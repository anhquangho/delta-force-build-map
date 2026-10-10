import { describe, it, expect } from 'vitest'
import { mockDataset } from '@/data/mockDataset'
import { searchEntities } from '../search-ranking'
import { zeroDamSourceToLocal } from '../zero-dam-source-to-local'

function resultSlugs(query: string): string[] {
  return searchEntities(mockDataset, query).map((r) => r.entity.slug)
}

describe('searchEntities', () => {
  it('matches canonical Vietnamese with diacritics', () => {
    expect(resultSlugs('máy chủ')).toEqual(['server'])
  })

  it('matches canonical Vietnamese without diacritics', () => {
    expect(resultSlugs('may chu')).toEqual(['server'])
  })

  it('resolves all Server query forms to the same entity', () => {
    for (const query of ['máy chủ', 'may chu', 'server', 'sv']) {
      expect(resultSlugs(query)).toEqual(['server'])
    }
    expect(resultSlugs('SERVER')).toEqual(['server'])
  })

  it('matches aliases', () => {
    expect(resultSlugs('sv')).toEqual(['server'])
    expect(resultSlugs('két')).toEqual(['safe'])
    expect(resultSlugs('case')).toEqual(['computer-case'])
    expect(resultSlugs('thùng pc')).toEqual(['computer-case'])
  })

  it('finds both sample keycards by the canonical English substring and individual names', () => {
    expect(new Set(resultSlugs('keycard'))).toEqual(new Set([
      'substation-tech-room-keycard',
      'underground-vault-storage-keycard',
    ]))
    expect(resultSlugs('Substation Tech Room Keycard')).toEqual(['substation-tech-room-keycard'])
    expect(resultSlugs('Underground Vault Storage Keycard')).toEqual(['underground-vault-storage-keycard'])
    expect(resultSlugs('Thẻ khóa phòng kỹ thuật trạm điện')).toEqual(['substation-tech-room-keycard'])
    expect(resultSlugs('Thẻ kho lưu trữ ngầm')).toEqual(['underground-vault-storage-keycard'])
  })

  it('handles extra whitespace', () => {
    expect(resultSlugs('  may   chu  ')).toEqual(['server'])
    expect(resultSlugs('  KÉT  ')).toEqual(['safe'])
  })

  it('ranks exact canonical name above alias', () => {
    const results = searchEntities(mockDataset, 'server')
    expect(results[0].entity.slug).toBe('server')
    expect(results[0].rank).toBe(1)

    const aliasResults = searchEntities(mockDataset, 'sv')
    expect(aliasResults[0].entity.slug).toBe('server')
    expect(aliasResults[0].rank).toBe(2)
  })

  it('ranks canonical prefix above alias prefix', () => {
    const results = searchEntities(mockDataset, 'máy')
    expect(results[0].entity.slug).toBe('server')
    expect(results[0].rank).toBe(3)
  })

  it('finds substring matches with lower rank', () => {
    const results = searchEntities(mockDataset, 'chu')
    expect(results.map((r) => r.entity.slug)).toContain('server')
  })

  it('returns empty array for no match', () => {
    expect(searchEntities(mockDataset, 'xyzabc')).toEqual([])
  })

  it('returns empty array for empty/whitespace query', () => {
    expect(searchEntities(mockDataset, '')).toEqual([])
    expect(searchEntities(mockDataset, '   ')).toEqual([])
  })

  it('includes marker count, category, and map in results', () => {
    const [result] = searchEntities(mockDataset, 'server')
    expect(result).toBeDefined()
    expect(result.markerCount).toBe(3)
    expect(result.category.slug).toBe('server')
    expect(result.map.slug).toBe('zero-dam')
  })

  it('counts only in-crop markers while preserving local mock marker counts', () => {
    const data = structuredClone(mockDataset)
    const serverMarker = data.markers.find((marker) => marker.provenance?.sourceExternalId === '395')!
    const outOfCropSourceX = 4000
    const projection = zeroDamSourceToLocal(outOfCropSourceX, serverMarker.provenance!.sourceY)
    serverMarker.provenance!.sourceX = outOfCropSourceX
    serverMarker.xNormalized = projection.xNormalized
    serverMarker.yNormalized = projection.yNormalized
    serverMarker.withinLocalCrop = projection.withinLocalCrop

    expect(searchEntities(data, 'server')[0].markerCount).toBe(2)
    expect(searchEntities(mockDataset, 'safe')[0].markerCount).toBe(11)
    expect(searchEntities(mockDataset, 'két sắt')[0].markerCount).toBe(11)
    expect(searchEntities(mockDataset, 'computer case')[0].markerCount).toBe(9)
    expect(searchEntities(mockDataset, 'keycard').map((result) => result.markerCount)).toEqual([1, 1])
  })

  it('keeps keycard room POIs distinct from inventory Keycard items', () => {
    const roomResults = searchEntities(mockDataset, 'Substation Tech Room')
    expect(roomResults.map((result) => result.entity.slug)).toEqual(['substation-tech-room'])
    expect(roomResults[0].markerCount).toBe(1)
    expect(roomResults[0].category.slug).toBe('keycard-location')
    expect(searchEntities(mockDataset, 'Substation Tech Room Keycard').map((result) => result.entity.slug)).toEqual(['substation-tech-room-keycard'])
    expect(new Set(searchEntities(mockDataset, 'keycard').map((result) => result.entity.slug))).toEqual(new Set([
      'substation-tech-room-keycard',
      'underground-vault-storage-keycard',
    ]))
  })

  it('returns substring matches sorted by Vietnamese name when ranks tie', () => {
    const results = searchEntities(mockDataset, 'a')
    const sorted = [...results].sort((a, b) => a.entity.nameVi.localeCompare(b.entity.nameVi, 'vi'))
    expect(results.map((result) => result.entity.id)).toEqual(sorted.map((result) => result.entity.id))
  })

  it('orders exact canonical matches before substring matches', () => {
    const results = searchEntities(mockDataset, 'safe')
    expect(results[0].entity.slug).toBe('safe')
    expect(results[0].rank).toBe(1)
  })

  it('orders exact alias matches before prefix matches', () => {
    const aliasResult = searchEntities(mockDataset, 'sv')
    expect(aliasResult[0].rank).toBe(2)

    const prefixResult = searchEntities(mockDataset, 's')
    expect(prefixResult.every((r) => r.rank >= 3)).toBe(true)
  })

  it('returns a stable order for identical queries', () => {
    const first = searchEntities(mockDataset, 'may chu')
    const second = searchEntities(mockDataset, 'may chu')
    expect(first.map((r) => r.entity.id)).toEqual(second.map((r) => r.entity.id))
  })
})
