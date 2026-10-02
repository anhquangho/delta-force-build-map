import { describe, it, expect } from 'vitest'
import { mockDataset } from '@/data/mockDataset'
import { searchEntities } from '../search-ranking'

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

  it('matches canonical English case-insensitively', () => {
    expect(resultSlugs('server')).toEqual(['server'])
    expect(resultSlugs('SERVER')).toEqual(['server'])
  })

  it('matches aliases', () => {
    expect(resultSlugs('sv')).toEqual(['server'])
    expect(resultSlugs('két')).toEqual(['safe'])
    expect(resultSlugs('case')).toEqual(['computer-case'])
    expect(resultSlugs('thùng pc')).toEqual(['computer-case'])
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
    expect(result.markerCount).toBe(4)
    expect(result.category.slug).toBe('server')
    expect(result.map.slug).toBe('zero-dam')
  })

  it('returns substring matches sorted by Vietnamese name when ranks tie', () => {
    const results = searchEntities(mockDataset, 'a')
    expect(results.map((r) => r.entity.slug)).toEqual(['safe', 'server', 'computer-case'])
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
