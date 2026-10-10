/**
 * Local development dataset for Zero Dam search and map features.
 *
 * Only the two inventory Keycard markers remain mock fixtures. Server, Safe,
 * Computer Case, and keycard-related POI markers are source-backed candidates.
 */

import type { MapEntity, MapMarker } from '@/types/domain'
import type { PublicDataset } from '@/types/dataset'
import { ZERO_DAM_SOURCE_CROP } from '@/lib/zero-dam-source-to-local'
import { ITEM_CATALOG_IDS } from './itemCatalog'
import { createSourceCandidate } from './sourceCandidate'
import type { SourceCandidateRecord, SourceSnapshotMetadata } from './sourceCandidate'

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
  keycardLocation: 'e3ac0334-253a-4f27-81de-23e81165978e',
} as const

const ENTITY_IDS = {
  safe: 'faa8faac-6cb5-42d7-ad74-d9509f01002b',
  server: 'e4e00fcb-10b5-482e-9842-fac866dd4d8d',
  computerCase: '317d203d-aaae-434f-8c90-9ff8d813925f',
  substationTechRoomKeycard: '9c7d4ebd-a389-4871-9863-53375127504e',
  undergroundVaultStorageKeycard: 'c751c9b8-0901-41de-8a7d-b0588c230373',
} as const

const sourceSnapshotFields = {
  sourceName: 'deltaforce-maps.com',
  sourceUrl: 'https://deltaforce-maps.com/data/zero-dam/markers.json',
  coordinateSpace: 'zero-dam-image-4096',
  sourceUpdatedAt: '2025-10-14T15:40:14Z',
  snapshotEtag: 'W/"b2c30572ad63168e1fcbc8a805f6a484"',
  snapshotHash: 'sha256:bae201e2ead1ad729538348e6e3d33e3cfa4a1db8d0331ae4c5200410a1af0c',
  reuseStatus: 'unconfirmed',
} as const

const serverSourceSnapshot: SourceSnapshotMetadata = {
  ...sourceSnapshotFields,
  retrievedAt: '2026-10-04T10:25:38.955Z',
}

const safeSourceSnapshot: SourceSnapshotMetadata = {
  ...sourceSnapshotFields,
  retrievedAt: '2026-10-10T02:45:09.065Z',
}

const serverSourceRecords: SourceCandidateRecord[] = [
  {
    id: '54193b79-d16f-48ee-949f-52dfcb6c305d',
    locationId: 'server',
    sourceExternalId: '395',
    sourceX: 2428,
    sourceY: 1812,
    sourceZ: 1,
    sourceClaims: { validated: true, randomSpawn: false, difficulties: ['easy', 'normal', 'hard'] },
  },
  {
    id: '03365292-2377-4a79-8821-a9910d79908b',
    locationId: 'server',
    sourceExternalId: '333',
    sourceX: 2197,
    sourceY: 2735,
    sourceClaims: { validated: true, randomSpawn: false, difficulties: ['easy', 'normal', 'hard'] },
  },
  {
    id: 'fe7752ce-1126-4aa3-bf4e-e47de26dc659',
    locationId: 'server',
    sourceExternalId: '413',
    sourceX: 2298,
    sourceY: 2655,
    sourceZ: 0,
    sourceClaims: { validated: true, randomSpawn: false, difficulties: ['easy', 'normal', 'hard'] },
  },
]

export const serverMarkerCandidates: MapMarker[] = serverSourceRecords.map((record) =>
  createSourceCandidate(record, ENTITY_IDS.server, MAP_VERSION_ID, serverSourceSnapshot),
)

const safeSourceClaims = { validated: true, randomSpawn: true, difficulties: ['easy', 'normal', 'hard'] } as const

