import { describe, it, expect } from 'vitest'
import { mockDataset } from '@/data/mockDataset'
import { validateDataset } from '../dataset-validation'
import { zeroDamSourceToLocal } from '../zero-dam-source-to-local'

describe('validateDataset', () => {
  it('finds no errors in the current mock dataset', () => {
    expect(validateDataset(mockDataset)).toEqual([])
  })

  it('detects a marker referencing an unknown entity', () => {
    const bad = structuredClone(mockDataset)
    bad.markers[0].entityId = '00000000-0000-0000-0000-000000000000'
    const errors = validateDataset(bad)
    expect(errors.some((e) => e.type === 'marker' && e.message.includes('unknown entity'))).toBe(true)
  })

  it('detects a marker referencing an unknown area', () => {
    const bad = structuredClone(mockDataset)
    bad.markers[0].areaId = '00000000-0000-0000-0000-000000000000'
    const errors = validateDataset(bad)
    expect(errors.some((e) => e.type === 'marker' && e.message.includes('unknown area'))).toBe(true)
  })

  it('detects a marker whose mapVersionId does not match the dataset', () => {
    const bad = structuredClone(mockDataset)
    bad.markers[0].mapVersionId = '00000000-0000-0000-0000-000000000000'
    const errors = validateDataset(bad)
    expect(errors.some((e) => e.type === 'marker' && e.message.includes('mapVersionId'))).toBe(true)
  })

  it('detects coordinates outside the 0..1 range or not finite', () => {
    const outOfRange = structuredClone(mockDataset)
    outOfRange.markers[0].xNormalized = 1.5
    expect(validateDataset(outOfRange).some((e) => e.type === 'marker' && e.message.includes('coordinates'))).toBe(true)

    const notFinite = structuredClone(mockDataset)
    notFinite.markers[0].yNormalized = Number.NaN
    expect(validateDataset(notFinite).some((e) => e.type === 'marker' && e.message.includes('coordinates'))).toBe(true)
  })

  it('accepts traceable source candidates outside the local crop without clamping them', () => {
    const data = structuredClone(mockDataset)
    const sourceMarker = data.markers.find((marker) => marker.provenance?.sourceExternalId === '395')!
    const sourceX = 4000
    const sourceY = sourceMarker.provenance!.sourceY
    const projection = zeroDamSourceToLocal(sourceX, sourceY)
    const outOfCropMarker = {
      ...sourceMarker,
      id: '11111111-1111-4111-8111-111111111111',
      ...projection,
      provenance: { ...sourceMarker.provenance!, sourceExternalId: 'outside-crop-test', sourceX, sourceY },
    }
    data.markers.push(outOfCropMarker)

    expect(outOfCropMarker.xNormalized).toBeGreaterThan(1)
    expect(outOfCropMarker.withinLocalCrop).toBe(false)
    expect(outOfCropMarker.verificationStatus).toBe('candidate')
    expect(validateDataset(data)).toEqual([])
  })

  it('rejects out-of-range local mock markers without source crop provenance', () => {
    const data = structuredClone(mockDataset)
    const marker = data.markers.find((entry) => !entry.provenance)!
    marker.xNormalized = 1.1
    marker.withinLocalCrop = false

    expect(validateDataset(data).some((error) => error.type === 'marker' && error.message.includes('local-crop classification'))).toBe(true)
  })

  it('detects an alias referencing an unknown entity', () => {
    const bad = structuredClone(mockDataset)
    bad.aliases[0].entityId = '00000000-0000-0000-0000-000000000000'
    const errors = validateDataset(bad)
    expect(errors.some((e) => e.type === 'alias' && e.message.includes('unknown entity'))).toBe(true)
  })

  it('detects an alias that duplicates a canonical name', () => {
    const bad = structuredClone(mockDataset)
    bad.aliases[0].normalizedAlias = 'may chu'
    const errors = validateDataset(bad)
    expect(errors.some((e) => e.type === 'alias' && e.message.includes('duplicates canonical'))).toBe(true)
  })
})
