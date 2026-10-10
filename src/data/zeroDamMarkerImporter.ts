import type { MapEntity, MapMarker, MarkerProvenance } from '@/types/domain'
import type { PublicCategory, PublicDataset } from '@/types/dataset'
import { zeroDamSourceToLocal } from '@/lib/zero-dam-source-to-local'
import { createSourceCandidate, createSourceProvenance, type SourceCandidateRecord, type SourceSnapshotMetadata } from './sourceCandidate'

export type MeaningConfidence = 'high' | 'medium' | 'low'
export type SourceCategoryDisposition = 'baseline' | 'integrate' | 'defer'
export type EntityGrouping = 'category' | 'source-record'

export interface ZeroDamSourceSnapshot {
  metadata: {
    sourceName: string
    sourceUrl: string
    retrievedAt: string
    sourceUpdatedAt?: string
    etag: string
    sha256: string
    coordinateSpace: string
    reuseStatus: 'unconfirmed'
    sourceRecordCount: number
    sourceCategoryCount: number
    sourceCategoryCounts: Record<string, number>
    excludedBaselineRecordCount: number
  }
  records: unknown[]
}

export interface SourceCategoryMapping {
  locationId: string
  disposition: SourceCategoryDisposition
  meaningConfidence: MeaningConfidence
  meaningSummary: string
  categorySlug?: string
  categoryParentSlug?: string
  categoryNameVi?: string
  categoryNameEn?: string
  entitySlug?: string
  entityNameVi?: string
  entityNameEn?: string
  entityGrouping?: EntityGrouping
  translationNeedsReview?: boolean
  deferReason?: string
}

export interface DeferredZeroDamSourceRecord {
  id: string
  sourceExternalId: string
  locationId: string
  sourceX: number
  sourceY: number
  sourceZ?: number
  xNormalized: number
  yNormalized: number
  withinLocalCrop: boolean
  verificationStatus: 'candidate'
  provenance: MarkerProvenance
  deferReason: string
}

export interface CategoryImportReport {
  locationId: string
  sourceCount: number
  existingCount: number
  missingCount: number
  importedCount: number
  inCropCount: number
  visibleCount: number
  outOfCropCount: number
  deferredCount: number
  invalidCount: number
  duplicateCount: number
  unaccountedCount: number
  meaningConfidence: MeaningConfidence
  disposition: SourceCategoryDisposition | 'unmapped'
  meaningSummary: string
  translationNeedsReview: boolean
  deferReason?: string
}

export interface ZeroDamImportReport {
  sourceRecordCount: number
  sourceCategoryCount: number
  snapshotRecordCount: number
  baselineSourceRecordCount: number
  newIntegratedCount: number
  visibleNewCount: number
  outOfCropCount: number
  deferredCount: number
  invalidRecordCount: number
  duplicateRecordCount: number
  accountedRecordCount: number
  categoryReports: CategoryImportReport[]
  importedSourceIds: string[]
  deferredSourceIds: string[]
  invalidRecords: Array<{ sourceRecordIndex: number; sourceExternalId?: string; locationId?: string; reason: string }>
  duplicateSourceIds: string[]
  baselineConflicts: Array<{ sourceExternalId: string; reason: string }>
  reconciliationErrors: string[]
  translationReview: string[]
}

export interface ZeroDamImportResult {
  categories: PublicCategory[]
  entities: MapEntity[]
  markers: MapMarker[]
  deferredRecords: DeferredZeroDamSourceRecord[]
  report: ZeroDamImportReport
}

interface ParsedSourceRecord extends Omit<SourceCandidateRecord, 'id'> {
  sourceRecordIndex: number
}

function container(locationId: string, slug: string, nameEn: string, nameVi: string, translationNeedsReview = false): SourceCategoryMapping {
  return {
    locationId,
    disposition: 'integrate',
    meaningConfidence: 'high',
    meaningSummary: 'Source category denotes a container type; no contents or rarity are inferred.',
    categorySlug: slug,
    categoryParentSlug: 'container',
    categoryNameEn: nameEn,
    categoryNameVi: nameVi,
    entitySlug: slug,
    entityNameEn: nameEn,
    entityNameVi: nameVi,
    entityGrouping: 'category',
    translationNeedsReview,
  }
}

function extraction(locationId: string, slug: string, nameEn: string, nameVi: string): SourceCategoryMapping {
  return {
    locationId,
    disposition: 'integrate',
    meaningConfidence: 'high',
    meaningSummary: 'Source category denotes an extraction location; conditions are not inferred.',
    categorySlug: slug,
    categoryParentSlug: 'extraction',
    categoryNameEn: nameEn,
    categoryNameVi: nameVi,
    entitySlug: slug,
    entityNameEn: nameEn,
    entityNameVi: nameVi,
    entityGrouping: 'category',
  }
}

