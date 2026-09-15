import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { createPinia, setActivePinia } from 'pinia'
import EditOrderModal from '@/Components/ui/EditOrderModal.vue'
import en from '@/i18n/en.json'

const mockUpdateOrder = vi.fn()

vi.mock('@/api/orders', () => ({
  updateOrder: (...args: any[]) => mockUpdateOrder(...args),
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

const AppModalStub = {
  name: 'AppModal',
  props: ['show', 'title', 'size', 'closeOnBackdrop', 'loading'],
  emits: ['close'],
  template: `
    <div v-if="show" data-testid="modal">
      <div data-testid="modal-title">{{ title }}</div>
      <slot />
      <div data-testid="modal-footer"><slot name="footer" /></div>
      <button data-testid="modal-close-x" @click="$emit('close')" />
    </div>
  `,
}

function createTestI18n() {
  return createI18n({ legacy: false, locale: 'en', messages: { en } })
}

describe('EditOrderModal.vue', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  const preReceiveOrder = {
    _id: 'ord-123',
    id: 'ORD-123',
    status: 'pending',
    pickupDate: '2026-10-15',
    pickupTimeWindow: '08:00 - 10:00',
    estimatedBags: 2,
    specialNotes: 'Ring bell',
    isInvoiced: false,
    items: [
      { itemId: 'item-1', code: 'SHT', name: 'Shirt', qty: 3, unitPrice: 5.0 },
    ],
  }

  const postReceiveOrder = {
    _id: 'ord-456',
    id: 'ORD-456',
    status: 'washing',
    pickupDate: '2026-09-01',
    pickupTimeWindow: '08:00 - 10:00',
    estimatedBags: 3,
    specialNotes: 'Fragile fabrics',
    isInvoiced: false,
    items: [
      { itemId: 'item-1', code: 'SHT', name: 'Shirt', qty: 4, qtyGood: 3, qtyBad: 1, qtyStained: 0, unitPrice: 5.0 },
    ],
  }

  function mountModal(props: Record<string, unknown> = {}) {
    return mount(EditOrderModal, {
      global: {
        plugins: [createTestI18n()],
        stubs: {
          AppModal: AppModalStub,
        },
      },
      props: {
        show: true,
        order: preReceiveOrder,
        isAdminOrStaff: true,
        ...props,
      },
    })
  }

  it('renders pre-receive modal with OrderItemsPicker when order status is pending', async () => {
    const wrapper = mountModal({ order: preReceiveOrder })
    await flushPromises()

    expect(wrapper.findComponent({ name: 'OrderItemsPicker' }).exists()).toBe(true)
    expect(wrapper.findComponent({ name: 'OrderItemsConditionPicker' }).exists()).toBe(false)
  })

  it('renders post-receive modal with OrderItemsConditionPicker when order status is washing', async () => {
    const wrapper = mountModal({ order: postReceiveOrder })
    await flushPromises()

    expect(wrapper.findComponent({ name: 'OrderItemsConditionPicker' }).exists()).toBe(true)
    expect(wrapper.findComponent({ name: 'OrderItemsPicker' }).exists()).toBe(false)
  })

  it('submits edit payload correctly for post-receive orders', async () => {
    mockUpdateOrder.mockResolvedValue({ id: 'ORD-456', status: 'washing' })

    const wrapper = mountModal({ order: postReceiveOrder })
    await flushPromises()

    const form = wrapper.find('form')
    await form.trigger('submit')
    await flushPromises()

    expect(mockUpdateOrder).toHaveBeenCalledTimes(1)
    const [orderId, payload] = mockUpdateOrder.mock.calls[0]
    expect(orderId).toBe('ord-456')
    expect(payload.items).toEqual([
      {
        item_id: 'item-1',
        quantity: 4,
        qty_good: 3,
        qty_bad: 1,
        qty_stained: 0,
      },
    ])
    expect(wrapper.emitted('success')).toBeTruthy()
    expect(wrapper.emitted('close')).toBeTruthy()
  })

  it('blocks submit if order is invoiced', async () => {
    const invoicedOrder = { ...postReceiveOrder, isInvoiced: true }
    const wrapper = mountModal({ order: invoicedOrder })
    await flushPromises()

    const form = wrapper.find('form')
    await form.trigger('submit')
    await flushPromises()

    expect(mockUpdateOrder).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain('An invoiced order cannot be edited')
  })
})
