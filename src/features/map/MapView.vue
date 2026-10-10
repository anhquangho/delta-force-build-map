<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import type { CSSProperties } from 'vue'
import { keycardLocationMarkerCandidates, mockDataset } from '@/data/mockDataset'
import type { DeltaForceMapsZeroDamCalibrationRecord } from '@/data/deltaForceMapsZeroDamCalibration'
import { zeroDamMapConfig } from '@/data/zeroDamMap'
import { useMapController } from '@/composables/useMapController'
import type { SearchSelection } from '@/composables/useSearchSelection'
import type { MapMarker } from '@/types/domain'
import { normalizedCoordinatesToMapPoint, type NormalizedMapCoordinates } from '@/lib/coordinates'
import { isMarkerVisibleInLocalMap } from '@/lib/marker-visibility'
import { createMarkerReviewPatch, markerPositionDelta, markerReviewModeEnabled } from '@/lib/marker-review'
import { createCalibrationCorrespondence, sourceCoordinatesForCalibrationPreview } from '@/lib/marker-calibration'
import { getCatalogItem, getItemPresentation } from '@/lib/item-presentation'
import { placeMarkerDetail, type MarkerDetailPlacement } from '@/lib/marker-detail-placement'
import MarkerDetail from './MarkerDetail.vue'

const props = defineProps<{ selection: SearchSelection; focusRequest?: number }>()
const mapContainer = ref<HTMLElement | null>(null)
const detailAnchor = ref<HTMLElement | null>(null)
const detailPlacement = ref<MarkerDetailPlacement | null>(null)
const inspectedCoordinates = ref<NormalizedMapCoordinates | null>(null)
const reviewPositions = ref<Record<string, NormalizedMapCoordinates>>({})
const reviewCopyStatus = ref('')
const calibrationSourceExternalId = ref('')
const keycardPoiSourceExternalId = ref('')
const calibrationPosition = ref<NormalizedMapCoordinates | null>(null)
const calibrationWithinLocalCrop = ref<boolean | null>(null)
const calibrationHasManualReview = ref(false)
const selectedMarker = ref<MapMarker | null>(null)
const reviewMode = markerReviewModeEnabled(window.location.search, import.meta.env.DEV)
const reviewPanelVisible = ref(true)
const calibrationRecords = ref<readonly DeltaForceMapsZeroDamCalibrationRecord[]>([])
if (import.meta.env.DEV && reviewMode) {
  void import('@/data/deltaForceMapsZeroDamCalibration').then(({ deltaForceMapsZeroDamCalibrationRecords }) => {
    calibrationRecords.value = deltaForceMapsZeroDamCalibrationRecords
  })
}
const keycardPoiOptions = keycardLocationMarkerCandidates.flatMap((marker) => {
  const provenance = marker.provenance
  const entity = mockDataset.entities.find((entry) => entry.id === marker.entityId)
  return provenance?.sourceKey === 'key_card' && entity
    ? [{ marker, provenance, entity }]
    : []
})
const showAlignmentControlPoints = import.meta.env.DEV
const basemapStatus = ref<'loading' | 'ready' | 'error'>('loading')
let controller: ReturnType<typeof useMapController> | null = null
let resizeObserver: ResizeObserver | undefined
let removeMapClickListener: (() => void) | undefined
let removeCoordinateClickListener: (() => void) | undefined
let removeViewportListener: (() => void) | undefined

