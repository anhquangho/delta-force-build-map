import { describe, it, expect } from 'vitest'
import { mockDataset } from '../mockDataset'

describe('mockDataset', () => {
  it('contains the three existing entities and two sample keycards', () => {
    const slugs = new Set(mockDataset.entities.map((e) => e.slug))
    expect(slugs).toEqual(new Set([
      'safe', 'server', 'computer-case',
      'substation-tech-room-keycard', 'underground-vault-storage-keycard',
    ]))
  })

  it('has 10-20 markers', () => {
    expect(mockDataset.markers.length).toBeGreaterThanOrEqual(10)
    expect(mockDataset.markers.length).toBeLessThanOrEqual(20)
  })

  it('keeps genuine aliases optional and does not duplicate keycard canonical names', () => {
    expect(mockDataset.aliases.length).toBeGreaterThan(0)
    for (const slug of ['substation-tech-room-keycard', 'underground-vault-storage-keycard']) {
      const entity = mockDataset.entities.find((entry) => entry.slug === slug)!
      expect(mockDataset.aliases.filter((alias) => alias.entityId === entity.id)).toHaveLength(0)
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
