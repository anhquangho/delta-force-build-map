import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import MarkerDetail from '../MarkerDetail.vue'
import { mockDataset } from '@/data/mockDataset'
import { itemCatalog, ITEM_CATALOG_IDS } from '@/data/itemCatalog'
import { getItemPresentation } from '@/lib/item-presentation'

describe('MarkerDetail', () => {
  it('shows the provided rarity beside bilingual names without inventing it', () => {
    const entity = mockDataset.entities[1]
    const catalogItem = { ...itemCatalog.find((item) => item.id === ITEM_CATALOG_IDS.server)!, rarity: 'rare' as const, iconAssetRef: 'items/server.png' }
    const wrapper = mount(MarkerDetail, {
      props: {
        entity,
        catalogItem,
        marker: mockDataset.markers[0],
        areaName: 'Tòa quản trị / Admin Building',
        categoryName: 'Máy chủ / Server',
        mapName: 'Zero Dam',
        markerCount: 4,
        presentation: getItemPresentation(catalogItem),
      },
    })

    expect(wrapper.get('h2').text()).toBe('Máy chủ')
    expect(wrapper.get('.detail-title p').text()).toBe('Server')
    expect(wrapper.get('.rarity-badge').text()).toBe('Hiếm / Rare')
    expect(wrapper.get('.rarity-badge').classes()).toContain('rarity-rare')
    expect(wrapper.get('.marker-detail').classes()).toContain('rarity-rare')
    expect(wrapper.get('.detail-heading .item-icon').classes()).toContain('rarity-rare')
    expect(wrapper.get('.detail-heading img').attributes('src')).toBe('/items/server.png')
  })

  it('omits the rarity badge when entity rarity is unknown', () => {
    const wrapper = mount(MarkerDetail, {
      props: {
        entity: mockDataset.entities[1],
        marker: mockDataset.markers[0],
        areaName: 'Tòa quản trị / Admin Building',
        categoryName: 'Máy chủ / Server',
        mapName: 'Zero Dam',
        markerCount: 4,
        presentation: { icon: '/icons/server.svg' },
      },
    })

    expect(wrapper.find('.rarity-badge').exists()).toBe(false)
    expect(wrapper.get('.marker-detail').classes()).toContain('rarity-unspecified')
    expect(wrapper.get('.detail-heading .item-icon').classes()).toContain('rarity-unspecified')
  })
})