const selectedEntity = computed(() =>
  mockDataset.entities.find((entity) => entity.id === props.selection.selectedEntityId),
)
const selectedMarkers = computed(() =>
  mockDataset.markers.filter((marker) => marker.entityId === selectedEntity.value?.id && isMarkerVisibleInLocalMap(marker)),
)
const markersForMap = computed(() => selectedMarkers.value.map((marker) => {
  const coordinates = reviewPositions.value[marker.id]
  return coordinates ? { ...marker, ...coordinates } : marker
}))
const selectedReviewCandidate = computed(() => {
  const selected = selectedMarker.value
  if (!reviewMode || selected?.verificationStatus !== 'candidate') return null
  return mockDataset.markers.find((marker) => marker.id === selected.id && marker.verificationStatus === 'candidate') ?? null
})
const selectedCalibrationRecord = computed(() =>
  calibrationRecords.value.find((record) => record.sourceExternalId === calibrationSourceExternalId.value) ?? null,
)
const selectedKeycardPoiOption = computed(() =>
  keycardPoiOptions.find((option) => option.provenance.sourceExternalId === keycardPoiSourceExternalId.value) ?? null,
)
const selectedKeycardPoiMarker = computed(() =>
  selectedReviewCandidate.value?.provenance?.sourceKey === 'key_card' ? selectedReviewCandidate.value : null,
)
const keycardPoiFloorInterpretation = computed(() => {
  const sourceZ = selectedKeycardPoiMarker.value?.provenance?.sourceZ
  return sourceZ === undefined
    ? 'Unknown; source z was not supplied.'
    : `Unknown; source z=${sourceZ} is preserved as a code, but no named-floor mapping is validated.`
})
const currentReviewCoordinates = computed(() => {
  const marker = selectedReviewCandidate.value
  if (!marker) return null
  return reviewPositions.value[marker.id] ?? { xNormalized: marker.xNormalized, yNormalized: marker.yNormalized }
})
const reviewCoordinateDelta = computed(() => {
  const marker = selectedReviewCandidate.value
  const current = currentReviewCoordinates.value
  return marker && current
    ? markerPositionDelta({ xNormalized: marker.xNormalized, yNormalized: marker.yNormalized }, current)
    : null
})
const projectMapDimensions = { width: mockDataset.mapVersion.width, height: mockDataset.mapVersion.height }
const inspectedMapPoint = computed(() => inspectedCoordinates.value
  ? normalizedCoordinatesToMapPoint(inspectedCoordinates.value, projectMapDimensions.width, projectMapDimensions.height)
  : null)
const originalSourceMapPoint = computed(() => {
  const marker = selectedReviewCandidate.value
  return marker
    ? normalizedCoordinatesToMapPoint({ xNormalized: marker.xNormalized, yNormalized: marker.yNormalized }, projectMapDimensions.width, projectMapDimensions.height)
    : null
})
const currentReviewMapPoint = computed(() => currentReviewCoordinates.value
  ? normalizedCoordinatesToMapPoint(currentReviewCoordinates.value, projectMapDimensions.width, projectMapDimensions.height)
  : null)
const catalogItem = computed(() => getCatalogItem(selectedEntity.value))
const presentation = computed(() => getItemPresentation(catalogItem.value))
const areaName = computed(() => {
  const area = mockDataset.areas.find((area) => area.id === selectedMarker.value?.areaId)
  return area ? `${area.nameVi} / ${area.nameEn}` : 'Chưa rõ / Unknown'
})
const categoryName = computed(() => {
  const category = mockDataset.categories.find((category) => category.id === selectedEntity.value?.categoryId)
  return category ? `${category.nameVi} / ${category.nameEn}` : 'Chưa rõ / Unknown'
})
const detailAnchorStyle = computed<CSSProperties | undefined>(() => {
  const placement = detailPlacement.value
  const container = mapContainer.value
  if (!placement || !container) return undefined
  const rect = container.getBoundingClientRect()
  const width = container.clientWidth || rect.width || window.innerWidth
  const height = container.clientHeight || rect.height || window.innerHeight
  return {
    left: `${placement.left}px`,
    top: `${placement.top}px`,
    width: `${Math.max(1, Math.min(320, width - 24))}px`,
    '--arrow-x': `${placement.arrowX}px`,
    '--detail-max-height': `${Math.max(96, height - 24)}px`,
  } as CSSProperties
})

function updateDetailPosition() {
  const marker = selectedMarker.value
  const container = mapContainer.value
  const point = marker && controller?.getMarkerPoint(marker.id)
  if (!marker || !container || !point) {
    detailPlacement.value = null
    return
  }
  const rect = container.getBoundingClientRect()
  const viewport = {
    width: container.clientWidth || rect.width || window.innerWidth,
    height: container.clientHeight || rect.height || window.innerHeight,
  }
  const cardWidth = Math.max(1, Math.min(320, viewport.width - 24))
  const card = detailAnchor.value
    ? { width: detailAnchor.value.offsetWidth || cardWidth, height: detailAnchor.value.offsetHeight || Math.min(260, viewport.height - 24) }
    : { width: cardWidth, height: Math.min(260, viewport.height - 24) }
  detailPlacement.value = placeMarkerDetail(point, card, viewport)
}

