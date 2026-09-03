import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import InfoGridCard from '@/Components/ui/InfoGridCard.vue'

describe('InfoGridCard.vue', () => {
  it('renders title and item list correctly', () => {
    const items = [
      { label: 'Client', value: 'Hotel Sunshine' },
      { label: 'Service', value: 'Standard Laundry' },
    ]

    const wrapper = mount(InfoGridCard, {
      props: {
        title: 'Order Info',
        items,
      },
    })

    expect(wrapper.text()).toContain('Order Info')
    expect(wrapper.text()).toContain('Client')
    expect(wrapper.text()).toContain('Hotel Sunshine')
    expect(wrapper.text()).toContain('Service')
    expect(wrapper.text()).toContain('Standard Laundry')
  })

  it('handles null, undefined and empty values with fallbackValue', () => {
    const items = [
      { label: 'Driver', value: null },
      { label: 'Special Notes', value: '', fallback: 'No notes' },
      { label: 'Actual Bags', value: undefined },
    ]

    const wrapper = mount(InfoGridCard, {
      props: {
        items,
        fallbackValue: 'N/A',
      },
    })

    expect(wrapper.text()).toContain('Driver')
    expect(wrapper.text()).toContain('N/A')
    expect(wrapper.text()).toContain('Special Notes')
    expect(wrapper.text()).toContain('No notes')
  })

  it('filters out items with show === false', () => {
    const items = [
      { label: 'Visible 1', value: 'Val 1', show: true },
      { label: 'Hidden Item', value: 'Val 2', show: false },
      { label: 'Visible 2', value: 'Val 3' },
    ]

    const wrapper = mount(InfoGridCard, {
      props: { items },
    })

    expect(wrapper.text()).toContain('Visible 1')
    expect(wrapper.text()).toContain('Visible 2')
    expect(wrapper.text()).not.toContain('Hidden Item')
  })

  it('supports custom slots: header, header-extra, item-key, and footer', () => {
    const items = [
      { key: 'phone', label: 'Phone', value: '+34 600 000 000' },
      { key: 'address', label: 'Address', value: 'Calle Gran Via 1' },
    ]

    const wrapper = mount(InfoGridCard, {
      props: { items },
      slots: {
        header: '<h2>Custom Header Title</h2>',
        'header-extra': '<span class="badge">Active</span>',
        'item-phone': '<a href="tel:+34600000000">Call Now</a>',
        footer: '<div class="footer-note">Special Notice</div>',
      },
    })

    expect(wrapper.text()).toContain('Custom Header Title')
    expect(wrapper.find('.badge').text()).toBe('Active')
    expect(wrapper.find('a').text()).toBe('Call Now')
    expect(wrapper.find('.footer-note').text()).toBe('Special Notice')
  })

  it('applies col-span-full when fullWidth is true on item', () => {
    const items = [
      { label: 'Full Item', value: 'Wide content', fullWidth: true },
    ]

    const wrapper = mount(InfoGridCard, {
      props: { items },
    })

    const itemDiv = wrapper.find('.col-span-full')
    expect(itemDiv.exists()).toBe(true)
  })
})
