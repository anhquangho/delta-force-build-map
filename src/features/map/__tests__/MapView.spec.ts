import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { createSearchSelection } from '@/composables/useSearchSelection'
import { computerCaseMarkerCandidates, keycardLocationMarkerCandidates, mockDataset, safeMarkerCandidates } from '@/data/mockDataset'
import { deltaForceMapsZeroDamCalibrationRecords } from '@/data/deltaForceMapsZeroDamCalibration'
import { itemCatalog, ITEM_CATALOG_IDS } from '@/data/itemCatalog'
import { sourceCoordinatesForCalibrationPreview } from '@/lib/marker-calibration'
import MapView from '../MapView.vue'
import { getItemPresentation } from '@/lib/item-presentation'

const adapter = vi.hoisted(() => ({
  setMarkers: vi.fn(), setDevelopmentCalibrationMarker: vi.fn(), setMarkerPosition: vi.fn(), clearMarkers: vi.fn(), fitMarkers: vi.fn(), resetView: vi.fn(),
  selectMarker: vi.fn(), resize: vi.fn(), destroy: vi.fn(),
  getMarkerPoint: vi.fn(() => ({ x: 400, y: 300 })),
  onMapClick: vi.fn((_listener: () => void) => vi.fn()),
  onMapCoordinateClick: vi.fn((_listener: (coordinates: { xNormalized: number; yNormalized: number }) => void) => vi.fn()),
  onViewportChange: vi.fn((_listener: () => void) => vi.fn()),
}))
vi.mock('@/composables/useMapController', () => ({
  useMapController: vi.fn((_container: HTMLElement, options: { onBasemapStatus?: (status: 'ready' | 'error') => void }) => {
    options.onBasemapStatus?.('ready')
    return adapter
  }),
}))

const observe = vi.fn()
const disconnect = vi.fn()
let resizeCallback: () => void
beforeEach(() => {
  adapter.getMarkerPoint.mockReturnValue({ x: 400, y: 300 })
  adapter.onMapClick.mockReturnValue(vi.fn())
  adapter.onMapCoordinateClick.mockReturnValue(vi.fn())
  adapter.onViewportChange.mockReturnValue(vi.fn())
  vi.stubGlobal('ResizeObserver', class {
    constructor(callback: () => void) { resizeCallback = callback }
    observe = observe
    disconnect = disconnect
  })
})
const wrappers: ReturnType<typeof mount>[] = []
const originalClipboard = Object.getOwnPropertyDescriptor(navigator, 'clipboard')
afterEach(() => {
  wrappers.forEach((wrapper) => wrapper.unmount())
  wrappers.length = 0
  if (originalClipboard) Object.defineProperty(navigator, 'clipboard', originalClipboard)
  else Reflect.deleteProperty(navigator, 'clipboard')
  window.history.replaceState({}, '', '/')
  vi.clearAllMocks()
  vi.unstubAllGlobals()
})

function setup(search = '') {
  window.history.replaceState({}, '', search || '/')
  const selection = createSearchSelection()
  const wrapper = mount(MapView, { props: { selection }, attachTo: document.body })
  wrappers.push(wrapper)
  return { selection, wrapper }
}

function calibrationPreviewCoordinates(record: (typeof deltaForceMapsZeroDamCalibrationRecords)[number]) {
  const { xNormalized, yNormalized } = sourceCoordinatesForCalibrationPreview(record)
  return { xNormalized, yNormalized }
}