function openMarkerDetail(marker: MapMarker) {
  selectedMarker.value = marker
  keycardPoiSourceExternalId.value = marker.provenance?.sourceKey === 'key_card'
    ? marker.provenance.sourceExternalId
    : ''
  if (reviewMode) inspectedCoordinates.value = { xNormalized: marker.xNormalized, yNormalized: marker.yNormalized }
  updateDetailPosition()
  void nextTick(updateDetailPosition)
}

function onMapCoordinateClick(coordinates: NormalizedMapCoordinates) {
  inspectedCoordinates.value = coordinates
  reviewCopyStatus.value = ''
}

function onMarkerDrag(marker: MapMarker, coordinates: NormalizedMapCoordinates) {
  reviewPositions.value = { ...reviewPositions.value, [marker.id]: coordinates }
  if (selectedMarker.value?.id === marker.id) inspectedCoordinates.value = coordinates
  reviewCopyStatus.value = ''
  updateDetailPosition()
}

function sourceFieldText(value?: string): string {
  if (value === undefined) return 'Not supplied'
  return value.length ? value : 'Empty in source'
}

function sourceValidationClaimText(value?: boolean): string {
  return value === undefined ? 'Not supplied' : `${value} (source claim only)`
}

function selectCalibrationRecord(sourceExternalId: string) {
  calibrationSourceExternalId.value = sourceExternalId
  reviewCopyStatus.value = ''
  calibrationHasManualReview.value = false
  closeDetail()
  const record = calibrationRecords.value.find((candidate) => candidate.sourceExternalId === sourceExternalId)
  if (!record) {
    calibrationPosition.value = null
    calibrationWithinLocalCrop.value = null
    controller?.setDevelopmentCalibrationMarker(null)
    return
  }
  const projection = sourceCoordinatesForCalibrationPreview(record)
  calibrationPosition.value = { xNormalized: projection.xNormalized, yNormalized: projection.yNormalized }
  calibrationWithinLocalCrop.value = projection.withinLocalCrop
  if (!projection.withinLocalCrop) {
    controller?.setDevelopmentCalibrationMarker(null)
    return
  }
  controller?.setDevelopmentCalibrationMarker({
    xNormalized: projection.xNormalized,
    yNormalized: projection.yNormalized,
    title: `Calibration source ${record.sourceExternalId}: ${record.name ?? record.locationId}`,
    onDrag: (reviewedCoordinates) => {
      calibrationPosition.value = reviewedCoordinates
      calibrationHasManualReview.value = true
      reviewCopyStatus.value = ''
    },
  })
}

function onCalibrationRecordChange(event: Event) {
  selectCalibrationRecord((event.currentTarget as HTMLSelectElement).value)
}

async function onKeycardPoiSourceChange(event: Event) {
  const sourceExternalId = (event.currentTarget as HTMLSelectElement).value
  keycardPoiSourceExternalId.value = sourceExternalId
  reviewCopyStatus.value = ''
  const option = keycardPoiOptions.find((entry) => entry.provenance.sourceExternalId === sourceExternalId)
  if (!option) {
    closeDetail()
    return
  }
  props.selection.selectEntity(option.marker.entityId)
  await nextTick()
  controller?.fitMarkers()
  controller?.selectMarker(option.marker.id)
  openMarkerDetail(option.marker)
}

function resetCalibrationRecordPosition() {
  const record = selectedCalibrationRecord.value
  if (record) selectCalibrationRecord(record.sourceExternalId)
}

function copyCalibrationCorrespondence() {
  const record = selectedCalibrationRecord.value
  const coordinates = calibrationPosition.value
  if (record && coordinates && calibrationWithinLocalCrop.value && calibrationHasManualReview.value) {
    void copyReviewText(createCalibrationCorrespondence(record, coordinates))
  }
}

async function copyReviewText(value: unknown) {
  try {
    if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable')
    await navigator.clipboard.writeText(JSON.stringify(value, null, 2))
    reviewCopyStatus.value = 'Copied to clipboard'
  } catch {
    reviewCopyStatus.value = 'Clipboard unavailable'
  }
}

