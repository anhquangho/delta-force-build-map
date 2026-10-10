import { itemCatalog } from '@/data/itemCatalog'
import type { ItemCatalogRecord } from '@/types/item-catalog'
import type { ItemRarity, MapEntity } from '@/types/domain'

export type { ItemRarity }

export interface ItemPresentation {
  icon?: string
  fallbackIcon?: string
  rarity?: ItemRarity
}

export const itemRarityLabels: Record<ItemRarity, string> = {
  common: 'Phổ thông / Common',
  uncommon: 'Không phổ biến / Uncommon',
  rare: 'Hiếm / Rare',
  epic: 'Sử thi / Epic',
  legendary: 'Huyền thoại / Legendary',
  special: 'Đặc biệt / Special',
}

function localAssetUrl(assetRef?: string | null): string | undefined {
  return assetRef ? `${import.meta.env.BASE_URL}${assetRef}` : undefined
}

export function getCatalogItem(entity?: Pick<MapEntity, 'catalogItemId'> | null): ItemCatalogRecord | undefined {
  return entity?.catalogItemId
    ? itemCatalog.find((item) => item.id === entity.catalogItemId)
    : undefined
}

export function getItemPresentation(source?: ItemCatalogRecord | Pick<MapEntity, 'catalogItemId'> | null): ItemPresentation {
  const item = source && 'fallbackIconRef' in source ? source : getCatalogItem(source)
  return {
    icon: localAssetUrl(item?.iconAssetRef),
    fallbackIcon: localAssetUrl(item?.fallbackIconRef),
    rarity: item?.rarity ?? undefined,
  }
}
