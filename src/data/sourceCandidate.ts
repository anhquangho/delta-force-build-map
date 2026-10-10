import type { MapMarker, MarkerProvenance } from '@/types/domain'
import { zeroDamSourceToLocal } from '@/lib/zero-dam-source-to-local'

export type SourceSnapshotMetadata = Omit<MarkerProvenance, 'sourceKey' | 'sourceExternalId' | 'sourceRecordName' | 'sourceDescription' | 'sourceX' | 'sourceY' | 'sourceZ' | 'sourceClaims'>

export interface SourceCandidateRecord {
  id: string
  locationId: string
  sourceExternalId: string
  sourceX: number
  sourceY: number
  sourceZ?: number
  name?: string
  description?: string
  sourceClaims: {
    validated?: boolean
    randomSpawn?: boolean
    difficulties?: readonly string[]
  }
}

export function createSourceProvenance(
  record: SourceCandidateRecord,
  sourceSnapshot: SourceSnapshotMetadata,
): MarkerProvenance {
  return {
    ...sourceSnapshot,
    sourceKey: record.locationId,
    sourceExternalId: record.sourceExternalId,
    ...(record.name === undefined ? {} : { sourceRecordName: record.name }),
    ...(record.description === undefined ? {} : { sourceDescription: record.description }),
    sourceX: record.sourceX,
    sourceY: record.sourceY,
    ...(record.sourceZ === undefined ? {} : { sourceZ: record.sourceZ }),
    sourceClaims: {
      ...(record.sourceClaims.validated === undefined ? {} : { validated: record.sourceClaims.validated }),
      ...(record.sourceClaims.randomSpawn === undefined ? {} : { randomSpawn: record.sourceClaims.randomSpawn }),
      ...(record.sourceClaims.difficulties === undefined ? {} : { difficulties: [...record.sourceClaims.difficulties] }),
    },
  }
}

export function createSourceCandidate(
  record: SourceCandidateRecord,
  entityId: string,
  mapVersionId: string,
  sourceSnapshot: SourceSnapshotMetadata,
): MapMarker {
  const localCoordinates = zeroDamSourceToLocal(record.sourceX, record.sourceY)
  return {
    id: record.id,
    mapVersionId,
    entityId,
    xNormalized: localCoordinates.xNormalized,
    yNormalized: localCoordinates.yNormalized,
    withinLocalCrop: localCoordinates.withinLocalCrop,
    ...(record.sourceZ === undefined ? {} : { floorKey: String(record.sourceZ) }),
    verificationStatus: 'candidate',
    provenance: createSourceProvenance(record, sourceSnapshot),
  }
}
