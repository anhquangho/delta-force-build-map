import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import App from '@/App.vue'
import MapView from '@/features/map/MapView.vue'
import { mockDataset } from '@/data/mockDataset'

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

  it('shows only existing map/category choices with difficulty disabled', () => {
    const wrapper = setup()
    expect(wrapper.findAll('#map-select option')).toHaveLength(1)
    expect(wrapper.get('#difficulty-select').attributes('disabled')).toBeDefined()
    expect(wrapper.findAll('.category-button')).toHaveLength(mockDataset.entities.length)
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
