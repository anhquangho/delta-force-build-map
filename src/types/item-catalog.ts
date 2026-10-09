import type { ItemRarity, VerificationStatus } from './domain'

export type ItemVerificationStatus = VerificationStatus
export type ItemCatalogCategory = 'container' | 'access-card'
export type AssetReuseStatus = 'unconfirmed' | 'permitted' | 'not-approved'

export interface ItemProvenance {
  sourceName: string
  sourceUrl: string
  sourceExternalId: string | null
  observedAt: string
  assetReuseStatus: AssetReuseStatus
  sourceRarityLabel?: string | null
}

export interface ItemCatalogRecord {
  id: string
  nameVi?: string | null
  nameEn: string
  iconAssetRef?: string | null
  fallbackIconRef: string
  rarity?: ItemRarity | null
  category: ItemCatalogCategory
  weightKg?: number | null
  descriptionVi?: string | null
  descriptionEn?: string | null
  usedAt?: string[]
  unlocks?: string[]
  provenance: ItemProvenance
  verificationStatus: ItemVerificationStatus
}
