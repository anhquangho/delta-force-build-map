import { describe, it, expect } from 'vitest'
import { normalizeSearchInput } from '../search-normalization'

describe('normalizeSearchInput', () => {
  it('removes Vietnamese diacritics and maps đ to d', () => {
    expect(normalizeSearchInput('máy chủ')).toBe('may chu')
    expect(normalizeSearchInput('MÁY CHỦ')).toBe('may chu')
    expect(normalizeSearchInput('Đập')).toBe('dap')
  })

  it('leaves already-normalized Vietnamese unchanged', () => {
    expect(normalizeSearchInput('may chu')).toBe('may chu')
    expect(normalizeSearchInput('thung pc')).toBe('thung pc')
  })

  it('handles English case-insensitively', () => {
    expect(normalizeSearchInput('Server')).toBe('server')
    expect(normalizeSearchInput('SERVER')).toBe('server')
  })

  it('trims and collapses whitespace', () => {
    expect(normalizeSearchInput('  may   chu  ')).toBe('may chu')
    expect(normalizeSearchInput('máy\t\tchủ')).toBe('may chu')
  })

  it('replaces punctuation and separators with spaces', () => {
    expect(normalizeSearchInput('máy-chủ!')).toBe('may chu')
    expect(normalizeSearchInput('pc_case')).toBe('pc case')
    expect(normalizeSearchInput('két,sắt')).toBe('ket sat')
  })

  it('returns empty string for empty or whitespace-only input', () => {
    expect(normalizeSearchInput('')).toBe('')
    expect(normalizeSearchInput('   ')).toBe('')
  })
})