function copyInspectedCoordinates() {
  const coordinates = inspectedCoordinates.value
  const projectPoint = inspectedMapPoint.value
  if (coordinates && projectPoint) {
    void copyReviewText({
      ...coordinates,
      projectX: projectPoint.x,
      projectY: projectPoint.y,
    })
  }
}

function copySelectedMarkerPatch() {
  const marker = selectedReviewCandidate.value
  const coordinates = currentReviewCoordinates.value
  if (marker && coordinates) void copyReviewText(createMarkerReviewPatch(marker.id, coordinates))
}

function copySelectedKeycardPoiDetails() {
  const marker = selectedKeycardPoiMarker.value
  const option = selectedKeycardPoiOption.value
  const source = marker?.provenance
  const currentCoordinates = currentReviewCoordinates.value
  if (!marker || !option || option.marker.id !== marker.id || !source || !currentCoordinates) return
  void copyReviewText({
    sourceUrl: source.sourceUrl,
    sourceKey: source.sourceKey,
    sourceExternalId: source.sourceExternalId,
    sourceRecordName: source.sourceRecordName ?? null,
    sourceDescription: source.sourceDescription ?? null,
    sourceX: source.sourceX,
    sourceY: source.sourceY,
    sourceZ: source.sourceZ ?? null,
    sourceNormalizedX: marker.xNormalized,
    sourceNormalizedY: marker.yNormalized,
    currentNormalizedX: currentCoordinates.xNormalized,
    currentNormalizedY: currentCoordinates.yNormalized,
    withinLocalCrop: marker.withinLocalCrop,
    sourceClaims: source.sourceClaims,
    sourceFloorCode: source.sourceZ ?? null,
    namedFloorMapping: 'unknown/unverified',
    rarityEvidence: 'unknown/not supplied for this location POI',
    colorEvidence: 'unknown/not supplied for this location POI',
    verificationStatus: marker.verificationStatus,
  })
}

function resetSelectedMarkerToSource() {
  const marker = selectedReviewCandidate.value
  if (!marker) return
  const coordinates = { xNormalized: marker.xNormalized, yNormalized: marker.yNormalized }
  const nextPositions = { ...reviewPositions.value }
  delete nextPositions[marker.id]
  reviewPositions.value = nextPositions
  controller?.setMarkerPosition(marker.id, coordinates)
  inspectedCoordinates.value = coordinates
  selectedMarker.value = marker
  reviewCopyStatus.value = ''
  updateDetailPosition()
}

function onDocumentClick(event: MouseEvent) {
  if (!selectedMarker.value || !(event.target instanceof Element)) return
  if (detailAnchor.value?.contains(event.target) || event.target.closest('.item-map-marker') || event.target.closest('.dev-marker-review-panel')) return
  if (mapContainer.value?.contains(event.target)) {
    if (event.target.closest('.leaflet-control')) closeDetail()
    return
  }
  closeDetail()
}

function onDocumentKeydown(event: KeyboardEvent) {
  if (event.key !== 'Escape' || !selectedMarker.value) return
  event.preventDefault()
  event.stopPropagation()
  closeDetail()
}

function closeDetail() {
  selectedMarker.value = null
  detailPlacement.value = null
  controller?.selectMarker(null)
}

function renderMarkers() {
  closeDetail()
  if (!controller) return
  if (!selectedEntity.value) {
    controller.clearMarkers()
    controller.resetView()
    return
  }
  controller.setMarkers(markersForMap.value, {
    entityNameVi: selectedEntity.value.nameVi,
    entityNameEn: selectedEntity.value.nameEn,
    allowCandidateDragging: reviewMode,
    ...presentation.value,
    onMarkerClick: openMarkerDetail,
    onMarkerDrag,
  })
  controller.fitMarkers()
}