function specialPoint(
  locationId: string,
  slug: string,
  nameEn: string,
  nameVi: string,
  meaningSummary: string,
  meaningConfidence: MeaningConfidence = 'medium',
  translationNeedsReview = false,
): SourceCategoryMapping {
  return {
    locationId,
    disposition: 'integrate',
    meaningConfidence,
    meaningSummary,
    categorySlug: slug,
    categoryParentSlug: 'location',
    categoryNameEn: nameEn,
    categoryNameVi: nameVi,
    entitySlug: slug,
    entityNameEn: nameEn,
    entityNameVi: nameVi,
    entityGrouping: 'category',
    translationNeedsReview,
  }
}

export const zeroDamSourceCategoryMappings: readonly SourceCategoryMapping[] = [
  { locationId: 'computer_case', disposition: 'baseline', meaningConfidence: 'high', meaningSummary: 'Existing accepted source-backed baseline.' },
  { locationId: 'key_card', disposition: 'baseline', meaningConfidence: 'medium', meaningSummary: 'Existing keycard-related location POIs, kept separate from inventory Keycards.' },
  { locationId: 'safe', disposition: 'baseline', meaningConfidence: 'high', meaningSummary: 'Existing accepted source-backed baseline.' },
  { locationId: 'server', disposition: 'baseline', meaningConfidence: 'high', meaningSummary: 'Existing accepted source-backed baseline.' },
  container('ammo_crate', 'ammo-crate', 'Ammo Crate', 'Hòm đạn'),
  specialPoint('bird-nest', 'bird-nest', 'Bird Nest', 'Tổ chim', 'Source-labelled physical POI; no loot contents are inferred.'),
  container('briefcase', 'briefcase', 'Briefcase', 'Cặp tài liệu'),
  specialPoint('cement_truck', 'cement-truck', 'Cement Truck', 'Cement Truck', 'Neutral source-labelled physical POI; no loot/container claim.', 'medium', true),
  specialPoint('combo_lock', 'combination-lock', 'Combination Lock', 'Khóa số', 'Puzzle/interaction POI; no item or reward relation is inferred.'),
  { locationId: 'computer_data', disposition: 'defer', meaningConfidence: 'low', meaningSummary: 'Ambiguous between an item, an interactive point, or another location type.', deferReason: 'Source records have no custom names/descriptions and the category does not establish inventory-item identity.' },
  extraction('conditional_exfil', 'conditional-exfil', 'Conditional Exfil', 'Điểm rút lui có điều kiện'),
  container('courier_carton', 'courier-carton', 'Courier Carton', 'Hộp bưu kiện'),
  container('drawer', 'drawer', 'Drawer', 'Ngăn kéo'),
  extraction('exfil', 'exfil', 'Exfil', 'Điểm rút lui'),
  container('field_supply_box', 'field-supply-box', 'Field Supply Box', 'Hòm tiếp tế'),
  container('flight_case', 'flight-case', 'Flight Case', 'Flight Case', true),
  container('garbage_bin', 'garbage-bin', 'Garbage Bin', 'Thùng rác'),
  container('hidden_stash', 'hidden-stash', 'Hidden Stash', 'Kho đồ ẩn', true),
  container('large_toolbox', 'large-toolbox', 'Large Toolbox', 'Hòm dụng cụ lớn'),
  container('large_weapon_crate', 'large-weapon-crate', 'Large Weapon Crate', 'Hòm vũ khí lớn'),
  specialPoint('military_med_kit', 'military-med-kit', 'Military Med Kit', 'Túi cứu thương quân sự', 'Source-labelled medical POI; not linked to an inventory item or contents.'),
  extraction('paid_exfil', 'paid-exfil', 'Paid Exfil', 'Điểm rút lui trả phí'),
  { locationId: 'piece-of-clothing', disposition: 'defer', meaningConfidence: 'low', meaningSummary: 'Ambiguous whether this is a clothing-item spawn or another map point.', deferReason: 'No custom record names and no inventory item ID; retain the source records for later review.' },
  specialPoint('pile_of_medical_supplies', 'pile-of-medical-supplies', 'Pile of Medical Supplies', 'Đống vật tư y tế', 'Source-labelled physical POI; no medical item contents are inferred.'),
  {
    locationId: 'player_spawn', disposition: 'integrate', meaningConfidence: 'high', meaningSummary: 'Source-labelled player spawn locations; no spawn probability is inferred.',
    categorySlug: 'player-spawn', categoryParentSlug: 'spawn', categoryNameEn: 'Player Spawn', categoryNameVi: 'Điểm xuất hiện người chơi',
    entitySlug: 'player-spawn', entityNameEn: 'Player Spawn', entityNameVi: 'Điểm xuất hiện người chơi', entityGrouping: 'category',
  },
  container('premium_storage_box', 'premium-storage-box', 'Premium Storage Box', 'Hộp lưu trữ cao cấp', true),
  container('premium_suitcase', 'premium-suitcase', 'Premium Suitcase', 'Vali cao cấp', true),
  {
    locationId: 'protocol_crate', disposition: 'integrate', meaningConfidence: 'medium', meaningSummary: 'Named special/puzzle points; not interpreted as inventory items or loot contents.',
    categorySlug: 'location', entityGrouping: 'source-record', translationNeedsReview: true,
  },
  extraction('random_extract', 'random-extract', 'Random Extract', 'Điểm rút ngẫu nhiên'),
  {
    locationId: 'rare_spawn', disposition: 'integrate', meaningConfidence: 'medium', meaningSummary: 'Source-labelled spawn points only; no ItemRarity or drop probability is assigned.',
    categorySlug: 'rare-spawn', categoryParentSlug: 'spawn', categoryNameEn: 'Rare Spawn', categoryNameVi: 'Rare Spawn',
    entitySlug: 'rare-spawn', entityNameEn: 'Rare Spawn', entityNameVi: 'Rare Spawn', entityGrouping: 'category', translationNeedsReview: true,
  },
  {
    locationId: 'small_safe', disposition: 'integrate', meaningConfidence: 'high', meaningSummary: 'Distinct source container category; not merged into Safe.',
    categorySlug: 'small-safe', categoryParentSlug: 'container', categoryNameEn: 'Small Safe', categoryNameVi: 'Két sắt nhỏ',
    entitySlug: 'small-safe', entityNameEn: 'Small Safe', entityNameVi: 'Két sắt nhỏ', entityGrouping: 'category',
  },
  container('tool_cabinet', 'tool-cabinet', 'Tool Cabinet', 'Tủ dụng cụ'),
  container('travel_bag', 'travel-bag', 'Travel Bag', 'Túi du lịch'),
  {
    locationId: 'trigger', disposition: 'integrate', meaningConfidence: 'high', meaningSummary: 'Named interaction/switch point; no item reward is inferred.',
    categorySlug: 'trigger', categoryParentSlug: 'location', categoryNameEn: 'Trigger', categoryNameVi: 'Điểm kích hoạt',
    entitySlug: 'industrial-elevator-switch', entityNameEn: 'Industrial Elevator Switch', entityNameVi: 'Công tắc thang máy công nghiệp', entityGrouping: 'category',
  },
  container('weapon_crate', 'weapon-crate', 'Weapon Crate', 'Hòm vũ khí'),
]

