import type { NormalizedMapCoordinates } from './coordinates'
import type { DeltaForceMapsZeroDamCalibrationRecord } from '@/data/deltaForceMapsZeroDamCalibration'

export const ZERO_DAM_SOURCE_PREVIEW_EXTENT = 4096

export interface CalibrationCorrespondence extends NormalizedMapCoordinates {
  sourceExternalId: string
  sourceX: number
  sourceY: number
  sourceZ?: number
  calibrationRole: 'fit' | 'holdout'
}

export function provisionalSourcePreviewCoordinates(
  record: Pick<DeltaForceMapsZeroDamCalibrationRecord, 'sourceX' | 'sourceY'>,
): NormalizedMapCoordinates {
  return {
    xNormalized: record.sourceX / ZERO_DAM_SOURCE_PREVIEW_EXTENT,
    yNormalized: record.sourceY / ZERO_DAM_SOURCE_PREVIEW_EXTENT,
  }
}

export function createCalibrationCorrespondence(
  record: DeltaForceMapsZeroDamCalibrationRecord,
  coordinates: NormalizedMapCoordinates,
): CalibrationCorrespondence {
  return {
    sourceExternalId: record.sourceExternalId,
    sourceX: record.sourceX,
    sourceY: record.sourceY,
    ...(record.sourceZ === undefined ? {} : { sourceZ: record.sourceZ }),
    ...coordinates,
    calibrationRole: record.calibrationRole,
  }
}
