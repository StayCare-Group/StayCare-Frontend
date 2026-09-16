import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import OrderNotesBadge from '@/Components/ui/OrderNotesBadge.vue'
import en from '@/i18n/en.json'

function createTestI18n() {
  return createI18n({ legacy: false, locale: 'en', messages: { en } })
}

describe('OrderNotesBadge.vue', () => {
  const globalOptions = {
    plugins: [createTestI18n()],
    stubs: {
      Teleport: true,
    },
  }

  it('renders nothing when notes prop is empty and no fallback is set', () => {
    const wrapper = mount(OrderNotesBadge, {
      props: { notes: '' },
      global: globalOptions,
    })
    expect(wrapper.html()).toBe('<!--v-if-->')
  })

  it('renders fallback when notes prop is empty and fallback is provided', () => {
    const wrapper = mount(OrderNotesBadge, {
      props: { notes: '', fallback: '—' },
      global: globalOptions,
    })
    expect(wrapper.text()).toBe('—')
  })

  it('renders notes badge with default label when notes are provided', () => {
    const wrapper = mount(OrderNotesBadge, {
      props: { notes: 'Handle with delicate cycle' },
      global: globalOptions,
    })
    expect(wrapper.text()).toContain('Notes')
    expect(wrapper.find('svg').exists()).toBe(true)
  })

  it('allows custom label override', () => {
    const wrapper = mount(OrderNotesBadge, {
      props: { notes: 'Urgent delivery', label: 'Observaciones' },
      global: globalOptions,
    })
    expect(wrapper.text()).toContain('Observaciones')
  })
})
