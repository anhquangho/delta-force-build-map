import { describe, expect, it } from 'vitest'
import { isMarkerVisibleInLocalMap } from '@/lib/marker-visibility'
import { searchEntities } from '@/lib/search-ranking'
import { mockDataset } from '../mockDataset'
import {
  deterministicProjectUuid,
  importZeroDamMarkerRecords,
  zeroDamSourceCategoryMappings,
  type ZeroDamSourceSnapshot,
} from '../zeroDamMarkerImporter'

const acceptedSourceCounts = {
  computer_case: 9,
  key_card: 15,
  safe: 11,
  server: 3,
}

const sourceClaims = {
  validated: true,
  randomSpawn: false,
  difficulties: ['easy', 'normal', 'hard'],
}

const syntheticRecords: unknown[] = [
  { id: 1001, locationId: 'ammo_crate', x: 1200, y: 2000, ...sourceClaims },
  { id: 1002, locationId: 'ammo_crate', x: 1450, ...sourceClaims },
  { id: 1003, locationId: 'ammo_crate', x: 1300, y: 2100, ...sourceClaims },
  { id: 1003, locationId: 'ammo_crate', x: 1310, y: 2110, ...sourceClaims },
  { id: 1004, locationId: 'random_extract', x: 1500, y: 643, z: 0, ...sourceClaims },
  { id: 1005, locationId: 'computer_data', x: 2000, y: 2000, ...sourceClaims },
  { id: 1006, locationId: 'mystery_object', x: 900, y: 2000, ...sourceClaims },
  { id: 1007, locationId: 'small_safe', x: 1700, y: 2200, ...sourceClaims },
  {
    id: 'POI-A', locationId: 'protocol_crate', x: 950, y: 1800,
    name: 'Synthetic Crate Alpha', description: 'Synthetic puzzle note', ...sourceClaims,
  },
]

function makeSnapshot(records: unknown[], extraCounts: Record<string, number>): ZeroDamSourceSnapshot {
  const sourceCategoryCounts = { ...acceptedSourceCounts, ...extraCounts }
  return {
    metadata: {
      sourceName: 'synthetic-fixture',
      sourceUrl: 'synthetic:zero-dam-import-test',
      retrievedAt: 'synthetic-retrieval-time',
      sourceUpdatedAt: 'synthetic-source-time',
      etag: 'synthetic-etag',
      sha256: 'synthetic-hash',
      coordinateSpace: 'zero-dam-image-4096',
      reuseStatus: 'unconfirmed',
      sourceRecordCount: Object.values(sourceCategoryCounts).reduce((sum, count) => sum + count, 0),
      sourceCategoryCount: Object.keys(sourceCategoryCounts).length,
      sourceCategoryCounts,
      excludedBaselineRecordCount: 38,
    },
    records,
  }
}

function sourceFingerprints() {
  return mockDataset.markers
    .filter((marker) => marker.provenance)
    .map((marker) => ({
      id: marker.id,
      entityId: marker.entityId,
      sourceKey: marker.provenance!.sourceKey,
      sourceExternalId: marker.provenance!.sourceExternalId,
      sourceX: marker.provenance!.sourceX,
      sourceY: marker.provenance!.sourceY,
      sourceZ: marker.provenance!.sourceZ,
      xNormalized: marker.xNormalized,
      yNormalized: marker.yNormalized,
      withinLocalCrop: marker.withinLocalCrop,
    }))
    .sort((a, b) => a.sourceKey.localeCompare(b.sourceKey) || a.sourceExternalId.localeCompare(b.sourceExternalId))
}

