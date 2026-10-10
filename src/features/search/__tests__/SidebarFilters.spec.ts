import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { mockDataset } from '@/data/mockDataset'
import SidebarFilters from '../SidebarFilters.vue'

describe('SidebarFilters', () => {
  it('shows the visible source Safe location count', () => {
    const wrapper = mount(SidebarFilters, {
      props: {
        selection: { selectedEntityId: null, selectEntity: vi.fn(), clear: vi.fn() },
      },
    })
    const safeButton = wrapper.findAll('.category-button').find((button) => button.text().includes('Safe'))
    expect(safeButton?.find('.category-count').text()).toBe('11')
    wrapper.unmount()
  })

  it('counts only markers that can be displayed in the local crop', () => {
    const server = mockDataset.entities.find((entity) => entity.slug === 'server')!
    const marker = mockDataset.markers.find((entry) => entry.entityId === server.id)!
    const original = {
      xNormalized: marker.xNormalized,
      yNormalized: marker.yNormalized,
      withinLocalCrop: marker.withinLocalCrop,
    }
    let wrapper: ReturnType<typeof mount> | undefined
    try {
      marker.xNormalized = 1.1
      marker.withinLocalCrop = false
      wrapper = mount(SidebarFilters, {
        props: {
          selection: { selectedEntityId: null, selectEntity: vi.fn(), clear: vi.fn() },
        },
      })
      const serverButton = wrapper.findAll('.category-button').find((button) => button.text().includes('Server'))
      expect(serverButton?.find('.category-count').text()).toBe('2')
    } finally {
      wrapper?.unmount()
      marker.xNormalized = original.xNormalized
      marker.yNormalized = original.yNormalized
      if (original.withinLocalCrop === undefined) delete marker.withinLocalCrop
      else marker.withinLocalCrop = original.withinLocalCrop
    }
  })
})
