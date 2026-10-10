import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import App from '@/App.vue'
import MapView from '@/features/map/MapView.vue'
import { mockDataset } from '@/data/mockDataset'
import { itemCatalog, ITEM_CATALOG_IDS } from '@/data/itemCatalog'

vi.mock('@/features/map/MapView.vue', () => ({
  default: { props: ['selection', 'focusRequest'], template: '<div class="map-stub" />' },
}))
let matches = false
beforeEach(() => {
  vi.stubGlobal('matchMedia', () => ({ matches, addEventListener: vi.fn(), removeEventListener: vi.fn() }))
})
const wrappers: ReturnType<typeof mount>[] = []
afterEach(() => {
  wrappers.forEach((wrapper) => wrapper.unmount())
  wrappers.length = 0
  vi.unstubAllGlobals()
  matches = false
})
function setup() {
  const wrapper = mount(App, { attachTo: document.body })
  wrappers.push(wrapper)
  return wrapper
}

describe('map/sidebar shell', () => {
  it('uses exactly one state-aware toggle outside the inert map workspace', async () => {
    const wrapper = setup()
    expect(wrapper.findAll('[aria-controls="map-sidebar"]')).toHaveLength(1)
    expect(wrapper.find('.sidebar-close').exists()).toBe(false)
    const toggle = wrapper.get('.sidebar-toggle')
    expect(toggle.text()).toBe('←')
    expect(toggle.attributes('aria-expanded')).toBe('true')
    expect(toggle.element.closest('.map-workspace')).toBeNull()
    await toggle.trigger('click')
    expect(toggle.text()).toBe('☰')
    expect(toggle.attributes('aria-expanded')).toBe('false')
    expect(wrapper.get('aside').attributes('inert')).toBeDefined()
    await toggle.trigger('click')
    expect(toggle.text()).toBe('←')
    expect(wrapper.get('aside').attributes('inert')).toBeUndefined()
  })

  it('keeps query and result selection through collapse and reopen', async () => {
    const wrapper = setup()
    await wrapper.get('input').setValue('may chu')
    await wrapper.get('.result').trigger('click')
    const selectedId = wrapper.findComponent(MapView).props('selection').selectedEntityId
    expect(wrapper.find('.search-dropdown').exists()).toBe(false)
    await wrapper.get('.sidebar-toggle').trigger('click')
    expect(wrapper.get('aside').attributes('aria-hidden')).toBe('true')
    await wrapper.get('.sidebar-toggle').trigger('click')
    expect(wrapper.get('aside').attributes('aria-hidden')).toBe('false')
    expect((wrapper.get('input').element as HTMLInputElement).value).toBe('may chu')
    expect(wrapper.get('.result').attributes('data-selected')).toBe('true')
    expect(wrapper.findComponent(MapView).props('selection').selectedEntityId).toBe(selectedId)
  })

  it.each(['máy chủ', 'may chu', 'server', 'sv'])('activates the same entity for %s', async (query) => {
    const wrapper = setup()
    await wrapper.get('input').setValue(query)
    await wrapper.get('.result').trigger('click')
    const map = wrapper.findComponent(MapView)
    expect(map.props('selection').selectedEntityId).toBe(mockDataset.entities.find((entity) => entity.slug === 'server')?.id)
    expect(map.props('focusRequest')).toBe(1)
    const selectedCategory = wrapper.findAll('.category-button').find((button) => button.attributes('aria-pressed') === 'true')
    expect(selectedCategory?.text()).toContain('Server')
  })

  it.each([
    ['Thẻ khóa phòng kỹ thuật trạm điện', 'substation-tech-room-keycard', 'Substation Tech Room Keycard'],
    ['Thẻ kho lưu trữ ngầm', 'underground-vault-storage-keycard', 'Underground Vault Storage Keycard'],
  ])('selects the keycard search result for %s and requests map focus', async (query, slug, nameEn) => {
    const wrapper = setup()
    await wrapper.get('input').setValue(query)
    const result = wrapper.findAll('.result').find((option) => option.find('.result-english').text() === nameEn)
    expect(result).toBeDefined()
    await result!.trigger('click')
    const entity = mockDataset.entities.find((entry) => entry.slug === slug)
    const map = wrapper.findComponent(MapView)
    expect(map.props('selection').selectedEntityId).toBe(entity?.id)
    expect(map.props('focusRequest')).toBe(1)
  })

  it('propagates known catalog rarity into search and sidebar icons', async () => {
    const item = itemCatalog.find((entry) => entry.id === ITEM_CATALOG_IDS.server)!
    const previousRarity = item.rarity
    item.rarity = 'rare'
    try {
      const wrapper = setup()
      await wrapper.get('input').setValue('server')
      expect(wrapper.get('.result .item-icon').attributes('data-rarity')).toBe('rare')
      expect(wrapper.get('.result .item-icon').classes()).toContain('rarity-rare')
      const category = wrapper.findAll('.category-button').find((button) => button.text().includes('Server'))
      expect(category?.get('.item-icon').attributes('data-rarity')).toBe('rare')
      expect(category?.get('.item-icon').classes()).toContain('rarity-rare')
    } finally {
      item.rarity = previousRarity
    }
  })

  it('shows the keycard category and activates each sample from the sidebar', async () => {
    const wrapper = setup()
    const keycardButtons = wrapper.findAll('.category-button').filter((button) => button.text().includes('Keycard'))
    expect(keycardButtons).toHaveLength(2)
    for (const button of keycardButtons) {
      await button.trigger('click')
      const selected = mockDataset.entities.find((entity) => entity.id === wrapper.findComponent(MapView).props('selection').selectedEntityId)
      expect(selected?.slug).toMatch(/keycard$/)
      expect(wrapper.findComponent(MapView).props('focusRequest')).toBeTruthy()
    }
  })

  it('shows only existing map/category choices with difficulty disabled', () => {
    const wrapper = setup()
    expect(wrapper.findAll('#map-select option')).toHaveLength(1)
    expect(wrapper.get('#difficulty-select').attributes('disabled')).toBeDefined()
    const categoryShortcutEntities = mockDataset.entities.filter((entity) =>
      mockDataset.categories.some((category) => category.id === entity.categoryId && category.parentId),
    )
    expect(wrapper.findAll('.category-button')).toHaveLength(categoryShortcutEntities.length)
    expect(wrapper.findAll('.item-icon').every((icon) => icon.attributes('data-rarity') === 'unspecified')).toBe(true)
  })

  it('starts collapsed on narrow screens and closes the drawer after selection', async () => {
    matches = true
    const wrapper = setup()
    await wrapper.vm.$nextTick()
    expect(wrapper.get('aside').attributes('aria-hidden')).toBe('true')
    await wrapper.get('.sidebar-toggle').trigger('click')
    expect(wrapper.get('.map-workspace').attributes('inert')).toBeDefined()
    await wrapper.get('input').setValue('sv')
    await wrapper.get('.result').trigger('click')
    expect(wrapper.get('aside').attributes('aria-hidden')).toBe('true')
    expect(wrapper.get('.map-workspace').attributes('inert')).toBeUndefined()
  })
})
