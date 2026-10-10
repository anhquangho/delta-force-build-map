import { describe, it, expect } from 'vitest'
import { mockDataset, serverMarkerCandidates } from '../mockDataset'

describe('mockDataset', () => {
  it('contains the existing items and fifteen separate keycard-related location POIs', () => {
    const slugs = new Set(mockDataset.entities.map((entity) => entity.slug))
    expect(slugs).toEqual(new Set([
      'safe', 'server', 'computer-case',
      'substation-tech-room-keycard', 'underground-vault-storage-keycard',
      'keycard-puzzle-d3-3', 'keycard-puzzle-d2-3', 'cement-plant-office', 'keycard-puzzle-d1-3',
      'barracks-storage-room', 'west-wing-control-room', 'east-wing-managers-office', 'substation-dormitory',
      'ticket-office', 'equipment-collection-room', 'west-wing-monitoring-room', 'cement-plant-dormitory',
      'central-vip-room', 'substation-tech-room', 'west-wing-infirmary',
    ]))
    expect(mockDataset.entities).toHaveLength(20)
    expect(mockDataset.categories.find((category) => category.slug === 'keycard-location')).toBeDefined()
  })

  it('has 40 markers after integrating the scoped source categories', () => {
    expect(mockDataset.markers).toHaveLength(40)
  })

  it('keeps Server/Safe unchanged, replaces Computer Case mocks, and retains inventory Keycard mocks', () => {
    const count = (slug: string) => {
      const entity = mockDataset.entities.find((entry) => entry.slug === slug)!
      return mockDataset.markers.filter((marker) => marker.entityId === entity.id)
    }
    expect(count('server')).toEqual(serverMarkerCandidates)
    expect(count('server')).toHaveLength(3)
    expect(count('safe')).toHaveLength(11)
    expect(count('safe').every((marker) => marker.verificationStatus === 'candidate' && marker.provenance?.sourceKey === 'safe')).toBe(true)
    expect(count('computer-case')).toHaveLength(9)
    expect(count('computer-case').every((marker) => marker.verificationStatus === 'candidate' && marker.provenance?.sourceKey === 'computer_case')).toBe(true)
    expect(count('substation-tech-room-keycard')).toHaveLength(1)
    expect(count('underground-vault-storage-keycard')).toHaveLength(1)
    for (const slug of ['substation-tech-room-keycard', 'underground-vault-storage-keycard']) {
      expect(count(slug).every((marker) => marker.verificationStatus === undefined && marker.provenance === undefined)).toBe(true)
    }
  })

  it('uses local-crop dimensions and preserves local-only Keycard mock positions', () => {
    expect(mockDataset.mapVersion).toMatchObject({ width: 3584, height: 2560 })
    const expectedPositions: Record<string, [number, number][]> = {
      'substation-tech-room-keycard': [[0.67, 0.58]],
      'underground-vault-storage-keycard': [[0.52, 0.82]],
    }

    for (const [slug, positions] of Object.entries(expectedPositions)) {
      const entity = mockDataset.entities.find((entry) => entry.slug === slug)!
      expect(mockDataset.markers.filter((marker) => marker.entityId === entity.id).map((marker) => [marker.xNormalized, marker.yNormalized])).toEqual(positions)
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
