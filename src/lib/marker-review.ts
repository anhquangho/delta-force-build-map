import type { NormalizedMapCoordinates } from './coordinates'

export interface MarkerReviewPatch extends NormalizedMapCoordinates {
  markerId: string
  reviewStatus: 'human_reviewed'
}

export function markerReviewModeEnabled(search: string, isDevelopment: boolean): boolean {
  return isDevelopment && new URLSearchParams(search).get('devReview') === '1'
}

export function markerPositionDelta(
  original: NormalizedMapCoordinates,
  current: NormalizedMapCoordinates,
): NormalizedMapCoordinates {
  return {
    xNormalized: current.xNormalized - original.xNormalized,
    yNormalized: current.yNormalized - original.yNormalized,
  }
}

export function createMarkerReviewPatch(
  markerId: string,
  coordinates: NormalizedMapCoordinates,
): MarkerReviewPatch {
  return { markerId, ...coordinates, reviewStatus: 'human_reviewed' }
}
