import L from 'leaflet'
import { h, render } from 'vue'
import ItemIcon from '@/components/ItemIcon.vue'
import type { MapMarker } from '@/types/domain'
import type { ItemPresentation } from '@/lib/item-presentation'
import type { MarkerPoint } from '@/lib/marker-detail-placement'
import type { LocalTileMapConfig, SimpleMapBounds } from '@/types/map-config'
import { normalizedToLeafletSimplePoint, sourceWorldToLeafletSimplePoint } from '@/lib/coordinates'
import { isMapTileAvailable, minimumZoomForMapFit, nearestCoveredTileViewCenter, panBoundsForViewport } from '@/lib/map-tiles'

function toLeafletBounds(bounds: SimpleMapBounds): L.LatLngBoundsExpression {
  return [[bounds.south, bounds.west], [bounds.north, bounds.east]]
}

function sameBounds(left: SimpleMapBounds, right: SimpleMapBounds): boolean {
  return Math.abs(left.west - right.west) < 1e-6 &&
    Math.abs(left.east - right.east) < 1e-6 &&
    Math.abs(left.north - right.north) < 1e-6 &&
    Math.abs(left.south - right.south) < 1e-6
}

export interface MapControllerOptions {
  mapConfig: LocalTileMapConfig
  showDevelopmentControlPoints?: boolean
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
  resetView(): void
  selectMarker(markerId: string | null): void
  getMarkerPoint(markerId: string): MarkerPoint | null
  onMapClick(listener: () => void): () => void
  onViewportChange(listener: () => void): () => void
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
  const { mapConfig } = options
  const contentBounds = toLeafletBounds(mapConfig.contentBounds)
  const zoomSnap = 0.25
  const initialMinimumZoom = minimumZoomForMapFit(
    mapConfig,
    container.clientWidth,
    container.clientHeight,
    zoomSnap,
  )
  const initialPanBounds = panBoundsForViewport(
    mapConfig,
    container.clientWidth,
    container.clientHeight,
    initialMinimumZoom,
  )
  let activePanBounds = initialPanBounds
  const map = L.map(container, {
    crs: L.CRS.Simple,
    minZoom: Math.max(mapConfig.minZoom, Math.min(mapConfig.maxZoom, initialMinimumZoom)),
    maxZoom: mapConfig.maxZoom,
    zoomSnap,
    zoomControl: false,
    maxBounds: toLeafletBounds(initialPanBounds),
    maxBoundsViscosity: mapConfig.maxBoundsViscosity,
  })
  L.control.zoom({ position: 'bottomright', zoomInTitle: 'Phóng to / Zoom in', zoomOutTitle: 'Thu nhỏ / Zoom out' }).addTo(map)

  const tileLayer = L.tileLayer(mapConfig.tileUrlTemplate, {
    tileSize: mapConfig.tileSize,
    minZoom: mapConfig.minZoom,
    maxZoom: mapConfig.maxZoom,
    minNativeZoom: mapConfig.minNativeZoom,
    maxNativeZoom: mapConfig.maxNativeZoom,
    noWrap: true,
    bounds: contentBounds,
    updateWhenIdle: true,
    keepBuffer: 1,
  })
  type TileFactory = (coords: L.Coords, done: (error?: Error, tile?: HTMLElement) => void) => HTMLElement
  const tileFactory = tileLayer as unknown as { createTile: TileFactory }
  const createImageTile = tileFactory.createTile.bind(tileLayer)
  tileFactory.createTile = (coords, done) => {
    if (isMapTileAvailable(mapConfig, coords.z, coords.x, coords.y)) {
      return createImageTile(coords, done)
    }
    const emptyTile = document.createElement('div')
    emptyTile.className = 'zero-dam-empty-tile'
    queueMicrotask(() => done(undefined, emptyTile))
    return emptyTile
  }
  tileLayer
    .on('load', () => options.onBasemapStatus?.('ready'))
    .on('tileerror', () => options.onBasemapStatus?.('error'))
    .addTo(map)

