<script setup lang="ts">
import { computed } from 'vue'
import ItemIcon from '@/components/ItemIcon.vue'
import type { MapEntity, MapMarker } from '@/types/domain'
import type { ItemCatalogRecord } from '@/types/item-catalog'
import { itemRarityLabels, type ItemPresentation } from '@/lib/item-presentation'

const props = defineProps<{
  entity: MapEntity
  catalogItem?: ItemCatalogRecord
  marker: MapMarker
  areaName: string
  categoryName: string
  mapName: string
  markerCount: number
  presentation: ItemPresentation
}>()
defineEmits<{ close: [] }>()

const nameVi = computed(() => props.catalogItem?.nameVi ?? props.entity.nameVi)
const nameEn = computed(() => props.catalogItem?.nameEn ?? props.entity.nameEn)
const description = computed(() => props.catalogItem?.descriptionVi ?? props.catalogItem?.descriptionEn ?? props.entity.descriptionVi ?? props.entity.descriptionEn)
const rarityLabel = computed(() => props.presentation.rarity ? itemRarityLabels[props.presentation.rarity] : undefined)
const detailRows = computed(() => [
  { label: 'Khu vực / Area', value: props.areaName },
  { label: 'Tầng / Floor', value: props.marker.floorKey ?? 'Chưa rõ / Unknown' },
  { label: 'Bản đồ / Map', value: props.mapName },
  { label: 'Loại / Category', value: props.categoryName },
  ...(props.catalogItem?.weightKg != null ? [{ label: 'Khối lượng / Weight', value: `${props.catalogItem.weightKg} kg` }] : []),
])
</script>

<template>
  <article
    class="marker-detail"
    :class="`rarity-${presentation.rarity ?? 'unspecified'}`"
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
        <h2>{{ nameVi }}</h2>
        <p lang="en">
          {{ nameEn }}
        </p>
        <span
          v-if="rarityLabel && presentation.rarity"
          class="rarity-badge"
          :class="`rarity-${presentation.rarity}`"
          :data-rarity="presentation.rarity"
        >
          {{ rarityLabel }}
        </span>
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
  position: relative;
  width: 100%;
  max-height: var(--detail-max-height, calc(100vh - 24px));
  overflow-y: auto;
  background: linear-gradient(145deg, color-mix(in srgb, var(--panel) 88%, var(--rarity-surface) 12%), var(--panel));
  border: 1px solid color-mix(in srgb, var(--rarity-edge) 70%, var(--line));
  border-top: 2px solid var(--rarity-tone);
  box-shadow: 0 12px 36px #0008;
  padding: 16px;
}
.detail-heading { display: flex; align-items: center; gap: 12px; }
.detail-title { min-width: 0; }
.detail-heading h2 { margin: 3px 0; font-size: 18px; overflow-wrap: anywhere; }
.detail-heading p { margin: 0; color: var(--muted); }
.rarity-badge { display: inline-flex; margin-top: 5px; padding: 2px 6px; color: var(--rarity-tone); background: color-mix(in srgb, var(--rarity-tone) 9%, #0a1116); border: 1px solid color-mix(in srgb, var(--rarity-edge) 72%, transparent); font-size: 10px; line-height: 1.3; }
.detail-close { align-self: flex-start; margin-left: auto; }
.detail-description { margin: 14px 0 0; color: var(--muted); }
dl { margin: 16px 0; }
dl > div { display: grid; grid-template-columns: 110px 1fr; gap: 12px; padding: 8px 0; border-top: 1px solid #223136; }
dt { color: var(--muted); font-size: 11px; }
dd { margin: 0; overflow-wrap: anywhere; }
footer { border-top: 1px solid var(--line); padding-top: 12px; font-size: 11px; }
footer span { display: block; color: var(--muted); margin-top: 5px; }
</style>
