import { describe, expect, it } from 'vitest'
import { createMarkerReviewPatch, markerPositionDelta, markerReviewModeEnabled } from '../marker-review'

describe('development marker review', () => {
  it('requires both development mode and the explicit query parameter', () => {
    expect(markerReviewModeEnabled('?devReview=1', true)).toBe(true)
    expect(markerReviewModeEnabled('', true)).toBe(false)
    expect(markerReviewModeEnabled('?devReview=true', true)).toBe(false)
    expect(markerReviewModeEnabled('?devReview=1', false)).toBe(false)
  })

  it('creates a review delta without changing project verification', () => {
    const delta = markerPositionDelta(
      { xNormalized: 0.5, yNormalized: 0.4 },
      { xNormalized: 0.6, yNormalized: 0.3 },
    )
    expect(delta.xNormalized).toBeCloseTo(0.1)
    expect(delta.yNormalized).toBeCloseTo(-0.1)

    const patch = createMarkerReviewPatch('project-marker-id', { xNormalized: 0.6, yNormalized: 0.3 })
    expect(patch).toEqual({
      markerId: 'project-marker-id',
      xNormalized: 0.6,
      yNormalized: 0.3,
      reviewStatus: 'human_reviewed',
    })
    expect(patch).not.toHaveProperty('verificationStatus')
  })
})
