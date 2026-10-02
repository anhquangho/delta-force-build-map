/**
 * Public dataset payload types.
 *
 * The exported JSON will conform to this shape. For now it mirrors the
 * minimal fields needed for local search and map rendering.
 */

import type { MapEntity, MapMarker } from './domain'

export interface MapMetadata {
  id: string
  slug: string
  nameEn: string
  nameVi: string
}

export interface MapVersionMetadata {
  id: string
  mapId: string
  versionKey: string
  width: number
  height: number
}

export interface PublicArea {
  id: string
  mapVersionId: string
  slug: string
  nameEn: string
  nameVi: string
  xNormalized?: number
  yNormalized?: number
  parentId?: string
}

export interface PublicCategory {
  id: string
  slug: string
  nameEn: string
  nameVi: string
  parentId?: string
}

export interface PublicAlias {
  id: string
  entityId: string
  locale: 'vi' | 'en' | 'mixed'
  alias: string
  normalizedAlias: string
}

export interface PublicDataset {
  schemaVersion: string
  datasetVersion: string
  generatedAt: string
  map: MapMetadata
  mapVersion: MapVersionMetadata
  areas: PublicArea[]
  categories: PublicCategory[]
  entities: MapEntity[]
  aliases: PublicAlias[]
  markers: MapMarker[]
}