export interface ZeroDamSourceSnapshot {
  metadata: {
    sourceName: string
    sourceUrl: string
    retrievedAt: string
    sourceUpdatedAt?: string
    etag: string
    sha256: string
    coordinateSpace: string
    reuseStatus: 'unconfirmed'
    sourceRecordCount: number
    sourceCategoryCount: number
    sourceCategoryCounts: Record<string, number>
    excludedBaselineRecordCount: number
  }
  records: unknown[]
}

interface ParsedSourceRecord extends Omit<SourceCandidateRecord, 'id'> {
  sourceRecordIndex: number
}

export interface DeferredZeroDamSourceRecord {
  id: string
  sourceExternalId: string
  locationId: string
  sourceX: number
  sourceY: number
  sourceZ?: number
  xNormalized: number
  yNormalized: number
  withinLocalCrop: boolean
  verificationStatus: 'candidate'
  provenance: MarkerProvenance
  deferReason: string
}

export interface CategoryImportReport {
  locationId: string
  sourceCount: number
  existingCount: number
  missingCount: number
  importedCount: number
  inCropCount: number
  visibleCount: number
  outOfCropCount: number
  deferredCount: number
  invalidCount: number
  duplicateCount: number
  unaccountedCount: number
  meaningConfidence: MeaningConfidence
  disposition: SourceCategoryDisposition | 'unmapped'
  meaningSummary: string
  translationNeedsReview: boolean
  deferReason?: string
}

export interface ZeroDamImportReport {
  sourceRecordCount: number
  sourceCategoryCount: number
  snapshotRecordCount: number
  baselineSourceRecordCount: number
  newIntegratedCount: number
  visibleNewCount: number
  outOfCropCount: number
  deferredCount: number
  invalidRecordCount: number
  duplicateRecordCount: number
  accountedRecordCount: number
  categoryReports: CategoryImportReport[]
  importedSourceIds: string[]
  deferredSourceIds: string[]
  invalidRecords: Array<{ sourceRecordIndex: number; sourceExternalId?: string; locationId?: string; reason: string }>
  duplicateSourceIds: string[]
  baselineConflicts: Array<{ sourceExternalId: string; reason: string }>
  reconciliationErrors: string[]
  translationReview: string[]
}

export interface ZeroDamImportResult {
  categories: PublicCategory[]
  entities: MapEntity[]
  markers: MapMarker[]
  deferredRecords: DeferredZeroDamSourceRecord[]
  report: ZeroDamImportReport
}

interface ProjectCategoryDefinition {
  slug: string
  nameVi: string
  nameEn: string
  parentSlug?: string
}

