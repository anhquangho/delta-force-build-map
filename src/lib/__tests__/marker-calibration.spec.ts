import { describe, expect, it } from 'vitest'
import { deltaForceMapsZeroDamCalibrationRecords } from '@/data/deltaForceMapsZeroDamCalibration'
import { createCalibrationCorrespondence, provisionalSourcePreviewCoordinates } from '../marker-calibration'

describe('development source calibration correspondence', () => {
  it('creates a clearly provisional preview position while keeping raw source coordinates', () => {
    const record = deltaForceMapsZeroDamCalibrationRecords.find((candidate) => candidate.sourceExternalId === '165')!
    const original = structuredClone(record)

    expect(provisionalSourcePreviewCoordinates(record)).toEqual({
      xNormalized: 2455 / 4096,
      yNormalized: 1784 / 4096,
    })
    expect(record).toEqual(original)
  })

  it('copies exact source coordinates alongside only the reviewed normalized correspondence', () => {
    const record = deltaForceMapsZeroDamCalibrationRecords.find((candidate) => candidate.sourceExternalId === '165')!
    const original = structuredClone(record)
    const correspondence = createCalibrationCorrespondence(record, { xNormalized: 0.6123, yNormalized: 0.3341 })

    expect(correspondence).toEqual({
      sourceExternalId: '165',
      sourceX: 2455,
      sourceY: 1784,
      sourceZ: 1,
      xNormalized: 0.6123,
      yNormalized: 0.3341,
      calibrationRole: 'fit',
    })
    expect(record).toEqual(original)
    expect(correspondence).not.toHaveProperty('verificationStatus')
  })

  it('omits sourceZ when the source record did not provide it and preserves held-out role', () => {
    const record = deltaForceMapsZeroDamCalibrationRecords.find((candidate) => candidate.sourceExternalId === '195')!

    expect(createCalibrationCorrespondence(record, { xNormalized: 0.7, yNormalized: 0.8 })).toEqual({
      sourceExternalId: '195',
      sourceX: 2828,
      sourceY: 2822,
      xNormalized: 0.7,
      yNormalized: 0.8,
      calibrationRole: 'holdout',
    })
  })
})
