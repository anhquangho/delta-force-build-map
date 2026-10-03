import type { PublicDataset } from '@/types/dataset'
import { normalizeSearchInput } from './search-normalization'

export interface DatasetValidationError {
  type: 'marker' | 'alias' | 'category' | 'entity'
  message: string
}

/**
 * Validate a public dataset against structural and referential constraints.
 *
 * This is intentionally a runtime/static guard, not a replacement for the
 * review/publication workflow. It runs over the mock dataset in tests and can
 * be reused by the future deterministic exporter.
 */
export function validateDataset(dataset: PublicDataset): DatasetValidationError[] {
  const errors: DatasetValidationError[] = []

  const entityIds = new Set(dataset.entities.map((entity) => entity.id))
  const areaIds = new Set(dataset.areas.map((area) => area.id))
  const categoryIds = new Set(dataset.categories.map((category) => category.id))
  const mapVersionId = dataset.mapVersion.id

  for (const marker of dataset.markers) {
    if (!entityIds.has(marker.entityId)) {
      errors.push({
        type: 'marker',
        message: `Marker ${marker.id} references unknown entity ${marker.entityId}`,
      })
    }

    if (marker.areaId && !areaIds.has(marker.areaId)) {
      errors.push({
        type: 'marker',
        message: `Marker ${marker.id} references unknown area ${marker.areaId}`,
      })
    }

    if (marker.mapVersionId !== mapVersionId) {
      errors.push({
        type: 'marker',
        message: `Marker ${marker.id} mapVersionId ${marker.mapVersionId} does not match dataset mapVersion ${mapVersionId}`,
      })
    }

    if (
      !Number.isFinite(marker.xNormalized) ||
      !Number.isFinite(marker.yNormalized) ||
      marker.xNormalized < 0 ||
      marker.xNormalized > 1 ||
      marker.yNormalized < 0 ||
      marker.yNormalized > 1
    ) {
      errors.push({
        type: 'marker',
        message: `Marker ${marker.id} coordinates out of 0..1 range`,
      })
    }
  }

  for (const alias of dataset.aliases) {
    if (!entityIds.has(alias.entityId)) {
      errors.push({
        type: 'alias',
        message: `Alias ${alias.id} (${alias.alias}) references unknown entity ${alias.entityId}`,
      })
      continue
    }

    const entity = dataset.entities.find((entity) => entity.id === alias.entityId)
    if (!entity) continue

    const canonicalVi = normalizeSearchInput(entity.nameVi)
    const canonicalEn = normalizeSearchInput(entity.nameEn)
    if (alias.normalizedAlias === canonicalVi || alias.normalizedAlias === canonicalEn) {
      errors.push({
        type: 'alias',
        message: `Alias "${alias.alias}" duplicates canonical name of entity ${entity.slug}`,
      })
    }
  }

  for (const category of dataset.categories) {
    if (category.parentId && !categoryIds.has(category.parentId)) {
      errors.push({
        type: 'category',
        message: `Category ${category.slug} references unknown parent ${category.parentId}`,
      })
    }
  }

  return errors
}
