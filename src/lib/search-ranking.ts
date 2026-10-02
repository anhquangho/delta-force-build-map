import type { MapMetadata, PublicCategory, PublicDataset } from '@/types/dataset'
import type { MapEntity } from '@/types/domain'
import { normalizeSearchInput } from './search-normalization'

export interface SearchResult {
  entity: MapEntity
  category: PublicCategory
  map: MapMetadata
  markerCount: number
  rank: number
}

type MatchRank = 1 | 2 | 3 | 4 | 5 | 6 | null

/**
 * Search the published dataset for entities matching a bilingual query.
 *
 * Ranking order (best first):
 * 1. Exact canonical Vietnamese/English name match
 * 2. Exact reviewed alias match
 * 3. Canonical name prefix
 * 4. Reviewed alias prefix
 * 5. Canonical name substring
 * 6. Reviewed alias substring
 *
 * Only matches of rank 1-6 are returned; results are sorted by rank.
 */
export function searchEntities(dataset: PublicDataset, rawQuery: string): SearchResult[] {
  const query = normalizeSearchInput(rawQuery)
  if (query.length === 0) {
    return []
  }

  const results: SearchResult[] = []

  for (const entity of dataset.entities) {
    const canonicalVi = normalizeSearchInput(entity.nameVi)
    const canonicalEn = normalizeSearchInput(entity.nameEn)
    const entityAliases = dataset.aliases.filter((alias) => alias.entityId === entity.id)

    const rank = computeRank(query, canonicalVi, canonicalEn, entityAliases)
    if (rank === null) {
      continue
    }

    const category = dataset.categories.find((category) => category.id === entity.categoryId)
    if (!category) {
      continue
    }

    const markerCount = dataset.markers.filter((marker) => marker.entityId === entity.id).length

    results.push({ entity, category, map: dataset.map, markerCount, rank })
  }

  return results.sort((a, b) => {
    if (a.rank !== b.rank) {
      return a.rank - b.rank
    }
    return a.entity.nameVi.localeCompare(b.entity.nameVi, 'vi')
  })
}

function computeRank(
  query: string,
  canonicalVi: string,
  canonicalEn: string,
  aliases: { normalizedAlias: string }[]
): MatchRank {
  if (canonicalVi === query || canonicalEn === query) {
    return 1
  }

  if (aliases.some((alias) => alias.normalizedAlias === query)) {
    return 2
  }

  if (canonicalVi.startsWith(query) || canonicalEn.startsWith(query)) {
    return 3
  }

  if (aliases.some((alias) => alias.normalizedAlias.startsWith(query))) {
    return 4
  }

  if (canonicalVi.includes(query) || canonicalEn.includes(query)) {
    return 5
  }

  if (aliases.some((alias) => alias.normalizedAlias.includes(query))) {
    return 6
  }

  return null
}
