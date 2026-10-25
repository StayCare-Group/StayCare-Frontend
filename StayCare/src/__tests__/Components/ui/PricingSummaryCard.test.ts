import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import PricingSummaryCard from '@/Components/ui/PricingSummaryCard.vue'

describe('PricingSummaryCard.vue', () => {
  const globalOptions = {
    mocks: {
      $t: (key: string) => {
        const translations: Record<string, string> = {
          'admin.subtotal': 'Subtotal',
          'admin.expressSurcharge': 'Express Surcharge',
          'admin.vatPercent': 'VAT (18%)',
          'admin.vat': 'VAT',
          'common.vatIncluded': 'VAT included in price',
          'admin.grandTotal': 'Grand Total',
        }
        return translations[key] || key
      },
    },
  }

  it('renders default subtotal, vatAmount, and total correctly', () => {
    const wrapper = mount(PricingSummaryCard, {
      props: {
        subtotal: 100,
        vatAmount: 18,
        total: 118,
      },
      global: globalOptions,
    })

    expect(wrapper.text()).toContain('Subtotal')
    expect(wrapper.text()).toContain('€100.00')
    expect(wrapper.text()).toContain('VAT (18%)')
    expect(wrapper.text()).toContain('€18.00')
    expect(wrapper.text()).toContain('Grand Total')
    expect(wrapper.text()).toContain('€118.00')
    expect(wrapper.text()).not.toContain('Express Surcharge')
  })

  it('renders VAT included in price when vatAmount is 0', () => {
    const wrapper = mount(PricingSummaryCard, {
      props: {
        subtotal: 100,
        vatAmount: 0,
        total: 100,
      },
      global: globalOptions,
    })

    expect(wrapper.text()).toContain('Subtotal')
    expect(wrapper.text()).toContain('€100.00')
    expect(wrapper.text()).toContain('VAT')
    expect(wrapper.text()).toContain('VAT included in price')
    expect(wrapper.text()).toContain('Grand Total')
    expect(wrapper.text()).toContain('€100.00')
  })

  it('renders title and surcharge when provided', () => {
    const wrapper = mount(PricingSummaryCard, {
      props: {
        title: 'Price Breakdown',
        subtotal: 50,
        surcharge: 25,
        vatAmount: 13.5,
        total: 88.5,
      },
      global: globalOptions,
    })

    expect(wrapper.text()).toContain('Price Breakdown')
    expect(wrapper.text()).toContain('Express Surcharge')
    expect(wrapper.text()).toContain('€25.00')
  })

  it('renders custom labels when provided', () => {
    const wrapper = mount(PricingSummaryCard, {
      props: {
        subtotal: 100,
        vatAmount: 18,
        total: 118,
        subtotalLabel: 'Base Amount',
        vatLabel: 'Tax (18%)',
        totalLabel: 'Estimated Total',
      },
      global: globalOptions,
    })

    expect(wrapper.text()).toContain('Base Amount')
    expect(wrapper.text()).toContain('Tax (18%)')
    expect(wrapper.text()).toContain('Estimated Total')
  })

  it('applies max-w-xs ml-auto when alignRight is true', () => {
    const wrapper = mount(PricingSummaryCard, {
      props: {
        subtotal: 100,
        vatAmount: 18,
        total: 118,
        alignRight: true,
      },
      global: globalOptions,
    })

    const innerDiv = wrapper.find('.max-w-xs.ml-auto')
    expect(innerDiv.exists()).toBe(true)
  })
})
