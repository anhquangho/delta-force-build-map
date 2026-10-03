<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import type { CSSProperties } from 'vue'
import { mockDataset } from '@/data/mockDataset'
import { zeroDamMapConfig } from '@/data/zeroDamMap'
import { useMapController } from '@/composables/useMapController'
import type { SearchSelection } from '@/composables/useSearchSelection'
import type { MapMarker } from '@/types/domain'
import { getCatalogItem, getItemPresentation } from '@/lib/item-presentation'
import { placeMarkerDetail, type MarkerDetailPlacement } from '@/lib/marker-detail-placement'
import MarkerDetail from './MarkerDetail.vue'

const props = defineProps<{ selection: SearchSelection; focusRequest?: number }>()
const mapContainer = ref<HTMLElement | null>(null)
const detailAnchor = ref<HTMLElement | null>(null)
const detailPlacement = ref<MarkerDetailPlacement | null>(null)
const showAlignmentControlPoints = import.meta.env.DEV
const basemapStatus = ref<'loading' | 'ready' | 'error'>('loading')
let controller: ReturnType<typeof useMapController> | null = null
let resizeObserver: ResizeObserver | undefined
let removeMapClickListener: (() => void) | undefined
let removeViewportListener: (() => void) | undefined

const selectedEntity = computed(() =>
  mockDataset.entities.find((entity) => entity.id === props.selection.selectedEntityId),
)
const selectedMarkers = computed(() =>
  mockDataset.markers.filter((marker) => marker.entityId === selectedEntity.value?.id),
)
const catalogItem = computed(() => getCatalogItem(selectedEntity.value))
const presentation = computed(() => getItemPresentation(catalogItem.value))
const selectedMarker = ref<MapMarker | null>(null)
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
  updateDetailPosition()
  void nextTick(updateDetailPosition)
}

function onDocumentClick(event: MouseEvent) {
  if (!selectedMarker.value || !(event.target instanceof Element)) return
  if (detailAnchor.value?.contains(event.target) || event.target.closest('.item-map-marker')) return
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
  controller.setMarkers(selectedMarkers.value, {
    entityNameVi: selectedEntity.value.nameVi,
    entityNameEn: selectedEntity.value.nameEn,
    ...presentation.value,
    onMarkerClick: openMarkerDetail,
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
    <p class="map-disclaimer">
      BẢN ĐỒ TILE LOCAL · MARKER MOCK/CHƯA XÁC MINH · Not gameplay guidance
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
@media (max-width: 900px) {
  .map-actions { top: 78px; }
}
</style>
