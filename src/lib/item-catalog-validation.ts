import type { ItemRarity } from '@/types/domain'
import type { ItemCatalogRecord, ItemVerificationStatus } from '@/types/item-catalog'

const itemRarities: ItemRarity[] = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'special']
const verificationStatuses: ItemVerificationStatus[] = ['candidate', 'reviewed', 'verified', 'disputed', 'stale']
const assetReuseStatuses = ['unconfirmed', 'permitted', 'not-approved']
const catalogCategories = ['container', 'access-card']
const sourceRarityMappings: Record<string, ItemRarity> = {
  common: 'common',
  gray: 'common',
  grey: 'common',
  uncommon: 'uncommon',
  green: 'uncommon',
  rare: 'rare',
  blue: 'rare',
  epic: 'epic',
  purple: 'epic',
  legendary: 'legendary',
  gold: 'legendary',
  special: 'special',
  red: 'special',
}
const projectIdPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export function isItemRarity(value: unknown): value is ItemRarity {
  return typeof value === 'string' && itemRarities.includes(value as ItemRarity)
}

export function mapSourceRarity(value?: string | null): ItemRarity | null {
  return value ? sourceRarityMappings[value.trim().toLocaleLowerCase('en-US')] ?? null : null
}

function isLocalAssetRef(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0 &&
    !value.startsWith('/') && !value.startsWith('.') && !value.includes('://') &&
    !value.includes('\\') && !value.includes('..')
}

export function validateItemCatalog(records: readonly ItemCatalogRecord[]): string[] {
  const errors: string[] = []
  const ids = new Set<string>()

  for (const record of records) {
    if (!projectIdPattern.test(record.id)) errors.push(`${record.id}: invalid project item id`)
    if (ids.has(record.id)) errors.push(`${record.id}: duplicate project item id`)
    ids.add(record.id)
    if (!record.nameEn.trim() || (record.nameVi != null && !record.nameVi.trim())) errors.push(`${record.id}: canonical names must be non-empty when provided`)
    if (!record.category.trim()) errors.push(`${record.id}: category is required`)
    if (!catalogCategories.includes(record.category)) errors.push(`${record.id}: invalid category`)
    if (!verificationStatuses.includes(record.verificationStatus)) errors.push(`${record.id}: invalid verification status`)
    if (record.rarity != null && !isItemRarity(record.rarity)) errors.push(`${record.id}: invalid project rarity`)

    const { provenance } = record
    if (!provenance.sourceName.trim()) errors.push(`${record.id}: provenance source name is required`)
    try {
      if (new URL(provenance.sourceUrl).protocol !== 'https:') errors.push(`${record.id}: provenance URL must use HTTPS`)
    } catch {
      errors.push(`${record.id}: provenance source URL is required`)
    }
    if (!provenance.observedAt.trim() || Number.isNaN(Date.parse(provenance.observedAt))) {
      errors.push(`${record.id}: provenance observation date is required`)
    }
    if (!assetReuseStatuses.includes(provenance.assetReuseStatus)) errors.push(`${record.id}: invalid asset reuse status`)
    if (provenance.sourceExternalId !== null && !provenance.sourceExternalId.trim()) {
      errors.push(`${record.id}: source external id must be null or non-empty`)
    }

    if (!isLocalAssetRef(record.fallbackIconRef)) errors.push(`${record.id}: a local fallback icon is required`)
    if (record.iconAssetRef != null) {
      if (!isLocalAssetRef(record.iconAssetRef)) errors.push(`${record.id}: icon asset must be a local project path`)
      if (provenance.assetReuseStatus !== 'permitted') errors.push(`${record.id}: icon asset reuse is not approved`)
    }
  }

  return errors
}
