/**
 * Local mock dataset for Zero Dam vertical-slice development.
 *
 * This is intentionally small, unreviewed placeholder data used only to build
 * search and map features. It will be replaced by a deterministic export from
 * the Supabase canonical dataset once the publication workflow is implemented.
 */

import type { PublicDataset } from '@/types/dataset'

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
} as const

const ENTITY_IDS = {
  safe: 'faa8faac-6cb5-42d7-ad74-d9509f01002b',
  server: 'e4e00fcb-10b5-482e-9842-fac866dd4d8d',
  computerCase: '317d203d-aaae-434f-8c90-9ff8d813925f',
} as const

export const mockDataset: PublicDataset = {
  schemaVersion: '1',
  datasetVersion: 'zero-dam-mock-2026-09-30',
  generatedAt: '2026-09-30T00:00:00Z',
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
  ],
  entities: [
    {
      id: ENTITY_IDS.safe,
      slug: 'safe',
      categoryId: CATEGORY_IDS.safe,
      nameEn: 'Safe',
      nameVi: 'Két sắt',
      icon: `${import.meta.env.BASE_URL}icons/safe.svg`,
    },
    {
      id: ENTITY_IDS.server,
      slug: 'server',
      categoryId: CATEGORY_IDS.server,
      nameEn: 'Server',
      nameVi: 'Máy chủ',
      icon: `${import.meta.env.BASE_URL}icons/server.svg`,
    },
    {
      id: ENTITY_IDS.computerCase,
      slug: 'computer-case',
      categoryId: CATEGORY_IDS.computerCase,
      nameEn: 'Computer Case',
      nameVi: 'Thùng máy tính',
      icon: `${import.meta.env.BASE_URL}icons/computer-case.svg`,
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
    // Server markers
    { id: '343aa6f8-3571-4a70-81e5-81baee4b543a', mapVersionId: MAP_VERSION_ID, areaId: AREA_IDS.adminBuilding, entityId: ENTITY_IDS.server, xNormalized: 0.35, yNormalized: 0.42, floorKey: '1' },
    { id: '00501dec-0c9c-4df1-a57f-0fcc2df79556', mapVersionId: MAP_VERSION_ID, areaId: AREA_IDS.powerStation, entityId: ENTITY_IDS.server, xNormalized: 0.62, yNormalized: 0.55, floorKey: '1' },
    { id: '0898eb1f-1857-40e7-80a2-1908b78505ba', mapVersionId: MAP_VERSION_ID, areaId: AREA_IDS.underground, entityId: ENTITY_IDS.server, xNormalized: 0.48, yNormalized: 0.78, floorKey: 'B1' },
    { id: '8ea3d5ca-f2d0-4279-a07e-9244b853f27e', mapVersionId: MAP_VERSION_ID, areaId: AREA_IDS.checkpoint, entityId: ENTITY_IDS.server, xNormalized: 0.22, yNormalized: 0.3, floorKey: '1' },
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
  ],
}
