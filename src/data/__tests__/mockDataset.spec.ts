import { describe, it, expect } from 'vitest'
import { mockDataset, serverMarkerCandidates } from '../mockDataset'

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

  it('replaces only Server mocks and keeps other fixture counts unchanged', () => {
    const count = (slug: string) => {
      const entity = mockDataset.entities.find((entry) => entry.slug === slug)!
      return mockDataset.markers.filter((marker) => marker.entityId === entity.id)
    }
    expect(count('server')).toEqual(serverMarkerCandidates)
    expect(count('server')).toHaveLength(3)
    expect(count('safe')).toHaveLength(5)
    expect(count('computer-case')).toHaveLength(6)
    expect(count('substation-tech-room-keycard')).toHaveLength(1)
    expect(count('underground-vault-storage-keycard')).toHaveLength(1)
    for (const slug of ['safe', 'computer-case', 'substation-tech-room-keycard', 'underground-vault-storage-keycard']) {
      expect(count(slug).every((marker) => marker.verificationStatus === undefined && marker.provenance === undefined)).toBe(true)
    }
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
