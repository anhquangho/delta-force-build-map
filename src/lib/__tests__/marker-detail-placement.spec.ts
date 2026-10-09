import { describe, expect, it } from 'vitest'
import { placeMarkerDetail } from '../marker-detail-placement'

describe('placeMarkerDetail', () => {
  it('centers above the anchor when there is room', () => {
    expect(placeMarkerDetail({ x: 400, y: 300 }, { width: 320, height: 220 }, { width: 800, height: 600 })).toEqual({
      left: 240,
      top: 68,
      side: 'above',
      arrowX: 160,
    })
  })

  it('moves below near the top edge and keeps the card inside the map', () => {
    const placement = placeMarkerDetail({ x: 100, y: 30 }, { width: 320, height: 220 }, { width: 800, height: 600 })
    expect(placement).toEqual({ left: 12, top: 42, side: 'below', arrowX: 88 })
  })

  it('clamps the card and arrow near the right/bottom edges', () => {
    const placement = placeMarkerDetail({ x: 790, y: 580 }, { width: 320, height: 220 }, { width: 800, height: 600 })
    expect(placement.left).toBe(468)
    expect(placement.top).toBe(348)
    expect(placement.side).toBe('above')
    expect(placement.arrowX).toBe(304)
  })
})
