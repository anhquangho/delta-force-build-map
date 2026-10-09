/**
 * Local development dataset for Zero Dam search and map features.
 *
 * Safe, Computer Case, and Keycard locations remain mock fixtures. Server
 * locations are source-backed candidates pending project review.
 */

import type { MapMarker } from '@/types/domain'
import type { PublicDataset } from '@/types/dataset'
import { ITEM_CATALOG_IDS } from './itemCatalog'

const MAP_ID = '4cdcb007-ee4d-489a-8406-c908c2553f48'
const MAP_VERSION_ID = '1bf10507-4425-417a-b514-8bb3dba45bd4'

const AREA_IDS = {
  adminBuilding: 'eb6831d1-eea9-45d3-b73a-50ab43977efb',
  powerStation: 'eec41ef3-16e8-4f4a-8beb-2e5b65dd6e57',
  underground: '2c105e71-52bd-4706-b409-47a45138e500',
  checkpoint: 'e6f4a47c-ae50-4bce-9524-882b8d13f147',
} as const

const CATEGORY_IDS = {
  container: 'a92d5cf5-d234-4d54-a7a6-f720c5f3163d',
  safe: '237d2127-17c0-4888-bf0f-036b32d57d39',
  server: '3f21470b-2df0-4341-b572-9fba5715267f',
  computerCase: '5ac27f60-3762-48d1-9b26-4f72068c2160',
  access: '66e28e0f-f0a0-41d7-b7de-8eaa16732301',
  keycard: 'c160ea2f-31bc-437e-8d64-fe8e2f52b3ea',
} as const

const ENTITY_IDS = {
  safe: 'faa8faac-6cb5-42d7-ad74-d9509f01002b',
  server: 'e4e00fcb-10b5-482e-9842-fac866dd4d8d',
  computerCase: '317d203d-aaae-434f-8c90-9ff8d813925f',
  substationTechRoomKeycard: '9c7d4ebd-a389-4871-9863-53375127504e',
  undergroundVaultStorageKeycard: 'c751c9b8-0901-41de-8a7d-b0588c230373',
} as const

const serverSourceSnapshot = {
  sourceName: 'deltaforce-maps.com',
  sourceKey: 'server',
  sourceUrl: 'https://deltaforce-maps.com/data/zero-dam/markers.json',
  coordinateSpace: 'zero-dam-image-4096',
  retrievedAt: '2026-10-04T10:25:38.955Z',
  sourceUpdatedAt: '2025-10-14T15:40:14Z',
  snapshotEtag: 'W/"b2c30572ad63168e1fcbc8a805f6a484"',
  snapshotHash: 'sha256:bae201e2ead1ad729538348e6e3d33e3cfa4a1db8d0331ae4c5200410a1af0c',
  reuseStatus: 'unconfirmed',
} as const

export const serverMarkerCandidates: MapMarker[] = [
  {
    id: '54193b79-d16f-48ee-949f-52dfcb6c305d',
    mapVersionId: MAP_VERSION_ID,
    entityId: ENTITY_IDS.server,
    xNormalized: 2428 / 4096,
    yNormalized: 1812 / 4096,
    floorKey: '1',
    verificationStatus: 'candidate',
    provenance: {
      ...serverSourceSnapshot,
      sourceExternalId: '395',
      sourceX: 2428,
      sourceY: 1812,
      sourceZ: 1,
      sourceClaims: { validated: true, randomSpawn: false, difficulties: ['easy', 'normal', 'hard'] },
    },
  },
  {
    id: '03365292-2377-4a79-8821-a9910d79908b',
    mapVersionId: MAP_VERSION_ID,
    entityId: ENTITY_IDS.server,
    xNormalized: 2197 / 4096,
    yNormalized: 2735 / 4096,
    verificationStatus: 'candidate',
    provenance: {
      ...serverSourceSnapshot,
      sourceExternalId: '333',
      sourceX: 2197,
      sourceY: 2735,
      sourceClaims: { validated: true, randomSpawn: false, difficulties: ['easy', 'normal', 'hard'] },
    },
  },
  {
    id: 'fe7752ce-1126-4aa3-bf4e-e47de26dc659',
    mapVersionId: MAP_VERSION_ID,
    entityId: ENTITY_IDS.server,
    xNormalized: 2298 / 4096,
    yNormalized: 2655 / 4096,
    floorKey: '0',
    verificationStatus: 'candidate',
    provenance: {
      ...serverSourceSnapshot,
      sourceExternalId: '413',
      sourceX: 2298,
      sourceY: 2655,
      sourceZ: 0,
      sourceClaims: { validated: true, randomSpawn: false, difficulties: ['easy', 'normal', 'hard'] },
    },
  },
]

