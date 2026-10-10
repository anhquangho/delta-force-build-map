import { describe, expect, it } from 'vitest'
import { computerCaseMarkerCandidates, mockDataset, selectSourceRecordsByLocationId } from '../mockDataset'
import { zeroDamSourceToLocal } from '@/lib/zero-dam-source-to-local'

const computerCaseEntity = mockDataset.entities.find((entity) => entity.slug === 'computer-case')!
const expectedRecords = [
  { sourceExternalId: '330', sourceX: 2184, sourceY: 2648, sourceZ: 1, sourceDescription: '', xNormalized: 2184 / 3584, yNormalized: 936 / 2560 },
  { sourceExternalId: '327', sourceX: 2251, sourceY: 2730, sourceZ: 0, sourceDescription: '', xNormalized: 2251 / 3584, yNormalized: 854 / 2560 },
  { sourceExternalId: '326', sourceX: 2247, sourceY: 2731, sourceZ: 0, sourceDescription: '', xNormalized: 2247 / 3584, yNormalized: 853 / 2560 },
  { sourceExternalId: '643', sourceX: 2237, sourceY: 1593, sourceZ: 0, sourceDescription: undefined, xNormalized: 2237 / 3584, yNormalized: 1991 / 2560 },
  { sourceExternalId: '344', sourceX: 2483, sourceY: 2667, sourceZ: 0, sourceDescription: '', xNormalized: 2483 / 3584, yNormalized: 917 / 2560 },
  { sourceExternalId: '1019', sourceX: 2584, sourceY: 3079, sourceZ: 0, sourceDescription: undefined, xNormalized: 2584 / 3584, yNormalized: 505 / 2560 },
  { sourceExternalId: '334', sourceX: 2250, sourceY: 2734, sourceZ: 1, sourceDescription: '', xNormalized: 2250 / 3584, yNormalized: 850 / 2560 },
  { sourceExternalId: '1386', sourceX: 2173, sourceY: 2618, sourceZ: -1, sourceDescription: undefined, xNormalized: 2173 / 3584, yNormalized: 966 / 2560 },
  { sourceExternalId: '1396', sourceX: 2120, sourceY: 2286, sourceZ: -1, sourceDescription: undefined, xNormalized: 2120 / 3584, yNormalized: 1298 / 2560 },
]

describe('source-backed Computer Case candidates', () => {
  it('filters the exact computer_case category and imports all nine records only', () => {
    expect(selectSourceRecordsByLocationId([
      { locationId: 'computer_case', id: 'case-record' },
      { locationId: 'computer_data', id: 'computer-data-record' },
      { locationId: 'safe', id: 'safe-record' },
    ], 'computer_case')).toEqual([{ locationId: 'computer_case', id: 'case-record' }])
    expect(computerCaseMarkerCandidates).toHaveLength(9)
    expect(computerCaseMarkerCandidates.map((marker) => marker.provenance?.sourceExternalId)).toEqual([
      '330', '327', '326', '643', '344', '1019', '334', '1386', '1396',
    ])
  })

  it('replaces all six Computer Case mocks without duplicates', () => {
    const entityMarkers = mockDataset.markers.filter((marker) => marker.entityId === computerCaseEntity.id)
    expect(entityMarkers).toEqual(computerCaseMarkerCandidates)
    expect(entityMarkers).toHaveLength(9)
    expect(new Set(entityMarkers.map((marker) => marker.id)).size).toBe(9)
    expect(new Set(entityMarkers.map((marker) => marker.provenance?.sourceExternalId)).size).toBe(9)
  })

  it('preserves source coordinates and maps every record through the shared crop adapter', () => {
    expect(computerCaseMarkerCandidates.map((marker) => ({
      sourceExternalId: marker.provenance?.sourceExternalId,
      sourceX: marker.provenance?.sourceX,
      sourceY: marker.provenance?.sourceY,
      sourceZ: marker.provenance?.sourceZ,
      sourceDescription: marker.provenance?.sourceDescription,
      xNormalized: marker.xNormalized,
      yNormalized: marker.yNormalized,
    }))).toEqual(expectedRecords)

    for (const marker of computerCaseMarkerCandidates) {
      const provenance = marker.provenance!
      expect(zeroDamSourceToLocal(provenance.sourceX, provenance.sourceY)).toMatchObject({
        xNormalized: marker.xNormalized,
        yNormalized: marker.yNormalized,
        withinLocalCrop: true,
      })
      expect(marker.withinLocalCrop).toBe(true)
    }
  })

  it('keeps project identity, snapshot provenance, source claims, and candidate verification separate', () => {
    for (const marker of computerCaseMarkerCandidates) {
      expect(marker.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)
      expect(marker.id).not.toBe(marker.provenance?.sourceExternalId)
      expect(marker.entityId).toBe(computerCaseEntity.id)
      expect(marker.mapVersionId).toBe(mockDataset.mapVersion.id)
      expect(marker.verificationStatus).toBe('candidate')
      expect(marker.provenance).toMatchObject({
        sourceKey: 'computer_case',
        sourceUrl: 'https://deltaforce-maps.com/data/zero-dam/markers.json',
        coordinateSpace: 'zero-dam-image-4096',
        snapshotEtag: 'W/"b2c30572ad63168e1fcbc8a805f6a484"',
        snapshotHash: 'sha256:bae201e2ead1ad729538348e6e3d33e3cfa4a1db8d0331ae4c5200410a1af0c',
        reuseStatus: 'unconfirmed',
        sourceClaims: { validated: true, randomSpawn: false, difficulties: ['easy', 'normal', 'hard'] },
      })
      expect(marker.areaId).toBeUndefined()
      expect(marker.provenance?.sourceRecordName).toBeUndefined()
    }
  })
})
