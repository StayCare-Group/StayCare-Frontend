import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { createPinia, setActivePinia } from 'pinia'
import RoutePlanner from '@/Components/pages/admin/RoutePlanner.vue'
import en from '@/i18n/en.json'

// ─── Mocks ────────────────────────────────────────────────────────────────────

const { mockOrders, mockDrivers, mockClients } = vi.hoisted(() => {
  return {
    mockOrders: [
      {
        id: 'ord-1',
        _id: 'ord-1',
        order_number: 'ORD-001',
        status: 'pending',
        client_id: 'client-1',
        client: { id: 'client-1', name: 'Hotel Luxe' },
        property_name: 'Main Villa',
        property_address: '123 Ocean Drive',
        pickup_date: '2026-09-05',
        pickup_window_start: '09:00',
        pickup_window_end: '11:00',
        service_type: 'standard',
        estimated_bags: 2,
        actual_bags: null,
      },
      {
        id: 'ord-2',
        _id: 'ord-2',
        order_number: 'ORD-002',
        status: 'pending',
        client_id: 'client-1',
        client: { id: 'client-1', name: 'Hotel Luxe' },
        property_name: 'Sea View Suite',
        property_address: '124 Ocean Drive',
        pickup_date: '2026-09-05',
        pickup_window_start: '10:00',
        pickup_window_end: '12:00',
        service_type: 'express',
        estimated_bags: 3,
        actual_bags: null,
      },
      {
        id: 'ord-3',
        _id: 'ord-3',
        order_number: 'ORD-003',
        status: 'pending',
        client_id: 'client-2',
        client: { id: 'client-2', name: 'Grand Resort' },
        property_name: 'Grand Tower',
        property_address: '456 Hilltop Road',
        pickup_date: '2026-09-05',
        pickup_window_start: '14:00',
        pickup_window_end: '16:00',
        service_type: 'standard',
        estimated_bags: 1,
        actual_bags: null,
      },
      {
        id: 'ord-4',
        _id: 'ord-4',
        order_number: 'ORD-004',
        status: 'ready_to_delivery',
        client_id: 'client-2',
        client: { id: 'client-2', name: 'Grand Resort' },
        property_name: 'Grand Tower',
        property_address: '456 Hilltop Road',
        pickup_date: '2026-09-05',
        pickup_window_start: '15:00',
        pickup_window_end: '17:00',
        service_type: 'standard',
        estimated_bags: 1,
        actual_bags: 1,
      },
    ],
    mockDrivers: [
      { id: 'driver-1', _id: 'driver-1', name: 'Driver John', email: 'john@driver.com', role: 'driver' },
      { id: 'driver-2', _id: 'driver-2', name: 'Driver Alice', email: 'alice@driver.com', role: 'driver' },
    ],
    mockClients: [
      { id: 'client-1', _id: 'client-1', name: 'Hotel Luxe', user_id: 'client-1' },
      { id: 'client-2', _id: 'client-2', name: 'Grand Resort', user_id: 'client-2' },
    ],
  }
})

vi.mock('@/api/orders', () => ({
  fetchOrders: vi.fn().mockResolvedValue(mockOrders),
  fetchAllOrders: vi.fn().mockResolvedValue(mockOrders),
  reassignOrder: vi.fn().mockResolvedValue({ success: true }),
  confirmPickup: vi.fn(),
}))

vi.mock('@/api/routes', () => ({
  fetchRoutes: vi.fn().mockResolvedValue([]),
  fetchAllRoutes: vi.fn().mockResolvedValue([]),
  mapRouteForDriver: vi.fn((r) => r),
  deleteRoute: vi.fn(),
}))

vi.mock('@/api/users', () => ({
  getUsers: vi.fn().mockResolvedValue(mockDrivers),
}))

vi.mock('@/api/clients', () => ({
  fetchClients: vi.fn().mockResolvedValue(mockClients),
}))

vi.mock('@/api/client', () => ({
  apiFetch: vi.fn().mockResolvedValue({ id: 'route-1' }),
}))

vi.mock('@/stores/ui.js', () => ({
  useUiStore: () => ({
    showSuccess: vi.fn(),
    showError: vi.fn(),
  }),
}))

vi.mock('@/stores/nav.js', () => ({
  useNavStore: () => ({
    goToDetail: vi.fn(),
    setPage: vi.fn(),
  }),
}))

