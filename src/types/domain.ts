/**
 * Domain types for entities, markers, aliases, and search results.
 *
 * These will be populated as the vertical slice grows. They must remain
 * independent of upstream schemas and Leaflet internals.
 */

export type ItemRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'special'
export type VerificationStatus = 'candidate' | 'reviewed' | 'verified' | 'disputed' | 'stale'

export interface MarkerSourceClaims {
  validated?: boolean
  randomSpawn?: boolean
  difficulties?: string[]
}

export interface MarkerProvenance {
  sourceName: string
  sourceKey: string
  sourceUrl: string
  sourceExternalId: string
  sourceRecordName?: string
  sourceDescription?: string
  coordinateSpace: string
  sourceX: number
  sourceY: number
  sourceZ?: number
  retrievedAt: string
  sourceUpdatedAt?: string
  snapshotEtag?: string
  snapshotHash?: string
  reuseStatus: 'unconfirmed' | 'permitted' | 'not-approved'
  sourceClaims: MarkerSourceClaims
}

export interface MapEntity {
  id: string
  slug: string
  categoryId: string
  nameVi: string
  nameEn: string
  descriptionVi?: string
  descriptionEn?: string
  catalogItemId?: string
  verificationStatus?: VerificationStatus
}

export interface MapMarker {
  id: string
  mapVersionId: string
  entityId: string
  areaId?: string
  xNormalized: number
  yNormalized: number
  withinLocalCrop?: boolean
  floorKey?: string
  verificationStatus?: VerificationStatus
  provenance?: MarkerProvenance
}
