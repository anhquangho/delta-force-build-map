import { afterEach, describe, expect, it, vi } from 'vitest'
import L from 'leaflet'
import { useMapController, type MapController } from '../useMapController'
import { mockDataset } from '@/data/mockDataset'

let controller: MapController | undefined
const container = document.createElement('div')
afterEach(() => {
  controller?.destroy()
  controller = undefined
  container.remove()
  vi.restoreAllMocks()
})

function setup() {
  document.body.append(container)
  Object.defineProperties(container, {
    clientWidth: { value: 1000, configurable: true },
    clientHeight: { value: 800, configurable: true },
  })
  controller = useMapController(container, { basemapUrl: '/zero-dam-basemap.svg', width: 4096, height: 4096 })
  return controller
}

const options = { entityNameVi: 'Máy chủ', entityNameEn: 'Server', icon: '/icons/server.svg' }

describe('Leaflet adapter', () => {
  it('keeps CRS.Simple and the current normalized coordinate mapping', () => {
    const mapFactory = vi.spyOn(L, 'map')
    const markerFactory = vi.spyOn(L, 'marker')
    setup().setMarkers([mockDataset.markers[0]], options)
    expect(mapFactory).toHaveBeenCalledWith(container, expect.objectContaining({ crs: L.CRS.Simple }))
    expect(markerFactory.mock.calls[0][0]).toEqual([0.42 * 4096, 0.35 * 4096])
  })

  it('renders keyboard-accessible local icons and reports marker selection', () => {
    const onMarkerClick = vi.fn()
    const map = setup()
    map.setMarkers(mockDataset.markers.slice(0, 4), { ...options, onMarkerClick })
    const pins = container.querySelectorAll<HTMLElement>('.item-map-marker')
    expect(pins).toHaveLength(4)
    expect(pins[0].getAttribute('role')).toBe('button')
    expect(pins[0].getAttribute('aria-label')).toContain('Máy chủ / Server')
    pins[0].click()
    expect(onMarkerClick).toHaveBeenLastCalledWith(mockDataset.markers[0])
    expect(pins[0].getAttribute('aria-pressed')).toBe('true')
    pins[1].dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }))
    expect(onMarkerClick).toHaveBeenLastCalledWith(mockDataset.markers[1])
    expect(pins[0].getAttribute('aria-pressed')).toBe('false')
    map.selectMarker(null)
    expect(container.querySelector('.is-selected')).toBeNull()
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
