import type { LocalTileMapConfig } from '@/types/map-config'

export const zeroDamMapConfig: LocalTileMapConfig = {
  slug: 'zero-dam',
  tileUrlTemplate: `${import.meta.env.BASE_URL}assets/maps/zero-dam/{z}/{y}/{x}.webp`,
  tileIndexOrder: 'z-y-x',
  tileSize: 512,
  minZoom: -1,
  maxZoom: 5,
  minNativeZoom: 1,
  maxNativeZoom: 3,
  coordinateWidth: 448,
  coordinateHeight: 320,
  yAxisOrientation: 'top-down',
  contentBounds: { west: 0, east: 448, north: -64, south: -384 },
  panBoundsPaddingRatio: 0.05,
  maxBoundsViscosity: 0.8,
  tileLevels: {
    1: {
      bounds: { minX: 0, maxX: 1, minY: 0, maxY: 1 },
      rows: { 0: [0, 1], 1: [0, 1] },
    },
    2: {
      bounds: { minX: 0, maxX: 3, minY: 0, maxY: 3 },
      rows: { 0: [1, 2, 3], 1: [0, 1, 2, 3], 2: [0, 1, 2, 3], 3: [0, 1, 2] },
    },
    3: {
      bounds: { minX: 0, maxX: 6, minY: 1, maxY: 5 },
      rows: {
        1: [1, 2, 3, 4],
        2: [1, 2, 3, 4, 5, 6],
        3: [0, 1, 2, 3, 4, 5, 6],
        4: [0, 1, 2, 3, 4, 5, 6],
        5: [0, 2, 3, 4],
      },
    },
  },
  sourceTransform: {
    width: 81086.304688,
    height: 80988.5,
    centerX: 358155.6875,
    centerY: 750191.75,
  },
  developmentControlPoints: [
    { id: 'administrative-area', nameEn: 'Administrative Area', sourceX: 364598.8125, sourceY: -787795 },
    { id: 'major-substation', nameEn: 'Major Substation', sourceX: 371413.0625, sourceY: -768131.25 },
    { id: 'barracks', nameEn: 'Barracks', sourceX: 336667.78125, sourceY: -793117.8125 },
    { id: 'cement-plant', nameEn: 'Cement Plant', sourceX: 336179.1875, sourceY: -776354.5625 },
    { id: 'visitor-center', nameEn: 'Visitor Center', sourceX: 392334.90625, sourceY: -750165.75 },
  ],
}
