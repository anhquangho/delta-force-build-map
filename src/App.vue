<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, ref } from 'vue'
import { createSearchSelection } from '@/composables/useSearchSelection'
import SearchView from './features/search/SearchView.vue'
import SidebarFilters from './features/search/SidebarFilters.vue'
import MapView from './features/map/MapView.vue'

const selection = createSearchSelection()
const sidebarOpen = ref(true)
const narrow = ref(false)
const focusRequest = ref(0)
const sidebar = ref<HTMLElement | null>(null)
const toggle = ref<HTMLButtonElement | null>(null)
let media: MediaQueryList | undefined

function updateViewport() {
  narrow.value = media?.matches ?? false
  sidebarOpen.value = !narrow.value
}

async function setSidebar(open: boolean) {
  sidebarOpen.value = open
  await nextTick()
  if (open) sidebar.value?.querySelector('input')?.focus()
  else toggle.value?.focus()
}

function onSelected() {
  focusRequest.value++
  if (narrow.value) void setSidebar(false)
}

onMounted(() => {
  media = window.matchMedia('(max-width: 700px)')
  updateViewport()
  media.addEventListener('change', updateViewport)
})
onUnmounted(() => media?.removeEventListener('change', updateViewport))
</script>

<template>
  <main
    class="app-shell"
    :class="{ 'sidebar-collapsed': !sidebarOpen }"
    @keydown.esc="setSidebar(false)"
  >
    <aside
      id="map-sidebar"
      ref="sidebar"
      :aria-hidden="!sidebarOpen"
      :inert="!sidebarOpen ? true : undefined"
      class="sidebar"
      aria-label="Tìm kiếm và bộ lọc / Search and filters"
    >
      <header class="sidebar-brand">
        <span
          class="brand-mark"
          aria-hidden="true"
        >DF</span>
        <div>
          <strong>DELTA FORCE</strong>
          <span>BUILD MAP <small>VI / EN</small></span>
        </div>
      </header>
      <div class="sidebar-body">
        <SearchView
          :selection="selection"
          @selected="onSelected"
        >
          <SidebarFilters
            :selection="selection"
            @selected="onSelected"
          />
        </SearchView>
      </div>
      <footer class="sidebar-footer">
        <span class="status-dot" /> BẢN THỬ / LOCAL PROTOTYPE
        <p>Dữ liệu giả lập, chưa xác minh.<br>Community project · Not official.</p>
      </footer>
    </aside>
    <button
      v-if="sidebarOpen"
      type="button"
      class="sidebar-backdrop"
      aria-label="Đóng menu / Close sidebar"
      tabindex="-1"
      @click="setSidebar(false)"
    />
    <button
      ref="toggle"
      type="button"
      class="icon-button sidebar-toggle"
      :aria-expanded="sidebarOpen"
      aria-controls="map-sidebar"
      :aria-label="sidebarOpen ? 'Thu gọn / Collapse sidebar' : 'Mở menu / Open sidebar'"
      @click="setSidebar(!sidebarOpen)"
    >
      <span aria-hidden="true">{{ sidebarOpen ? '←' : '☰' }}</span>
    </button>
    <div
      class="map-workspace"
      :inert="narrow && sidebarOpen ? true : undefined"
    >
      <MapView
        :selection="selection"
        :focus-request="focusRequest"
      />
    </div>
  </main>
</template>

<style scoped>
.app-shell { --sidebar-width: 310px; position: relative; display: grid; grid-template-columns: var(--sidebar-width) minmax(0, 1fr); width: 100%; height: 100vh; height: 100dvh; overflow: hidden; transition: grid-template-columns 200ms ease-out; }
.app-shell.sidebar-collapsed { grid-template-columns: 0px minmax(0, 1fr); }
.sidebar { z-index: 700; display: flex; flex-direction: column; width: var(--sidebar-width); min-height: 0; background: var(--panel); border-right: 1px solid var(--line); transition: transform 200ms ease-out; }
.sidebar-collapsed .sidebar { transform: translateX(-100%); }
.sidebar-brand { display: flex; align-items: center; gap: 10px; padding: 20px 16px; }
.brand-mark { display: grid; place-items: center; width: 34px; height: 34px; color: var(--accent); border: 1px solid var(--accent); font-weight: 800; font-size: 13px; }
.sidebar-brand strong { display: block; font-size: 13px; letter-spacing: 0.12em; }
.sidebar-brand div > span { display: block; margin-top: 3px; font-size: 10px; letter-spacing: 0.1em; color: var(--muted); }
.sidebar-brand small { color: var(--accent); margin-left: 10px; font-size: 9px; }
.sidebar-body { flex: 1; overflow-y: auto; min-height: 0; }
.sidebar-footer { padding: 14px 16px; border-top: 1px solid var(--line); font-size: 9px; letter-spacing: 0.04em; color: var(--accent); }
.sidebar-footer p { color: var(--muted); line-height: 1.6; margin: 7px 0 0; letter-spacing: normal; }
.status-dot { display: inline-block; width: 5px; height: 5px; background: var(--accent); margin-right: 5px; }
.map-workspace { min-width: 0; min-height: 0; position: relative; }
.sidebar-toggle { position: absolute; left: calc(var(--sidebar-width) + 16px); top: 23px; z-index: 850; background: var(--panel); transition: left 200ms ease-out; }
.sidebar-collapsed .sidebar-toggle { left: 16px; }
.sidebar-backdrop { display: none; }
@media (max-width: 700px) {
  .app-shell, .app-shell.sidebar-collapsed { --sidebar-width: min(310px, calc(100vw - 48px)); grid-template-columns: 0px minmax(0, 1fr); }
  .sidebar { position: absolute; inset: 0 auto 0 0; z-index: 800; }
  .sidebar-toggle { left: calc(var(--sidebar-width) - 46px); }
  .sidebar-backdrop { display: block; position: absolute; inset: 0; z-index: 750; background: #0008; border: 0; }
}
@media (prefers-reduced-motion: reduce) {
  .app-shell, .sidebar, .sidebar-toggle { transition: none; }
}
</style>
