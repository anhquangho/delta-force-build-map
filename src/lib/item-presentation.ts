import type { ItemRarity, MapEntity } from '@/types/domain'

export type { ItemRarity }

export interface ItemPresentation {
  icon?: string
  rarity?: ItemRarity
}

/**
 * Presentation is read from entity data. The UI does not infer icons or rarity
 * from slugs, so replacing an SVG with a later transparent PNG is a data change.
 */
export function getItemPresentation(entity?: Pick<MapEntity, 'icon' | 'rarity'> | null): ItemPresentation {
  return { icon: entity?.icon, rarity: entity?.rarity }
}
