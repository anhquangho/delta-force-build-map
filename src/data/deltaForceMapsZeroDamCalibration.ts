export type CalibrationRole = 'fit' | 'holdout'
export type CalibrationRegion = 'NW' | 'NE' | 'CENTER' | 'SW' | 'SE'
export type CalibrationConfidence = 'high' | 'medium'

export interface DeltaForceMapsZeroDamCalibrationRecord {
  sourceExternalId: string
  locationId: string
  name?: string
  description?: string
  sourceX: number
  sourceY: number
  sourceZ?: number
  approximateSourceRegion: CalibrationRegion
  calibrationRole: CalibrationRole
  confidence: CalibrationConfidence
}

export const deltaForceMapsZeroDamCalibrationRecords: readonly DeltaForceMapsZeroDamCalibrationRecord[] = [
  {
    sourceExternalId: '165',
    locationId: 'key_card',
    name: 'Substation Tech Room',
    description: 'normal: 1x Big safe, 2x Server',
    sourceX: 2455,
    sourceY: 1784,
    sourceZ: 1,
    approximateSourceRegion: 'CENTER',
    calibrationRole: 'fit',
    confidence: 'high',
  },
  {
    sourceExternalId: '183',
    locationId: 'key_card',
    name: 'Cement Plant Office',
    sourceX: 1379,
    sourceY: 2006,
    sourceZ: 0,
    approximateSourceRegion: 'NW',
    calibrationRole: 'fit',
    confidence: 'high',
  },
  {
    sourceExternalId: '161',
    locationId: 'key_card',
    name: 'Barracks Storage Room',
    sourceX: 1341,
    sourceY: 2879,
    sourceZ: 0,
    approximateSourceRegion: 'SW',
    calibrationRole: 'fit',
    confidence: 'high',
  },
  {
    sourceExternalId: '386',
    locationId: 'trigger',
    name: 'Industrial Elevator Switch',
    description: 'Activates the industrial eleva',
    sourceX: 2681,
    sourceY: 2137,
    sourceZ: 0,
    approximateSourceRegion: 'SE',
    calibrationRole: 'fit',
    confidence: 'high',
  },
  {
    sourceExternalId: '119',
    locationId: 'paid_exfil',
    description: '$10k on easy, $40k on medium',
    sourceX: 1872,
    sourceY: 1556,
    approximateSourceRegion: 'NW',
    calibrationRole: 'fit',
    confidence: 'medium',
  },
  {
    sourceExternalId: '1474',
    locationId: 'rare_spawn',
    description: 'Rare Spawn - Found Armored Veh',
    sourceX: 714,
    sourceY: 2762,
    sourceZ: 0,
    approximateSourceRegion: 'SW',
    calibrationRole: 'fit',
    confidence: 'medium',
  },
  {
    sourceExternalId: '164',
    locationId: 'key_card',
    name: 'Ticket Office',
    description: '1x small safe, 1x briefcase, 1',
    sourceX: 3217,
    sourceY: 1186,
    sourceZ: 0,
    approximateSourceRegion: 'NE',
    calibrationRole: 'holdout',
    confidence: 'high',
  },
  {
    sourceExternalId: '195',
    locationId: 'protocol_crate',
    name: 'Secret Protocol Crate #D1',
    description: 'You must complete the jump puz',
    sourceX: 2828,
    sourceY: 2822,
    approximateSourceRegion: 'SE',
    calibrationRole: 'holdout',
    confidence: 'medium',
  },
]