const safeSourceRecords: SourceCandidateRecord[] = [
  { id: 'a09a8cb1-6d53-4501-8eb2-e926b5c6f4e1', locationId: 'safe', sourceExternalId: '354', sourceX: 2417, sourceY: 2664, sourceClaims: safeSourceClaims },
  { id: 'b5471def-0b22-41d5-8a56-71df6169a3af', locationId: 'safe', sourceExternalId: '355', sourceX: 2491, sourceY: 1792, sourceZ: 0, sourceClaims: safeSourceClaims },
  { id: '5d079722-d266-40ef-9bf1-3115aedc39eb', locationId: 'safe', sourceExternalId: '353', sourceX: 2303, sourceY: 2739, sourceClaims: safeSourceClaims },
  { id: '20c7ff8a-03ed-4c59-90a8-b21cc90cba5f', locationId: 'safe', sourceExternalId: '351', sourceX: 1390, sourceY: 2807, sourceClaims: safeSourceClaims },
  { id: '6654ee89-2cf7-490e-b0e3-7626b8ae71a5', locationId: 'safe', sourceExternalId: '352', sourceX: 1265, sourceY: 2863, sourceClaims: safeSourceClaims },
  { id: '9a10f829-4094-4694-8d89-4c88581163e2', locationId: 'safe', sourceExternalId: '735', sourceX: 3249, sourceY: 1341, sourceZ: 1, sourceClaims: safeSourceClaims },
  { id: '52566499-d42f-4fb4-9091-b3adc6758043', locationId: 'safe', sourceExternalId: '736', sourceX: 2150, sourceY: 2635, sourceZ: 1, sourceClaims: safeSourceClaims },
  { id: '4a1336b1-66cf-45b9-b999-d420c0c7305d', locationId: 'safe', sourceExternalId: '1016', sourceX: 1317, sourceY: 2268, sourceZ: 0, sourceClaims: safeSourceClaims },
  { id: 'd3a6e9c3-2b1c-4e31-aca5-cc9031d32ebd', locationId: 'safe', sourceExternalId: '1018', sourceX: 2434, sourceY: 1819, sourceZ: 1, sourceClaims: safeSourceClaims },
  { id: '5286d403-3329-45cf-b3d7-8c395e1a3c52', locationId: 'safe', sourceExternalId: '1017', sourceX: 1271, sourceY: 2186, sourceZ: 1, sourceClaims: safeSourceClaims },
  { id: '7f8b8e78-f776-4b42-838c-72776f97fdc7', locationId: 'safe', sourceExternalId: '1401', sourceX: 2411, sourceY: 2662, sourceZ: 1, sourceClaims: safeSourceClaims },
]

export function selectSourceRecordsByLocationId<T extends { locationId: string }>(records: readonly T[], locationId: string): T[] {
  return records.filter((record) => record.locationId === locationId)
}

export const safeMarkerCandidates: MapMarker[] = selectSourceRecordsByLocationId(safeSourceRecords, 'safe').map((record) =>
  createSourceCandidate(record, ENTITY_IDS.safe, MAP_VERSION_ID, safeSourceSnapshot),
)

const computerCaseSourceClaims = { validated: true, randomSpawn: false, difficulties: ['easy', 'normal', 'hard'] } as const

const computerCaseSourceRecords: SourceCandidateRecord[] = [
  { id: '5725490c-4fb7-4683-b1ad-9e9990e73fd3', locationId: 'computer_case', sourceExternalId: '330', sourceX: 2184, sourceY: 2648, sourceZ: 1, description: '', sourceClaims: computerCaseSourceClaims },
  { id: '1dba8882-624c-480a-b030-193dffc4471f', locationId: 'computer_case', sourceExternalId: '327', sourceX: 2251, sourceY: 2730, sourceZ: 0, description: '', sourceClaims: computerCaseSourceClaims },
  { id: '612bba95-80a5-478d-bf8f-3307234fc199', locationId: 'computer_case', sourceExternalId: '326', sourceX: 2247, sourceY: 2731, sourceZ: 0, description: '', sourceClaims: computerCaseSourceClaims },
  { id: '2b5c8068-5c75-4edb-9aa9-96297cdfac25', locationId: 'computer_case', sourceExternalId: '643', sourceX: 2237, sourceY: 1593, sourceZ: 0, sourceClaims: computerCaseSourceClaims },
  { id: '535e9639-f2a3-4189-a822-829cb244157e', locationId: 'computer_case', sourceExternalId: '344', sourceX: 2483, sourceY: 2667, sourceZ: 0, description: '', sourceClaims: computerCaseSourceClaims },
  { id: '7e457448-ead6-4b29-8513-71270d51b2da', locationId: 'computer_case', sourceExternalId: '1019', sourceX: 2584, sourceY: 3079, sourceZ: 0, sourceClaims: computerCaseSourceClaims },
  { id: 'a9aca5d6-bccc-4b9d-8564-7c99acaf6409', locationId: 'computer_case', sourceExternalId: '334', sourceX: 2250, sourceY: 2734, sourceZ: 1, description: '', sourceClaims: computerCaseSourceClaims },
  { id: '24f49fb0-3121-4024-a7c8-ced620ff7146', locationId: 'computer_case', sourceExternalId: '1386', sourceX: 2173, sourceY: 2618, sourceZ: -1, sourceClaims: computerCaseSourceClaims },
  { id: 'f01b24ad-23c1-4ade-80a3-7261cff96149', locationId: 'computer_case', sourceExternalId: '1396', sourceX: 2120, sourceY: 2286, sourceZ: -1, sourceClaims: computerCaseSourceClaims },
]

export const computerCaseMarkerCandidates: MapMarker[] = selectSourceRecordsByLocationId(computerCaseSourceRecords, 'computer_case').map((record) =>
  createSourceCandidate(record, ENTITY_IDS.computerCase, MAP_VERSION_ID, safeSourceSnapshot),
)

