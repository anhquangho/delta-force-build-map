import { describe, expect, it } from 'vitest'
import { zeroDamMapConfig } from '@/data/zeroDamMap'
import { isTileViewCovered, isTileViewInsidePanBounds, minimumZoomForMapFit, nearestCoveredTileViewCenter, panBoundsForViewport, type TileCoverageView } from '../map-tiles'

const viewport = { width: 1130, height: 900 }
const extremeViews: Array<[string, TileCoverageView]> = [
  ['top-left', { ...viewport, tileZoom: 3, zoom: 3, center: { lng: 70.625, lat: -120.25 } }],
  ['top-right', { ...viewport, tileZoom: 3, zoom: 3, center: { lng: 377.375, lat: -120.25 } }],
  ['bottom-left', { ...viewport, tileZoom: 3, zoom: 3, center: { lng: 70.625, lat: -327.75 } }],
  ['bottom-right', { ...viewport, tileZoom: 3, zoom: 3, center: { lng: 377.375, lat: -327.75 } }],
  ['top-left overzoom', { ...viewport, tileZoom: 3, zoom: 5, center: { lng: 17.65625, lat: -78.0625 } }],
  ['top-right overzoom', { ...viewport, tileZoom: 3, zoom: 5, center: { lng: 430.34375, lat: -78.0625 } }],
  ['bottom-left overzoom', { ...viewport, tileZoom: 3, zoom: 5, center: { lng: 17.65625, lat: -369.9375 } }],
  ['bottom-right overzoom', { ...viewport, tileZoom: 3, zoom: 5, center: { lng: 430.34375, lat: -369.9375 } }],
]

describe('tile coverage viewport constraints', () => {
  it.each(extremeViews)('keeps the %s viewport on available tiles', (_name, view) => {
    const center = nearestCoveredTileViewCenter(zeroDamMapConfig, view)
    expect(center).not.toBeNull()
    expect(isTileViewInsidePanBounds(zeroDamMapConfig, { ...view, center: center! })).toBe(true)
  })

  it('retains an edge view inside the configured pan margin instead of recentering', () => {
    const view = { center: { lng: 120.25, lat: -109 }, zoom: 3, tileZoom: 3, width: 1000, height: 800 }
    expect(isTileViewCovered(zeroDamMapConfig, view)).toBe(false)
    expect(isTileViewInsidePanBounds(zeroDamMapConfig, view)).toBe(true)
    expect(nearestCoveredTileViewCenter(zeroDamMapConfig, view)).toEqual(view.center)
  })

  it('derives a small viewport-scaled pan margin separate from content bounds', () => {
    expect(panBoundsForViewport(zeroDamMapConfig, 1000, 800, 2)).toEqual({
      west: -12.5,
      east: 460.5,
      north: -54,
      south: -394,
    })
    expect(zeroDamMapConfig.maxBoundsViscosity).toBe(0.8)
  })

  it('derives a snapped minimum that keeps the full map overview visible', () => {
    expect(minimumZoomForMapFit(zeroDamMapConfig, 1130, 900, 0.25)).toBe(1.25)
    expect(minimumZoomForMapFit(zeroDamMapConfig, 390, 844, 0.25)).toBe(-0.25)
    expect(minimumZoomForMapFit(zeroDamMapConfig, 1440, 900, 0.25)).toBe(1.25)
  })
})
