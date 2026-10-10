import { describe, expect, it } from 'vitest'
import { deltaForceMapsZeroDamCalibrationRecords } from '../deltaForceMapsZeroDamCalibration'

describe('selected Zero Dam calibration source records', () => {
  it('keeps a bounded, distinctive, distributed set with explicit held-out points', () => {
    expect(deltaForceMapsZeroDamCalibrationRecords).toHaveLength(8)
    expect(new Set(deltaForceMapsZeroDamCalibrationRecords.map((record) => record.sourceExternalId)).size).toBe(8)
    expect(new Set(deltaForceMapsZeroDamCalibrationRecords.map((record) => record.locationId)).size).toBeGreaterThanOrEqual(4)
    expect(deltaForceMapsZeroDamCalibrationRecords.filter((record) => record.calibrationRole === 'fit')).toHaveLength(6)
    expect(deltaForceMapsZeroDamCalibrationRecords.filter((record) => record.calibrationRole === 'holdout').map((record) => record.sourceExternalId)).toEqual(['164', '195'])
  })

  it('preserves raw source coordinates and reports source-space spread without adding imported markers', () => {
    for (const record of deltaForceMapsZeroDamCalibrationRecords) {
      expect(record.sourceX).toBeGreaterThanOrEqual(0)
      expect(record.sourceX).toBeLessThanOrEqual(4096)
      expect(record.sourceY).toBeGreaterThanOrEqual(0)
      expect(record.sourceY).toBeLessThanOrEqual(4096)
    }
    expect(new Set(deltaForceMapsZeroDamCalibrationRecords.map((record) => record.approximateSourceRegion))).toEqual(
      new Set(['NW', 'NE', 'CENTER', 'SW', 'SE']),
    )
    expect(deltaForceMapsZeroDamCalibrationRecords.some((record) => record.locationId === 'server')).toBe(false)
  })
})
