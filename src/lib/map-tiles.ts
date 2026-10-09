import type { LocalTileMapConfig, SimpleMapBounds } from '@/types/map-config'

const EPSILON = 1e-7

export interface TileCoverageView {
  center: { lat: number; lng: number }
  zoom: number
  tileZoom: number
  width: number
  height: number
}

interface CoveredRectangle {
  bounds: SimpleMapBounds
  area: number
}

const rectangleCache = new WeakMap<LocalTileMapConfig, Map<number, CoveredRectangle[]>>()

export function isMapTileAvailable(config: LocalTileMapConfig, zoom: number, x: number, y: number): boolean {
  const level = config.tileLevels[zoom]
  if (!level || !Number.isInteger(x) || !Number.isInteger(y)) return false
  if (x < level.bounds.minX || x > level.bounds.maxX || y < level.bounds.minY || y > level.bounds.maxY) return false
  return level.rows[y]?.includes(x) ?? false
}

function getCoveredRectangles(config: LocalTileMapConfig, zoom: number): CoveredRectangle[] {
  const cached = rectangleCache.get(config)?.get(zoom)
  if (cached) return cached
  const level = config.tileLevels[zoom]
  if (!level) return []
  const rectangles: CoveredRectangle[] = []
  const tileWorldSize = config.tileSize / 2 ** zoom

  for (let minY = level.bounds.minY; minY <= level.bounds.maxY; minY += 1) {
    for (let maxY = minY; maxY <= level.bounds.maxY; maxY += 1) {
      for (let minX = level.bounds.minX; minX <= level.bounds.maxX; minX += 1) {
        for (let maxX = minX; maxX <= level.bounds.maxX; maxX += 1) {
          let covered = true
          for (let y = minY; covered && y <= maxY; y += 1) {
            for (let x = minX; x <= maxX; x += 1) {
              if (!isMapTileAvailable(config, zoom, x, y)) {
                covered = false
                break
              }
            }
          }
          if (!covered) continue

          const bounds = {
            west: Math.max(config.contentBounds.west, minX * tileWorldSize),
            east: Math.min(config.contentBounds.east, (maxX + 1) * tileWorldSize),
            north: Math.min(config.contentBounds.north, -minY * tileWorldSize),
            south: Math.max(config.contentBounds.south, -(maxY + 1) * tileWorldSize),
          }
          const width = bounds.east - bounds.west
          const height = bounds.north - bounds.south
          if (width > 0 && height > 0) rectangles.push({ bounds, area: width * height })
        }
      }
    }
  }

  const zoomCache = rectangleCache.get(config) ?? new Map<number, CoveredRectangle[]>()
  zoomCache.set(zoom, rectangles)
  rectangleCache.set(config, zoomCache)
  return rectangles
}

export function isTileViewCovered(config: LocalTileMapConfig, view: TileCoverageView): boolean {
  if (!Number.isFinite(view.zoom) || view.width <= 0 || view.height <= 0) return false
  const scale = 2 ** view.zoom
  const halfWidth = view.width / (2 * scale)
  const halfHeight = view.height / (2 * scale)
  const west = view.center.lng - halfWidth
  const east = view.center.lng + halfWidth
  const north = view.center.lat + halfHeight
  const south = view.center.lat - halfHeight

  if (
    west < config.contentBounds.west - EPSILON ||
    east > config.contentBounds.east + EPSILON ||
    north > config.contentBounds.north + EPSILON ||
    south < config.contentBounds.south - EPSILON
  ) return false

  const tileScale = 2 ** view.tileZoom / config.tileSize
  const minX = Math.floor(west * tileScale + EPSILON)
  const maxX = Math.floor(east * tileScale - EPSILON)
  const minY = Math.floor(-north * tileScale + EPSILON)
  const maxY = Math.floor(-south * tileScale - EPSILON)

  for (let y = minY; y <= maxY; y += 1) {
    for (let x = minX; x <= maxX; x += 1) {
      if (!isMapTileAvailable(config, view.tileZoom, x, y)) return false
    }
  }
  return true
}

