import { describe, it, expect } from 'vitest'
import { zeroDamMapConfig } from '@/data/zeroDamMap'
import { mapPointToNormalized, normalizedToLeafletSimplePoint, normalizedToMapPoint, sourceWorldToLeafletSimplePoint } from '../coordinates'

describe('coordinates', () => {
  it('maps normalized (0,0) to top-left of map-space', () => {
    expect(normalizedToMapPoint(0, 0, 4096, 4096)).toEqual({ x: 0, y: 0 })
  })

  it('maps normalized (1,1) to bottom-right of map-space', () => {
    expect(normalizedToMapPoint(1, 1, 4096, 4096)).toEqual({ x: 4096, y: 4096 })
  })

  it('scales linearly between 0 and the map dimensions', () => {
    expect(normalizedToMapPoint(0.5, 0.25, 1000, 2000)).toEqual({ x: 500, y: 500 })
  })

  it('round-trips through mapPointToNormalized', () => {
    const original = { x: 0.35, y: 0.42 }
    const point = normalizedToMapPoint(original.x, original.y, 4096, 4096)
    expect(mapPointToNormalized(point, 4096, 4096)).toEqual(original)
  })

  it('converts top-down normalized coordinates to the configured CRS.Simple bounds', () => {
    expect(normalizedToLeafletSimplePoint(0, 0, zeroDamMapConfig)).toEqual({ lat: -64, lng: 0 })
    expect(normalizedToLeafletSimplePoint(1, 1, zeroDamMapConfig)).toEqual({ lat: -384, lng: 448 })
    expect(normalizedToLeafletSimplePoint(0.25, 0.75, zeroDamMapConfig)).toEqual({ lat: -304, lng: 112 })
  })

  it('maps source-world control coordinates with the collected Zero Dam transform', () => {
    const source = zeroDamMapConfig.sourceTransform
    expect(sourceWorldToLeafletSimplePoint(source.centerX, -source.centerY, source)).toEqual({ lat: -128, lng: 128 })
    const adminArea = zeroDamMapConfig.developmentControlPoints.find((point) => point.id === 'administrative-area')!
    const point = sourceWorldToLeafletSimplePoint(adminArea.sourceX, adminArea.sourceY, source)
    expect(point.lng).toBeCloseTo(138.17, 1)
    expect(point.lat).toBeCloseTo(-68.58, 1)
  })

  it.each([[-0.01, 0.5], [0.5, 1.01], [Number.NaN, 0.5], [0.5, Number.POSITIVE_INFINITY]])(
    'rejects invalid normalized point (%s, %s)',
    (x, y) => {
      expect(() => normalizedToLeafletSimplePoint(x, y, zeroDamMapConfig)).toThrow(RangeError)
    },
  )
})
