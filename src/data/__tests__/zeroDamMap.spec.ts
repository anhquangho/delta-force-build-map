import { describe, expect, it } from 'vitest'
import { zeroDamMapConfig } from '../zeroDamMap'
import { isMapTileAvailable } from '@/lib/map-tiles'

describe('zeroDamMapConfig', () => {
  it('uses the inspected z/y/x local tile path and native zoom range', () => {
    expect(zeroDamMapConfig.tileUrlTemplate).toContain('/assets/maps/zero-dam/{z}/{y}/{x}.webp')
    expect(zeroDamMapConfig.tileIndexOrder).toBe('z-y-x')
    expect(zeroDamMapConfig.tileSize).toBe(512)
    expect(zeroDamMapConfig.minZoom).toBe(-1)
    expect(zeroDamMapConfig.maxZoom).toBe(5)
    expect(zeroDamMapConfig.minNativeZoom).toBe(1)
    expect(zeroDamMapConfig.maxNativeZoom).toBe(3)
    expect(zeroDamMapConfig.panBoundsPaddingRatio).toBe(0.05)
    expect(zeroDamMapConfig.maxBoundsViscosity).toBe(0.8)
    expect(zeroDamMapConfig.tileLevels[1].bounds).toEqual({ minX: 0, maxX: 1, minY: 0, maxY: 1 })
    expect(zeroDamMapConfig.tileLevels[2].bounds).toEqual({ minX: 0, maxX: 3, minY: 0, maxY: 3 })
    expect(zeroDamMapConfig.tileLevels[3].bounds).toEqual({ minX: 0, maxX: 6, minY: 1, maxY: 5 })
  })

  it('derives Simple map bounds from the max native tile extent', () => {
    const level = zeroDamMapConfig.tileLevels[3]
    const columns = level.bounds.maxX - level.bounds.minX + 1
    const rows = level.bounds.maxY - level.bounds.minY + 1
    expect(zeroDamMapConfig.coordinateWidth).toBe(columns * zeroDamMapConfig.tileSize / 2 ** 3)
    expect(zeroDamMapConfig.coordinateHeight).toBe(rows * zeroDamMapConfig.tileSize / 2 ** 3)
    expect(zeroDamMapConfig.contentBounds).toEqual({ west: 0, east: 448, north: -64, south: -384 })
    expect(zeroDamMapConfig.yAxisOrientation).toBe('top-down')
  })

  it('contains the locally observed tile availability and excludes holes/out-of-bounds files', () => {
    expect(isMapTileAvailable(zeroDamMapConfig, 1, 0, 0)).toBe(true)
    expect(isMapTileAvailable(zeroDamMapConfig, 2, 3, 2)).toBe(true)
    expect(isMapTileAvailable(zeroDamMapConfig, 2, 0, 0)).toBe(false)
    expect(isMapTileAvailable(zeroDamMapConfig, 2, 0, 3)).toBe(true)
    expect(isMapTileAvailable(zeroDamMapConfig, 2, 3, 3)).toBe(false)
    expect(isMapTileAvailable(zeroDamMapConfig, 3, 0, 1)).toBe(false)
    expect(isMapTileAvailable(zeroDamMapConfig, 3, 6, 4)).toBe(true)
    expect(isMapTileAvailable(zeroDamMapConfig, 4, 0, 0)).toBe(false)
  })

  it('keeps five alignment landmarks separate from item entities and markers', () => {
    expect(zeroDamMapConfig.developmentControlPoints.map((point) => point.nameEn)).toEqual([
      'Administrative Area',
      'Major Substation',
      'Barracks',
      'Cement Plant',
      'Visitor Center',
    ])
  })
})