const keyCardSourceClaims = { validated: true, randomSpawn: false, difficulties: ['easy', 'normal', 'hard'] } as const

interface KeycardLocationSourceRecord extends SourceCandidateRecord {
  entityId: string
  slug: string
  name: string
  nameVi: string
}

const keycardLocationSourceRecords: KeycardLocationSourceRecord[] = [
  { id: '04c7aeff-8ed3-4ed5-a5a0-ca2ca9f41cc4', entityId: '0c87fc19-d2b7-43ce-94f9-2e774f01ff9a', slug: 'keycard-puzzle-d3-3', locationId: 'key_card', sourceExternalId: '226', sourceX: 3063, sourceY: 1887, sourceZ: -1, name: '???#D3-3', nameVi: '???#D3-3', description: 'Last part of the puzzle for Se', sourceClaims: keyCardSourceClaims },
  { id: '699a363d-49a7-424f-88a1-2bf64481f114', entityId: 'e38dfd7b-45e2-4ee7-8db8-c19a1c2a3d1c', slug: 'keycard-puzzle-d2-3', locationId: 'key_card', sourceExternalId: '225', sourceX: 2378, sourceY: 1999, name: '???#D2-3', nameVi: '???#D2-3', description: 'Third part of the puzzle for S', sourceClaims: keyCardSourceClaims },
  { id: 'c21a7f83-2dba-4f41-bbef-77c83f1c6851', entityId: '47036267-0a57-49be-8510-9f0dedd71c2a', slug: 'cement-plant-office', locationId: 'key_card', sourceExternalId: '183', sourceX: 1379, sourceY: 2006, sourceZ: 0, name: 'Cement Plant Office', nameVi: 'Văn phòng nhà máy xi măng', description: '', sourceClaims: keyCardSourceClaims },
  { id: 'e86362f1-399c-4d7b-9c65-a4ce85d6fd74', entityId: '2a0ed531-11b0-4106-a96d-cae0800fc4df', slug: 'keycard-puzzle-d1-3', locationId: 'key_card', sourceExternalId: '223', sourceX: 1054, sourceY: 1892, sourceZ: -1, name: '???#D1-3', nameVi: '???#D1-3', description: 'Second part of the puzzle for ', sourceClaims: keyCardSourceClaims },
  { id: 'f04472ef-93b8-4d96-813b-3f81481fa9a9', entityId: 'a9d7d43e-5b83-43ab-89a9-77b60f5a6d06', slug: 'barracks-storage-room', locationId: 'key_card', sourceExternalId: '161', sourceX: 1341, sourceY: 2879, sourceZ: 0, name: 'Barracks Storage Room', nameVi: 'Phòng kho doanh trại', description: '', sourceClaims: keyCardSourceClaims },
  { id: 'ece43ea2-4ab4-4c30-9b05-f9fb0c40363f', entityId: 'e5075950-458e-432d-a316-9494d19de983', slug: 'west-wing-control-room', locationId: 'key_card', sourceExternalId: '169', sourceX: 2193, sourceY: 2741, name: 'West Wing Control Room', nameVi: 'Phòng điều khiển cánh Tây', description: '2x Server rack, 1x Jacket, 1x ', sourceClaims: keyCardSourceClaims },
  { id: 'cb3029a7-db56-4054-8c73-3b51937a547a', entityId: '12d97e2f-c0f3-46b6-bb57-bb6a07fe152d', slug: 'east-wing-managers-office', locationId: 'key_card', sourceExternalId: '167', sourceX: 2369, sourceY: 2576, name: 'East Wing Managers Office', nameVi: 'Văn phòng quản lý cánh Đông', description: '1x Large Weapon Crate, 2x Big ', sourceClaims: keyCardSourceClaims },
  { id: '951dfc2d-eceb-4681-8010-d1b845032965', entityId: '4e0ed042-caf0-4588-b01b-2b9d8438b5ee', slug: 'substation-dormitory', locationId: 'key_card', sourceExternalId: '163', sourceX: 2208, sourceY: 1569, name: 'Substation Dormitory', nameVi: 'Ký túc xá trạm biến áp', description: '3x loose item, 1x locker', sourceClaims: keyCardSourceClaims },
  { id: 'c80831ec-e2df-4f3e-b95b-c198abdfcd78', entityId: '8d43eed1-9dfb-4ae1-a388-6864c8941536', slug: 'ticket-office', locationId: 'key_card', sourceExternalId: '164', sourceX: 3217, sourceY: 1186, sourceZ: 0, name: 'Ticket Office', nameVi: 'Phòng vé', description: '1x small safe, 1x briefcase, 1', sourceClaims: keyCardSourceClaims },
  { id: '9f938214-5680-4a9f-8de5-b74f7ffb363b', entityId: '93c38202-e4eb-470f-a4be-66b1ae01b04a', slug: 'equipment-collection-room', locationId: 'key_card', sourceExternalId: '166', sourceX: 2434, sourceY: 2632, name: 'Equipment Collection Room', nameVi: 'Phòng thu gom trang bị', description: '', sourceClaims: keyCardSourceClaims },
  { id: '2e4fd76b-ac5e-4a80-b610-615276b34ae8', entityId: 'c2aebe1c-7e66-4568-8586-f91b767c2afa', slug: 'west-wing-monitoring-room', locationId: 'key_card', sourceExternalId: '362', sourceX: 2231, sourceY: 2641, sourceZ: 1, name: 'West Wing Monitoring Room', nameVi: 'Phòng giám sát cánh Tây', description: '', sourceClaims: keyCardSourceClaims },
  { id: '4320777c-f599-4609-97a2-ee656b4012ea', entityId: '167473b3-3e59-4d2e-9579-f80b730b2242', slug: 'cement-plant-dormitory', locationId: 'key_card', sourceExternalId: '162', sourceX: 1127, sourceY: 2151, sourceZ: 1, name: 'Cement Plant Dormitory', nameVi: 'Ký túc xá nhà máy xi măng', description: '1x Computer Case, 1x Briefcase', sourceClaims: keyCardSourceClaims },
  { id: '43166db9-699b-4a0d-9756-1db24301958f', entityId: '72d26182-460e-4113-a44b-10219f220a0d', slug: 'central-vip-room', locationId: 'key_card', sourceExternalId: '184', sourceX: 3270, sourceY: 1337, sourceZ: 1, name: 'Central VIP Room', nameVi: 'Phòng VIP trung tâm', description: '2x Briefcase & 2 loose items', sourceClaims: keyCardSourceClaims },
  { id: 'ea0f13fa-7a4e-4278-8a71-3839b89b846a', entityId: 'd4c6203c-7ee4-460b-a249-82b9202234fb', slug: 'substation-tech-room', locationId: 'key_card', sourceExternalId: '165', sourceX: 2455, sourceY: 1784, sourceZ: 1, name: 'Substation Tech Room', nameVi: 'Phòng kỹ thuật trạm biến áp', description: 'normal: 1x Big safe, 2x Server', sourceClaims: keyCardSourceClaims },
  { id: '81ae8b6a-39b6-4192-aca1-8d206c1d9752', entityId: '5bfe7c5e-e042-466d-8be9-46c079156e60', slug: 'west-wing-infirmary', locationId: 'key_card', sourceExternalId: '168', sourceX: 2237, sourceY: 2648, name: 'West Wing Infirmary', nameVi: 'Bệnh xá cánh Tây', description: '', sourceClaims: keyCardSourceClaims },
]

