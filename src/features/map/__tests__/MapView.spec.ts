import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { createSearchSelection } from '@/composables/useSearchSelection'
import { mockDataset } from '@/data/mockDataset'
import MapView from '../MapView.vue'

const adapter = vi.hoisted(() => ({
  setMarkers: vi.fn(), clearMarkers: vi.fn(), fitMarkers: vi.fn(),
  selectMarker: vi.fn(), resize: vi.fn(), destroy: vi.fn(),
}))
vi.mock('@/composables/useMapController', () => ({ useMapController: vi.fn(() => adapter) }))

const observe = vi.fn()
const disconnect = vi.fn()
let resizeCallback: () => void
beforeEach(() => {
  vi.stubGlobal('ResizeObserver', class {
    constructor(callback: () => void) { resizeCallback = callback }
    observe = observe
    disconnect = disconnect
  })
})
const wrappers: ReturnType<typeof mount>[] = []
afterEach(() => {
  wrappers.forEach((wrapper) => wrapper.unmount())
  wrappers.length = 0
  vi.clearAllMocks()
  vi.unstubAllGlobals()
})

function setup() {
  const selection = createSearchSelection()
  const wrapper = mount(MapView, { props: { selection } })
  wrappers.push(wrapper)
  return { selection, wrapper }
}

describe('map view lifecycle', () => {
  it('mounts a map container before selection with no markers', () => {
    const { wrapper } = setup()
    expect(wrapper.find('.map-container').exists()).toBe(true)
    expect(adapter.clearMarkers).toHaveBeenCalled()
    expect(adapter.setMarkers).not.toHaveBeenCalled()
  })

  it('filters and focuses markers when the initial selection changes', async () => {
    const { selection } = setup()
    for (const entity of mockDataset.entities) {
      selection.selectEntity(entity.id)
      await nextTick()
      expect(adapter.setMarkers.mock.lastCall?.[0]).toEqual(
        mockDataset.markers.filter((marker) => marker.entityId === entity.id),
      )
    }
    expect(adapter.fitMarkers).toHaveBeenCalledTimes(3)
  })

  it('clears markers and detail when selection is cleared', async () => {
    const { selection, wrapper } = setup()
    selection.selectEntity(mockDataset.entities[0].id)
    await nextTick()
    adapter.setMarkers.mock.lastCall?.[1].onMarkerClick(mockDataset.markers[4])
    await nextTick()
    expect(wrapper.find('.marker-detail').exists()).toBe(true)
    selection.clear()
    await nextTick()
    expect(wrapper.find('.marker-detail').exists()).toBe(false)
    expect(adapter.clearMarkers).toHaveBeenCalledTimes(2)
  })

  it('invalidates map size after layout changes and disconnects on unmount', () => {
    const { wrapper } = setup()
    expect(observe).toHaveBeenCalledOnce()
    resizeCallback()
    expect(adapter.resize).toHaveBeenCalledOnce()
    wrapper.unmount()
    wrappers.length = 0
    expect(disconnect).toHaveBeenCalledOnce()
  })

  it('refocuses the same entity on a new focus request', async () => {
    const { selection, wrapper } = setup()
    selection.selectEntity(mockDataset.entities[1].id)
    await nextTick()
    await wrapper.setProps({ focusRequest: 1 })
    expect(adapter.fitMarkers).toHaveBeenCalledTimes(2)
  })

  it('renders mock detail and closes it without clearing the entity', async () => {
    const { selection, wrapper } = setup()
    const entity = mockDataset.entities[1]
    selection.selectEntity(entity.id)
    await nextTick()
    adapter.setMarkers.mock.lastCall?.[1].onMarkerClick(mockDataset.markers[0])
    await nextTick()
    const detail = wrapper.get('.marker-detail')
    expect(detail.text()).toContain('Máy chủ')
    expect(detail.text()).toContain('Server')
    expect(detail.text()).toContain('Tòa quản trị / Admin Building')
    expect(detail.text()).toContain('Zero Dam')
    expect(detail.text()).toContain('Máy chủ / Server')
    expect(detail.text()).toContain('Unverified mock data')
    expect(detail.findAll('dd')[1].text()).toBe('1')
    await detail.get('button').trigger('click')
    expect(wrapper.find('.marker-detail').exists()).toBe(false)
    expect(selection.selectedEntityId).toBe(entity.id)
    expect(adapter.selectMarker).toHaveBeenLastCalledWith(null)
  })

  it('destroys the adapter on unmount', () => {
    const { wrapper } = setup()
    wrapper.unmount()
    wrappers.length = 0
    expect(adapter.destroy).toHaveBeenCalledOnce()
  })
})
