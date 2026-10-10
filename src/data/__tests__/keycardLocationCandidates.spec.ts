import { describe, expect, it } from 'vitest'
import { itemCatalog } from '../itemCatalog'
import { mockDataset, keycardLocationMarkerCandidates, selectSourceRecordsByLocationId } from '../mockDataset'
import { zeroDamSourceToLocal } from '@/lib/zero-dam-source-to-local'
import { searchEntities } from '@/lib/search-ranking'

const expectedRecords = [
  { id: '226', name: '???#D3-3', sourceX: 3063, sourceY: 1887, sourceZ: -1, sourceDescription: 'Last part of the puzzle for Se' },
  { id: '225', name: '???#D2-3', sourceX: 2378, sourceY: 1999, sourceZ: undefined, sourceDescription: 'Third part of the puzzle for S' },
  { id: '183', name: 'Cement Plant Office', sourceX: 1379, sourceY: 2006, sourceZ: 0, sourceDescription: '' },
  { id: '223', name: '???#D1-3', sourceX: 1054, sourceY: 1892, sourceZ: -1, sourceDescription: 'Second part of the puzzle for ' },
  { id: '161', name: 'Barracks Storage Room', sourceX: 1341, sourceY: 2879, sourceZ: 0, sourceDescription: '' },
  { id: '169', name: 'West Wing Control Room', sourceX: 2193, sourceY: 2741, sourceZ: undefined, sourceDescription: '2x Server rack, 1x Jacket, 1x ' },
  { id: '167', name: 'East Wing Managers Office', sourceX: 2369, sourceY: 2576, sourceZ: undefined, sourceDescription: '1x Large Weapon Crate, 2x Big ' },
  { id: '163', name: 'Substation Dormitory', sourceX: 2208, sourceY: 1569, sourceZ: undefined, sourceDescription: '3x loose item, 1x locker' },
  { id: '164', name: 'Ticket Office', sourceX: 3217, sourceY: 1186, sourceZ: 0, sourceDescription: '1x small safe, 1x briefcase, 1' },
  { id: '166', name: 'Equipment Collection Room', sourceX: 2434, sourceY: 2632, sourceZ: undefined, sourceDescription: '' },
  { id: '362', name: 'West Wing Monitoring Room', sourceX: 2231, sourceY: 2641, sourceZ: 1, sourceDescription: '' },
  { id: '162', name: 'Cement Plant Dormitory', sourceX: 1127, sourceY: 2151, sourceZ: 1, sourceDescription: '1x Computer Case, 1x Briefcase' },
  { id: '184', name: 'Central VIP Room', sourceX: 3270, sourceY: 1337, sourceZ: 1, sourceDescription: '2x Briefcase & 2 loose items' },
  { id: '165', name: 'Substation Tech Room', sourceX: 2455, sourceY: 1784, sourceZ: 1, sourceDescription: 'normal: 1x Big safe, 2x Server' },
  { id: '168', name: 'West Wing Infirmary', sourceX: 2237, sourceY: 2648, sourceZ: undefined, sourceDescription: '' },
]

