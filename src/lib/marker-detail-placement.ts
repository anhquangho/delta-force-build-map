export interface MarkerPoint {
  x: number
  y: number
}

export interface MarkerDetailSize {
  width: number
  height: number
}

export interface MarkerViewportSize {
  width: number
  height: number
}

export interface MarkerDetailPlacement {
  left: number
  top: number
  side: 'above' | 'below'
  arrowX: number
}

const clamp = (value: number, minimum: number, maximum: number) => Math.max(minimum, Math.min(value, maximum))

export function placeMarkerDetail(
  point: MarkerPoint,
  card: MarkerDetailSize,
  viewport: MarkerViewportSize,
  gap = 12,
  margin = 12,
): MarkerDetailPlacement {
  const safeMargin = Math.min(margin, viewport.width / 2, viewport.height / 2)
  const maximumLeft = Math.max(safeMargin, viewport.width - card.width - safeMargin)
  const left = clamp(point.x - card.width / 2, safeMargin, maximumLeft)
  const aboveTop = point.y - card.height - gap
  const belowTop = point.y + gap
  const aboveFits = aboveTop >= safeMargin
  const belowFits = belowTop + card.height <= viewport.height - safeMargin
  const aboveSpace = point.y - gap - safeMargin
  const belowSpace = viewport.height - safeMargin - point.y - gap
  const side = aboveFits ? 'above' : belowFits ? 'below' : aboveSpace >= belowSpace ? 'above' : 'below'
  const preferredTop = side === 'above' ? aboveTop : belowTop
  const maximumTop = Math.max(safeMargin, viewport.height - card.height - safeMargin)
  const top = clamp(preferredTop, safeMargin, maximumTop)
  const arrowInset = Math.min(16, card.width / 2)

  return {
    left,
    top,
    side,
    arrowX: clamp(point.x - left, arrowInset, Math.max(arrowInset, card.width - arrowInset)),
  }
}
