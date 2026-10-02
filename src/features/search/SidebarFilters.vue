<script setup lang="ts">
import { mockDataset } from '@/data/mockDataset'
import type { SearchSelection } from '@/composables/useSearchSelection'
import ItemIcon from '@/components/ItemIcon.vue'
import { getItemPresentation } from '@/lib/item-presentation'

defineProps<{ selection: SearchSelection }>()
defineEmits<{ selected: [] }>()
const categories = mockDataset.categories.filter((category) => category.parentId)
</script>

<template>
  <div class="sidebar-filters">
    <div class="filter-section">
      <label for="map-select">Bản đồ <span>/ Map</span></label>
      <select id="map-select">
        <option :value="mockDataset.map.id">
          {{ mockDataset.map.nameEn }} · Mock
        </option>
      </select>
      <label for="difficulty-select">Độ khó <span>/ Difficulty</span></label>
      <select
        id="difficulty-select"
        disabled
        aria-describedby="difficulty-note"
      >
        <option>Chưa có dữ liệu / Unavailable</option>
      </select>
      <p
        id="difficulty-note"
        class="muted"
      >
        Chưa áp dụng bộ lọc độ khó / No difficulty filter
      </p>
    </div>
    <section
      class="filter-section"
      aria-labelledby="category-title"
    >
      <h2 id="category-title">
        Danh mục <span>/ Categories</span>
      </h2>
      <div
        v-for="category in categories"
        :key="category.id"
      >
        <button
          v-for="entity in mockDataset.entities.filter((entry) => entry.categoryId === category.id)"
          :key="entity.id"
          type="button"
          class="category-button"
          :aria-pressed="selection.selectedEntityId === entity.id"
          @click="selection.selectEntity(entity.id); $emit('selected')"
        >
          <ItemIcon
            v-bind="getItemPresentation(entity)"
            :size="30"
            :selected="selection.selectedEntityId === entity.id"
          />
          <span>{{ category.nameVi }}<small>{{ category.nameEn }}</small></span>
          <span class="category-count">{{ mockDataset.markers.filter((marker) => marker.entityId === entity.id).length }}</span>
        </button>
      </div>
    </section>
  </div>
</template>

<style scoped>
.filter-section { padding: 14px 0; border-bottom: 1px solid var(--line); }
label, h2 { display: block; font-size: 11px; font-weight: 600; margin: 0 0 8px; }
label span, h2 span { color: var(--muted); font-weight: 400; }
select { width: 100%; background: #101c20; border: 1px solid var(--line); padding: 8px; color: var(--text); font: inherit; margin-bottom: 12px; }
select:disabled { color: var(--muted); cursor: not-allowed; }
.muted { margin: 0; font-size: 10px; }
.category-button { display: flex; align-items: center; gap: 10px; width: 100%; text-align: left; padding: 6px 8px; border: 0; border-left: 2px solid transparent; background: transparent; }
.category-button:hover { background: #ffffff08; }
.category-button[aria-pressed='true'] { border-left-color: var(--accent); background: #66c8ab10; }
.category-button small { display: block; color: var(--muted); font-size: 10px; margin-top: 2px; }
.category-count { margin-left: auto; color: var(--muted); font-variant-numeric: tabular-nums; }
</style>
