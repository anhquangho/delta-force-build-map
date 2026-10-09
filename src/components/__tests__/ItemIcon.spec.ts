import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import ItemIcon from '../ItemIcon.vue'
import { getItemPresentation, type ItemRarity } from '@/lib/item-presentation'
import { itemCatalog, ITEM_CATALOG_IDS } from '@/data/itemCatalog'
import { mockDataset } from '@/data/mockDataset'

describe('ItemIcon', () => {
  it.each<ItemRarity>(['common', 'uncommon', 'rare', 'epic', 'legendary', 'special'])('supports the %s presentation without upstream classes', (rarity) => {
    const wrapper = mount(ItemIcon, { props: { rarity, size: 48, selected: true, icon: '/local.png' } })
    expect(wrapper.attributes('data-rarity')).toBe(rarity)
    expect(wrapper.classes()).toContain(`rarity-${rarity}`)
    expect(wrapper.attributes('style')).toContain('width: 48px')
    expect(wrapper.classes()).toContain('is-selected')
    expect(wrapper.get('img').attributes('src')).toBe('/local.png')
    wrapper.unmount()
  })

  it('does not invent rarity when none is provided', () => {
    const wrapper = mount(ItemIcon)
    expect(wrapper.attributes('data-rarity')).toBe('unspecified')
    expect(wrapper.classes()).toContain('rarity-unspecified')
    expect(wrapper.find('img').exists()).toBe(false)
    expect(wrapper.text()).toBe('?')
    wrapper.unmount()
  })

  it('falls back from a transparent PNG to the local placeholder on image error', async () => {
    const wrapper = mount(ItemIcon, {
      props: { icon: '/items/example.png', fallbackIcon: '/icons/server.svg' },
    })
    expect(wrapper.get('img').attributes('src')).toBe('/items/example.png')
    await wrapper.get('img').trigger('error')
    expect(wrapper.get('img').attributes('src')).toBe('/icons/server.svg')
    await wrapper.get('img').trigger('error')
    expect(wrapper.find('img').exists()).toBe(false)
    expect(wrapper.text()).toBe('?')
  })

  it('uses catalog icon data for linked map entities without inferring rarity', () => {
    const entity = mockDataset.entities.find((entry) => entry.catalogItemId === ITEM_CATALOG_IDS.server)!
    const serverItem = itemCatalog.find((item) => item.id === ITEM_CATALOG_IDS.server)!
    expect(getItemPresentation(entity)).toEqual({ icon: '/image/Serve.png', fallbackIcon: '/icons/server.svg', rarity: undefined })
    expect(getItemPresentation({ ...serverItem, iconAssetRef: 'items/server.png', rarity: 'rare' })).toEqual({
      icon: '/items/server.png',
      fallbackIcon: '/icons/server.svg',
      rarity: 'rare',
    })
    expect(getItemPresentation(null)).toEqual({ icon: undefined, fallbackIcon: undefined, rarity: undefined })
  })
})