  let adjustingCoverage = false
  function constrainToTileCoverage() {
    if (adjustingCoverage) return
    const size = map.getSize()
    if (!size.x || !size.y) return
    adjustingCoverage = true
    try {
      const minimumZoom = Math.max(
        mapConfig.minZoom,
        Math.min(mapConfig.maxZoom, minimumZoomForMapFit(mapConfig, size.x, size.y, zoomSnap)),
      )
      const previousZoom = map.getZoom()
      if (Math.abs(map.getMinZoom() - minimumZoom) > 0.001) {
        map.setMinZoom(minimumZoom)
        if (previousZoom < minimumZoom) map.setView(map.getCenter(), minimumZoom, { animate: false })
      }
      const panBounds = panBoundsForViewport(mapConfig, size.x, size.y, map.getZoom())
      if (!sameBounds(activePanBounds, panBounds)) {
        activePanBounds = panBounds
        map.setMaxBounds(toLeafletBounds(panBounds))
      }

      const tileZoom = (tileLayer as unknown as { _tileZoom?: number })._tileZoom
      if (!Number.isInteger(tileZoom)) return
      const center = map.getCenter()
      const safeCenter = nearestCoveredTileViewCenter(mapConfig, {
        center: { lat: center.lat, lng: center.lng },
        zoom: map.getZoom(),
        tileZoom: tileZoom!,
        width: size.x,
        height: size.y,
      })
      if (!safeCenter) return
      const tolerance = 1 / 2 ** map.getZoom()
      if (Math.abs(safeCenter.lat - center.lat) > tolerance || Math.abs(safeCenter.lng - center.lng) > tolerance) {
        map.setView([safeCenter.lat, safeCenter.lng], map.getZoom(), { animate: false })
      }
    } finally {
      adjustingCoverage = false
    }
  }

  map.on('move zoomend resize', constrainToTileCoverage)
  map.fitBounds(contentBounds)
  constrainToTileCoverage()

  if (options.showDevelopmentControlPoints) {
    const pane = map.createPane('development-control-points')
    pane.style.zIndex = '650'
    pane.style.pointerEvents = 'none'
    const controlPointLayer = L.layerGroup().addTo(map)
    for (const controlPoint of mapConfig.developmentControlPoints) {
      const position = sourceWorldToLeafletSimplePoint(
        controlPoint.sourceX,
        controlPoint.sourceY,
        mapConfig.sourceTransform,
      )
      const root = document.createElement('span')
      root.className = 'development-control-point'
      const symbol = document.createElement('span')
      symbol.className = 'development-control-point-symbol'
      const label = document.createElement('span')
      label.className = 'development-control-point-label'
      label.textContent = controlPoint.nameEn
      root.append(symbol, label)
      L.marker([position.lat, position.lng], {
        pane: 'development-control-points',
        icon: L.divIcon({ html: root, className: 'development-control-point-icon', iconSize: [20, 20], iconAnchor: [10, 10] }),
        interactive: false,
        keyboard: false,
        alt: `Development alignment control point: ${controlPoint.nameEn}`,
      }).addTo(controlPointLayer)
    }
  }

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
        fallbackIcon: currentOptions?.fallbackIcon,
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
      const point = normalizedToLeafletSimplePoint(marker.xNormalized, marker.yNormalized, mapConfig)
      const element = document.createElement('div')
      const label = `${renderOptions.entityNameVi} / ${renderOptions.entityNameEn} · ${marker.floorKey ?? '?'} · Mock`
      const pin = L.marker([point.lat, point.lng], {
        icon: L.divIcon({ html: element, className: 'item-map-marker', iconSize: [36, 36], iconAnchor: [18, 18] }),
        title: label,
        alt: label,
        keyboard: true,
        bubblingMouseEvents: false,
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

  function resetView() {
    map.fitBounds(contentBounds, { animate: false })
  }

  function getMarkerPoint(markerId: string): MarkerPoint | null {
    const entry = entries.get(markerId)
    if (!entry) return null
    const point = map.latLngToContainerPoint(entry.marker.getLatLng())
    return { x: point.x, y: point.y }
  }

  function onMapClick(listener: () => void): () => void {
    map.on('click', listener)
    return () => map.off('click', listener)
  }

  function onViewportChange(listener: () => void): () => void {
    map.on('move zoom resize', listener)
    return () => map.off('move zoom resize', listener)
  }

  function resize() {
    map.invalidateSize({ animate: false })
    constrainToTileCoverage()
  }

  function destroy() {
    clearMarkers()
    map.remove()
  }

  return { setMarkers, clearMarkers, fitMarkers, resetView, selectMarker, getMarkerPoint, onMapClick, onViewportChange, resize, destroy }
}
