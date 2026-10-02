/**
 * Bilingual query normalization for Vietnamese and English.
 *
 * Rules (matches MVP-V1.md normalization contract):
 * 1. Unicode NFD decomposition so combining diacritics become separable.
 * 2. Remove Vietnamese combining diacritics.
 * 3. Map đ/Đ to d.
 * 4. Lowercase.
 * 5. Replace punctuation/separators with a single space.
 * 6. Collapse whitespace and trim.
 *
 * Display strings are never modified; normalization is for comparison only.
 */

const VIETNAMESE_DIACRITIC_PATTERN = /[\u0300-\u036f]/g
const D_STROKE_PATTERN = /[đĐ]/g
const SEPARATOR_PATTERN = /[^\p{L}\p{N}]+/gu
const WHITESPACE_PATTERN = /\s+/g

export function normalizeSearchInput(input: string): string {
  return input
    .normalize('NFD')
    .replace(VIETNAMESE_DIACRITIC_PATTERN, '')
    .replace(D_STROKE_PATTERN, 'd')
    .toLowerCase()
    .replace(SEPARATOR_PATTERN, ' ')
    .trim()
    .replace(WHITESPACE_PATTERN, ' ')
}
