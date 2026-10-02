import { reactive } from 'vue'

/**
 * Minimal shared selection state between search and map.
 *
 * Search and map are intentionally decoupled: search sets the selected entity
 * id, and the map observes it. Neither feature imports Leaflet or search
 * internals from the other.
 */
export interface SearchSelection {
  selectedEntityId: string | null
  selectEntity(entityId: string): void
  clear(): void
}

export function createSearchSelection(): SearchSelection {
  return reactive({
    selectedEntityId: null as string | null,
    selectEntity(entityId: string) {
      this.selectedEntityId = entityId
    },
    clear() {
      this.selectedEntityId = null
    },
  })
}
