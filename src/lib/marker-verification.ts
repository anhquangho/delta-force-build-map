import type { MapMarker, VerificationStatus } from '@/types/domain'

const verificationLabels: Record<VerificationStatus, string> = {
  candidate: 'Ứng viên nguồn / Unverified source candidate',
  reviewed: 'Đã rà soát / Reviewed, not verified',
  verified: 'Đã xác minh / Verified',
  disputed: 'Đang tranh chấp / Disputed',
  stale: 'Có thể đã cũ / Stale',
}

export function markerVerificationLabel(marker: Pick<MapMarker, 'verificationStatus'>): string {
  return marker.verificationStatus
    ? verificationLabels[marker.verificationStatus]
    : 'Dữ liệu giả lập / Unverified mock data'
}
