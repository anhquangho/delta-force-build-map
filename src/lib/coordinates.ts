/**
 * Coordinate transforms between normalized (0..1) and renderer map-space.
 *
 * Normalized map points use a top-left origin. The selected local map
 * configuration converts this map-space contract to CRS.Simple bounds and
 * applies that map's y-axis orientation.
 */

import type { LocalTileMapConfig, SourceCoordinateTransform } from '@/types/map-config'

export interface MapPoint {
  x: number
  y: number
}

export interface LeafletSimplePoint {
  lat: number
  lng: number
}

export interface NormalizedMapCoordinates {
  xNormalized: number
  yNormalized: number
}

function assertPositiveDimensions(width: number, height: number) {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    throw new RangeError('Map dimensions must be positive finite numbers')
  }
}

export function isNormalizedCoordinate(value: number): boolean {
  return Number.isFinite(value) && value >= 0 && value <= 1
}

export function normalizedCoordinatesToMapPoint(
  coordinates: NormalizedMapCoordinates,
  width: number,
  height: number,
): MapPoint {
  assertPositiveDimensions(width, height)
  if (!Number.isFinite(coordinates.xNormalized) || !Number.isFinite(coordinates.yNormalized)) {
    throw new RangeError('Normalized coordinates must be finite numbers')
  }
  return {
    x: coordinates.xNormalized * width,
    y: coordinates.yNormalized * height,
  }
}

export function normalizedToMapPoint(
  xNormalized: number,
  yNormalized: number,
  width: number,
  height: number
): MapPoint {
  if (!isNormalizedCoordinate(xNormalized) || !isNormalizedCoordinate(yNormalized)) {
    throw new RangeError('Normalized coordinates must be finite values in the 0..1 range')
  }
  return normalizedCoordinatesToMapPoint({ xNormalized, yNormalized }, width, height)
}

export function mapPointToNormalized(point: MapPoint, width: number, height: number): MapPoint {
  assertPositiveDimensions(width, height)
  if (!Number.isFinite(point.x) || !Number.isFinite(point.y)) {
    throw new RangeError('Map coordinates must be finite numbers')
  }
  return {
    x: point.x / width,
    y: point.y / height,
  }
}

export function leafletSimplePointToNormalized(
  point: LeafletSimplePoint,
  config: Pick<LocalTileMapConfig, 'coordinateWidth' | 'coordinateHeight' | 'yAxisOrientation' | 'contentBounds'>,
): NormalizedMapCoordinates {
  if (!Number.isFinite(point.lat) || !Number.isFinite(point.lng)) {
    throw new RangeError('Leaflet coordinates must be finite numbers')
  }
  const mapPoint = {
    x: point.lng - config.contentBounds.west,
    y: config.yAxisOrientation === 'top-down'
      ? config.contentBounds.north - point.lat
      : point.lat - config.contentBounds.south,
  }
  const normalized = mapPointToNormalized(mapPoint, config.coordinateWidth, config.coordinateHeight)
  return { xNormalized: normalized.x, yNormalized: normalized.y }
}

export function clampNormalizedCoordinates(coordinates: NormalizedMapCoordinates): NormalizedMapCoordinates {
  if (!Number.isFinite(coordinates.xNormalized) || !Number.isFinite(coordinates.yNormalized)) {
    throw new RangeError('Normalized coordinates must be finite numbers')
  }
  return {
    xNormalized: Math.max(0, Math.min(1, coordinates.xNormalized)),
    yNormalized: Math.max(0, Math.min(1, coordinates.yNormalized)),
  }
}

export function normalizedToLeafletSimplePoint(
  xNormalized: number,
  yNormalized: number,
  config: Pick<LocalTileMapConfig, 'coordinateWidth' | 'coordinateHeight' | 'yAxisOrientation' | 'contentBounds'>,
): LeafletSimplePoint {
  const point = normalizedToMapPoint(xNormalized, yNormalized, config.coordinateWidth, config.coordinateHeight)
  const lat = config.yAxisOrientation === 'top-down'
    ? config.contentBounds.north - point.y
    : config.contentBounds.south + point.y
  return { lat, lng: config.contentBounds.west + point.x }
}

export function sourceWorldToLeafletSimplePoint(
  sourceX: number,
  sourceY: number,
  transform: SourceCoordinateTransform,
): LeafletSimplePoint {
  const xScale = transform.width / 128
  const yScale = transform.height / 128
  const mapX = 128 - (transform.centerX - sourceX) / xScale
  const mapY = -128 - (transform.centerY + sourceY) / yScale
  return { lat: mapY, lng: mapX }
}