onMounted(() => {
  document.addEventListener('click', onDocumentClick)
  document.addEventListener('keydown', onDocumentKeydown, true)
  if (!mapContainer.value) return
  controller = useMapController(mapContainer.value, {
    mapConfig: zeroDamMapConfig,
    showDevelopmentControlPoints: showAlignmentControlPoints,
    onBasemapStatus: (status) => { basemapStatus.value = status },
  })
  removeMapClickListener = controller.onMapClick(closeDetail)
  if (reviewMode) removeCoordinateClickListener = controller.onMapCoordinateClick(onMapCoordinateClick)
  removeViewportListener = controller.onViewportChange(updateDetailPosition)
  resizeObserver = new ResizeObserver(() => {
    controller?.resize()
    updateDetailPosition()
  })
  resizeObserver.observe(mapContainer.value)
  renderMarkers()
})

watch([selectedEntity, () => props.focusRequest], renderMarkers, { flush: 'post' })
onUnmounted(() => {
  resizeObserver?.disconnect()
  removeMapClickListener?.()
  removeCoordinateClickListener?.()
  removeViewportListener?.()
  document.removeEventListener('click', onDocumentClick)
  document.removeEventListener('keydown', onDocumentKeydown, true)
  controller?.destroy()
})
</script>

<template>
  <section
    class="map-view"
    aria-label="Bản đồ Zero Dam / Zero Dam map"
  >
    <div
      ref="mapContainer"
      class="map-container"
    />
    <header class="map-heading">
      <span class="eyebrow">BẢN ĐỒ / MAP</span>
      <h1>ZERO DAM <span>MOCK</span></h1>
      <p
        v-if="showAlignmentControlPoints"
        class="alignment-legend"
      >
        + LANDMARK ALIGNMENT · DEV ONLY · NOT ITEM DATA
      </p>
    </header>
    <div
      class="map-status"
      role="status"
    >
      <span v-if="basemapStatus === 'loading'">Đang tải bản đồ / Loading map…</span>
      <span v-else-if="basemapStatus === 'error'">Không tải được bản đồ nền / Basemap unavailable</span>
      <span v-else-if="!selectedEntity">Tìm hoặc chọn một mục để hiện vị trí / Search or select an entity</span>
      <span v-else>{{ selectedEntity.nameVi }} / {{ selectedEntity.nameEn }} · {{ selectedMarkers.length }} vị trí / locations</span>
    </div>
    <div
      v-if="selectedEntity"
      class="map-actions"
    >
      <button
        type="button"
        @click="controller?.fitMarkers()"
      >
        Định vị / Focus
      </button>
      <button
        type="button"
        @click="selection.clear()"
      >
        Bỏ chọn / Clear
      </button>
    </div>
    <div
      v-if="selectedMarker && selectedEntity && detailPlacement"
      ref="detailAnchor"
      class="marker-detail-anchor"
      :class="[`rarity-${presentation.rarity ?? 'unspecified'}`, `placement-${detailPlacement.side}`]"
      :style="detailAnchorStyle"
      :data-placement="detailPlacement.side"
    >
      <MarkerDetail
        :entity="selectedEntity"
        :catalog-item="catalogItem"
        :marker="selectedMarker"
        :area-name="areaName"
        :category-name="categoryName"
        :map-name="mockDataset.map.nameVi"
        :marker-count="selectedMarkers.length"
        :presentation="presentation"
        @close="closeDetail"
      />
    </div>
    <aside
      v-if="reviewMode && reviewPanelVisible"
      class="dev-marker-review-panel"
      aria-label="Development marker review"
    >
      <div class="review-panel-heading">
        <h2>MARKER REVIEW · DEV ONLY</h2>
        <button
          type="button"
          @click="reviewPanelVisible = false"
        >
          Hide panel
        </button>
      </div>
      <section class="review-coordinate-inspector">
        <h3>Map click coordinates</h3>
        <template v-if="inspectedCoordinates && inspectedMapPoint">
          <dl>
            <dt>xNormalized</dt>
            <dd>{{ inspectedCoordinates.xNormalized.toFixed(6) }}</dd>
            <dt>yNormalized</dt>
            <dd>{{ inspectedCoordinates.yNormalized.toFixed(6) }}</dd>
            <dt>Project X / Y</dt>
            <dd>{{ inspectedMapPoint.x.toFixed(2) }} / {{ inspectedMapPoint.y.toFixed(2) }}</dd>
          </dl>
        </template>
        <p v-else>
          Click the map to inspect coordinates.
        </p>
        <button
          type="button"
          :disabled="!inspectedCoordinates"
          @click="copyInspectedCoordinates"
        >
          Copy coordinates
        </button>
      </section>
      <section class="review-keycard-poi-tools">
        <h3>Keycard-related POI audit</h3>
        <label for="keycard-poi-source-select">Source ID / name</label>
        <select
          id="keycard-poi-source-select"
          :value="keycardPoiSourceExternalId"
          @change="onKeycardPoiSourceChange"
        >
          <option value="">
            Select a keycard-related POI…
          </option>
          <option
            v-for="option in keycardPoiOptions"
            :key="option.marker.id"
            :value="option.provenance.sourceExternalId"
          >
            {{ option.provenance.sourceExternalId }} · {{ sourceFieldText(option.provenance.sourceRecordName) }} · {{ option.entity.nameVi }}
          </option>
        </select>
        <p>Focuses and highlights one map POI. This does not link it to an inventory Keycard item.</p>
      </section>
      <section class="review-calibration-tools">
        <h3>Calibration correspondences</h3>
        <label for="calibration-source-select">Source record</label>
        <select
          id="calibration-source-select"
          :value="calibrationSourceExternalId"
          @change="onCalibrationRecordChange"
        >
          <option value="">
            Select a source record…
          </option>
          <option
            v-for="record in calibrationRecords"
            :key="record.sourceExternalId"
            :value="record.sourceExternalId"
          >
            {{ record.calibrationRole.toUpperCase() }} · {{ record.approximateSourceRegion }} · {{ record.sourceExternalId }} · {{ record.name ?? record.locationId }}
          </option>
        </select>
        <template v-if="selectedCalibrationRecord && calibrationPosition">
          <dl>
            <dt>Source external ID</dt>
            <dd>{{ selectedCalibrationRecord.sourceExternalId }}</dd>
            <dt>Category</dt>
            <dd>{{ selectedCalibrationRecord.locationId }}</dd>
            <dt>Name</dt>
            <dd>{{ selectedCalibrationRecord.name ?? 'Not supplied' }}</dd>
            <dt>Description</dt>
            <dd>{{ selectedCalibrationRecord.description ?? 'Not supplied' }}</dd>
            <dt>Original source X / Y / Z</dt>
            <dd>{{ selectedCalibrationRecord.sourceX }} / {{ selectedCalibrationRecord.sourceY }} / {{ selectedCalibrationRecord.sourceZ ?? 'Not supplied' }}</dd>
            <dt>Approx. source region</dt>
            <dd>{{ selectedCalibrationRecord.approximateSourceRegion }} · {{ selectedCalibrationRecord.calibrationRole }} · {{ selectedCalibrationRecord.confidence }}</dd>
            <dt>Current normalized</dt>
            <dd>{{ calibrationPosition.xNormalized.toFixed(6) }} / {{ calibrationPosition.yNormalized.toFixed(6) }}</dd>
            <dt>Within local crop</dt>
            <dd>{{ calibrationWithinLocalCrop ? 'Yes' : 'No' }}</dd>
          </dl>
          <p v-if="calibrationWithinLocalCrop">
            Temporary pin starts at the deterministic crop conversion only. Drag to the exact local feature; source data stays unchanged.
          </p>
          <p v-else>
            Outside the local crop; no pin is rendered and coordinates are not clamped.
          </p>
          <div class="review-actions">
            <button
              type="button"
              @click="resetCalibrationRecordPosition"
            >
              Reset to source preview
            </button>
            <button
              type="button"
              :disabled="!calibrationWithinLocalCrop || !calibrationHasManualReview"
              @click="copyCalibrationCorrespondence"
            >
              Copy calibration correspondence
            </button>
            <button
              type="button"
              @click="selectCalibrationRecord('')"
            >
              Clear calibration point
            </button>
          </div>
        </template>
        <p v-else>
          Choose one of the selected records; hold-out records are reserved for later validation.
        </p>
      </section>
      <section
        v-if="selectedReviewCandidate && currentReviewCoordinates && reviewCoordinateDelta"
        class="review-marker-inspector"
      >
        <h3>Selected candidate</h3>
        <dl>
          <dt>Marker ID</dt>
          <dd>{{ selectedReviewCandidate.id }}</dd>
          <dt>Entity</dt>
          <dd>{{ selectedEntity?.nameVi }} / {{ selectedEntity?.nameEn }}</dd>
          <dt>Source external ID</dt>
          <dd>{{ selectedReviewCandidate.provenance?.sourceExternalId ?? 'Unknown' }}</dd>
          <dt>Source category</dt>
          <dd>{{ selectedReviewCandidate.provenance?.sourceKey ?? 'Unknown' }}</dd>
          <dt>Original source name</dt>
          <dd>{{ sourceFieldText(selectedReviewCandidate.provenance?.sourceRecordName) }}</dd>
          <dt>Original source description</dt>
          <dd>{{ sourceFieldText(selectedReviewCandidate.provenance?.sourceDescription) }}</dd>
          <dt>Source validated claim</dt>
          <dd>{{ sourceValidationClaimText(selectedReviewCandidate.provenance?.sourceClaims.validated) }}</dd>
          <dt>Original source X / Y / Z</dt>
          <dd>{{ selectedReviewCandidate.provenance?.sourceX ?? 'Unknown' }} / {{ selectedReviewCandidate.provenance?.sourceY ?? 'Unknown' }} / {{ selectedReviewCandidate.provenance?.sourceZ ?? 'Unknown' }}</dd>
          <dt>Original normalized</dt>
          <dd>{{ selectedReviewCandidate.xNormalized.toFixed(6) }} / {{ selectedReviewCandidate.yNormalized.toFixed(6) }}</dd>
          <template v-if="selectedReviewCandidate.provenance?.sourceKey === 'key_card'">
            <dt>Source floor code (z)</dt>
            <dd>{{ selectedReviewCandidate.provenance.sourceZ ?? 'Not supplied' }}</dd>
            <dt>Named floor interpretation</dt>
            <dd>{{ keycardPoiFloorInterpretation }}</dd>
            <dt>Rarity / color evidence</dt>
            <dd>Unknown; not present in this marker record or assigned to the POI.</dd>
            <dt>Visible in local crop</dt>
            <dd>{{ selectedReviewCandidate.withinLocalCrop ? 'Yes' : 'No' }}</dd>
          </template>
          <dt>Original project X / Y</dt>
          <dd>{{ originalSourceMapPoint?.x.toFixed(2) }} / {{ originalSourceMapPoint?.y.toFixed(2) }}</dd>
          <dt>Current normalized</dt>
          <dd>{{ currentReviewCoordinates.xNormalized.toFixed(6) }} / {{ currentReviewCoordinates.yNormalized.toFixed(6) }}</dd>
          <dt>Current project X / Y</dt>
          <dd>{{ currentReviewMapPoint?.x.toFixed(2) }} / {{ currentReviewMapPoint?.y.toFixed(2) }}</dd>
          <dt>Coordinate delta</dt>
          <dd>{{ reviewCoordinateDelta.xNormalized.toFixed(6) }} / {{ reviewCoordinateDelta.yNormalized.toFixed(6) }}</dd>
          <dt>Verification status</dt>
          <dd>{{ selectedReviewCandidate.verificationStatus }}</dd>
        </dl>
        <div class="review-actions">
          <button
            type="button"
            @click="resetSelectedMarkerToSource"
          >
            Reset to Source
          </button>
          <button
            type="button"
            @click="copySelectedMarkerPatch"
          >
            Copy JSON Patch
          </button>
          <button
            v-if="selectedReviewCandidate.provenance?.sourceKey === 'key_card'"
            type="button"
            @click="copySelectedKeycardPoiDetails"
          >
            Copy source ID / coordinates
          </button>
        </div>
      </section>
      <p
        v-else
        class="review-instructions"
      >
        Select a candidate marker to inspect and drag it. Review edits remain in memory only.
      </p>
      <output
        v-if="reviewCopyStatus"
        role="status"
      >
        {{ reviewCopyStatus }}
      </output>
    </aside>
    <button
      v-if="reviewMode && !reviewPanelVisible"
      type="button"
      class="dev-marker-review-toggle"
      @click="reviewPanelVisible = true"
    >
      Show review tools
    </button>
    <p class="map-disclaimer">
      BẢN ĐỒ TILE LOCAL · MARKERS CHƯA XÁC MINH · Mock fixtures and source candidates · Not gameplay guidance
    </p>
  </section>
