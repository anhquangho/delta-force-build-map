import { afterEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import L from 'leaflet'
import { useMapController, type MapController } from '../useMapController'
import { mockDataset, serverMarkerCandidates } from '@/data/mockDataset'
import { zeroDamMapConfig } from '@/data/zeroDamMap'
import { isMapTileAvailable } from '@/lib/map-tiles'
import { normalizedToLeafletSimplePoint } from '@/lib/coordinates'
import { minimumZoomForMapFit, panBoundsForViewport } from '@/lib/map-tiles'

let controller: MapController | undefined
const container = document.createElement('div')
afterEach(() => {
  controller?.destroy()
  controller = undefined
  container.remove()
  vi.restoreAllMocks()
})

function setup(showDevelopmentControlPoints = false) {
  document.body.append(container)
  Object.defineProperties(container, {
    clientWidth: { value: 1000, configurable: true },
    clientHeight: { value: 800, configurable: true },
  })
  controller = useMapController(container, { mapConfig: zeroDamMapConfig, showDevelopmentControlPoints })
  return controller
}

const options = {
  entityNameVi: 'Máy chủ',
  entityNameEn: 'Server',
  icon: '/items/server.png',
  fallbackIcon: '/icons/server.svg',
  rarity: 'rare' as const,
}

describe('Leaflet adapter', () => {
  it('keeps CRS.Simple and converts normalized top-down coordinates for the configured map', () => {
    const mapFactory = vi.spyOn(L, 'map')
    const markerFactory = vi.spyOn(L, 'marker')
    setup().setMarkers([mockDataset.markers[0]], options)
    const panBounds = panBoundsForViewport(
      zeroDamMapConfig,
      1000,
      800,
      minimumZoomForMapFit(zeroDamMapConfig, 1000, 800, 0.25),
    )
    expect(mapFactory).toHaveBeenCalledWith(container, expect.objectContaining({
      crs: L.CRS.Simple,
      minZoom: minimumZoomForMapFit(zeroDamMapConfig, 1000, 800, 0.25),
      maxZoom: zeroDamMapConfig.maxZoom,
      maxBounds: [[panBounds.south, panBounds.west], [panBounds.north, panBounds.east]],
      maxBoundsViscosity: zeroDamMapConfig.maxBoundsViscosity,
    }))
    const markerPoint = normalizedToLeafletSimplePoint(
      mockDataset.markers[0].xNormalized,
      mockDataset.markers[0].yNormalized,
      zeroDamMapConfig,
    )
    expect(markerFactory.mock.calls[0][0]).toEqual([markerPoint.lat, markerPoint.lng])
  })

  it('uses the inspected local z/y/x 512px native tile configuration', () => {
    const tileFactory = vi.spyOn(L, 'tileLayer')
    setup()
    expect(tileFactory).toHaveBeenCalledWith(zeroDamMapConfig.tileUrlTemplate, expect.objectContaining({
      tileSize: 512,
      minZoom: zeroDamMapConfig.minZoom,
      maxZoom: 5,
      minNativeZoom: 1,
      maxNativeZoom: 3,
      noWrap: true,
    }))
  })

  it('only enables dragging for candidate markers when review mode is explicitly enabled', () => {
    const markerFactory = vi.spyOn(L, 'marker')
    const map = setup()
    const candidate = serverMarkerCandidates[0]
    const safe = mockDataset.markers.find((marker) => marker.entityId !== candidate.entityId)!
    const onMarkerDrag = vi.fn()
    map.setMarkers([candidate], options)
    expect((markerFactory.mock.results[0].value as L.Marker).options.draggable).toBe(false)
    map.setMarkers([candidate, safe], { ...options, allowCandidateDragging: true, onMarkerDrag })
    const candidatePin = markerFactory.mock.results[1].value as L.Marker
    const safePin = markerFactory.mock.results[2].value as L.Marker
    expect(candidatePin.options.draggable).toBe(true)
    expect(safePin.options.draggable).toBe(false)
    const target = normalizedToLeafletSimplePoint(0.61, 0.42, zeroDamMapConfig)
    candidatePin.setLatLng([target.lat, target.lng])
    candidatePin.fire('dragend')
    const [draggedMarker, coordinates] = onMarkerDrag.mock.calls[0]
    expect(draggedMarker).toBe(candidate)
    expect(coordinates.xNormalized).toBeCloseTo(0.61)
    expect(coordinates.yNormalized).toBeCloseTo(0.42)
    map.setMarkerPosition(candidate.id, { xNormalized: candidate.xNormalized, yNormalized: candidate.yNormalized })
    expect(candidatePin.getLatLng().lat).toBeCloseTo(normalizedToLeafletSimplePoint(candidate.xNormalized, candidate.yNormalized, zeroDamMapConfig).lat)
  })

  it('keeps the draggable temporary calibration pin separate from project marker data', () => {
    const mapFactory = vi.spyOn(L, 'map')
    const markerFactory = vi.spyOn(L, 'marker')
    const map = setup()
    const candidate = serverMarkerCandidates[0]
    const original = { xNormalized: candidate.xNormalized, yNormalized: candidate.yNormalized }
    const onDrag = vi.fn()
    map.setMarkers([candidate], options)
    map.setDevelopmentCalibrationMarker({
      xNormalized: 2455 / 4096,
      yNormalized: 1784 / 4096,
      title: 'Calibration source 165',
      onDrag,
    })

    expect(container.querySelectorAll('.item-map-marker')).toHaveLength(1)
    expect(container.querySelectorAll('.development-calibration-marker')).toHaveLength(1)
    const calibrationPin = markerFactory.mock.results[markerFactory.mock.results.length - 1].value as L.Marker
    expect(calibrationPin.options.draggable).toBe(true)
    expect(calibrationPin.options.pane).toBe('development-calibration-markers')
    const leafletMap = mapFactory.mock.results[0].value as L.Map
    expect(leafletMap.getPane('development-calibration-markers')?.style.zIndex).toBe('700')
    const target = normalizedToLeafletSimplePoint(0.6123, 0.3341, zeroDamMapConfig)
    calibrationPin.setLatLng([target.lat, target.lng])
    calibrationPin.fire('dragend')
    expect(onDrag).toHaveBeenCalledWith({ xNormalized: expect.closeTo(0.6123), yNormalized: expect.closeTo(0.3341) })
    expect(candidate.xNormalized).toBe(original.xNormalized)
    expect(candidate.yNormalized).toBe(original.yNormalized)

    map.setDevelopmentCalibrationMarker(null)
    expect(container.querySelectorAll('.development-calibration-marker')).toHaveLength(0)
    expect(container.querySelectorAll('.item-map-marker')).toHaveLength(1)
  })

  it('projects map clicks through the centralized inverse coordinate transform', () => {
    const mapFactory = vi.spyOn(L, 'map')
    const controller = setup()
    const leafletMap = mapFactory.mock.results[0].value as L.Map
    const onCoordinateClick = vi.fn()
    const remove = controller.onMapCoordinateClick(onCoordinateClick)
    const point = normalizedToLeafletSimplePoint(0.25, 0.75, zeroDamMapConfig)
    leafletMap.fire('click', { latlng: L.latLng(point.lat, point.lng) })
    expect(onCoordinateClick).toHaveBeenCalledWith({ xNormalized: 0.25, yNormalized: 0.75 })
    remove()
  })

  it('reuses z3 tiles above native max zoom without requesting higher levels', () => {
    const mapFactory = vi.spyOn(L, 'map')
    setup()
    const map = mapFactory.mock.results[0].value as L.Map
    map.setView(map.getCenter(), 5, { animate: false })
    const sources = [...container.querySelectorAll<HTMLImageElement>('.leaflet-tile-container img')]
      .map((image) => image.getAttribute('src'))
      .filter((source): source is string => !!source)
    expect(sources.length).toBeGreaterThan(0)
    expect(sources.every((source) => /\/3\/\d+\/\d+\.webp$/.test(source))).toBe(true)
  })

  it('resets to the full configured map bounds', () => {
    const fitBounds = vi.spyOn(L.Map.prototype, 'fitBounds')
    const map = setup()
    map.resetView()
    expect(fitBounds).toHaveBeenLastCalledWith(
      [[zeroDamMapConfig.contentBounds.south, zeroDamMapConfig.contentBounds.west], [zeroDamMapConfig.contentBounds.north, zeroDamMapConfig.contentBounds.east]],
      expect.objectContaining({ animate: false }),
    )
  })

  it('recomputes its overview minimum zoom when the map viewport resizes', () => {
    const mapFactory = vi.spyOn(L, 'map')
    const controller = setup()
    const leafletMap = mapFactory.mock.results[0].value as L.Map
    expect(leafletMap.getMinZoom()).toBe(minimumZoomForMapFit(zeroDamMapConfig, 1000, 800, 0.25))
    Object.defineProperties(container, {
      clientWidth: { value: 390, configurable: true },
      clientHeight: { value: 844, configurable: true },
    })
    controller.resize()
    expect(leafletMap.getMinZoom()).toBe(minimumZoomForMapFit(zeroDamMapConfig, 390, 844, 0.25))
  })

  it('renders local tiles in y/x order and uses a blank element for absent tiles', async () => {
    const tileFactory = vi.spyOn(L, 'tileLayer')
    setup()
    const tileLayer = tileFactory.mock.results[0].value as unknown as {
      createTile(coords: L.Coords, done: (error?: Error, tile?: HTMLElement) => void): HTMLElement
    }
    ;(tileLayer as unknown as { _tileZoom: number })._tileZoom = 3
    const missingTileDone = vi.fn()
    const missingTile = tileLayer.createTile({ x: 0, y: 1, z: 3 } as unknown as L.Coords, missingTileDone)
    await Promise.resolve()
    expect(missingTile.classList.contains('zero-dam-empty-tile')).toBe(true)
    expect(missingTileDone).toHaveBeenCalledWith(undefined, missingTile)
    const localTile = tileLayer.createTile({ x: 1, y: 1, z: 3 } as unknown as L.Coords, vi.fn()) as HTMLImageElement
    expect(localTile.getAttribute('src')).toContain('/assets/maps/zero-dam/3/1/1.webp')
  })

  it('renders alignment control points in a separate development-only layer', () => {
    setup(true)
    expect(container.querySelectorAll('.development-control-point')).toHaveLength(5)
    expect(container.querySelectorAll('.item-map-marker')).toHaveLength(0)
    expect(isMapTileAvailable(zeroDamMapConfig, 3, 2, 1)).toBe(true)
    expect(isMapTileAvailable(zeroDamMapConfig, 3, 0, 1)).toBe(false)
  })

  it('projects marker anchors into the map container coordinate space', () => {
    const map = setup()
    const marker = mockDataset.markers[0]
    map.setMarkers([marker], options)
    vi.spyOn(L.Map.prototype, 'latLngToContainerPoint').mockReturnValue(L.point(120, 240))
    expect(map.getMarkerPoint(marker.id)).toEqual({ x: 120, y: 240 })
    expect(map.getMarkerPoint('missing')).toBeNull()
  })

  it('registers removable map-click and viewport subscriptions', () => {
    const map = setup()
    const on = vi.spyOn(L.Map.prototype, 'on')
    const off = vi.spyOn(L.Map.prototype, 'off')
    const mapClick = vi.fn()
    const viewportChange = vi.fn()
    const removeMapClick = map.onMapClick(mapClick)
    const removeViewportChange = map.onViewportChange(viewportChange)
    expect(on).toHaveBeenCalledWith('click', mapClick)
    expect(on).toHaveBeenCalledWith('move zoom resize', viewportChange)
    removeMapClick()
    removeViewportChange()
    expect(off).toHaveBeenCalledWith('click', mapClick)
    expect(off).toHaveBeenCalledWith('move zoom resize', viewportChange)
  })

  it('renders keyboard-accessible local icons and reports marker selection', async () => {
    const onMarkerClick = vi.fn()
    const onMapClick = vi.fn()
    const map = setup()
    const removeMapClick = map.onMapClick(onMapClick)
    map.setMarkers(mockDataset.markers.slice(0, 4), { ...options, onMarkerClick })
    const pins = container.querySelectorAll<HTMLElement>('.item-map-marker')
    expect(pins).toHaveLength(4)
    expect(pins[0].getAttribute('role')).toBe('button')
    expect(pins[0].getAttribute('aria-label')).toContain('Máy chủ / Server')
    expect(pins[0].getAttribute('aria-label')).toContain('Unverified source candidate')
    pins[0].click()
    expect(onMarkerClick).toHaveBeenLastCalledWith(mockDataset.markers[0])
    expect(onMapClick).not.toHaveBeenCalled()
    expect(pins[0].getAttribute('aria-pressed')).toBe('true')
    expect(pins[0].querySelector('.item-icon')?.classList.contains('is-selected')).toBe(true)
    expect(pins[0].querySelector('.item-icon')?.classList.contains('rarity-rare')).toBe(true)
    const iconImage = pins[0].querySelector('.item-icon img')!
    expect(iconImage.getAttribute('src')).toBe('/items/server.png')
    iconImage.dispatchEvent(new Event('error'))
    await nextTick()
    expect(pins[0].querySelector('.item-icon img')?.getAttribute('src')).toBe('/icons/server.svg')
    pins[1].dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }))
    expect(onMarkerClick).toHaveBeenLastCalledWith(mockDataset.markers[1])
    expect(pins[0].getAttribute('aria-pressed')).toBe('false')
    map.selectMarker(null)
    expect(container.querySelector('.is-selected')).toBeNull()
    removeMapClick()
  })

  it('replaces rather than accumulates markers and safely handles empty focus', () => {
    const map = setup()
    map.setMarkers(mockDataset.markers.slice(0, 4), options)
    const oldIcon = container.querySelector('.item-map-marker > div')!
    map.setMarkers(mockDataset.markers.slice(4, 9), options)
    expect(container.querySelectorAll('.item-map-marker')).toHaveLength(5)
    expect(oldIcon.childElementCount).toBe(0)
    map.fitMarkers()
    map.resize()
    map.clearMarkers()
    expect(container.querySelectorAll('.item-map-marker')).toHaveLength(0)
    expect(() => map.fitMarkers()).not.toThrow()
  })
})
