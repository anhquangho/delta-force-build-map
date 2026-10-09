import { describe, expect, it } from 'vitest'
import { mockDataset, serverMarkerCandidates } from '../mockDataset'
import { zeroDamMapConfig } from '../zeroDamMap'
import { normalizedToLeafletSimplePoint } from '@/lib/coordinates'

const serverEntity = mockDataset.entities.find((entity) => entity.slug === 'server')!

describe('source-backed Server marker candidates', () => {
  it('imports every Server record from the selected Zero Dam source', () => {
    expect(serverMarkerCandidates).toHaveLength(3)
    expect(serverMarkerCandidates.map((marker) => marker.provenance?.sourceExternalId)).toEqual(['395', '333', '413'])
    expect(mockDataset.markers.filter((marker) => marker.entityId === serverEntity.id)).toEqual(serverMarkerCandidates)
  })

  it('keeps project coordinates normalized from the source 4096 image-space coordinates', () => {
    for (const marker of serverMarkerCandidates) {
      const provenance = marker.provenance!
      expect(marker.xNormalized).toBe(provenance.sourceX / 4096)
      expect(marker.yNormalized).toBe(provenance.sourceY / 4096)
      expect(marker.xNormalized).toBeGreaterThanOrEqual(0)
      expect(marker.xNormalized).toBeLessThanOrEqual(1)
      expect(marker.yNormalized).toBeGreaterThanOrEqual(0)
      expect(marker.yNormalized).toBeLessThanOrEqual(1)

      const projected = normalizedToLeafletSimplePoint(marker.xNormalized, marker.yNormalized, zeroDamMapConfig)
      expect(projected.lng).toBeCloseTo(zeroDamMapConfig.contentBounds.west + marker.xNormalized * zeroDamMapConfig.coordinateWidth)
      expect(projected.lat).toBeCloseTo(zeroDamMapConfig.contentBounds.north - marker.yNormalized * zeroDamMapConfig.coordinateHeight)
    }
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
