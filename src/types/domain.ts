/**
 * Domain types for entities, markers, aliases, and search results.
 *
 * These will be populated as the vertical slice grows. They must remain
 * independent of upstream schemas and Leaflet internals.
 */

export type ItemRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'special'

export interface MapEntity {
  id: string
  slug: string
  categoryId: string
  nameVi: string
  nameEn: string
  descriptionVi?: string
  descriptionEn?: string
  catalogItemId?: string
}

export interface MapMarker {
  id: string
  mapVersionId: string
  entityId: string
  areaId?: string
  xNormalized: number
  yNormalized: number
  floorKey?: string
}
