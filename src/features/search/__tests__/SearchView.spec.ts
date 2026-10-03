import { describe, it, expect, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { nextTick } from 'vue'
import SearchView from '../SearchView.vue'
import type { SearchSelection } from '@/composables/useSearchSelection'

function createFakeSelection(overrides?: Partial<SearchSelection>): SearchSelection {
  return {
    selectedEntityId: null,
    selectEntity: vi.fn(),
    clear: vi.fn(),
    ...overrides,
  }
}

describe('SearchView', () => {
  it('places live results directly after the input, before sidebar filters', async () => {
    const wrapper = mount(SearchView, {
      props: { selection: createFakeSelection() },
      slots: { default: '<div class="test-filters">Filters</div>' },
    })
    await wrapper.get('input').setValue('sv')
    const dropdown = wrapper.get('.search-dropdown').element
    expect(wrapper.get('input').element.nextElementSibling).toBe(dropdown)
    expect(dropdown.compareDocumentPosition(wrapper.get('.test-filters').element) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(wrapper.find('.result-heading').exists()).toBe(false)
    expect(wrapper.findAll('.results')).toHaveLength(1)
    await wrapper.get('input').setValue('case')
    expect(wrapper.get('.result strong').text()).toBe('Thùng máy tính')
    wrapper.unmount()
  })

  it('supports arrow/Enter selection and closes the dropdown without changing the query', async () => {
    const selection = createFakeSelection()
    const wrapper = mount(SearchView, { props: { selection } })
    const input = wrapper.get('input')
    await input.setValue('sv')
    expect(input.attributes('aria-expanded')).toBe('true')
    await input.trigger('keydown', { key: 'ArrowDown' })
    expect(input.attributes('aria-activedescendant')).toBe(wrapper.get('.result').attributes('id'))
    await input.trigger('keydown', { key: 'Enter' })
    expect(selection.selectEntity).toHaveBeenCalledOnce()
    expect(wrapper.emitted('selected')).toHaveLength(1)
    expect(wrapper.find('.search-dropdown').exists()).toBe(false)
    expect((input.element as HTMLInputElement).value).toBe('sv')
    wrapper.unmount()
  })

  it('dismisses with Escape and blur, reopens on typing, and clears empty queries', async () => {
    const selection = createFakeSelection()
    const wrapper = mount(SearchView, { props: { selection } })
    const input = wrapper.get('input')
    await input.setValue('server')
    await input.trigger('keydown', { key: 'Escape' })
    expect(input.attributes('aria-expanded')).toBe('false')
    expect(selection.selectEntity).not.toHaveBeenCalled()
    await input.setValue('sv')
    expect(input.attributes('aria-expanded')).toBe('true')
    await input.trigger('focusout', { relatedTarget: null })
    expect(input.attributes('aria-expanded')).toBe('false')
    await input.setValue('   ')
    expect(wrapper.find('.search-dropdown').exists()).toBe(false)
    wrapper.unmount()
  })

  it('renders the search input', () => {
    const wrapper = mount(SearchView, { props: { selection: createFakeSelection() } })
    expect(wrapper.find('input[type="search"]').exists()).toBe(true)
  })

  it('shows a hint before the user types', () => {
    const wrapper = mount(SearchView, { props: { selection: createFakeSelection() } })
    expect(wrapper.text()).toContain('Enter an item or location')
  })

  it('shows results for máy chủ', async () => {
    const wrapper = mount(SearchView, { props: { selection: createFakeSelection() } })
    await wrapper.find('input').setValue('máy chủ')
    await nextTick()
    await flushPromises()

    expect(wrapper.find('.result strong').text()).toBe('Máy chủ')
    expect(wrapper.find('.result-english').text()).toBe('Server')
    expect(wrapper.get('.result img').attributes('src')).toBe('/image/Serve.png')
    expect(wrapper.find('.result-count').text()).toContain('4')
    expect(wrapper.text()).toContain('Zero Dam')
  })

  it('shows results for aliases', async () => {
    const wrapper = mount(SearchView, { props: { selection: createFakeSelection() } })
    await wrapper.find('input').setValue('két')
    await nextTick()
    await flushPromises()

    expect(wrapper.find('.result strong').text()).toBe('Két sắt')
    expect(wrapper.find('.result-english').text()).toBe('Safe')
  })

  it('selects an entity when a result is clicked', async () => {
    const selection = createFakeSelection()
    const wrapper = mount(SearchView, { props: { selection } })
    await wrapper.find('input').setValue('máy chủ')
    await nextTick()
    await flushPromises()

    await wrapper.find('.result').trigger('click')
    expect(selection.selectEntity).toHaveBeenCalledOnce()
  })

  it('shows no-results state for unknown query', async () => {
    const wrapper = mount(SearchView, { props: { selection: createFakeSelection() } })
    await wrapper.find('input').setValue('xyzabc')
    await nextTick()
    await flushPromises()

    expect(wrapper.text()).toContain('No results')
  })
})