describe('map view lifecycle', () => {
  it('mounts a map container before selection with no markers', () => {
    const { wrapper } = setup()
    expect(wrapper.find('.map-container').exists()).toBe(true)
    expect(wrapper.find('.dev-marker-review-panel').exists()).toBe(false)
    expect(wrapper.find('#keycard-poi-source-select').exists()).toBe(false)
    expect(wrapper.find('#calibration-source-select').exists()).toBe(false)
    expect(wrapper.find('.dev-marker-review-toggle').exists()).toBe(false)
    expect(adapter.clearMarkers).toHaveBeenCalled()
    expect(adapter.resetView).toHaveBeenCalledOnce()
    expect(adapter.setMarkers).not.toHaveBeenCalled()
  })

  it('omits out-of-crop source candidates from the visible marker layer and count', async () => {
    const server = mockDataset.entities.find((entity) => entity.slug === 'server')!
    const sourceMarker = mockDataset.markers.find((marker) => marker.provenance?.sourceExternalId === '395')!
    const outOfCropMarker = {
      ...sourceMarker,
      id: '11111111-1111-4111-8111-111111111111',
      xNormalized: 4000 / 3584,
      withinLocalCrop: false,
      provenance: { ...sourceMarker.provenance!, sourceExternalId: 'outside-crop-test', sourceX: 4000 },
    }
    mockDataset.markers.push(outOfCropMarker)
    let wrapper: ReturnType<typeof setup>['wrapper'] | undefined
    try {
      const result = setup()
      wrapper = result.wrapper
      result.selection.selectEntity(server.id)
      await nextTick()

      expect(mockDataset.markers).toContain(outOfCropMarker)
      expect(adapter.setMarkers.mock.lastCall?.[0]).toEqual(mockDataset.markers.filter((marker) => marker.entityId === server.id && marker.withinLocalCrop !== false))
      expect(adapter.setMarkers.mock.lastCall?.[0]).toHaveLength(3)
      expect(wrapper.get('.map-status').text()).toContain('3 vị trí / locations')
    } finally {
      wrapper?.unmount()
      mockDataset.markers.splice(mockDataset.markers.indexOf(outOfCropMarker), 1)
    }
  })

  it('filters and focuses markers when the initial selection changes', async () => {
    const { selection } = setup()
    for (const entity of mockDataset.entities) {
      selection.selectEntity(entity.id)
      await nextTick()
      expect(adapter.setMarkers.mock.lastCall?.[0]).toEqual(
        mockDataset.markers.filter((marker) => marker.entityId === entity.id),
      )
      expect(adapter.setMarkers.mock.lastCall?.[1]).toMatchObject(getItemPresentation(entity))
    }
    expect(adapter.fitMarkers).toHaveBeenCalledTimes(mockDataset.entities.length)
  })

  it('renders nine source-backed Computer Case candidates and opens their detail', async () => {
    const { selection, wrapper } = setup()
    const entity = mockDataset.entities.find((entry) => entry.slug === 'computer-case')!
    selection.selectEntity(entity.id)
    await nextTick()
    const markers = mockDataset.markers.filter((marker) => marker.entityId === entity.id)
    expect(markers).toEqual(computerCaseMarkerCandidates)
    expect(adapter.setMarkers.mock.lastCall?.[0]).toHaveLength(9)
    expect(wrapper.get('.map-status').text()).toContain('9 vị trí / locations')
    adapter.setMarkers.mock.lastCall?.[1].onMarkerClick(markers[0])
    await nextTick()
    expect(wrapper.get('.marker-detail').text()).toContain('Computer Case')
    expect(wrapper.get('.marker-detail').text()).toContain('Unverified source candidate')
  })

  it('keeps source key_card locations separate from inventory Keycard items', async () => {
    const { selection, wrapper } = setup()
    const location = mockDataset.entities.find((entry) => entry.slug === 'substation-tech-room')!
    const item = mockDataset.entities.find((entry) => entry.slug === 'substation-tech-room-keycard')!
    selection.selectEntity(location.id)
    await nextTick()
    const marker = keycardLocationMarkerCandidates.find((entry) => entry.provenance?.sourceExternalId === '165')!
    expect(marker.entityId).toBe(location.id)
    expect(marker.entityId).not.toBe(item.id)
    expect(adapter.setMarkers.mock.lastCall?.[0]).toEqual([marker])
    adapter.setMarkers.mock.lastCall?.[1].onMarkerClick(marker)
    await nextTick()
    const detail = wrapper.get('.marker-detail')
    expect(detail.text()).toContain('Phòng kỹ thuật trạm biến áp')
    expect(detail.text()).toContain('Substation Tech Room')
    expect(detail.text()).toContain('Keycard-related location')
    expect(detail.text()).toContain('Unverified source candidate')
  })

  it.each([
    ['substation-tech-room-keycard', 'Thẻ khóa phòng kỹ thuật trạm điện', 'Substation Tech Room Keycard', '/image/keycard_white.png'],
    ['underground-vault-storage-keycard', 'Thẻ kho lưu trữ ngầm', 'Underground Vault Storage Keycard', '/image/keycard_gold.png'],
  ])('filters and opens the keycard detail for %s', async (slug, nameVi, nameEn, icon) => {
    const { selection, wrapper } = setup()
    const entity = mockDataset.entities.find((entry) => entry.slug === slug)!
    const markers = mockDataset.markers.filter((marker) => marker.entityId === entity.id)
    selection.selectEntity(entity.id)
    await nextTick()
    expect(adapter.setMarkers.mock.lastCall?.[0]).toEqual(markers)
    expect(markers).toHaveLength(1)
    expect(adapter.setMarkers.mock.lastCall?.[1].icon).toBe(icon)
    adapter.setMarkers.mock.lastCall?.[1].onMarkerClick(markers[0])
    await nextTick()
    const detail = wrapper.get('.marker-detail')
    expect(detail.get('h2').text()).toBe(nameVi)
    expect(detail.get('.detail-title p').text()).toBe(nameEn)
    expect(detail.get('.detail-heading img').attributes('src')).toBe(icon)
    expect(detail.text()).toContain('Zero Dam')
    expect(detail.text()).toContain('Unknown')
    expect(detail.text()).toContain('Unverified mock data')
    expect(markers[0].provenance).toBeUndefined()
    expect(markers[0].verificationStatus).toBeUndefined()
    expect(detail.find('.rarity-badge').exists()).toBe(false)
  })

  it('propagates known catalog rarity into the map marker presentation and detail', async () => {
    const item = itemCatalog.find((entry) => entry.id === ITEM_CATALOG_IDS.server)!
    const previousRarity = item.rarity
    item.rarity = 'rare'
    try {
      const { selection, wrapper } = setup()
      selection.selectEntity(mockDataset.entities[1].id)
      await nextTick()
      expect(adapter.setMarkers.mock.lastCall?.[1].rarity).toBe('rare')
      adapter.setMarkers.mock.lastCall?.[1].onMarkerClick(mockDataset.markers[0])
      await nextTick()
      expect(wrapper.get('.marker-detail').classes()).toContain('rarity-rare')
      expect(wrapper.get('.detail-heading .item-icon').attributes('data-rarity')).toBe('rare')
      expect(wrapper.get('.detail-heading .item-icon').classes()).toContain('rarity-rare')
      expect(wrapper.get('.rarity-badge').text()).toBe('Hiếm / Rare')
    } finally {
      item.rarity = previousRarity
    }
  })

  it('switches the anchored detail when another marker is clicked', async () => {
    const { selection, wrapper } = setup()
    const server = mockDataset.entities.find((entity) => entity.slug === 'server')!
    selection.selectEntity(server.id)
    await nextTick()
    const onMarkerClick = adapter.setMarkers.mock.lastCall?.[1].onMarkerClick
    onMarkerClick?.(mockDataset.markers[0])
    await nextTick()
    expect(wrapper.get('.marker-detail').text()).toContain('Chưa rõ / Unknown')
    expect(wrapper.get('.marker-detail').findAll('dd')[1].text()).toBe('1')
    onMarkerClick?.(mockDataset.markers[1])
    await nextTick()
    expect(wrapper.findAll('.marker-detail')).toHaveLength(1)
    expect(wrapper.get('.marker-detail').text()).toContain('Chưa rõ / Unknown')
    expect(wrapper.get('.marker-detail').findAll('dd')[1].text()).toBe('Chưa rõ / Unknown')
  })

  it('closes detail after clicking away from the card', async () => {
    const { selection, wrapper } = setup()
    selection.selectEntity(mockDataset.entities[1].id)
    await nextTick()
    adapter.setMarkers.mock.lastCall?.[1].onMarkerClick(mockDataset.markers[0])
    await nextTick()
    adapter.onMapClick.mock.calls[0][0]()
    await nextTick()
    expect(wrapper.find('.marker-detail').exists()).toBe(false)
    expect(adapter.selectMarker).toHaveBeenLastCalledWith(null)

    adapter.setMarkers.mock.lastCall?.[1].onMarkerClick(mockDataset.markers[0])
    await nextTick()
    document.body.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await nextTick()
    expect(wrapper.find('.marker-detail').exists()).toBe(false)
  })

  it('closes detail with Escape without allowing the event to bubble', async () => {
    const { selection, wrapper } = setup()
    selection.selectEntity(mockDataset.entities[1].id)
    await nextTick()
    adapter.setMarkers.mock.lastCall?.[1].onMarkerClick(mockDataset.markers[0])
    await nextTick()
    const event = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true })
    document.dispatchEvent(event)
    await nextTick()
    expect(event.defaultPrevented).toBe(true)
    expect(wrapper.find('.marker-detail').exists()).toBe(false)
  })

  it('does not dismiss detail when clicking inside the card', async () => {
    const { selection, wrapper } = setup()
    selection.selectEntity(mockDataset.entities[1].id)
    await nextTick()
    adapter.setMarkers.mock.lastCall?.[1].onMarkerClick(mockDataset.markers[0])
    await nextTick()
    await wrapper.get('.marker-detail').trigger('click')
    expect(wrapper.find('.marker-detail').exists()).toBe(true)
  })

  it('repositions the detail when the map viewport moves or zooms', async () => {
    const { selection, wrapper } = setup()
    selection.selectEntity(mockDataset.entities[1].id)
    await nextTick()
    adapter.setMarkers.mock.lastCall?.[1].onMarkerClick(mockDataset.markers[0])
    await nextTick()
    const anchor = wrapper.get('.marker-detail-anchor')
    const initialLeft = anchor.element.getAttribute('style')
    expect(adapter.onViewportChange).toHaveBeenCalledOnce()
    adapter.getMarkerPoint.mockReturnValue({ x: 100, y: 30 })
    adapter.onViewportChange.mock.calls[0][0]()
    await nextTick()
    expect(anchor.element.getAttribute('style')).not.toBe(initialLeft)
    expect(anchor.attributes('data-placement')).toBe('below')
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
    expect(adapter.resetView).toHaveBeenCalledTimes(2)
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

  it('renders unverified source-candidate detail and closes it without clearing the entity', async () => {
    const { selection, wrapper } = setup()
    const entity = mockDataset.entities.find((entry) => entry.slug === 'server')!
    selection.selectEntity(entity.id)
    await nextTick()
    adapter.setMarkers.mock.lastCall?.[1].onMarkerClick(mockDataset.markers[0])
    await nextTick()
    const detail = wrapper.get('.marker-detail')
    expect(detail.text()).toContain('Máy chủ')
    expect(detail.text()).toContain('Server')
    expect(detail.text()).toContain('Chưa rõ / Unknown')
    expect(detail.text()).toContain('Zero Dam')
    expect(detail.text()).toContain('Máy chủ / Server')
    expect(detail.get('.detail-heading img').attributes('src')).toBe('/image/Serve.png')
    expect(detail.text()).toContain('Unverified source candidate')
    expect(detail.findAll('dd')[1].text()).toBe('1')
    await detail.get('button').trigger('click')
    expect(wrapper.find('.marker-detail').exists()).toBe(false)
    expect(selection.selectedEntityId).toBe(entity.id)
    expect(adapter.selectMarker).toHaveBeenLastCalledWith(null)
  })

  it('renders the source Safe candidates and opens their existing detail', async () => {
    const { selection, wrapper } = setup()
    const entity = mockDataset.entities.find((entry) => entry.slug === 'safe')!
    selection.selectEntity(entity.id)
    await nextTick()
    const markers = mockDataset.markers.filter((entry) => entry.entityId === entity.id)
    expect(markers).toEqual(safeMarkerCandidates)
    expect(adapter.setMarkers.mock.lastCall?.[0]).toEqual(markers)
    expect(adapter.setMarkers.mock.lastCall?.[0]).toHaveLength(11)
    expect(wrapper.get('.map-status').text()).toContain('11 vị trí / locations')

    const marker = markers[0]
    expect(marker.verificationStatus).toBe('candidate')
    expect(marker.provenance?.sourceExternalId).toBe('354')
    adapter.setMarkers.mock.lastCall?.[1].onMarkerClick(marker)
    await nextTick()
    expect(wrapper.get('.marker-detail').text()).toContain('Két sắt')
    expect(wrapper.get('.marker-detail').text()).toContain('Safe')
    expect(wrapper.get('.marker-detail').text()).toContain('11 vị trí / locations')
    expect(wrapper.get('.marker-detail').text()).toContain('Unverified source candidate')
  })

  it('keeps Safe source candidates draggable only in review mode without mutating stored coordinates', async () => {
    const { selection } = setup('?devReview=1')
    const entity = mockDataset.entities.find((entry) => entry.slug === 'safe')!
    selection.selectEntity(entity.id)
    await nextTick()
    const marker = safeMarkerCandidates[0]
    const original = { xNormalized: marker.xNormalized, yNormalized: marker.yNormalized }
    const renderOptions = adapter.setMarkers.mock.lastCall?.[1]

    expect(renderOptions?.allowCandidateDragging).toBe(true)
    expect(adapter.setMarkers.mock.lastCall?.[0]).toHaveLength(11)
    renderOptions?.onMarkerDrag?.(marker, { xNormalized: 0.4, yNormalized: 0.5 })
    expect(marker.xNormalized).toBe(original.xNormalized)
    expect(marker.yNormalized).toBe(original.yNormalized)
    expect(marker.verificationStatus).toBe('candidate')
  })

  it('inspects clicks and reviews a candidate without mutating the dataset', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } })
    const { selection, wrapper } = setup('?devReview=1')
    const server = mockDataset.entities.find((entity) => entity.slug === 'server')!
    selection.selectEntity(server.id)
    await nextTick()

    expect(wrapper.find('.dev-marker-review-panel').exists()).toBe(true)
    const renderOptions = adapter.setMarkers.mock.lastCall?.[1]
    expect(renderOptions?.allowCandidateDragging).toBe(true)
    const coordinateClick = adapter.onMapCoordinateClick.mock.calls[0][0]
    coordinateClick({ xNormalized: 0.25, yNormalized: 0.75 })
    await nextTick()
    expect(wrapper.get('.dev-marker-review-panel').text()).toContain('0.250000')
    expect(wrapper.get('.dev-marker-review-panel').text()).toContain('0.750000')
    expect(wrapper.get('.dev-marker-review-panel').text()).toContain('896.00 / 1920.00')
    await wrapper.findAll('.dev-marker-review-panel button').find((button) => button.text() === 'Copy coordinates')!.trigger('click')
    expect(JSON.parse(writeText.mock.calls[0][0])).toEqual({
      xNormalized: 0.25,
      yNormalized: 0.75,
      projectX: 896,
      projectY: 1920,
    })

    const marker = mockDataset.markers.find((entry) => entry.verificationStatus === 'candidate')!
    renderOptions?.onMarkerClick?.(marker)
    await nextTick()
    expect(wrapper.get('.dev-marker-review-panel').text()).toContain(marker.id)
    expect(wrapper.get('.dev-marker-review-panel').text()).toContain(marker.provenance?.sourceExternalId)
    expect(wrapper.get('.dev-marker-review-panel').text()).toContain('candidate')

    const original = { xNormalized: marker.xNormalized, yNormalized: marker.yNormalized }
    renderOptions?.onMarkerDrag?.(marker, { xNormalized: 0.61, yNormalized: 0.42 })
    await nextTick()
    expect(wrapper.get('.dev-marker-review-panel').text()).toContain('0.610000 / 0.420000')
    expect(marker.xNormalized).toBe(original.xNormalized)
    expect(marker.yNormalized).toBe(original.yNormalized)
    expect(marker.provenance?.sourceX).toBe(2428)

    const patchButton = wrapper.findAll('.dev-marker-review-panel button').find((button) => button.text() === 'Copy JSON Patch')!
    await patchButton.trigger('click')
    const patch = JSON.parse(writeText.mock.calls[1][0])
    expect(patch).toEqual({
      markerId: marker.id,
      xNormalized: 0.61,
      yNormalized: 0.42,
      reviewStatus: 'human_reviewed',
    })
    expect(patch).not.toHaveProperty('verificationStatus')
    expect(marker.verificationStatus).toBe('candidate')
    expect(marker.provenance?.sourceX).toBe(2428)

    const resetButton = wrapper.findAll('.dev-marker-review-panel button').find((button) => button.text() === 'Reset to Source')!
    await resetButton.trigger('click')
    expect(adapter.setMarkerPosition).toHaveBeenLastCalledWith(marker.id, original)
    expect(wrapper.get('.dev-marker-review-panel').text()).toContain(`${original.xNormalized.toFixed(6)} / ${original.yNormalized.toFixed(6)}`)
  })

  it('focuses and inspects a key_card POI in dev review without persisting data', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } })
    const { selection, wrapper } = setup('?devReview=1')
    const selector = wrapper.get('#keycard-poi-source-select')
    expect(selector.findAll('option')).toHaveLength(16)
    expect(selector.text()).toContain('165 · Substation Tech Room')

    await selector.setValue('165')
    await flushPromises()
    await nextTick()

    const marker = keycardLocationMarkerCandidates.find((entry) => entry.provenance?.sourceExternalId === '165')!
    const entity = mockDataset.entities.find((entry) => entry.slug === 'substation-tech-room')!
    expect(selection.selectedEntityId).toBe(entity.id)
    expect(adapter.setMarkers.mock.lastCall?.[0]).toEqual([marker])
    expect(adapter.fitMarkers).toHaveBeenCalled()
    expect(adapter.selectMarker).toHaveBeenCalledWith(marker.id)
    expect(wrapper.get('.marker-detail').text()).toContain('Keycard-related location')

    const inspector = wrapper.get('.review-marker-inspector')
    expect(inspector.text()).toContain('Substation Tech Room')
    expect(inspector.text()).toContain('normal: 1x Big safe, 2x Server')
    expect(inspector.text()).toContain('2455 / 1784 / 1')
    expect(inspector.text()).toContain('0.684989 / 0.703125')
    expect(inspector.text()).toContain('Source floor code (z)')
    expect(inspector.text()).toContain('Unknown; source z=1')
    expect(inspector.text()).toContain('Rarity / color evidence')
    expect(inspector.text()).toContain('candidate')

    await wrapper.findAll('.review-marker-inspector button').find((button) => button.text() === 'Copy source ID / coordinates')!.trigger('click')
    await flushPromises()
    expect(JSON.parse(writeText.mock.calls[0][0])).toMatchObject({
      sourceKey: 'key_card',
      sourceExternalId: '165',
      sourceRecordName: 'Substation Tech Room',
      sourceDescription: 'normal: 1x Big safe, 2x Server',
      sourceX: 2455,
      sourceY: 1784,
      sourceZ: 1,
      sourceNormalizedX: marker.xNormalized,
      sourceNormalizedY: marker.yNormalized,
      namedFloorMapping: 'unknown/unverified',
      verificationStatus: 'candidate',
    })
    expect(marker.verificationStatus).toBe('candidate')

    await selector.setValue('225')
    await flushPromises()
    await nextTick()
    expect(wrapper.get('.review-marker-inspector').text()).toContain('Source floor code (z)')
    expect(wrapper.get('.review-marker-inspector').text()).toContain('Not supplied')
    expect(wrapper.get('.review-marker-inspector').text()).toContain('Unknown; source z was not supplied')
  })

  it('reviews temporary source calibration points without mutating dataset markers', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } })
    const server = mockDataset.markers.find((marker) => marker.provenance?.sourceExternalId === '395')!
    const original = { xNormalized: server.xNormalized, yNormalized: server.yNormalized }
    const { wrapper } = setup('?devReview=1')
    await flushPromises()
    const record = deltaForceMapsZeroDamCalibrationRecords.find((candidate) => candidate.sourceExternalId === '165')!

    await wrapper.get('#calibration-source-select').setValue(record.sourceExternalId)
    await nextTick()
    expect(wrapper.get('.review-calibration-tools').text()).toContain('Substation Tech Room')
    expect(adapter.setDevelopmentCalibrationMarker).toHaveBeenLastCalledWith(expect.objectContaining({
      ...calibrationPreviewCoordinates(record),
      title: expect.stringContaining('165'),
      onDrag: expect.any(Function),
    }))

    await wrapper.findAll('.dev-marker-review-panel button').find((button) => button.text() === 'Hide panel')!.trigger('click')
    expect(wrapper.find('.dev-marker-review-panel').exists()).toBe(false)
    expect(wrapper.find('.dev-marker-review-toggle').exists()).toBe(true)
    expect(adapter.setDevelopmentCalibrationMarker).toHaveBeenLastCalledWith(expect.objectContaining({
      ...calibrationPreviewCoordinates(record),
      onDrag: expect.any(Function),
    }))
    adapter.setDevelopmentCalibrationMarker.mock.lastCall?.[0].onDrag({ xNormalized: 0.6123, yNormalized: 0.3341 })
    await nextTick()
    await wrapper.get('.dev-marker-review-toggle').trigger('click')
    expect(wrapper.get('.review-calibration-tools').text()).toContain('0.612300 / 0.334100')
    await wrapper.findAll('.review-calibration-tools button').find((button) => button.text() === 'Copy calibration correspondence')!.trigger('click')
    expect(JSON.parse(writeText.mock.calls[0][0])).toEqual({
      sourceExternalId: '165',
      sourceX: 2455,
      sourceY: 1784,
      sourceZ: 1,
      xNormalized: 0.6123,
      yNormalized: 0.3341,
      calibrationRole: 'fit',
    })
    expect(server.xNormalized).toBe(original.xNormalized)
    expect(server.yNormalized).toBe(original.yNormalized)
    expect(server.verificationStatus).toBe('candidate')

    await wrapper.findAll('.review-calibration-tools button').find((button) => button.text() === 'Reset to source preview')!.trigger('click')
    expect(adapter.setDevelopmentCalibrationMarker).toHaveBeenLastCalledWith(expect.objectContaining(calibrationPreviewCoordinates(record)))
    await wrapper.findAll('.review-calibration-tools button').find((button) => button.text() === 'Clear calibration point')!.trigger('click')
    expect(adapter.setDevelopmentCalibrationMarker).toHaveBeenLastCalledWith(null)
  })

  it('destroys the adapter on unmount', () => {
    const { wrapper } = setup()
    wrapper.unmount()
    wrappers.length = 0
    expect(adapter.destroy).toHaveBeenCalledOnce()
  })
})