describe('key_card source locations', () => {
  it('selects only the exact key_card source category', () => {
    expect(selectSourceRecordsByLocationId([
      { locationId: 'key_card', id: 'keycard-location' },
      { locationId: 'keycard', id: 'inventory-card' },
      { locationId: 'key_card_spawn', id: 'other-point' },
    ], 'key_card')).toEqual([{ locationId: 'key_card', id: 'keycard-location' }])
    expect(keycardLocationMarkerCandidates).toHaveLength(15)
    expect(keycardLocationMarkerCandidates.map((marker) => marker.provenance?.sourceExternalId)).toEqual(expectedRecords.map((record) => record.id))
  })

  it('preserves each named location/puzzle source record and projects through the shared adapter', () => {
    expect(keycardLocationMarkerCandidates.map((marker) => ({
      id: marker.provenance?.sourceExternalId,
      name: marker.provenance?.sourceRecordName,
      sourceX: marker.provenance?.sourceX,
      sourceY: marker.provenance?.sourceY,
      sourceZ: marker.provenance?.sourceZ,
      sourceDescription: marker.provenance?.sourceDescription,
    }))).toEqual(expectedRecords)

    for (const marker of keycardLocationMarkerCandidates) {
      const source = marker.provenance!
      expect(source.sourceKey).toBe('key_card')
      expect(marker.xNormalized).toBe(zeroDamSourceToLocal(source.sourceX, source.sourceY).xNormalized)
      expect(marker.yNormalized).toBe(zeroDamSourceToLocal(source.sourceX, source.sourceY).yNormalized)
      expect(marker.withinLocalCrop).toBe(true)
      expect(marker.verificationStatus).toBe('candidate')
      expect(marker.areaId).toBeUndefined()
    }
  })

  it('represents key_card points as separate location POIs, not inventory Keycard items', () => {
    const locationCategory = mockDataset.categories.find((category) => category.slug === 'keycard-location')!
    const locations = mockDataset.entities.filter((entity) => entity.categoryId === locationCategory.id)
    expect(locations).toHaveLength(15)
    expect(locations.every((entity) => entity.verificationStatus === 'candidate')).toBe(true)
    expect(keycardLocationMarkerCandidates.every((marker) => locations.some((entity) => entity.id === marker.entityId))).toBe(true)

    const itemKeycards = mockDataset.entities.filter((entity) => entity.slug.endsWith('-keycard'))
    expect(itemKeycards).toHaveLength(2)
    for (const entity of itemKeycards) {
      const markers = mockDataset.markers.filter((marker) => marker.entityId === entity.id)
      expect(markers).toHaveLength(1)
      expect(markers[0].verificationStatus).toBeUndefined()
      expect(markers[0].provenance).toBeUndefined()
      expect(keycardLocationMarkerCandidates.some((marker) => marker.entityId === entity.id)).toBe(false)
    }
  })

  it('retains source floor codes without assigning named levels or rarity/color meaning', () => {
    expect(keycardLocationMarkerCandidates.filter((marker) => marker.provenance?.sourceZ === -1)).toHaveLength(2)
    expect(keycardLocationMarkerCandidates.filter((marker) => marker.provenance?.sourceZ === 0)).toHaveLength(3)
    expect(keycardLocationMarkerCandidates.filter((marker) => marker.provenance?.sourceZ === 1)).toHaveLength(4)
    expect(keycardLocationMarkerCandidates.filter((marker) => marker.provenance?.sourceZ === undefined)).toHaveLength(6)

    for (const marker of keycardLocationMarkerCandidates) {
      const sourceZ = marker.provenance!.sourceZ
      expect(marker.floorKey).toBe(sourceZ === undefined ? undefined : String(sourceZ))
      expect(marker.provenance).not.toHaveProperty('rarity')
      expect(marker.provenance).not.toHaveProperty('color')
    }

    const locationCategory = mockDataset.categories.find((category) => category.slug === 'keycard-location')!
    expect(mockDataset.entities.filter((entity) => entity.categoryId === locationCategory.id).every((entity) => entity.catalogItemId === undefined)).toBe(true)
    expect(itemCatalog.filter((item) => item.category === 'access-card').map((item) => item.rarity)).toEqual([null, null])
    expect(itemCatalog.filter((item) => item.category === 'access-card').every((item) => item.provenance.sourceRarityLabel == null)).toBe(true)
  })

  it('keeps source candidates traceable and searchable by supported location names', () => {
    for (const marker of keycardLocationMarkerCandidates) {
      expect(marker.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)
      expect(marker.id).not.toBe(marker.provenance?.sourceExternalId)
      expect(marker.provenance).toMatchObject({
        sourceName: 'deltaforce-maps.com',
        sourceUrl: 'https://deltaforce-maps.com/data/zero-dam/markers.json',
        coordinateSpace: 'zero-dam-image-4096',
        sourceClaims: { validated: true, randomSpawn: false, difficulties: ['easy', 'normal', 'hard'] },
      })
    }
    expect(searchEntities(mockDataset, 'Cement Plant Office').map((result) => result.entity.slug)).toEqual(['cement-plant-office'])
    expect(new Set(searchEntities(mockDataset, 'keycard').map((result) => result.entity.slug))).toEqual(new Set([
      'substation-tech-room-keycard',
      'underground-vault-storage-keycard',
    ]))
  })
})
