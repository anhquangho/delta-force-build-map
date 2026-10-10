import type { NormalizedMapCoordinates } from './coordinates'
import type { DeltaForceMapsZeroDamCalibrationRecord } from '@/data/deltaForceMapsZeroDamCalibration'
import { zeroDamSourceToLocal, type SourceCoordinateResult } from './zero-dam-source-to-local'

export interface CalibrationCorrespondence extends NormalizedMapCoordinates {
  sourceExternalId: string
  sourceX: number
  sourceY: number
  sourceZ?: number
  calibrationRole: 'fit' | 'holdout'
}

export function sourceCoordinatesForCalibrationPreview(
  record: Pick<DeltaForceMapsZeroDamCalibrationRecord, 'sourceX' | 'sourceY'>,
): SourceCoordinateResult {
  return zeroDamSourceToLocal(record.sourceX, record.sourceY)
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
