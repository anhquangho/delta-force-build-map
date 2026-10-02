import { describe, it, expect } from 'vitest'
import { mockDataset } from '../mockDataset'

describe('mockDataset', () => {
  it('contains the three required entities', () => {
    const slugs = new Set(mockDataset.entities.map((e) => e.slug))
    expect(slugs).toEqual(new Set(['safe', 'server', 'computer-case']))
  })

  it('has 10-20 markers', () => {
    expect(mockDataset.markers.length).toBeGreaterThanOrEqual(10)
    expect(mockDataset.markers.length).toBeLessThanOrEqual(20)
  })

  it('has at least one genuine alias per entity', () => {
    for (const entity of mockDataset.entities) {
      const count = mockDataset.aliases.filter((a) => a.entityId === entity.id).length
      expect(count).toBeGreaterThan(0)
    }
  })

  it('does not store canonical names as aliases', () => {
    const canonicalAliases = new Set([
      'may chu',
      'server',
      'ket sat',
      'safe',
      'thung may tinh',
      'computer case',
    ])

    for (const alias of mockDataset.aliases) {
      expect(canonicalAliases.has(alias.normalizedAlias)).toBe(false)
    }
  })

  it('uses normalized coordinates in the 0..1 range', () => {
    for (const marker of mockDataset.markers) {
      expect(marker.xNormalized).toBeGreaterThanOrEqual(0)
      expect(marker.xNormalized).toBeLessThanOrEqual(1)
      expect(marker.yNormalized).toBeGreaterThanOrEqual(0)
      expect(marker.yNormalized).toBeLessThanOrEqual(1)
    }
  })
})
