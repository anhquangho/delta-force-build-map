/**
 * Coordinate transforms between normalized (0..1) and renderer map-space.
 *
 * The current mock transform assumes yNormalized=0 maps to the top of the map
 * image and yNormalized=1 maps to the bottom. This is a placeholder assumption
 * for the vertical slice and must be verified with control points before using
 * a real basemap.
 */

export interface MapPoint {
  x: number
  y: number
}

export function normalizedToMapPoint(
  xNormalized: number,
  yNormalized: number,
  width: number,
  height: number
): MapPoint {
  return {
    x: xNormalized * width,
    y: yNormalized * height,
  }
}

export function mapPointToNormalized(point: MapPoint, width: number, height: number): MapPoint {
  return {
    x: point.x / width,
    y: point.y / height,
  }
}