const rootCategoryDefinitions: ProjectCategoryDefinition[] = [
  { slug: 'location', nameVi: 'Địa điểm', nameEn: 'Location' },
  { slug: 'extraction', nameVi: 'Điểm rút lui', nameEn: 'Extraction', parentSlug: 'location' },
  { slug: 'spawn', nameVi: 'Điểm xuất hiện', nameEn: 'Spawn', parentSlug: 'location' },
]

const namespaceUuid = 'b86989ee-6682-5f08-a3e3-4b7902ef61b0'

function rotateLeft(value: number, bits: number): number {
  return (value << bits) | (value >>> (32 - bits))
}

function sha1(bytes: Uint8Array): Uint8Array {
  const bitLength = bytes.length * 8
  const paddedLength = Math.ceil((bytes.length + 9) / 64) * 64
  const padded = new Uint8Array(paddedLength)
  padded.set(bytes)
  padded[bytes.length] = 0x80
  const view = new DataView(padded.buffer)
  view.setUint32(paddedLength - 8, Math.floor(bitLength / 0x100000000), false)
  view.setUint32(paddedLength - 4, bitLength >>> 0, false)
  let h0 = 0x67452301
  let h1 = 0xefcdab89
  let h2 = 0x98badcfe
  let h3 = 0x10325476
  let h4 = 0xc3d2e1f0
  const words = new Uint32Array(80)

  for (let offset = 0; offset < paddedLength; offset += 64) {
    for (let index = 0; index < 16; index += 1) words[index] = view.getUint32(offset + index * 4, false)
    for (let index = 16; index < 80; index += 1) {
      words[index] = rotateLeft(words[index - 3] ^ words[index - 8] ^ words[index - 14] ^ words[index - 16], 1) >>> 0
    }
    let a = h0
    let b = h1
    let c = h2
    let d = h3
    let e = h4
    for (let index = 0; index < 80; index += 1) {
      let f: number
      let k: number
      if (index < 20) {
        f = (b & c) | (~b & d)
        k = 0x5a827999
      } else if (index < 40) {
        f = b ^ c ^ d
        k = 0x6ed9eba1
      } else if (index < 60) {
        f = (b & c) | (b & d) | (c & d)
        k = 0x8f1bbcdc
      } else {
        f = b ^ c ^ d
        k = 0xca62c1d6
      }
      const temp = (rotateLeft(a, 5) + f + e + k + words[index]) >>> 0
      e = d
      d = c
      c = rotateLeft(b, 30) >>> 0
      b = a
      a = temp
    }
    h0 = (h0 + a) >>> 0
    h1 = (h1 + b) >>> 0
    h2 = (h2 + c) >>> 0
    h3 = (h3 + d) >>> 0
    h4 = (h4 + e) >>> 0
  }

  const digest = new Uint8Array(20)
  const digestView = new DataView(digest.buffer)
  ;[h0, h1, h2, h3, h4].forEach((value, index) => digestView.setUint32(index * 4, value, false))
  return digest
}

function parseUuid(uuid: string): Uint8Array {
  const hex = uuid.replaceAll('-', '')
  if (!/^[0-9a-f]{32}$/i.test(hex)) throw new TypeError(`Invalid UUID namespace: ${uuid}`)
  return Uint8Array.from({ length: 16 }, (_, index) => Number.parseInt(hex.slice(index * 2, index * 2 + 2), 16))
}

