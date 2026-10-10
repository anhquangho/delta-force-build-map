import type { MapMarker } from '@/types/domain'
import { isNormalizedCoordinate } from './coordinates'

export function isMarkerVisibleInLocalMap(
  marker: Pick<MapMarker, 'xNormalized' | 'yNormalized' | 'withinLocalCrop'>,
): boolean {
  return marker.withinLocalCrop !== false &&
    isNormalizedCoordinate(marker.xNormalized) &&
    isNormalizedCoordinate(marker.yNormalized)
}
