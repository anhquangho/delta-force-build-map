import L from 'leaflet'
import { h, render } from 'vue'
import ItemIcon from '@/components/ItemIcon.vue'
import type { MapMarker } from '@/types/domain'
import type { ItemPresentation } from '@/lib/item-presentation'
import { normalizedToMapPoint } from '@/lib/coordinates'

export interface MapControllerOptions {
  basemapUrl: string
  width: number
  height: number
  onBasemapStatus?(status: 'ready' | 'error'): void
}

export interface MapMarkerRenderOptions extends ItemPresentation {
  entityNameVi: string
  entityNameEn: string
  onMarkerClick?(marker: MapMarker): void
}

export interface MapController {
  setMarkers(markers: MapMarker[], options: MapMarkerRenderOptions): void
  clearMarkers(): void
  fitMarkers(): void
  selectMarker(markerId: string | null): void
  resize(): void
  destroy(): void
}

/**
 * Leaflet controller behind an adapter boundary.
 *
 * Domain code (search, entities) never touches Leaflet directly. The controller
 * owns the map instance, layers, and coordinate transform for the current map
 * version.
 */
export function useMapController(
  container: HTMLElement,
  options: MapControllerOptions
): MapController {
  const { basemapUrl, width, height } = options

  const map = L.map(container, {
    crs: L.CRS.Simple,
    minZoom: -5,
    maxZoom: 4,
    zoomSnap: 0.25,
    zoomControl: false,
  })
  L.control.zoom({ position: 'bottomright', zoomInTitle: 'Phóng to / Zoom in', zoomOutTitle: 'Thu nhỏ / Zoom out' }).addTo(map)

  const bounds: L.LatLngBoundsExpression = [[0, 0], [height, width]]
  L.imageOverlay(basemapUrl, bounds)
    .on('load', () => options.onBasemapStatus?.('ready'))
    .on('error', () => options.onBasemapStatus?.('error'))
    .addTo(map)
  map.fitBounds(bounds)

  const markerLayer = L.featureGroup().addTo(map)
  const entries = new Map<string, { element: HTMLElement; marker: L.Marker }>()
  let currentOptions: MapMarkerRenderOptions | null = null

  function clearMarkers() {
    for (const entry of entries.values()) render(null, entry.element)
    entries.clear()
    markerLayer.clearLayers()
    currentOptions = null
  }

  function selectMarker(markerId: string | null) {
    for (const [id, entry] of entries) {
      render(h(ItemIcon, {
        icon: currentOptions?.icon,
        rarity: currentOptions?.rarity,
        size: 36,
        selected: id === markerId,
      }), entry.element)
      entry.marker.getElement()?.setAttribute('aria-pressed', String(id === markerId))
      entry.marker.setZIndexOffset(id === markerId ? 1000 : 0)
    }
  }

  function setMarkers(markers: MapMarker[], renderOptions: MapMarkerRenderOptions) {
    clearMarkers()
    currentOptions = renderOptions
    for (const marker of markers) {
      const point = normalizedToMapPoint(marker.xNormalized, marker.yNormalized, width, height)
      const element = document.createElement('div')
      const label = `${renderOptions.entityNameVi} / ${renderOptions.entityNameEn} · ${marker.floorKey ?? '?'} · Mock`
      const pin = L.marker([point.y, point.x], {
        icon: L.divIcon({ html: element, className: 'item-map-marker', iconSize: [36, 36], iconAnchor: [18, 18] }),
        title: label,
        alt: label,
        keyboard: true,
      }).addTo(markerLayer)
      pin.getElement()?.setAttribute('aria-label', label)
      pin.getElement()?.addEventListener('keydown', (event) => {
        if (event.key === ' ') {
          event.preventDefault()
          pin.fire('click')
        }
      })
      pin.on('click', () => {
        selectMarker(marker.id)
        renderOptions.onMarkerClick?.(marker)
      })
      entries.set(marker.id, { element, marker: pin })
    }
    selectMarker(null)
  }

  function fitMarkers() {
    if (!entries.size) return
    map.fitBounds(markerLayer.getBounds().pad(0.25), { padding: [40, 60], maxZoom: 1, animate: false })
  }

  function resize() {
    map.invalidateSize({ animate: false })
  }

  function destroy() {
    clearMarkers()
    map.remove()
  }

  return { setMarkers, clearMarkers, fitMarkers, selectMarker, resize, destroy }
}
