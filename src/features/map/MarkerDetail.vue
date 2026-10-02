<script setup lang="ts">
import { computed } from 'vue'
import ItemIcon from '@/components/ItemIcon.vue'
import type { MapEntity, MapMarker } from '@/types/domain'
import type { ItemPresentation } from '@/lib/item-presentation'

const props = defineProps<{
  entity: MapEntity
  marker: MapMarker
  areaName: string
  categoryName: string
  mapName: string
  markerCount: number
  presentation: ItemPresentation
}>()
defineEmits<{ close: [] }>()

const description = computed(() => props.entity.descriptionVi ?? props.entity.descriptionEn)
const detailRows = computed(() => [
  { label: 'Khu vực / Area', value: props.areaName },
  { label: 'Tầng / Floor', value: props.marker.floorKey ?? 'Chưa rõ / Unknown' },
  { label: 'Bản đồ / Map', value: props.mapName },
  { label: 'Loại / Category', value: props.categoryName },
])
</script>

<template>
  <article
    class="marker-detail"
    aria-label="Chi tiết vị trí / Marker detail"
    aria-live="polite"
  >
    <div class="detail-heading">
      <ItemIcon
        v-bind="presentation"
        :size="52"
        selected
      />
      <div class="detail-title">
        <span class="eyebrow">VỊ TRÍ / LOCATION</span>
        <h2>{{ entity.nameVi }}</h2>
        <p lang="en">
          {{ entity.nameEn }}
        </p>
      </div>
      <button
        type="button"
        class="icon-button detail-close"
        aria-label="Đóng chi tiết / Close detail"
        @click="$emit('close')"
      >
        ×
      </button>
    </div>
    <p
      v-if="description"
      class="detail-description"
    >
      {{ description }}
    </p>
    <dl>
      <div
        v-for="row in detailRows"
        :key="row.label"
      >
        <dt>{{ row.label }}</dt>
        <dd>{{ row.value }}</dd>
      </div>
    </dl>
    <footer>
      {{ markerCount }} vị trí / locations
      <span>Dữ liệu giả lập / Unverified mock data</span>
    </footer>
  </article>
</template>

<style scoped>
.marker-detail {
  position: absolute;
  z-index: 500;
  top: 78px;
  right: 18px;
  width: min(320px, calc(100% - 36px));
  background: var(--panel);
  border: 1px solid var(--line);
  border-top: 2px solid var(--accent);
  box-shadow: 0 12px 36px #0008;
  padding: 16px;
}
.detail-heading { display: flex; align-items: center; gap: 12px; }
.detail-title { min-width: 0; }
.detail-heading h2 { margin: 3px 0; font-size: 18px; overflow-wrap: anywhere; }
.detail-heading p { margin: 0; color: var(--muted); }
.detail-close { align-self: flex-start; margin-left: auto; }
.detail-description { margin: 14px 0 0; color: var(--muted); }
dl { margin: 16px 0; }
dl > div { display: grid; grid-template-columns: 110px 1fr; gap: 12px; padding: 8px 0; border-top: 1px solid #223136; }
dt { color: var(--muted); font-size: 11px; }
dd { margin: 0; overflow-wrap: anywhere; }
footer { border-top: 1px solid var(--line); padding-top: 12px; font-size: 11px; }
footer span { display: block; color: var(--muted); margin-top: 5px; }
@media (min-width: 701px) and (max-width: 900px) {
  .marker-detail { top: 120px; }
}
@media (max-width: 700px) {
  .marker-detail { top: auto; bottom: 42px; right: 12px; }
}
</style>
