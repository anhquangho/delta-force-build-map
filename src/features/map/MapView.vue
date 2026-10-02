<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { mockDataset } from '@/data/mockDataset'
import { useMapController } from '@/composables/useMapController'
import type { SearchSelection } from '@/composables/useSearchSelection'
import type { MapMarker } from '@/types/domain'
import { getItemPresentation } from '@/lib/item-presentation'
import MarkerDetail from './MarkerDetail.vue'

const props = defineProps<{ selection: SearchSelection; focusRequest?: number }>()
const mapContainer = ref<HTMLElement | null>(null)
const basemapStatus = ref<'loading' | 'ready' | 'error'>('loading')
let controller: ReturnType<typeof useMapController> | null = null
let resizeObserver: ResizeObserver | undefined

const selectedEntity = computed(() =>
  mockDataset.entities.find((entity) => entity.id === props.selection.selectedEntityId),
)
const selectedMarkers = computed(() =>
  mockDataset.markers.filter((marker) => marker.entityId === selectedEntity.value?.id),
)
const presentation = computed(() => getItemPresentation(selectedEntity.value))
const selectedMarker = ref<MapMarker | null>(null)
const areaName = computed(() => {
  const area = mockDataset.areas.find((area) => area.id === selectedMarker.value?.areaId)
  return area ? `${area.nameVi} / ${area.nameEn}` : 'Chưa rõ / Unknown'
})
const categoryName = computed(() => {
  const category = mockDataset.categories.find((category) => category.id === selectedEntity.value?.categoryId)
  return category ? `${category.nameVi} / ${category.nameEn}` : 'Chưa rõ / Unknown'
})

function closeDetail() {
  selectedMarker.value = null
  controller?.selectMarker(null)
}

function renderMarkers() {
  closeDetail()
  if (!controller) return
  if (!selectedEntity.value) {
    controller.clearMarkers()
    return
  }
  controller.setMarkers(selectedMarkers.value, {
    entityNameVi: selectedEntity.value.nameVi,
    entityNameEn: selectedEntity.value.nameEn,
    ...presentation.value,
    onMarkerClick: (marker) => { selectedMarker.value = marker },
  })
  controller.fitMarkers()
}

onMounted(() => {
  if (!mapContainer.value) return
  controller = useMapController(mapContainer.value, {
    basemapUrl: `${import.meta.env.BASE_URL}zero-dam-basemap.svg`,
    width: mockDataset.mapVersion.width,
    height: mockDataset.mapVersion.height,
    onBasemapStatus: (status) => { basemapStatus.value = status },
  })
  resizeObserver = new ResizeObserver(() => controller?.resize())
  resizeObserver.observe(mapContainer.value)
  renderMarkers()
})

watch([selectedEntity, () => props.focusRequest], renderMarkers, { flush: 'post' })
onUnmounted(() => {
  resizeObserver?.disconnect()
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
    <MarkerDetail
      v-if="selectedMarker && selectedEntity"
      :entity="selectedEntity"
      :marker="selectedMarker"
      :area-name="areaName"
      :category-name="categoryName"
      :map-name="mockDataset.map.nameVi"
      :marker-count="selectedMarkers.length"
      :presentation="presentation"
      @close="closeDetail"
    />
    <p class="map-disclaimer">
      SƠ ĐỒ GIẢ LẬP / LOCAL PLACEHOLDER · Không dùng để định vị trong game / Not gameplay guidance
    </p>
  </section>
</template>

<style scoped>
.map-view { position: relative; height: 100%; min-width: 0; overflow: hidden; background: #101a1d; }
.map-container { position: absolute; inset: 0; height: 100%; width: 100%; }
.map-heading { position: absolute; z-index: 450; top: 20px; left: 64px; pointer-events: none; text-shadow: 0 2px 5px #000; }
h1 { font-size: 19px; letter-spacing: 0.12em; margin: 4px 0; }
h1 span { color: var(--accent); font-size: 10px; vertical-align: middle; border: 1px solid var(--line); padding: 3px 5px; }
.map-status { position: absolute; z-index: 450; bottom: 54px; left: 18px; max-width: calc(100% - 88px); padding: 8px 12px; background: #0e171bea; border-left: 2px solid var(--accent); font-size: 12px; pointer-events: none; }
.map-actions { position: absolute; z-index: 450; top: 20px; right: 18px; display: flex; gap: 6px; }
.map-actions button { padding: 8px 10px; font-size: 11px; background: var(--panel); border: 1px solid var(--line); }
.map-disclaimer { position: absolute; z-index: 450; bottom: 0; left: 0; max-width: calc(100% - 76px); margin: 0; padding: 8px 18px; color: var(--muted); background: #0e171bdd; font-size: 9px; pointer-events: none; }
@media (max-width: 900px) {
  .map-actions { top: 78px; }
}
</style>
