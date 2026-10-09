import type { ItemCatalogRecord } from '@/types/item-catalog'

export const ITEM_CATALOG_IDS = {
  safe: '2dfd6075-5a6b-41d9-9b75-4dbb4ef24f14',
  server: '710d1fd5-ad8e-4d01-b477-31e2ba6d42dc',
  computerCase: 'd4331952-8e35-4aa3-9ff1-2045c0711766',
  substationTechRoomKeycard: 'c44e3892-02bb-4775-9f3e-b5e27621b702',
  undergroundVaultStorageKeycard: 'de69a651-b734-43f3-a03e-08664098301a',
} as const

const officialItemWikiSource = {
  sourceName: 'Delta Force Official Wiki',
  sourceUrl: 'https://www.playdeltaforce.com/act/officialwiki/en/#/item',
  sourceExternalId: null,
  observedAt: '2026-10-02',
  assetReuseStatus: 'permitted',
} as const

export const itemCatalog: ItemCatalogRecord[] = [
  {
    id: ITEM_CATALOG_IDS.safe,
    nameVi: 'Két sắt',
    nameEn: 'Safe',
    iconAssetRef: 'image/safe.png',
    fallbackIconRef: 'icons/safe.svg',
    rarity: null,
    category: 'container',
    provenance: officialItemWikiSource,
    verificationStatus: 'candidate',
  },
  {
    id: ITEM_CATALOG_IDS.server,
    nameVi: 'Máy chủ',
    nameEn: 'Server',
    iconAssetRef: 'image/Serve.png',
    fallbackIconRef: 'icons/server.svg',
    rarity: null,
    category: 'container',
    provenance: officialItemWikiSource,
    verificationStatus: 'candidate',
  },
  {
    id: ITEM_CATALOG_IDS.computerCase,
    nameVi: 'Thùng máy tính',
    nameEn: 'Computer Case',
    iconAssetRef: 'image/Computer-Case.png',
    fallbackIconRef: 'icons/computer-case.svg',
    rarity: null,
    category: 'container',
    provenance: officialItemWikiSource,
    verificationStatus: 'candidate',
  },
  {
    id: ITEM_CATALOG_IDS.substationTechRoomKeycard,
    nameVi: 'Thẻ khóa phòng kỹ thuật trạm điện',
    nameEn: 'Substation Tech Room Keycard',
    iconAssetRef: 'image/keycard_white.png',
    fallbackIconRef: 'icons/access-card.svg',
    rarity: null,
    category: 'access-card',
    provenance: officialItemWikiSource,
    verificationStatus: 'candidate',
  },
  {
    id: ITEM_CATALOG_IDS.undergroundVaultStorageKeycard,
    nameVi: 'Thẻ kho lưu trữ ngầm',
    nameEn: 'Underground Vault Storage Keycard',
    iconAssetRef: 'image/keycard_gold.png',
    fallbackIconRef: 'icons/access-card.svg',
    rarity: null,
    category: 'access-card',
    provenance: officialItemWikiSource,
    verificationStatus: 'candidate',
  },
]
