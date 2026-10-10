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

    if (marker.verificationStatus === 'candidate' && !marker.provenance) {
      errors.push({ type: 'marker', message: `Candidate marker ${marker.id} is missing source provenance` })
    }

    if (marker.provenance) {
      const { provenance } = marker
      if (!provenance.sourceName || !provenance.sourceKey || !provenance.sourceUrl || !provenance.sourceExternalId || marker.id === provenance.sourceExternalId) {
        errors.push({ type: 'marker', message: `Marker ${marker.id} has incomplete or reused source identity` })
      }
      if (!Number.isFinite(provenance.sourceX) || !Number.isFinite(provenance.sourceY) || (provenance.sourceZ != null && !Number.isFinite(provenance.sourceZ))) {
        errors.push({ type: 'marker', message: `Marker ${marker.id} has invalid source coordinates` })
      }
    }

    const coordinatesAreFinite = Number.isFinite(marker.xNormalized) && Number.isFinite(marker.yNormalized)
    const coordinatesAreWithinCrop =
      marker.xNormalized >= 0 && marker.xNormalized <= 1 && marker.yNormalized >= 0 && marker.yNormalized <= 1
    const hasTraceableOutOfCropSource =
      marker.withinLocalCrop === false &&
      marker.verificationStatus === 'candidate' &&
      marker.provenance?.coordinateSpace === 'zero-dam-image-4096' &&
      Number.isFinite(marker.provenance.sourceX) &&
      Number.isFinite(marker.provenance.sourceY)

    if (!coordinatesAreFinite || (!coordinatesAreWithinCrop && !hasTraceableOutOfCropSource)) {
      errors.push({ type: 'marker', message: `Marker ${marker.id} coordinates out of 0..1 range` })
    }
    if (marker.withinLocalCrop === false && (!hasTraceableOutOfCropSource || coordinatesAreWithinCrop)) {
      errors.push({ type: 'marker', message: `Marker ${marker.id} has inconsistent local-crop classification` })
    }
    if (marker.withinLocalCrop === true && !coordinatesAreWithinCrop) {
      errors.push({ type: 'marker', message: `Marker ${marker.id} is marked within the local crop but has out-of-range coordinates` })
    }
    if (marker.provenance?.coordinateSpace === 'zero-dam-image-4096' && marker.withinLocalCrop === undefined) {
      errors.push({ type: 'marker', message: `Source marker ${marker.id} is missing local-crop classification` })
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
