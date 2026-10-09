export type YAxisOrientation = 'top-down' | 'bottom-up'

export interface SimpleMapBounds {
  west: number
  east: number
  north: number
  south: number
}

export interface TileGridBounds {
  minX: number
  maxX: number
  minY: number
  maxY: number
}

export interface TileZoomLevel {
  bounds: TileGridBounds
  rows: Record<number, readonly number[]>
}

export interface SourceCoordinateTransform {
  width: number
  height: number
  centerX: number
  centerY: number
}

export interface DevelopmentControlPoint {
  id: string
  nameEn: string
  sourceX: number
  sourceY: number
}

export interface LocalTileMapConfig {
  slug: string
  tileUrlTemplate: string
  tileIndexOrder: 'z-y-x' | 'z-x-y'
  tileSize: number
  minZoom: number
  maxZoom: number
  minNativeZoom: number
  maxNativeZoom: number
  coordinateWidth: number
  coordinateHeight: number
  yAxisOrientation: YAxisOrientation
  contentBounds: SimpleMapBounds
  panBoundsPaddingRatio: number
  maxBoundsViscosity: number
  tileLevels: Record<number, TileZoomLevel>
  sourceTransform: SourceCoordinateTransform
  developmentControlPoints: DevelopmentControlPoint[]
}
