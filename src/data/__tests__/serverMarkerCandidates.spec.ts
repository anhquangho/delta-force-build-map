import { describe, expect, it } from 'vitest'
import { mockDataset, serverMarkerCandidates } from '../mockDataset'
import { zeroDamMapConfig } from '../zeroDamMap'
import { normalizedToLeafletSimplePoint } from '@/lib/coordinates'
import { zeroDamSourceToLocal } from '@/lib/zero-dam-source-to-local'

const serverEntity = mockDataset.entities.find((entity) => entity.slug === 'server')!

describe('source-backed Server marker candidates', () => {
  it('imports every Server record from the selected Zero Dam source', () => {
    expect(serverMarkerCandidates).toHaveLength(3)
    expect(serverMarkerCandidates.map((marker) => marker.provenance?.sourceExternalId)).toEqual(['395', '333', '413'])
    expect(mockDataset.markers.filter((marker) => marker.entityId === serverEntity.id)).toEqual(serverMarkerCandidates)
  })

  it('converts source coordinates into the local crop before Leaflet projection', () => {
    for (const marker of serverMarkerCandidates) {
      const provenance = marker.provenance!
      const expected = zeroDamSourceToLocal(provenance.sourceX, provenance.sourceY)
      expect(marker.xNormalized).toBe(expected.xNormalized)
      expect(marker.yNormalized).toBe(expected.yNormalized)
      expect(marker.withinLocalCrop).toBe(expected.withinLocalCrop)
      expect(expected.withinLocalCrop).toBe(true)

      const projected = normalizedToLeafletSimplePoint(marker.xNormalized, marker.yNormalized, zeroDamMapConfig)
      expect(projected.lng).toBeCloseTo(zeroDamMapConfig.contentBounds.west + marker.xNormalized * zeroDamMapConfig.coordinateWidth)
      expect(projected.lat).toBeCloseTo(zeroDamMapConfig.contentBounds.north - marker.yNormalized * zeroDamMapConfig.coordinateHeight)
    }
  })

  it('produces deterministic normalized positions from each preserved source coordinate', () => {
    expect(serverMarkerCandidates.map((marker) => ({
      sourceExternalId: marker.provenance?.sourceExternalId,
      sourceX: marker.provenance?.sourceX,
      sourceY: marker.provenance?.sourceY,
      sourceZ: marker.provenance?.sourceZ,
      xNormalized: marker.xNormalized,
      yNormalized: marker.yNormalized,
      withinLocalCrop: marker.withinLocalCrop,
    }))).toEqual([
      { sourceExternalId: '395', sourceX: 2428, sourceY: 1812, sourceZ: 1, xNormalized: 2428 / 3584, yNormalized: 1772 / 2560, withinLocalCrop: true },
      { sourceExternalId: '333', sourceX: 2197, sourceY: 2735, sourceZ: undefined, xNormalized: 2197 / 3584, yNormalized: 849 / 2560, withinLocalCrop: true },
      { sourceExternalId: '413', sourceX: 2298, sourceY: 2655, sourceZ: 0, xNormalized: 2298 / 3584, yNormalized: 929 / 2560, withinLocalCrop: true },
    ])
  })

  it('uses project marker UUIDs and the project Server entity/map version', () => {
    for (const marker of serverMarkerCandidates) {
      expect(marker.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)
      expect(marker.id).not.toBe(marker.provenance?.sourceExternalId)
      expect(marker.entityId).toBe(serverEntity.id)
      expect(marker.mapVersionId).toBe(mockDataset.mapVersion.id)
    }
  })

  it('retains the source URL, identity, snapshot and source claims for every candidate', () => {
    for (const marker of serverMarkerCandidates) {
      const source = marker.provenance!
      expect(source).toMatchObject({
        sourceName: 'deltaforce-maps.com',
        sourceKey: 'server',
        sourceUrl: 'https://deltaforce-maps.com/data/zero-dam/markers.json',
        coordinateSpace: 'zero-dam-image-4096',
        sourceUpdatedAt: '2025-10-14T15:40:14Z',
        retrievedAt: expect.any(String),
        snapshotEtag: expect.any(String),
        snapshotHash: expect.stringMatching(/^sha256:/),
        reuseStatus: 'unconfirmed',
        sourceClaims: { validated: true, randomSpawn: false, difficulties: ['easy', 'normal', 'hard'] },
      })
      expect(source.sourceExternalId).toBeTruthy()
      expect(source.sourceX).toBeTypeOf('number')
      expect(source.sourceY).toBeTypeOf('number')
      expect(marker.verificationStatus).toBe('candidate')
    }
  })

  it('keeps source validation claims separate from project verification', () => {
    expect(serverMarkerCandidates.every((marker) => marker.provenance?.sourceClaims.validated === true)).toBe(true)
    expect(serverMarkerCandidates.every((marker) => marker.verificationStatus === 'candidate')).toBe(true)
    expect(serverMarkerCandidates.find((marker) => marker.provenance?.sourceExternalId === '333')?.provenance?.sourceZ).toBeUndefined()
    expect(serverMarkerCandidates.find((marker) => marker.provenance?.sourceExternalId === '333')?.floorKey).toBeUndefined()
    expect(serverMarkerCandidates.find((marker) => marker.provenance?.sourceExternalId === '395')?.floorKey).toBe('1')
    expect(serverMarkerCandidates.find((marker) => marker.provenance?.sourceExternalId === '413')?.floorKey).toBe('0')
    expect(serverMarkerCandidates.every((marker) => marker.areaId === undefined)).toBe(true)
  })
})
