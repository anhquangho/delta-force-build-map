import { describe, expect, it } from 'vitest'
import { mockDataset, safeMarkerCandidates, selectSourceRecordsByLocationId } from '../mockDataset'
import { zeroDamSourceToLocal } from '@/lib/zero-dam-source-to-local'

const safeEntity = mockDataset.entities.find((entity) => entity.slug === 'safe')!

const expectedRecords = [
  { sourceExternalId: '354', sourceX: 2417, sourceY: 2664, sourceZ: undefined, xNormalized: 2417 / 3584, yNormalized: 920 / 2560 },
  { sourceExternalId: '355', sourceX: 2491, sourceY: 1792, sourceZ: 0, xNormalized: 2491 / 3584, yNormalized: 1792 / 2560 },
  { sourceExternalId: '353', sourceX: 2303, sourceY: 2739, sourceZ: undefined, xNormalized: 2303 / 3584, yNormalized: 845 / 2560 },
  { sourceExternalId: '351', sourceX: 1390, sourceY: 2807, sourceZ: undefined, xNormalized: 1390 / 3584, yNormalized: 777 / 2560 },
  { sourceExternalId: '352', sourceX: 1265, sourceY: 2863, sourceZ: undefined, xNormalized: 1265 / 3584, yNormalized: 721 / 2560 },
  { sourceExternalId: '735', sourceX: 3249, sourceY: 1341, sourceZ: 1, xNormalized: 3249 / 3584, yNormalized: 2243 / 2560 },
  { sourceExternalId: '736', sourceX: 2150, sourceY: 2635, sourceZ: 1, xNormalized: 2150 / 3584, yNormalized: 949 / 2560 },
  { sourceExternalId: '1016', sourceX: 1317, sourceY: 2268, sourceZ: 0, xNormalized: 1317 / 3584, yNormalized: 1316 / 2560 },
  { sourceExternalId: '1018', sourceX: 2434, sourceY: 1819, sourceZ: 1, xNormalized: 2434 / 3584, yNormalized: 1765 / 2560 },
  { sourceExternalId: '1017', sourceX: 1271, sourceY: 2186, sourceZ: 1, xNormalized: 1271 / 3584, yNormalized: 1398 / 2560 },
  { sourceExternalId: '1401', sourceX: 2411, sourceY: 2662, sourceZ: 1, xNormalized: 2411 / 3584, yNormalized: 922 / 2560 },
]

describe('source-backed Safe candidates', () => {
  it('selects only the exact safe source category, excluding small_safe and other variants', () => {
    expect(selectSourceRecordsByLocationId([
      { locationId: 'safe', id: 'safe-record' },
      { locationId: 'small_safe', id: 'small-safe-record' },
      { locationId: 'premium_storage_box', id: 'other-container' },
    ], 'safe')).toEqual([{ locationId: 'safe', id: 'safe-record' }])
    expect(safeMarkerCandidates).toHaveLength(11)
    expect(safeMarkerCandidates.every((marker) => marker.provenance?.sourceKey === 'safe')).toBe(true)
  })

  it('replaces all five Safe mocks without duplicating or dropping a source Safe record', () => {
    const safeMarkers = mockDataset.markers.filter((marker) => marker.entityId === safeEntity.id)
    expect(safeMarkers).toEqual(safeMarkerCandidates)
    expect(safeMarkers).toHaveLength(11)
    expect(new Set(safeMarkers.map((marker) => marker.id)).size).toBe(11)
    expect(new Set(safeMarkers.map((marker) => marker.provenance?.sourceExternalId)).size).toBe(11)
    expect(safeMarkers.every((marker) => marker.provenance?.sourceKey !== 'small_safe')).toBe(true)
  })

  it('preserves each source coordinate and uses the existing crop adapter without clamping', () => {
    expect(safeMarkerCandidates.map((marker) => ({
      sourceExternalId: marker.provenance?.sourceExternalId,
      sourceX: marker.provenance?.sourceX,
      sourceY: marker.provenance?.sourceY,
      sourceZ: marker.provenance?.sourceZ,
      xNormalized: marker.xNormalized,
      yNormalized: marker.yNormalized,
    }))).toEqual(expectedRecords)

    for (const marker of safeMarkerCandidates) {
      const source = marker.provenance!
      const projection = zeroDamSourceToLocal(source.sourceX, source.sourceY)
      expect(marker.xNormalized).toBe(projection.xNormalized)
      expect(marker.yNormalized).toBe(projection.yNormalized)
      expect(marker.withinLocalCrop).toBe(projection.withinLocalCrop)
      expect(marker.withinLocalCrop).toBe(true)
      expect(marker.xNormalized).toBeGreaterThanOrEqual(0)
      expect(marker.xNormalized).toBeLessThanOrEqual(1)
      expect(marker.yNormalized).toBeGreaterThanOrEqual(0)
      expect(marker.yNormalized).toBeLessThanOrEqual(1)
    }
  })

  it('keeps project UUIDs, entity/map references, source snapshot claims, and candidate status', () => {
    for (const marker of safeMarkerCandidates) {
      const source = marker.provenance!
      expect(marker.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)
      expect(marker.id).not.toBe(source.sourceExternalId)
      expect(marker.entityId).toBe(safeEntity.id)
      expect(marker.mapVersionId).toBe(mockDataset.mapVersion.id)
      expect(marker.verificationStatus).toBe('candidate')
      expect(source).toMatchObject({
        sourceName: 'deltaforce-maps.com',
        sourceKey: 'safe',
        sourceUrl: 'https://deltaforce-maps.com/data/zero-dam/markers.json',
        coordinateSpace: 'zero-dam-image-4096',
        retrievedAt: '2026-10-10T02:45:09.065Z',
        sourceUpdatedAt: '2025-10-14T15:40:14Z',
        snapshotEtag: 'W/"b2c30572ad63168e1fcbc8a805f6a484"',
        snapshotHash: 'sha256:bae201e2ead1ad729538348e6e3d33e3cfa4a1db8d0331ae4c5200410a1af0c',
        reuseStatus: 'unconfirmed',
        sourceClaims: { validated: true, randomSpawn: true, difficulties: ['easy', 'normal', 'hard'] },
      })
      expect(marker.areaId).toBeUndefined()
      expect(source).not.toHaveProperty('description')
      expect(marker.floorKey).toBe(source.sourceZ === undefined ? undefined : String(source.sourceZ))
    }
  })

  it('reports eleven visible Safe locations for the existing entity', () => {
    expect(safeMarkerCandidates.filter((marker) => marker.withinLocalCrop)).toHaveLength(11)
    expect(mockDataset.markers.filter((marker) => marker.entityId === safeEntity.id && marker.withinLocalCrop !== false)).toHaveLength(11)
  })
})
