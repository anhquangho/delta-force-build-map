import { describe, expect, it } from 'vitest'
import { itemCatalog, ITEM_CATALOG_IDS } from '../itemCatalog'
import { mockDataset } from '../mockDataset'
import type { ItemCatalogRecord } from '@/types/item-catalog'
import { getItemPresentation } from '@/lib/item-presentation'
import { isItemRarity, mapSourceRarity, validateItemCatalog } from '@/lib/item-catalog-validation'

describe('item catalog', () => {
  it('contains five candidate records with project IDs and provenance', () => {
    expect(itemCatalog).toHaveLength(5)
    expect(validateItemCatalog(itemCatalog)).toEqual([])
    expect(itemCatalog.every((item) => item.verificationStatus === 'candidate')).toBe(true)
    expect(itemCatalog.every((item) => item.provenance.sourceExternalId === null)).toBe(true)
    expect(itemCatalog.every((item) => item.provenance.assetReuseStatus === 'permitted')).toBe(true)
    expect(itemCatalog.map((item) => item.nameEn)).toEqual([
      'Safe',
      'Server',
      'Computer Case',
      'Substation Tech Room Keycard',
      'Underground Vault Storage Keycard',
    ])
  })

  it('leaves all sample rarity values unknown without source-level claims', () => {
    expect(itemCatalog.every((item) => item.rarity === null)).toBe(true)
    expect(itemCatalog.every((item) => item.provenance.sourceRarityLabel == null)).toBe(true)
  })

  it('links all five sample entities to matching catalog records', () => {
    expect(mockDataset.entities.map((entity) => entity.catalogItemId)).toEqual([
      ITEM_CATALOG_IDS.safe,
      ITEM_CATALOG_IDS.server,
      ITEM_CATALOG_IDS.computerCase,
      ITEM_CATALOG_IDS.substationTechRoomKeycard,
      ITEM_CATALOG_IDS.undergroundVaultStorageKeycard,
    ])
  })

  it('accepts only project rarity values and maps source labels independently of CSS classes', () => {
    expect(['common', 'uncommon', 'rare', 'epic', 'legendary', 'special'].every(isItemRarity)).toBe(true)
    expect(isItemRarity('mythic')).toBe(false)
    expect([
      ['Gray', 'common'], ['Green', 'uncommon'], ['Blue', 'rare'],
      ['Purple', 'epic'], ['Gold', 'legendary'], ['Red', 'special'],
    ].map(([label]) => mapSourceRarity(label)).join(',')).toBe('common,uncommon,rare,epic,legendary,special')
    expect(mapSourceRarity('unknown tier')).toBeNull()
    expect(JSON.stringify(itemCatalog)).not.toContain('img_levelicon_')
  })

  it('uses a local fallback when the primary icon asset is absent', () => {
    const card = itemCatalog.find((item) => item.category === 'access-card')!
    const presentation = getItemPresentation({ ...card, iconAssetRef: null })
    expect(presentation.icon).toBeUndefined()
    expect(presentation.fallbackIcon).toBe('/icons/access-card.svg')
    expect(validateItemCatalog([{ ...card, iconAssetRef: null }])).toEqual([])
    expect(itemCatalog.filter((item) => item.iconAssetRef).map((item) => item.iconAssetRef)).toEqual([
      'image/safe.png',
      'image/Serve.png',
      'image/Computer-Case.png',
      'image/keycard_white.png',
      'image/keycard_gold.png',
    ])
  })

  it('rejects invalid rarity and incomplete provenance', () => {
    const base = itemCatalog[0]
    const invalid = {
      ...base,
      rarity: 'mythic',
      provenance: { ...base.provenance, sourceName: '', sourceUrl: '' },
    } as unknown as ItemCatalogRecord
    const errors = validateItemCatalog([invalid])
    expect(errors).toContain(`${base.id}: invalid project rarity`)
    expect(errors).toContain(`${base.id}: provenance source name is required`)
    expect(errors).toContain(`${base.id}: provenance source URL is required`)
  })

  it('rejects external runtime icon URLs and requires a local fallback', () => {
    const base = itemCatalog[0]
    const invalid = {
      ...base,
      iconAssetRef: 'https://assets.example/item.png',
      fallbackIconRef: '',
      provenance: { ...base.provenance, assetReuseStatus: 'unconfirmed' as const },
    }
    const errors = validateItemCatalog([invalid])
    expect(errors).toContain(`${base.id}: a local fallback icon is required`)
    expect(errors).toContain(`${base.id}: icon asset must be a local project path`)
    expect(errors).toContain(`${base.id}: icon asset reuse is not approved`)
  })
})
