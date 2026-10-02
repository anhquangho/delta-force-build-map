import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import ItemIcon from '../ItemIcon.vue'
import { getItemPresentation, type ItemRarity } from '@/lib/item-presentation'

describe('ItemIcon', () => {
  it.each<ItemRarity>(['common', 'uncommon', 'rare', 'epic', 'legendary', 'special'])('supports the %s presentation without upstream classes', (rarity) => {
    const wrapper = mount(ItemIcon, { props: { rarity, size: 48, selected: true, icon: '/local.png' } })
    expect(wrapper.attributes('data-rarity')).toBe(rarity)
    expect(wrapper.attributes('style')).toContain('width: 48px')
    expect(wrapper.classes()).toContain('is-selected')
    expect(wrapper.get('img').attributes('src')).toBe('/local.png')
    wrapper.unmount()
  })

  it('does not invent rarity when none is provided', () => {
    const wrapper = mount(ItemIcon)
    expect(wrapper.attributes('data-rarity')).toBe('unspecified')
    expect(wrapper.find('img').exists()).toBe(false)
    expect(wrapper.text()).toBe('?')
    wrapper.unmount()
  })

  it('uses icon and rarity supplied by entity data without inferring gameplay facts', () => {
    expect(getItemPresentation({ icon: '/icons/server.svg' })).toEqual({ icon: '/icons/server.svg', rarity: undefined })
    expect(getItemPresentation({ icon: '/items/example.png', rarity: 'rare' })).toEqual({ icon: '/items/example.png', rarity: 'rare' })
    expect(getItemPresentation(null)).toEqual({ icon: undefined, rarity: undefined })
  })
})
