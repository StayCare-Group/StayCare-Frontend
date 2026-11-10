import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import OrdersLineChart from '@/Components/dashboard/OrdersLineChart.vue'
import en from '@/i18n/en.json'

function mountChart(props: {
  points: { date: string; orders: number }[]
  granularity?: 'day' | 'month'
}) {
  const i18n = createI18n({ legacy: false, locale: 'en', messages: { en } })
  return mount(OrdersLineChart, {
    props,
    global: { plugins: [i18n] },
  })
}

describe('OrdersLineChart.vue', () => {
  it('shows the empty state when all points have 0 orders', () => {
    const wrapper = mountChart({
      granularity: 'day',
      points: [
        { date: '2026-11-01', orders: 0 },
        { date: '2026-11-02', orders: 0 },
      ],
    })

    expect(wrapper.find('[data-testid="orders-line-chart-empty"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="orders-line-chart-svg"]').exists()).toBe(false)
  })

  it('renders all 12 monthly points and value labels in month granularity', () => {
    const points = Array.from({ length: 12 }, (_, idx) => ({
      date: `2026-${String(idx + 1).padStart(2, '0')}`,
      orders: (idx + 1) * 10,
    }))

    const wrapper = mountChart({ granularity: 'month', points })

    expect(wrapper.find('[data-testid="orders-line-chart-svg"]').exists()).toBe(true)
    expect(wrapper.findAll('[data-testid="orders-line-point"]')).toHaveLength(12)
    expect(wrapper.findAll('[data-testid="orders-line-value"]')).toHaveLength(12)

    const axisLabels = wrapper
      .findAll('[data-testid="orders-line-axis-label"]')
      .map((el) => el.text())
    expect(axisLabels[0]).toBe('Jan')
    expect(axisLabels[11]).toBe('Dec')
  })

  it('spaces axis labels and value labels when rendering 31 daily points so text does not collide', () => {
    const points = Array.from({ length: 31 }, (_, idx) => ({
      date: `2026-10-${String(idx + 1).padStart(2, '0')}`,
      orders: idx === 14 ? 50 : 12,
    }))

    const wrapper = mountChart({ granularity: 'day', points })

    expect(wrapper.findAll('[data-testid="orders-line-point"]')).toHaveLength(31)

    const axisLabels = wrapper
      .findAll('[data-testid="orders-line-axis-label"]')
      .map((el) => el.text())
    expect(axisLabels[0]).toBe('1')
    expect(axisLabels[axisLabels.length - 1]).toBe('31')
    expect(axisLabels.length).toBeLessThan(31)

    const valueLabels = wrapper
      .findAll('[data-testid="orders-line-value"]')
      .map((el) => el.text())
    expect(valueLabels).toContain('50')
    expect(valueLabels.length).toBeLessThan(31)
  })
})

