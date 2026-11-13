import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import AlertsCard from '@/Components/dashboard/AlertsCard.vue'
import en from '@/i18n/en.json'

function createTestI18n() {
  return createI18n({ legacy: false, locale: 'en', messages: { en } })
}

describe('AlertsCard.vue', () => {
  it('renders clean empty state and green zero badge when there are no alerts', () => {
    const wrapper = mount(AlertsCard, {
      global: { plugins: [createTestI18n()] },
      props: {
        alerts: {
          thresholdHours: 24,
          totalAlerts: 0,
          overduePickups: [],
          stalledOrders: [],
        },
      },
    })

    const totalBadge = wrapper.find('[data-testid="alerts-total-badge"]')
    expect(totalBadge.text()).toBe('0')
    expect(totalBadge.classes()).toContain('bg-emerald-100')

    const empty = wrapper.find('[data-testid="alerts-empty"]')
    expect(empty.exists()).toBe(true)
    expect(empty.text()).toContain(en.admin.noOverduePickups)
  })

  it('renders overdue pickups list and switches tabs to stalled orders', async () => {
    const wrapper = mount(AlertsCard, {
      global: { plugins: [createTestI18n()] },
      props: {
        alerts: {
          thresholdHours: 24,
          totalAlerts: 3,
          overduePickups: [
            {
              orderId: 'ord-1',
              orderNumber: 'ORD-101',
              clientId: 'cli-1',
              clientName: 'Client Alpha',
              status: 'pending',
              hoursDelayed: 32,
              referenceDate: '2026-11-09T13:00:00.000Z',
              specialNotes: 'Call client upon arrival',
            },
          ],
          stalledOrders: [
            {
              orderId: 'ord-2',
              orderNumber: 'ORD-102',
              clientId: 'cli-2',
              clientName: 'Client Beta',
              status: 'washing',
              hoursDelayed: 50,
              referenceDate: '2026-11-08T19:00:00.000Z',
            },
            {
              orderId: 'ord-3',
              orderNumber: 'ORD-103',
              clientId: 'cli-3',
              clientName: 'Client Gamma',
              status: 'ready_to_delivery',
              hoursDelayed: 26,
              referenceDate: '2026-11-09T19:00:00.000Z',
            },
          ],
        },
      },
    })

    // Total badge shows 3 with red styling
    const totalBadge = wrapper.find('[data-testid="alerts-total-badge"]')
    expect(totalBadge.text()).toBe('3')
    expect(totalBadge.classes()).toContain('bg-red-100')

    // Initial tab is 'pickups'
    let items = wrapper.findAll('[data-testid="alert-item"]')
    expect(items).toHaveLength(1)
    expect(items[0].text()).toContain('ORD-101')
    expect(items[0].text()).toContain('Client Alpha')
    expect(items[0].text()).toContain(en.facility.notes)

    // Click stalled tab
    await wrapper.find('[data-testid="tab-stalled-orders"]').trigger('click')

    items = wrapper.findAll('[data-testid="alert-item"]')
    expect(items).toHaveLength(2)
    expect(items[0].text()).toContain('ORD-102')
    expect(items[1].text()).toContain('ORD-103')
  })

  it('emits view-order when clicking an alert item', async () => {
    const wrapper = mount(AlertsCard, {
      global: { plugins: [createTestI18n()] },
      props: {
        alerts: {
          thresholdHours: 24,
          totalAlerts: 1,
          overduePickups: [
            {
              orderId: 'ord-target',
              orderNumber: 'ORD-999',
              clientId: 'cli-1',
              clientName: 'Client Target',
              status: 'assigned',
              hoursDelayed: 28,
              referenceDate: '2026-11-09T17:00:00.000Z',
            },
          ],
          stalledOrders: [],
        },
      },
    })

    await wrapper.find('[data-testid="alert-item"]').trigger('click')

    expect(wrapper.emitted('view-order')).toBeTruthy()
    expect(wrapper.emitted('view-order')![0]).toEqual(['ord-target'])
  })

  it('renders loading state when loading prop is true', () => {
    const wrapper = mount(AlertsCard, {
      global: { plugins: [createTestI18n()] },
      props: {
        loading: true,
      },
    })

    expect(wrapper.find('[data-testid="alerts-loading"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="alerts-list"]').exists()).toBe(false)
  })
})

