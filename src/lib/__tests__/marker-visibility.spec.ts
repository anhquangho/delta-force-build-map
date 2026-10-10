import { describe, expect, it } from 'vitest'
import { isMarkerVisibleInLocalMap } from '../marker-visibility'

const visibleMarker = { xNormalized: 0.5, yNormalized: 0.5 }

describe('isMarkerVisibleInLocalMap', () => {
  it('keeps local mock markers visible when their normalized points are in bounds', () => {
    expect(isMarkerVisibleInLocalMap(visibleMarker)).toBe(true)
    expect(isMarkerVisibleInLocalMap({ ...visibleMarker, withinLocalCrop: true })).toBe(true)
  })

  it('hides explicitly out-of-crop and out-of-range markers without clamping', () => {
    expect(isMarkerVisibleInLocalMap({ xNormalized: 1.1, yNormalized: 0.5, withinLocalCrop: false })).toBe(false)
    expect(isMarkerVisibleInLocalMap({ xNormalized: -0.1, yNormalized: 0.5 })).toBe(false)
    expect(isMarkerVisibleInLocalMap({ ...visibleMarker, withinLocalCrop: false })).toBe(false)
  })
})