describe('Zero Dam marker importer', () => {
  it('generates deterministic RFC 4122 UUIDv5 project IDs', () => {
    expect(deterministicProjectUuid('www.example.com', '6ba7b810-9dad-11d1-80b4-00c04fd430c8'))
      .toBe('2ed6657d-e927-568b-95e1-2665a8aea6a2')
    expect(deterministicProjectUuid('marker:zero-dam:1001')).toBe(deterministicProjectUuid('marker:zero-dam:1001'))
    expect(deterministicProjectUuid('marker:zero-dam:1001')).not.toBe(deterministicProjectUuid('marker:zero-dam:1002'))
  })

  it('defines every audited source category exactly once and keeps ambiguous categories deferred', () => {
    expect(zeroDamSourceCategoryMappings).toHaveLength(35)
    expect(new Set(zeroDamSourceCategoryMappings.map((mapping) => mapping.locationId)).size).toBe(35)
    expect(zeroDamSourceCategoryMappings.filter((mapping) => mapping.disposition === 'baseline')).toHaveLength(4)
    expect(zeroDamSourceCategoryMappings.filter((mapping) => mapping.disposition === 'integrate')).toHaveLength(29)
    expect(zeroDamSourceCategoryMappings.filter((mapping) => mapping.disposition === 'defer').map((mapping) => mapping.locationId).sort()).toEqual([
      'computer_data', 'piece-of-clothing',
    ])
    expect(zeroDamSourceCategoryMappings.find((mapping) => mapping.locationId === 'small_safe')?.entitySlug).toBe('small-safe')
    expect(zeroDamSourceCategoryMappings.find((mapping) => mapping.locationId === 'rare_spawn')?.meaningSummary).toContain('no ItemRarity')
  })

  it('validates records, imports safe mappings, and preserves ambiguous and unknown records as candidates', () => {
    const before = sourceFingerprints()
    const snapshot = makeSnapshot(syntheticRecords, {
      ammo_crate: 4,
      random_extract: 1,
      computer_data: 1,
      mystery_object: 1,
      small_safe: 1,
      protocol_crate: 1,
    })
    const imported = importZeroDamMarkerRecords(snapshot, mockDataset)
    const secondImport = importZeroDamMarkerRecords(snapshot, mockDataset)
    const markerBySourceId = new Map(imported.markers.map((marker) => [marker.provenance!.sourceExternalId, marker]))
    const entityById = new Map(imported.entities.map((entity) => [entity.id, entity]))

    expect(imported.report).toMatchObject({
      sourceRecordCount: 47,
      sourceCategoryCount: 10,
      snapshotRecordCount: 9,
      baselineSourceRecordCount: 38,
      newIntegratedCount: 4,
      visibleNewCount: 3,
      outOfCropCount: 1,
      deferredCount: 2,
      invalidRecordCount: 1,
      duplicateRecordCount: 2,
      accountedRecordCount: 47,
      duplicateSourceIds: ['1003'],
      reconciliationErrors: [],
    })
    expect(imported.report.importedSourceIds).toEqual(['1001', 'POI-A', '1004', '1007'].sort((a, b) => a.localeCompare(b, undefined, { numeric: true })))
    expect(imported.report.deferredSourceIds).toEqual(['1005', '1006'])
    expect(imported.report.invalidRecords).toMatchObject([{ sourceExternalId: '1002', locationId: 'ammo_crate' }])
    expect(imported.report.categoryReports.find((entry) => entry.locationId === 'ammo_crate')).toMatchObject({
      sourceCount: 4,
      existingCount: 0,
      missingCount: 4,
      importedCount: 1,
      inCropCount: 1,
      visibleCount: 1,
      invalidCount: 1,
      duplicateCount: 2,
      unaccountedCount: 0,
    })
    expect(imported.report.categoryReports.find((entry) => entry.locationId === 'computer_data')).toMatchObject({
      deferredCount: 1,
      visibleCount: 0,
      inCropCount: 1,
    })
    expect(imported.report.categoryReports.find((entry) => entry.locationId === 'mystery_object')).toMatchObject({
      disposition: 'unmapped',
      meaningConfidence: 'low',
      deferredCount: 1,
    })

    const ammo = markerBySourceId.get('1001')!
    expect(ammo.xNormalized).toBe(1200 / 3584)
    expect(ammo.yNormalized).toBe((3584 - 2000) / 2560)
    expect(ammo.provenance).toMatchObject({
      sourceName: 'synthetic-fixture',
      sourceUrl: 'synthetic:zero-dam-import-test',
      sourceKey: 'ammo_crate',
      sourceExternalId: '1001',
      sourceX: 1200,
      sourceY: 2000,
      sourceClaims: { validated: true, randomSpawn: false, difficulties: ['easy', 'normal', 'hard'] },
      reuseStatus: 'unconfirmed',
    })
    expect(ammo.verificationStatus).toBe('candidate')
    expect(ammo.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)
    expect(ammo.id).not.toBe(ammo.provenance?.sourceExternalId)
    expect(entityById.get(ammo.entityId)).toMatchObject({ verificationStatus: 'candidate', slug: 'ammo-crate' })
    expect(entityById.get(ammo.entityId)).not.toHaveProperty('catalogItemId')
    expect(entityById.get(ammo.entityId)).not.toHaveProperty('rarity')

    const outside = markerBySourceId.get('1004')!
    expect(outside.provenance?.sourceY).toBe(643)
    expect(outside.yNormalized).toBeGreaterThan(1)
    expect(outside.withinLocalCrop).toBe(false)
    expect(isMarkerVisibleInLocalMap(outside)).toBe(false)

    expect(imported.markers.every((marker) => imported.entities.some((entity) => entity.id === marker.entityId))).toBe(true)
    expect(imported.markers.every((marker) => marker.verificationStatus === 'candidate')).toBe(true)
    expect(imported.entities.every((entity) => entity.verificationStatus === 'candidate' && !entity.catalogItemId)).toBe(true)
    expect(imported.deferredRecords.map((record) => record.sourceExternalId)).toEqual(['1005', '1006'])
    expect(imported.deferredRecords.every((record) => record.verificationStatus === 'candidate' && record.id !== record.sourceExternalId)).toBe(true)
    expect(imported.markers.some((marker) => marker.provenance?.sourceExternalId === '1003')).toBe(false)
    expect(imported.markers.map((marker) => marker.id)).toEqual(secondImport.markers.map((marker) => marker.id))
    expect(imported.entities.map((entity) => [entity.id, entity.slug])).toEqual(secondImport.entities.map((entity) => [entity.id, entity.slug]))
    expect(sourceFingerprints()).toEqual(before)
  })

  it('matches existing records by exact source IDs, not displayed names', () => {
    const snapshot = makeSnapshot([
      { id: 'SYNTHETIC-1', locationId: 'ammo_crate', x: 1000, y: 2000, name: 'Safe', ...sourceClaims },
    ], { ammo_crate: 1 })
    const imported = importZeroDamMarkerRecords(snapshot, mockDataset)

    expect(imported.markers).toHaveLength(1)
    expect(imported.markers[0].provenance?.sourceExternalId).toBe('SYNTHETIC-1')
    expect(imported.entities).toMatchObject([{ slug: 'ammo-crate', nameEn: 'Ammo Crate' }])
    expect(imported.report.baselineSourceRecordCount).toBe(38)
    expect(imported.report.reconciliationErrors).toEqual([])
  })

  it('keeps search bilingual, leaves deferred categories out of search, and keeps Safe distinct from Small Safe', () => {
    const imported = importZeroDamMarkerRecords(makeSnapshot(syntheticRecords, {
      ammo_crate: 4,
      random_extract: 1,
      computer_data: 1,
      mystery_object: 1,
      small_safe: 1,
      protocol_crate: 1,
    }), mockDataset)
    const dataset = {
      ...mockDataset,
      categories: [...mockDataset.categories, ...imported.categories],
      entities: [...mockDataset.entities, ...imported.entities],
      markers: [...mockDataset.markers, ...imported.markers],
    }

    expect(searchEntities(dataset, 'ammo crate').map((result) => result.entity.slug)).toEqual(['ammo-crate'])
    expect(searchEntities(dataset, 'hòm đạn').map((result) => result.entity.slug)).toEqual(['ammo-crate'])
    expect(searchEntities(dataset, 'small safe').map((result) => [result.entity.slug, result.markerCount])).toEqual([['small-safe', 1]])
    expect(searchEntities(dataset, 'safe').map((result) => [result.entity.slug, result.markerCount])).toEqual([['safe', 11]])
    expect(searchEntities(dataset, 'computer data')).toEqual([])
    expect(searchEntities(dataset, 'mystery object')).toEqual([])
    expect(searchEntities(dataset, 'synthetic crate alpha').map((result) => result.entity.slug)).toEqual(['synthetic-crate-alpha'])
    expect(new Set(searchEntities(dataset, 'keycard').map((result) => result.entity.slug))).toEqual(new Set([
      'substation-tech-room-keycard', 'underground-vault-storage-keycard',
    ]))
  })

  it('retains the exact 38 accepted source IDs in their original categories', () => {
    const expected = {
      computer_case: ['326', '327', '330', '334', '344', '643', '1019', '1386', '1396'],
      key_card: ['161', '162', '163', '164', '165', '166', '167', '168', '169', '183', '184', '223', '225', '226', '362'],
      safe: ['351', '352', '353', '354', '355', '735', '736', '1016', '1017', '1018', '1401'],
      server: ['333', '395', '413'],
    }
    const actual = Object.fromEntries(Object.keys(expected).map((locationId) => [
      locationId,
      mockDataset.markers
        .filter((marker) => marker.provenance?.sourceKey === locationId)
        .map((marker) => marker.provenance!.sourceExternalId)
        .sort((a, b) => Number(a) - Number(b)),
    ]))

    expect(actual).toEqual(expected)
    expect(Object.values(actual).flat()).toHaveLength(38)
  })
})
