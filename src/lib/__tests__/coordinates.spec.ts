import { describe, it, expect } from 'vitest'
import { mapPointToNormalized, normalizedToMapPoint } from '../coordinates'

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
})