export const mockDataset: PublicDataset = {
  schemaVersion: '1',
  datasetVersion: 'zero-dam-server-candidates-2026-10-04',
  generatedAt: serverSourceSnapshot.retrievedAt,
  map: {
    id: MAP_ID,
    slug: 'zero-dam',
    nameEn: 'Zero Dam',
    nameVi: 'Zero Dam',
  },
  mapVersion: {
    id: MAP_VERSION_ID,
    mapId: MAP_ID,
    versionKey: 'mock-2026-09',
    width: 4096,
    height: 4096,
  },
  areas: [
    {
      id: AREA_IDS.adminBuilding,
      mapVersionId: MAP_VERSION_ID,
      slug: 'admin-building',
      nameEn: 'Admin Building',
      nameVi: 'Tòa quản trị',
    },
    {
      id: AREA_IDS.powerStation,
      mapVersionId: MAP_VERSION_ID,
      slug: 'power-station',
      nameEn: 'Power Station',
      nameVi: 'Trạm điện',
    },
    {
      id: AREA_IDS.underground,
      mapVersionId: MAP_VERSION_ID,
      slug: 'underground',
      nameEn: 'Underground',
      nameVi: 'Khu ngầm',
    },
    {
      id: AREA_IDS.checkpoint,
      mapVersionId: MAP_VERSION_ID,
      slug: 'checkpoint',
      nameEn: 'Checkpoint',
      nameVi: 'Trạm kiểm soát',
    },
  ],
  categories: [
    {
      id: CATEGORY_IDS.container,
      slug: 'container',
      nameEn: 'Container',
      nameVi: 'Đồ vật',
    },
    {
      id: CATEGORY_IDS.access,
      slug: 'access',
      nameEn: 'Access',
      nameVi: 'Truy cập',
    },
    {
      id: CATEGORY_IDS.safe,
      slug: 'safe',
      nameEn: 'Safe',
      nameVi: 'Két sắt',
      parentId: CATEGORY_IDS.container,
    },
    {
      id: CATEGORY_IDS.server,
      slug: 'server',
      nameEn: 'Server',
      nameVi: 'Máy chủ',
      parentId: CATEGORY_IDS.container,
    },
    {
      id: CATEGORY_IDS.computerCase,
      slug: 'computer-case',
      nameEn: 'Computer Case',
      nameVi: 'Thùng máy tính',
      parentId: CATEGORY_IDS.container,
    },
    {
      id: CATEGORY_IDS.keycard,
      slug: 'keycard',
      nameEn: 'Keycard',
      nameVi: 'Thẻ khóa',
      parentId: CATEGORY_IDS.access,
    },
  ],
  entities: [
    {
      id: ENTITY_IDS.safe,
      slug: 'safe',
      categoryId: CATEGORY_IDS.safe,
      nameEn: 'Safe',
      nameVi: 'Két sắt',
      catalogItemId: ITEM_CATALOG_IDS.safe,
    },
    {
      id: ENTITY_IDS.server,
      slug: 'server',
      categoryId: CATEGORY_IDS.server,
      nameEn: 'Server',
      nameVi: 'Máy chủ',
      catalogItemId: ITEM_CATALOG_IDS.server,
    },
    {
      id: ENTITY_IDS.computerCase,
      slug: 'computer-case',
      categoryId: CATEGORY_IDS.computerCase,
      nameEn: 'Computer Case',
      nameVi: 'Thùng máy tính',
      catalogItemId: ITEM_CATALOG_IDS.computerCase,
    },
    {
      id: ENTITY_IDS.substationTechRoomKeycard,
      slug: 'substation-tech-room-keycard',
      categoryId: CATEGORY_IDS.keycard,
      nameEn: 'Substation Tech Room Keycard',
      nameVi: 'Thẻ khóa phòng kỹ thuật trạm điện',
      catalogItemId: ITEM_CATALOG_IDS.substationTechRoomKeycard,
    },
    {
      id: ENTITY_IDS.undergroundVaultStorageKeycard,
      slug: 'underground-vault-storage-keycard',
      categoryId: CATEGORY_IDS.keycard,
      nameEn: 'Underground Vault Storage Keycard',
      nameVi: 'Thẻ kho lưu trữ ngầm',
      catalogItemId: ITEM_CATALOG_IDS.undergroundVaultStorageKeycard,
    },
  ],
  aliases: [
    // Server: abbreviation only; canonical VI/EN names are searchable directly.
    { id: '09368d91-44ff-4add-a395-90a913453932', entityId: ENTITY_IDS.server, locale: 'en', alias: 'sv', normalizedAlias: 'sv' },
    // Safe: common Vietnamese short form.
    { id: 'ca33dd62-75ad-4788-a0b9-935c17d9d870', entityId: ENTITY_IDS.safe, locale: 'vi', alias: 'két', normalizedAlias: 'ket' },
    // Computer Case: borrowed terms and Vietnamese/English mixed forms.
    { id: '02fbac2f-f8e1-4d0f-b34c-1246c4a40767', entityId: ENTITY_IDS.computerCase, locale: 'mixed', alias: 'case', normalizedAlias: 'case' },
    { id: '05250ed6-3982-4c2f-869a-6fdbdbff1eac', entityId: ENTITY_IDS.computerCase, locale: 'mixed', alias: 'thùng pc', normalizedAlias: 'thung pc' },
    { id: '4a836ad3-d7af-4f1c-a10c-396e2e2360ac', entityId: ENTITY_IDS.computerCase, locale: 'en', alias: 'pc case', normalizedAlias: 'pc case' },
  ],
  markers: [
    ...serverMarkerCandidates,
    // Safe markers
    { id: 'fe949d67-ea6a-4f92-860d-e4b07eff99d9', mapVersionId: MAP_VERSION_ID, areaId: AREA_IDS.adminBuilding, entityId: ENTITY_IDS.safe, xNormalized: 0.33, yNormalized: 0.4, floorKey: '2' },
    { id: '05452cb2-14df-4d83-9272-a753fa2437ee', mapVersionId: MAP_VERSION_ID, areaId: AREA_IDS.powerStation, entityId: ENTITY_IDS.safe, xNormalized: 0.6, yNormalized: 0.53, floorKey: '1' },
    { id: '5e22cb51-148a-43e5-a8f6-38eac891d60f', mapVersionId: MAP_VERSION_ID, areaId: AREA_IDS.underground, entityId: ENTITY_IDS.safe, xNormalized: 0.5, yNormalized: 0.8, floorKey: 'B1' },
    { id: '60820ec3-6d2c-404b-8775-f0e96ce1a5bd', mapVersionId: MAP_VERSION_ID, areaId: AREA_IDS.checkpoint, entityId: ENTITY_IDS.safe, xNormalized: 0.25, yNormalized: 0.32, floorKey: '1' },
    { id: '61f229f5-c284-41f7-bf6f-51aeb24cf039', mapVersionId: MAP_VERSION_ID, areaId: AREA_IDS.adminBuilding, entityId: ENTITY_IDS.safe, xNormalized: 0.37, yNormalized: 0.45, floorKey: '1' },
    // Computer Case markers
    { id: '3af65d25-2b93-49a7-9cec-15aad49aabff', mapVersionId: MAP_VERSION_ID, areaId: AREA_IDS.adminBuilding, entityId: ENTITY_IDS.computerCase, xNormalized: 0.34, yNormalized: 0.41, floorKey: '1' },
    { id: '9fdbce8a-5fc0-44e8-acdb-8e30caa15cdb', mapVersionId: MAP_VERSION_ID, areaId: AREA_IDS.powerStation, entityId: ENTITY_IDS.computerCase, xNormalized: 0.61, yNormalized: 0.54, floorKey: '1' },
    { id: 'e2fbd9c4-70da-4610-96b5-bc5b4f002b66', mapVersionId: MAP_VERSION_ID, areaId: AREA_IDS.underground, entityId: ENTITY_IDS.computerCase, xNormalized: 0.49, yNormalized: 0.79, floorKey: 'B1' },
    { id: '0211fc5e-6dc7-4990-bfef-15772f64b459', mapVersionId: MAP_VERSION_ID, areaId: AREA_IDS.checkpoint, entityId: ENTITY_IDS.computerCase, xNormalized: 0.23, yNormalized: 0.31, floorKey: '1' },
    { id: '6663ddb4-f0a0-482a-bf9d-ec27bc3b06e9', mapVersionId: MAP_VERSION_ID, areaId: AREA_IDS.adminBuilding, entityId: ENTITY_IDS.computerCase, xNormalized: 0.36, yNormalized: 0.43, floorKey: '2' },
    { id: '11e884e2-503d-4279-b311-0ae41dc5b45c', mapVersionId: MAP_VERSION_ID, areaId: AREA_IDS.powerStation, entityId: ENTITY_IDS.computerCase, xNormalized: 0.63, yNormalized: 0.56, floorKey: '2' },
    { id: '8bf3cf8e-e3d3-4c11-87b3-6f22ff87bf20', mapVersionId: MAP_VERSION_ID, areaId: AREA_IDS.powerStation, entityId: ENTITY_IDS.substationTechRoomKeycard, xNormalized: 0.67, yNormalized: 0.58 },
    { id: '08705d4d-387b-4d94-b574-3a8d7f66d7ef', mapVersionId: MAP_VERSION_ID, areaId: AREA_IDS.underground, entityId: ENTITY_IDS.undergroundVaultStorageKeycard, xNormalized: 0.52, yNormalized: 0.82 },
  ],
}