function createTestI18n() {
  return createI18n({ legacy: false, locale: 'en', messages: { en } })
}

describe('RoutePlanner.vue', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  function mountComponent() {
    return mount(RoutePlanner, {
      global: {
        plugins: [createTestI18n()],
        stubs: {
          MiniMap: true,
          PickupWindowFields: true,
        },
      },
    })
  }

  it('renders pending pickup orders and shows client filter', async () => {
    const wrapper = mountComponent()
    await flushPromises()

    // Should render 3 pending pickup orders (ord-1, ord-2, ord-3)
    const orderLabels = wrapper.findAll('label.flex.items-start')
    expect(orderLabels.length).toBe(3)

    // Should render ClientFilterSelect
    const clientSelect = wrapper.find('select.cursor-pointer')
    expect(clientSelect.exists()).toBe(true)
  })

  it('filters pending orders when client is selected', async () => {
    const wrapper = mountComponent()
    await flushPromises()

    const clientSelect = wrapper.find('select.cursor-pointer')
    await clientSelect.setValue('client-1')
    await flushPromises()

    // Only 2 orders belong to client-1
    const orderLabels = wrapper.findAll('label.flex.items-start')
    expect(orderLabels.length).toBe(2)
    expect(wrapper.text()).toContain('ORD-001')
    expect(wrapper.text()).toContain('ORD-002')
    expect(wrapper.text()).not.toContain('ORD-003')
  })

  it('allows selecting all visible pending orders at once and deselecting them', async () => {
    const wrapper = mountComponent()
    await flushPromises()

    // Find the select all checkbox
    const selectAllCheckbox = wrapper.find('div.bg-gray-50 input[type="checkbox"]')
    expect(selectAllCheckbox.exists()).toBe(true)

    // Click select all
    await selectAllCheckbox.trigger('change')
    await flushPromises()

    // Form should show 3 orders selected
    expect(wrapper.text()).toContain('3 order(s) selected')

    // Click select all again to deselect
    await selectAllCheckbox.trigger('change')
    await flushPromises()

    // Form should show 0 orders selected
    expect(wrapper.text()).toContain('0 order(s) selected')
  })

  it('selects all orders filtered by client', async () => {
    const wrapper = mountComponent()
    await flushPromises()

    // Filter by client-2
    const clientSelect = wrapper.find('select.cursor-pointer')
    await clientSelect.setValue('client-2')
    await flushPromises()

    // Select all for client-2
    const selectAllCheckbox = wrapper.find('div.bg-gray-50 input[type="checkbox"]')
    await selectAllCheckbox.trigger('change')
    await flushPromises()

    // Only 1 order selected (ORD-003)
    expect(wrapper.text()).toContain('1 order(s) selected')
  })

  it('switches to delivery orders queue and filters appropriately', async () => {
    const wrapper = mountComponent()
    await flushPromises()

    // Click Delivery orders tab
    const queueButtons = wrapper.findAll('div.flex.items-center.gap-2 button')
    const deliveryTab = queueButtons.find(b => b.text().includes('Delivery Orders'))
    expect(deliveryTab).toBeDefined()
    await deliveryTab!.trigger('click')
    await flushPromises()

    // Should show 1 delivery order (ORD-004)
    const orderLabels = wrapper.findAll('label.flex.items-start')
    expect(orderLabels.length).toBe(1)
    expect(wrapper.text()).toContain('ORD-004')
  })

  it('clears selection when switching between pickup and delivery queues', async () => {
    const wrapper = mountComponent()
    await flushPromises()

    // Select all in pickup queue
    const selectAllCheckbox = wrapper.find('div.bg-gray-50 input[type="checkbox"]')
    await selectAllCheckbox.trigger('change')
    await flushPromises()
    expect(wrapper.text()).toContain('3 order(s) selected')

    // Switch to delivery queue
    const queueButtons = wrapper.findAll('div.flex.items-center.gap-2 button')
    const deliveryTab = queueButtons.find(b => b.text().includes('Delivery Orders'))
    await deliveryTab!.trigger('click')
    await flushPromises()

    // Selection should be reset to 0
    expect(wrapper.text()).toContain('0 order(s) selected')

    // Select all in delivery queue
    const deliverySelectAll = wrapper.find('div.bg-gray-50 input[type="checkbox"]')
    await deliverySelectAll.trigger('change')
    await flushPromises()
    expect(wrapper.text()).toContain('1 order(s) selected')
  })
})
