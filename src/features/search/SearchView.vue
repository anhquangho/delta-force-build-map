<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import { mockDataset } from '@/data/mockDataset'
import { searchEntities, type SearchResult } from '@/lib/search-ranking'
import type { SearchSelection } from '@/composables/useSearchSelection'
import ItemIcon from '@/components/ItemIcon.vue'
import { getItemPresentation } from '@/lib/item-presentation'

const props = defineProps<{ selection: SearchSelection }>()
const emit = defineEmits<{ selected: [] }>()
const query = ref('')
const results = computed<SearchResult[]>(() => searchEntities(mockDataset, query.value))
const searchField = ref<HTMLElement | null>(null)
const list = ref<HTMLElement | null>(null)
const open = ref(false)
const activeIndex = ref(-1)
const dropdownVisible = computed(() => open.value && query.value.trim().length > 0)
const activeId = computed(() => dropdownVisible.value && results.value[activeIndex.value]
  ? `search-option-${results.value[activeIndex.value].entity.id}` : undefined)

function openDropdown() {
  open.value = true
  activeIndex.value = -1
}

function selectResult(result: SearchResult) {
  props.selection.selectEntity(result.entity.id)
  open.value = false
  activeIndex.value = -1
  emit('selected')
}

function onFocusOut(event: FocusEvent) {
  if (!(event.relatedTarget instanceof Node) || !searchField.value?.contains(event.relatedTarget)) {
    open.value = false
  }
}

async function onKeydown(event: KeyboardEvent) {
  if (event.isComposing) return
  if (event.key === 'Escape' && dropdownVisible.value) {
    event.preventDefault()
    event.stopPropagation()
    open.value = false
  } else if ((event.key === 'ArrowDown' || event.key === 'ArrowUp') && results.value.length) {
    event.preventDefault()
    const last = results.value.length - 1
    activeIndex.value = !dropdownVisible.value || activeIndex.value < 0
      ? (event.key === 'ArrowDown' ? 0 : last)
      : (activeIndex.value + (event.key === 'ArrowDown' ? 1 : last)) % results.value.length
    open.value = true
    await nextTick()
    list.value?.querySelector<HTMLElement>('[aria-selected="true"]')?.scrollIntoView?.({ block: 'nearest' })
  } else if (event.key === 'Enter' && dropdownVisible.value && activeIndex.value >= 0) {
    event.preventDefault()
    selectResult(results.value[activeIndex.value])
  }
}
</script>

<template>
  <section class="search-view">
    <label
      for="search-input"
      class="search-label"
    >Tìm kiếm <span>/ Search</span></label>
    <div
      ref="searchField"
      class="search-field"
      @focusout="onFocusOut"
    >
      <input
        id="search-input"
        v-model="query"
        type="search"
        role="combobox"
        class="search-input"
        placeholder="máy chủ, server, sv…"
        autocomplete="off"
        spellcheck="false"
        aria-autocomplete="list"
        :aria-controls="dropdownVisible ? 'search-results' : undefined"
        :aria-expanded="dropdownVisible"
        :aria-activedescendant="activeId"
        @input="openDropdown"
        @focus="openDropdown"
        @click="openDropdown"
        @keydown="onKeydown"
      >
      <div
        v-if="dropdownVisible"
        class="search-dropdown"
      >
        <p
          class="search-state"
          :class="{ 'sr-only': results.length }"
          role="status"
        >
          <template v-if="!results.length">
            Không tìm thấy / No results for "{{ query }}"
          </template>
          <template v-else>
            {{ results.length }} kết quả / results · Zero Dam
          </template>
        </p>
        <ul
          id="search-results"
          ref="list"
          class="results"
          role="listbox"
          aria-label="Kết quả tìm kiếm / Search results"
        >
          <li
            v-for="(result, index) in results"
            :key="result.entity.id"
            role="presentation"
          >
            <button
              :id="`search-option-${result.entity.id}`"
              type="button"
              role="option"
              tabindex="-1"
              class="result"
              :aria-selected="activeIndex === index"
              :data-selected="selection.selectedEntityId === result.entity.id"
              @mousedown.prevent
              @click="selectResult(result)"
            >
              <ItemIcon
                v-bind="getItemPresentation(result.entity)"
                :selected="selection.selectedEntityId === result.entity.id"
              />
              <span class="result-copy">
                <strong>{{ result.entity.nameVi }}</strong>
                <span class="result-english">{{ result.entity.nameEn }}</span>
              </span>
              <span class="result-count">{{ result.markerCount }}<small>vị trí<br>locations</small></span>
            </button>
          </li>
        </ul>
      </div>
    </div>
    <p
      v-if="!query.trim()"
      class="search-state"
    >
      Nhập tên đồ vật hoặc địa điểm / Enter an item or location
    </p>
    <slot />
  </section>
</template>

<style scoped>
.search-view { padding: 0 16px 16px; }
.search-label { display: block; margin: 0 0 8px; font-size: 11px; font-weight: 600; }
.search-label span { color: var(--muted); font-weight: 400; }
.search-field { position: relative; }
.search-input { width: 100%; padding: 10px; color: var(--text); background: #0d171a; border: 1px solid #3a5156; border-radius: 0; font: inherit; }
.search-input::placeholder { color: #8b9e9e; }
.search-dropdown { position: absolute; z-index: 20; top: calc(100% - 1px); left: 0; right: 0; background: #101b1f; border: 1px solid #3a5156; box-shadow: 0 8px 16px #0006; }
.search-state { font-size: 11px; color: var(--muted); line-height: 1.6; margin: 10px 0; overflow-wrap: anywhere; }
.search-dropdown .search-state { margin: 0; padding: 10px; }
.sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); }
.results { list-style: none; margin: 0; padding: 0; max-height: min(320px, 40vh); overflow-y: auto; overscroll-behavior: contain; }
.result { display: flex; align-items: center; gap: 10px; width: 100%; padding: 10px 6px; border: 0; border-bottom: 1px solid var(--line); border-left: 2px solid transparent; background: transparent; text-align: left; }
.result:hover, .result[aria-selected='true'] { background: #ffffff10; }
.result[data-selected='true'] { border-left-color: var(--accent); }
.result-copy { display: grid; gap: 3px; min-width: 0; }
.result-copy strong { font-size: 13px; }
.result-english { color: var(--muted); font-size: 10px; }
.result-count { margin-left: auto; color: var(--accent); font-size: 18px; text-align: right; }
.result-count small { display: block; font-size: 9px; color: var(--muted); }
</style>
