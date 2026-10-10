import { describe, expect, it } from 'vitest'
import { ZERO_DAM_SOURCE_CROP, zeroDamSourceToLocal } from '../zero-dam-source-to-local'

describe('zeroDamSourceToLocal', () => {
  it('uses the inspected 4096 source image and crop dimensions', () => {
    expect(ZERO_DAM_SOURCE_CROP).toEqual({
      sourceImageWidth: 4096,
      sourceImageHeight: 4096,
      cropLeft: 0,
      cropTop: 512,
      cropWidth: 3584,
      cropHeight: 2560,
    })
  })

  it('maps horizontal crop edges to normalized zero and one', () => {
    expect(zeroDamSourceToLocal(0, 2048).xNormalized).toBe(0)
    expect(zeroDamSourceToLocal(3584, 2048).xNormalized).toBe(1)
  })

  it('converts source Y-up coordinates into top-down crop coordinates once', () => {
    expect(zeroDamSourceToLocal(0, 3584).yNormalized).toBe(0)
    expect(zeroDamSourceToLocal(0, 1024).yNormalized).toBe(1)
    expect(zeroDamSourceToLocal(2455, 1784).yNormalized).toBe(1800 / 2560)
  })

  it('treats all crop boundaries as inclusive', () => {
    expect(zeroDamSourceToLocal(0, 3584).withinLocalCrop).toBe(true)
    expect(zeroDamSourceToLocal(3584, 1024).withinLocalCrop).toBe(true)
  })

  it('preserves out-of-crop values without clamping and classifies them separately', () => {
    const outsideRight = zeroDamSourceToLocal(3585, 2048)
    const outsideTop = zeroDamSourceToLocal(100, 1023)
    const outsideBottom = zeroDamSourceToLocal(100, 3585)

    expect(outsideRight).toMatchObject({ xNormalized: 3585 / 3584, withinLocalCrop: false })
    expect(outsideTop).toMatchObject({ yNormalized: 2561 / 2560, withinLocalCrop: false })
    expect(outsideBottom).toMatchObject({ yNormalized: -1 / 2560, withinLocalCrop: false })
  })

  it('is deterministic and rejects non-finite source coordinates', () => {
    expect(zeroDamSourceToLocal(2455, 1784)).toEqual(zeroDamSourceToLocal(2455, 1784))
    expect(() => zeroDamSourceToLocal(Number.NaN, 1784)).toThrow(RangeError)
    expect(() => zeroDamSourceToLocal(2455, Number.POSITIVE_INFINITY)).toThrow(RangeError)
  })
})
