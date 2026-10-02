import { describe, it, expect } from 'vitest'
import { mockDataset } from '@/data/mockDataset'
import { validateDataset } from '../dataset-validation'

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

  it('detects coordinates outside the 0..1 range', () => {
    const bad = structuredClone(mockDataset)
    bad.markers[0].xNormalized = 1.5
    const errors = validateDataset(bad)
    expect(errors.some((e) => e.type === 'marker' && e.message.includes('coordinates'))).toBe(true)
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