const keycardLocationEntities: MapEntity[] = selectSourceRecordsByLocationId(keycardLocationSourceRecords, 'key_card').map((record) => ({
  id: record.entityId,
  slug: record.slug,
  categoryId: CATEGORY_IDS.keycardLocation,
  nameEn: record.name,
  nameVi: record.nameVi,
  verificationStatus: 'candidate',
}))

export const keycardLocationMarkerCandidates: MapMarker[] = selectSourceRecordsByLocationId(keycardLocationSourceRecords, 'key_card').map((record) =>
  createSourceCandidate(record, record.entityId, MAP_VERSION_ID, safeSourceSnapshot),
)

export const mockDataset: PublicDataset = {
  schemaVersion: '1',
  datasetVersion: 'zero-dam-source-candidates-2026-10-10',
  generatedAt: safeSourceSnapshot.retrievedAt,
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
    width: ZERO_DAM_SOURCE_CROP.cropWidth,
    height: ZERO_DAM_SOURCE_CROP.cropHeight,
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
    {
      id: CATEGORY_IDS.keycardLocation,
      slug: 'keycard-location',
      nameEn: 'Keycard-related location',
      nameVi: 'Vị trí liên quan đến thẻ',
    }
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
    ...keycardLocationEntities,
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
    ...safeMarkerCandidates,
    ...computerCaseMarkerCandidates,
    ...keycardLocationMarkerCandidates,
    { id: '8bf3cf8e-e3d3-4c11-87b3-6f22ff87bf20', mapVersionId: MAP_VERSION_ID, areaId: AREA_IDS.powerStation, entityId: ENTITY_IDS.substationTechRoomKeycard, xNormalized: 0.67, yNormalized: 0.58 },
    { id: '08705d4d-387b-4d94-b574-3a8d7f66d7ef', mapVersionId: MAP_VERSION_ID, areaId: AREA_IDS.underground, entityId: ENTITY_IDS.undergroundVaultStorageKeycard, xNormalized: 0.52, yNormalized: 0.82 },
  ],
}
