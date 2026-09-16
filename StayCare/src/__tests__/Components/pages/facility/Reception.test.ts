import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { createPinia, setActivePinia } from 'pinia'
import Reception from '@/Components/pages/facility/Reception.vue'
import en from '@/i18n/en.json'

const mockFetchAllOrders = vi.fn()
const mockFetchOrderById = vi.fn()
const mockReceiveAtFacility = vi.fn()

vi.mock('@/api/orders', () => ({
  fetchAllOrders: (...args: any[]) => mockFetchAllOrders(...args),
  fetchOrderById: (...args: any[]) => mockFetchOrderById(...args),
  receiveAtFacility: (...args: any[]) => mockReceiveAtFacility(...args),
}))

vi.mock('@/api/items', () => ({
  fetchAllItems: () => Promise.resolve([
    { _id: 'item-1', item_code: 'SHT', name: 'Shirt', base_price: 5.0, is_active: true },
    { _id: 'item-2', item_code: 'PNT', name: 'Pants', base_price: 8.0, is_active: true },
  ]),
  mapItemForCatalog: (raw: any) => ({
    id: raw._id ?? raw.id,
    code: raw.item_code ?? raw.code,
    name: raw.name,
    unitPrice: Number(raw.unit_price ?? raw.base_price ?? 0),
    active: raw.is_active !== false,
  }),
}))

function createTestI18n() {
  return createI18n({ legacy: false, locale: 'en', messages: { en } })
}

describe('Reception.vue', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    mockFetchAllOrders.mockResolvedValue([
      {
        _id: 'ord-transit-1',
        id: 'ord-transit-1',
        order_number: 'ORD-101',
        status: 'transit',
        client: { name: 'Sunset Resort' },
        service_type: 'standard',
        pickup_date: '2026-10-15',
        estimated_bags: 2,
        items: [
          { item_id: 'item-1', item_code: 'SHT', name: 'Shirt', quantity: 3, unit_price: 5.0 },
        ],
      },
    ])
    mockFetchOrderById.mockResolvedValue({
      _id: 'ord-transit-1',
      id: 'ord-transit-1',
      order_number: 'ORD-101',
      status: 'transit',
      client: { name: 'Sunset Resort' },
      service_type: 'standard',
      pickup_date: '2026-10-15',
      estimated_bags: 2,
      items: [
        { item_id: 'item-1', item_code: 'SHT', name: 'Shirt', quantity: 3, unit_price: 5.0 },
      ],
    })
    mockReceiveAtFacility.mockResolvedValue({})
  })

  it('renders in-transit receivable orders list', async () => {
    const wrapper = mount(Reception, {
      global: { plugins: [createTestI18n()] },
    })
    await flushPromises()

    expect(wrapper.text()).toContain('ORD-101')
    expect(wrapper.text()).toContain('Sunset Resort')
  })

  it('opens order check-in with OrderItemsConditionPicker when Receive button is clicked', async () => {
    const wrapper = mount(Reception, {
      global: { plugins: [createTestI18n()] },
    })
    await flushPromises()

    const receiveBtn = wrapper.findAll('button').find(b => b.text().includes('Receive'))
    expect(receiveBtn).toBeDefined()
    await receiveBtn!.trigger('click')
    await flushPromises()

    const conditionPicker = wrapper.findComponent({ name: 'OrderItemsConditionPicker' })
    expect(conditionPicker.exists()).toBe(true)
    expect(wrapper.text()).toContain('Item Check-In')
    expect(wrapper.text()).toContain('Shirt')
  })

  it('submits reception payload with staff confirmed bags and items', async () => {
    const wrapper = mount(Reception, {
      global: { plugins: [createTestI18n()] },
    })
    await flushPromises()

    const receiveBtn = wrapper.findAll('button').find(b => b.text().includes('Receive'))
    await receiveBtn!.trigger('click')
    await flushPromises()

    const form = wrapper.find('form')
    await form.trigger('submit.prevent')
    await flushPromises()

    expect(mockReceiveAtFacility).toHaveBeenCalledTimes(1)
    const [orderId, payload] = mockReceiveAtFacility.mock.calls[0]
    expect(orderId).toBe('ord-transit-1')
    expect(payload.staff_confirmed_bags).toBe(3)
    expect(payload.items).toEqual([
      {
        item_id: 'item-1',
        quantity: 3,
        qty_good: 3,
        qty_bad: 0,
        qty_stained: 0,
      },
    ])
  })

  it('renders notes badge when an order in transit has special notes', async () => {
    mockFetchAllOrders.mockResolvedValueOnce([
      {
        _id: 'ord-transit-notes',
        id: 'ord-transit-notes',
        order_number: 'ORD-999',
        status: 'transit',
        client: { name: 'Grand Luxury Hotel' },
        service_type: 'express',
        pickup_date: '2026-10-16',
        estimated_bags: 1,
        special_notes: 'Urgent: low-temp delicate wash only',
        items: [],
      },
    ])

    const wrapper = mount(Reception, {
      global: {
        plugins: [createTestI18n()],
        stubs: { Teleport: true },
      },
    })
    await flushPromises()

    expect(wrapper.text()).toContain('ORD-999')
    expect(wrapper.text()).toContain('Grand Luxury Hotel')
    const badge = wrapper.findComponent({ name: 'OrderNotesBadge' })
    expect(badge.exists()).toBe(true)
    expect(badge.props('notes')).toBe('Urgent: low-temp delicate wash only')
  })
})