export function deterministicProjectUuid(name: string, namespace = namespaceUuid): string {
  const namespaceBytes = parseUuid(namespace)
  const nameBytes = new TextEncoder().encode(name)
  const value = new Uint8Array(namespaceBytes.length + nameBytes.length)
  value.set(namespaceBytes)
  value.set(nameBytes, namespaceBytes.length)
  const digest = sha1(value).slice(0, 16)
  digest[6] = (digest[6] & 0x0f) | 0x50
  digest[8] = (digest[8] & 0x3f) | 0x80
  const hex = Array.from(digest, (byte) => byte.toString(16).padStart(2, '0')).join('')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function sourceId(value: unknown): string | undefined {
  if (typeof value === 'number' && Number.isSafeInteger(value)) return String(value)
  if (typeof value === 'string' && value.trim()) return value.trim()
  return undefined
}

function parseSourceRecord(value: unknown, sourceRecordIndex: number): { record?: ParsedSourceRecord; reason?: string } {
  if (!isRecord(value)) return { reason: 'Record must be an object' }
  if (!sourceId(value.id)) return { reason: 'Missing or invalid source id' }
  if (typeof value.locationId !== 'string' || !value.locationId.trim()) return { reason: 'Missing or invalid locationId' }
  if (typeof value.x !== 'number' || !Number.isFinite(value.x)) return { reason: 'Missing or invalid source x' }
  if (typeof value.y !== 'number' || !Number.isFinite(value.y)) return { reason: 'Missing or invalid source y' }
  if (value.z != null && (typeof value.z !== 'number' || !Number.isFinite(value.z))) return { reason: 'Invalid source z' }
  if (value.name != null && typeof value.name !== 'string') return { reason: 'Invalid source name' }
  if (value.description != null && typeof value.description !== 'string') return { reason: 'Invalid source description' }
  if (value.validated != null && typeof value.validated !== 'boolean') return { reason: 'Invalid source validated claim' }
  if (value.randomSpawn != null && typeof value.randomSpawn !== 'boolean') return { reason: 'Invalid source randomSpawn claim' }
  if (value.difficulties != null && (!Array.isArray(value.difficulties) || value.difficulties.some((difficulty) => typeof difficulty !== 'string'))) {
    return { reason: 'Invalid source difficulties' }
  }
  return {
    record: {
      sourceRecordIndex,
      sourceExternalId: sourceId(value.id)!,
      locationId: value.locationId,
      sourceX: value.x,
      sourceY: value.y,
      ...(typeof value.z === 'number' ? { sourceZ: value.z } : {}),
      ...(typeof value.name === 'string' ? { name: value.name } : {}),
      ...(typeof value.description === 'string' ? { description: value.description } : {}),
      sourceClaims: {
        ...(typeof value.validated === 'boolean' ? { validated: value.validated } : {}),
        ...(typeof value.randomSpawn === 'boolean' ? { randomSpawn: value.randomSpawn } : {}),
        ...(Array.isArray(value.difficulties) ? { difficulties: value.difficulties as string[] } : {}),
      },
    },
  }
}

function slugifyProjectName(value: string): string {
  const slug = value.toLocaleLowerCase('en-US').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  return slug || 'source-location'
}

function createReportProvenance(record: ParsedSourceRecord, snapshot: SourceSnapshotMetadata, id: string) {
  return createSourceProvenance({ ...record, id }, snapshot)
}

export function importZeroDamMarkerRecords(
  snapshot: ZeroDamSourceSnapshot,
  baseline: PublicDataset,
): ZeroDamImportResult {
  const sourceMeta: SourceSnapshotMetadata = {
    sourceName: snapshot.metadata.sourceName,
    sourceUrl: snapshot.metadata.sourceUrl,
    retrievedAt: snapshot.metadata.retrievedAt,
    ...(snapshot.metadata.sourceUpdatedAt ? { sourceUpdatedAt: snapshot.metadata.sourceUpdatedAt } : {}),
    snapshotEtag: snapshot.metadata.etag,
    snapshotHash: `sha256:${snapshot.metadata.sha256}`,
    coordinateSpace: snapshot.metadata.coordinateSpace,
    reuseStatus: snapshot.metadata.reuseStatus,
  }
  const mappings = new Map(zeroDamSourceCategoryMappings.map((mapping) => [mapping.locationId, mapping]))
  const existingBySourceId = new Map<string, MapMarker>()
  const existingByCategory = new Map<string, MapMarker[]>()
  const baselineConflicts: Array<{ sourceExternalId: string; reason: string }> = []

  for (const marker of baseline.markers) {
    const source = marker.provenance
    if (!source) continue
    if (existingBySourceId.has(source.sourceExternalId)) {
      baselineConflicts.push({ sourceExternalId: source.sourceExternalId, reason: 'Duplicate sourceExternalId in the accepted baseline' })
      continue
    }
    existingBySourceId.set(source.sourceExternalId, marker)
    const records = existingByCategory.get(source.sourceKey) ?? []
    records.push(marker)
    existingByCategory.set(source.sourceKey, records)
  }

  const invalidRecords: ZeroDamImportReport['invalidRecords'] = []
  const parsedRecords: ParsedSourceRecord[] = []
  snapshot.records.forEach((value, sourceRecordIndex) => {
    const parsed = parseSourceRecord(value, sourceRecordIndex)
    if (!parsed.record) {
      const raw = isRecord(value) ? value : undefined
      invalidRecords.push({
        sourceRecordIndex,
        ...(sourceId(raw?.id) ? { sourceExternalId: sourceId(raw?.id)! } : {}),
        ...(typeof raw?.locationId === 'string' ? { locationId: raw.locationId } : {}),
        reason: parsed.reason ?? 'Invalid source record',
      })
      return
    }
    parsedRecords.push(parsed.record)
  })

  const rawIdCounts = new Map<string, number>()
  for (const record of parsedRecords) rawIdCounts.set(record.sourceExternalId, (rawIdCounts.get(record.sourceExternalId) ?? 0) + 1)
  const duplicateSourceIds = [...rawIdCounts].filter(([, count]) => count > 1).map(([id]) => id).sort()
  const duplicateIdSet = new Set(duplicateSourceIds)
  const deferredRecords: DeferredZeroDamSourceRecord[] = []
  const markers: MapMarker[] = []
  const entities: MapEntity[] = []
  const categories: PublicCategory[] = []
  const newEntityByGroup = new Map<string, MapEntity>()
  const entitySlugCounts = new Map<string, number>()
  const existingCategoryBySlug = new Map(baseline.categories.map((category) => [category.slug, category]))
  const categoryBySlug = new Map(existingCategoryBySlug)

  for (const { slug, nameVi, nameEn, parentSlug } of rootCategoryDefinitions) {
    if (categoryBySlug.has(slug)) continue
    const category: PublicCategory = {
      id: deterministicProjectUuid(`category:${baseline.map.slug}:${slug}`),
      slug,
      nameVi,
      nameEn,
      ...(parentSlug ? { parentId: categoryBySlug.get(parentSlug)?.id ?? deterministicProjectUuid(`category:${baseline.map.slug}:${parentSlug}`) } : {}),
    }
    categories.push(category)
    categoryBySlug.set(slug, category)
  }

  const ensureCategory = (mapping: SourceCategoryMapping): PublicCategory => {
    const slug = mapping.categorySlug
    if (!slug) throw new Error(`Missing project category slug for ${mapping.locationId}`)
    const existing = categoryBySlug.get(slug)
    if (existing) return existing
    const parent = mapping.categoryParentSlug ? categoryBySlug.get(mapping.categoryParentSlug) : undefined
    if (mapping.categoryParentSlug && !parent) throw new Error(`Missing project category parent ${mapping.categoryParentSlug}`)
    const nameEn = mapping.categoryNameEn ?? mapping.entityNameEn
    const nameVi = mapping.categoryNameVi ?? mapping.entityNameVi
    if (!nameEn || !nameVi) throw new Error(`Missing project category names for ${mapping.locationId}`)
    const category: PublicCategory = {
      id: deterministicProjectUuid(`category:${baseline.map.slug}:${slug}`),
      slug,
      nameEn,
      nameVi,
      ...(parent ? { parentId: parent.id } : {}),
    }
    categories.push(category)
    categoryBySlug.set(slug, category)
    return category
  }

  const sortedRecords = [...parsedRecords].sort((a, b) => a.locationId.localeCompare(b.locationId) || compareSourceIds(a.sourceExternalId, b.sourceExternalId))
  const importedSourceIds: string[] = []
  const translationReview = new Set<string>()
  const importedByLocationId = new Map<string, number>()
  const deferredByLocationId = new Map<string, number>()
  const deferredInCropByLocationId = new Map<string, number>()
  const deferredOutOfCropByLocationId = new Map<string, number>()
  const visibleByLocationId = new Map<string, number>()
  const outOfCropByLocationId = new Map<string, number>()
  const rawCountsByLocationId = new Map<string, number>()
  const duplicateByLocationId = new Map<string, number>()
  const invalidByLocationId = new Map<string, number>()

  for (const record of parsedRecords) {
    rawCountsByLocationId.set(record.locationId, (rawCountsByLocationId.get(record.locationId) ?? 0) + 1)
  }
  for (const record of parsedRecords) {
    if (duplicateIdSet.has(record.sourceExternalId)) duplicateByLocationId.set(record.locationId, (duplicateByLocationId.get(record.locationId) ?? 0) + 1)
  }
  for (const invalid of invalidRecords) {
    if (invalid.locationId) invalidByLocationId.set(invalid.locationId, (invalidByLocationId.get(invalid.locationId) ?? 0) + 1)
  }

  for (const record of sortedRecords) {
    if (duplicateIdSet.has(record.sourceExternalId)) continue
    const existing = existingBySourceId.get(record.sourceExternalId)
    if (existing) {
      const provenance = existing.provenance!
      const sameRecord = provenance.sourceKey === record.locationId && provenance.sourceX === record.sourceX && provenance.sourceY === record.sourceY && (provenance.sourceZ ?? undefined) === record.sourceZ
      if (!sameRecord) baselineConflicts.push({ sourceExternalId: record.sourceExternalId, reason: 'Source id exists in the baseline but source category or coordinates differ; baseline kept unchanged' })
      continue
    }
    const mapping = mappings.get(record.locationId)
    if (!mapping) {
      const deferred = createDeferredRecord(record, sourceMeta, baseline.map.slug, 'No reviewed project category mapping exists for this locationId')
      deferredRecords.push(deferred)
      incrementCount(deferredByLocationId, record.locationId)
      incrementCount(deferred.withinLocalCrop ? deferredInCropByLocationId : deferredOutOfCropByLocationId, record.locationId)
      continue
    }
    if (mapping.disposition !== 'integrate') {
      const reason = mapping.deferReason ?? (mapping.disposition === 'baseline' ? 'New source id belongs to an already accepted baseline category; review separately' : 'Source category is deferred for semantic review')
      const deferred = createDeferredRecord(record, sourceMeta, baseline.map.slug, reason)
      deferredRecords.push(deferred)
      incrementCount(deferredByLocationId, record.locationId)
      incrementCount(deferred.withinLocalCrop ? deferredInCropByLocationId : deferredOutOfCropByLocationId, record.locationId)
      continue
    }

    const projectCategory = ensureCategory(mapping)
    const groupKey = mapping.entityGrouping === 'source-record' ? `${record.locationId}:record:${record.sourceExternalId}` : `${record.locationId}:category`
    let entity = newEntityByGroup.get(groupKey)
    if (!entity) {
      const nameEn = (mapping.entityGrouping === 'source-record' ? record.name : undefined) ?? mapping.entityNameEn ?? mapping.categoryNameEn
      const nameVi = (mapping.entityGrouping === 'source-record' ? record.name : undefined) ?? mapping.entityNameVi ?? mapping.categoryNameVi
      if (!nameEn || !nameVi) throw new Error(`Missing project name mapping for ${record.locationId}`)
      const baseSlug = mapping.entityGrouping === 'source-record' ? slugifyProjectName(nameEn) : mapping.entitySlug
      if (!baseSlug) throw new Error(`Missing project entity slug mapping for ${record.locationId}`)
      const slugCount = entitySlugCounts.get(baseSlug) ?? 0
      entitySlugCounts.set(baseSlug, slugCount + 1)
      const slug = slugCount === 0 ? baseSlug : `${baseSlug}-${slugCount + 1}`
      entity = {
        id: deterministicProjectUuid(`entity:${baseline.map.slug}:${groupKey}`),
        slug,
        categoryId: projectCategory.id,
        nameVi,
        nameEn,
        verificationStatus: 'candidate',
      }
      newEntityByGroup.set(groupKey, entity)
      entities.push(entity)
    }
    const markerRecord: SourceCandidateRecord = {
      id: deterministicProjectUuid(`marker:${baseline.map.slug}:${record.sourceExternalId}`),
      locationId: record.locationId,
      sourceExternalId: record.sourceExternalId,
      sourceX: record.sourceX,
      sourceY: record.sourceY,
      ...(record.sourceZ === undefined ? {} : { sourceZ: record.sourceZ }),
      ...(record.name === undefined ? {} : { name: record.name }),
      ...(record.description === undefined ? {} : { description: record.description }),
      sourceClaims: record.sourceClaims,
    }
    const marker = createSourceCandidate(markerRecord, entity.id, baseline.mapVersion.id, sourceMeta)
    markers.push(marker)
    importedSourceIds.push(record.sourceExternalId)
    incrementCount(importedByLocationId, record.locationId)
    if (marker.withinLocalCrop) incrementCount(visibleByLocationId, record.locationId)
    else incrementCount(outOfCropByLocationId, record.locationId)
    if (mapping.translationNeedsReview) {
      translationReview.add(mapping.entityGrouping === 'source-record' ? `${record.locationId}:${record.sourceExternalId}` : record.locationId)
    }
  }

  const locationIds = new Set([
    ...Object.keys(snapshot.metadata.sourceCategoryCounts),
    ...existingByCategory.keys(),
    ...rawCountsByLocationId.keys(),
    ...invalidByLocationId.keys(),
  ])
  const categoryReports: CategoryImportReport[] = [...locationIds].sort().map((locationId) => {
    const mapping = mappings.get(locationId)
    const sourceCount = snapshot.metadata.sourceCategoryCounts[locationId] ?? 0
    const existingMarkers = existingByCategory.get(locationId) ?? []
    const importedCount = importedByLocationId.get(locationId) ?? 0
    const deferredCount = deferredByLocationId.get(locationId) ?? 0
    const invalidCount = invalidByLocationId.get(locationId) ?? 0
    const duplicateCount = duplicateByLocationId.get(locationId) ?? 0
    const existingInCrop = existingMarkers.filter((marker) => marker.withinLocalCrop !== false).length
    const importedInCrop = visibleByLocationId.get(locationId) ?? 0
    const importedOutOfCrop = outOfCropByLocationId.get(locationId) ?? 0
    const deferredInCrop = deferredInCropByLocationId.get(locationId) ?? 0
    const deferredOutOfCrop = deferredOutOfCropByLocationId.get(locationId) ?? 0
    const baselineOutOfCrop = existingMarkers.filter((marker) => marker.withinLocalCrop === false).length
    const inCropCount = existingInCrop + importedInCrop + deferredInCrop
    const outOfCropCount = baselineOutOfCrop + importedOutOfCrop + deferredOutOfCrop
    const processed = existingMarkers.length + importedCount + deferredCount + invalidCount + duplicateCount
    return {
      locationId,
      sourceCount,
      existingCount: existingMarkers.length,
      missingCount: Math.max(0, sourceCount - existingMarkers.length),
      importedCount,
      inCropCount,
      visibleCount: existingInCrop + importedInCrop,
      outOfCropCount,
      deferredCount,
      invalidCount,
      duplicateCount,
      unaccountedCount: Math.max(0, sourceCount - processed),
      meaningConfidence: mapping?.meaningConfidence ?? 'low',
      disposition: mapping?.disposition ?? 'unmapped',
      meaningSummary: mapping?.meaningSummary ?? 'Unmapped source category; retained for review only.',
      translationNeedsReview: mapping?.translationNeedsReview ?? true,
      ...(mapping?.deferReason ? { deferReason: mapping.deferReason } : {}),
    }
  })

  const baselineSourceRecordCount = existingBySourceId.size
  const duplicateRecordCount = duplicateRecordCountFrom(duplicateSourceIds, parsedRecords)
  const deferredRecordCount = deferredRecords.length
  const accountedRecordCount = baselineSourceRecordCount + markers.length + deferredRecordCount + invalidRecords.length + duplicateRecordCount
  const newVisibleCount = markers.filter((marker) => marker.withinLocalCrop).length
  const outOfCropCount = markers.filter((marker) => marker.withinLocalCrop === false).length + deferredRecords.filter((record) => !record.withinLocalCrop).length + [...existingBySourceId.values()].filter((marker) => marker.withinLocalCrop === false).length
  const reconciliationErrors: string[] = []
  const categorySourceCount = Object.values(snapshot.metadata.sourceCategoryCounts).reduce((sum, count) => sum + count, 0)
  if (categorySourceCount !== snapshot.metadata.sourceRecordCount) reconciliationErrors.push('Per-category source counts do not sum to the declared source record total')
  if (snapshot.records.length + snapshot.metadata.excludedBaselineRecordCount !== snapshot.metadata.sourceRecordCount) reconciliationErrors.push('Filtered source snapshot and baseline exclusions do not reconcile to source total')
  if (baselineSourceRecordCount !== snapshot.metadata.excludedBaselineRecordCount) reconciliationErrors.push('Accepted baseline source marker count does not match the snapshot exclusion count')
  if (accountedRecordCount !== snapshot.metadata.sourceRecordCount) reconciliationErrors.push('Baseline, imported, deferred, invalid, and duplicate records do not reconcile to source total')
  if (categoryReports.some((category) => category.unaccountedCount !== 0)) reconciliationErrors.push('One or more source categories have unaccounted records')

  return {
    categories: categories.sort((a, b) => a.slug.localeCompare(b.slug)),
    entities: entities.sort((a, b) => a.slug.localeCompare(b.slug)),
    markers: markers.sort((a, b) => a.provenance!.sourceKey.localeCompare(b.provenance!.sourceKey) || compareSourceIds(a.provenance!.sourceExternalId, b.provenance!.sourceExternalId)),
    deferredRecords: deferredRecords.sort((a, b) => a.locationId.localeCompare(b.locationId) || compareSourceIds(a.sourceExternalId, b.sourceExternalId)),
    report: {
      sourceRecordCount: snapshot.metadata.sourceRecordCount,
      sourceCategoryCount: snapshot.metadata.sourceCategoryCount,
      snapshotRecordCount: snapshot.records.length,
      baselineSourceRecordCount,
      newIntegratedCount: markers.length,
      visibleNewCount: newVisibleCount,
      outOfCropCount,
      deferredCount: deferredRecordCount,
      invalidRecordCount: invalidRecords.length,
      duplicateRecordCount,
      accountedRecordCount,
      categoryReports,
      importedSourceIds: importedSourceIds.sort(compareSourceIds),
      deferredSourceIds: deferredRecords.map((record) => record.sourceExternalId).sort(compareSourceIds),
      invalidRecords,
      duplicateSourceIds,
      baselineConflicts,
      reconciliationErrors,
      translationReview: [...translationReview].sort(),
    },
  }
}

function createDeferredRecord(
  record: ParsedSourceRecord,
  snapshot: SourceSnapshotMetadata,
  mapSlug: string,
  deferReason: string,
): DeferredZeroDamSourceRecord {
  const id = deterministicProjectUuid(`deferred:${mapSlug}:${record.sourceExternalId}`)
  const projected = zeroDamSourceToLocal(record.sourceX, record.sourceY)
  return {
    id,
    sourceExternalId: record.sourceExternalId,
    locationId: record.locationId,
    sourceX: record.sourceX,
    sourceY: record.sourceY,
    ...(record.sourceZ === undefined ? {} : { sourceZ: record.sourceZ }),
    xNormalized: projected.xNormalized,
    yNormalized: projected.yNormalized,
    withinLocalCrop: projected.withinLocalCrop,
    verificationStatus: 'candidate',
    provenance: createReportProvenance(record, snapshot, id),
    deferReason,
  }
}

function incrementCount(map: Map<string, number>, key: string): void {
  map.set(key, (map.get(key) ?? 0) + 1)
}

function duplicateRecordCountFrom(ids: string[], records: ParsedSourceRecord[]): number {
  const duplicateIds = new Set(ids)
  return records.filter((record) => duplicateIds.has(record.sourceExternalId)).length
}

function compareSourceIds(a: string, b: string): number {
  const numericA = Number(a)
  const numericB = Number(b)
  return Number.isFinite(numericA) && Number.isFinite(numericB) ? numericA - numericB : a.localeCompare(b)
}
