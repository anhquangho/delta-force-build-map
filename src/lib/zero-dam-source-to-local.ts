import { isNormalizedCoordinate, type NormalizedMapCoordinates } from './coordinates'

export const ZERO_DAM_SOURCE_CROP = {
  sourceImageWidth: 4096,
  sourceImageHeight: 4096,
  cropLeft: 0,
  cropTop: 512,
  cropWidth: 3584,
  cropHeight: 2560,
} as const

export interface SourceCoordinateResult extends NormalizedMapCoordinates {
  withinLocalCrop: boolean
}

export function zeroDamSourceToLocal(sourceX: number, sourceY: number): SourceCoordinateResult {
  if (!Number.isFinite(sourceX) || !Number.isFinite(sourceY)) {
    throw new RangeError('Zero Dam source coordinates must be finite numbers')
  }
  const sourceImageY = ZERO_DAM_SOURCE_CROP.sourceImageHeight - sourceY
  const xNormalized = (sourceX - ZERO_DAM_SOURCE_CROP.cropLeft) / ZERO_DAM_SOURCE_CROP.cropWidth
  const yNormalized = (sourceImageY - ZERO_DAM_SOURCE_CROP.cropTop) / ZERO_DAM_SOURCE_CROP.cropHeight
  return {
    xNormalized,
    yNormalized,
    withinLocalCrop: isNormalizedCoordinate(xNormalized) && isNormalizedCoordinate(yNormalized),
  }
}