</template>

<style scoped>
.map-view { position: relative; height: 100%; min-width: 0; overflow: hidden; background: #101a1d; }
.map-container { position: absolute; inset: 0; height: 100%; width: 100%; }
.marker-detail-anchor { position: absolute; z-index: 500; max-height: calc(100% - 24px); }
.marker-detail-anchor::after { content: ''; position: absolute; left: var(--arrow-x, 50%); width: 0; height: 0; border-style: solid; transform: translateX(-50%); filter: drop-shadow(0 2px 1px #0007); pointer-events: none; }
.marker-detail-anchor.placement-above::after { top: 100%; border-width: 8px 8px 0; border-color: var(--rarity-tone) transparent transparent; }
.marker-detail-anchor.placement-below::after { bottom: 100%; border-width: 0 8px 8px; border-color: transparent transparent var(--rarity-tone); }
.map-heading { position: absolute; z-index: 450; top: 20px; left: 64px; pointer-events: none; text-shadow: 0 2px 5px #000; }
h1 { font-size: 19px; letter-spacing: 0.12em; margin: 4px 0; }
h1 span { color: var(--accent); font-size: 10px; vertical-align: middle; border: 1px solid var(--line); padding: 3px 5px; }
.alignment-legend { margin: 5px 0 0; padding: 3px 5px; width: max-content; color: #ffe08a; background: #111a20d9; border-left: 1px solid #ffe08a; font-size: 9px; letter-spacing: 0.06em; }
.map-status { position: absolute; z-index: 450; bottom: 54px; left: 18px; max-width: calc(100% - 88px); padding: 8px 12px; background: #0e171bea; border-left: 2px solid var(--accent); font-size: 12px; pointer-events: none; }
.map-actions { position: absolute; z-index: 450; top: 20px; right: 18px; display: flex; gap: 6px; }
.map-actions button { padding: 8px 10px; font-size: 11px; background: var(--panel); border: 1px solid var(--line); }
.map-disclaimer { position: absolute; z-index: 450; bottom: 0; left: 0; max-width: calc(100% - 76px); margin: 0; padding: 8px 18px; color: var(--muted); background: #0e171bdd; font-size: 9px; pointer-events: none; }
.dev-marker-review-panel { position: absolute; z-index: 650; top: 112px; left: 18px; width: min(340px, calc(100% - 36px)); max-height: calc(100% - 170px); overflow-y: auto; padding: 14px; color: var(--text); background: #101b1ff2; border: 1px solid var(--accent); box-shadow: 0 8px 28px #0009; }
.review-panel-heading { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.review-panel-heading h2 { margin: 0; color: var(--accent); font-size: 11px; letter-spacing: 0.08em; }
.review-panel-heading button { flex-shrink: 0; }
.dev-marker-review-toggle { position: absolute; z-index: 650; top: 112px; right: 18px; padding: 7px 9px; color: var(--text); background: #101b1ff2; border: 1px solid var(--accent); font-size: 10px; }
.dev-marker-review-panel h3 { margin: 9px 0 6px; font-size: 11px; }
.dev-marker-review-panel p { margin: 6px 0; color: var(--muted); font-size: 11px; }
.dev-marker-review-panel dl { display: grid; grid-template-columns: minmax(110px, 0.8fr) minmax(0, 1.2fr); gap: 3px 8px; margin: 6px 0 10px; overflow-wrap: anywhere; }
.dev-marker-review-panel dt { color: var(--muted); font-size: 10px; }
.dev-marker-review-panel dd { margin: 0; font-size: 10px; font-variant-numeric: tabular-nums; }
.dev-marker-review-panel button { margin: 3px 4px 0 0; padding: 6px 8px; color: var(--text); background: #152226; border: 1px solid var(--line); font-size: 10px; }
.dev-marker-review-panel select { display: block; width: 100%; margin: 4px 0 8px; padding: 6px; color: var(--text); background: #152226; border: 1px solid var(--line); font-size: 10px; }
.dev-marker-review-panel button:disabled { opacity: 0.5; }
.dev-marker-review-panel output { display: block; margin-top: 7px; color: var(--accent); font-size: 10px; }
@media (max-width: 900px) {
  .map-actions { top: 78px; }
}
</style>