export function panBoundsForViewport(
  config: LocalTileMapConfig,
  width: number,
  height: number,
  zoom: number,
): SimpleMapBounds {
  const paddingX = width / 2 ** zoom * config.panBoundsPaddingRatio
  const paddingY = height / 2 ** zoom * config.panBoundsPaddingRatio
  return {
    west: config.contentBounds.west - paddingX,
    east: config.contentBounds.east + paddingX,
    north: config.contentBounds.north + paddingY,
    south: config.contentBounds.south - paddingY,
  }
}

export function isTileViewInsidePanBounds(config: LocalTileMapConfig, view: TileCoverageView): boolean {
  const halfWidth = view.width / (2 * 2 ** view.zoom)
  const halfHeight = view.height / (2 * 2 ** view.zoom)
  const bounds = panBoundsForViewport(config, view.width, view.height, view.zoom)
  return view.center.lng - halfWidth >= bounds.west - EPSILON &&
    view.center.lng + halfWidth <= bounds.east + EPSILON &&
    view.center.lat + halfHeight <= bounds.north + EPSILON &&
    view.center.lat - halfHeight >= bounds.south - EPSILON
}

function centerInsidePanBounds(config: LocalTileMapConfig, view: TileCoverageView): { lat: number; lng: number } {
  const halfWidth = view.width / (2 * 2 ** view.zoom)
  const halfHeight = view.height / (2 * 2 ** view.zoom)
  const bounds = panBoundsForViewport(config, view.width, view.height, view.zoom)
  const mapWidth = bounds.east - bounds.west
  const mapHeight = bounds.north - bounds.south
  return {
    lng: mapWidth <= halfWidth * 2
      ? (bounds.west + bounds.east) / 2
      : Math.max(bounds.west + halfWidth, Math.min(bounds.east - halfWidth, view.center.lng)),
    lat: mapHeight <= halfHeight * 2
      ? (bounds.north + bounds.south) / 2
      : Math.max(bounds.south + halfHeight, Math.min(bounds.north - halfHeight, view.center.lat)),
  }
}

export function nearestCoveredTileViewCenter(
  config: LocalTileMapConfig,
  view: TileCoverageView,
): { lat: number; lng: number } | null {
  const requestedCenter = view.center
  const boundedView = { ...view, center: centerInsidePanBounds(config, view) }
  if (isTileViewCovered(config, boundedView)) return boundedView.center
  const scale = 2 ** view.zoom
  const halfWidth = view.width / (2 * scale)
  const halfHeight = view.height / (2 * scale)
  const paddingX = view.width / scale * config.panBoundsPaddingRatio
  const paddingY = view.height / scale * config.panBoundsPaddingRatio
  let nearest: { center: { lat: number; lng: number }; distance: number; area: number } | null = null

  for (const rectangle of getCoveredRectangles(config, view.tileZoom)) {
    const { bounds } = rectangle
    const minLng = bounds.west + halfWidth - paddingX
    const maxLng = bounds.east - halfWidth + paddingX
    const minLat = bounds.south + halfHeight - paddingY
    const maxLat = bounds.north - halfHeight + paddingY
    if (minLng > maxLng || minLat > maxLat) continue

    const center = {
      lng: Math.max(minLng, Math.min(maxLng, boundedView.center.lng)),
      lat: Math.max(minLat, Math.min(maxLat, boundedView.center.lat)),
    }
    const distance = ((center.lng - requestedCenter.lng) ** 2 + (center.lat - requestedCenter.lat) ** 2) * scale ** 2
    if (!nearest || distance < nearest.distance - EPSILON || (Math.abs(distance - nearest.distance) <= EPSILON && rectangle.area > nearest.area)) {
      nearest = { center, distance, area: rectangle.area }
    }
  }

  return nearest?.center ?? boundedView.center
}

export function minimumZoomForMapFit(
  config: LocalTileMapConfig,
  width: number,
  height: number,
  zoomSnap: number,
): number {
  if (width <= 0 || height <= 0 || zoomSnap <= 0) return config.minZoom
  const scale = Math.min(
    width / (config.contentBounds.east - config.contentBounds.west),
    height / (config.contentBounds.north - config.contentBounds.south),
  )
  const fitZoom = Math.log2(scale)
  const snappedZoom = Math.floor((fitZoom + EPSILON) / zoomSnap) * zoomSnap
  return Math.max(config.minZoom, Math.min(config.maxZoom, snappedZoom))
}
