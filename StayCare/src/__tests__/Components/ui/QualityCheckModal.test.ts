import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { createPinia, setActivePinia } from 'pinia'
import QualityCheckModal from '@/Components/ui/QualityCheckModal.vue'
import en from '@/i18n/en.json'

// ─── Stubs & Mocks ──────────────────────────────────────────────────────────
const mockFetchOrderById = vi.fn()
const mockUpdateOrder = vi.fn()
const mockUpdateOrderStatus = vi.fn()
const mockPrintOrderPdf = vi.fn()

vi.mock('@/api/orders', () => ({
  fetchOrderById: (...args: any[]) => mockFetchOrderById(...args),
  updateOrder: (...args: any[]) => mockUpdateOrder(...args),
  updateOrderStatus: (...args: any[]) => mockUpdateOrderStatus(...args),
}))

vi.mock('@/utils/generateOrderPdf.js', () => ({
  printOrderPdf: (...args: any[]) => mockPrintOrderPdf(...args),
  generateOrderPdf: vi.fn(),
  buildOrderPdfDoc: vi.fn(),
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

const mockOrderProp = {
  _id: 'ord-123',
  id: 'ORD-123',
  client: 'Grand Hotel',
  status: 'quality_check',
}

const mockOrderApiData = {
  _id: 'ord-123',
  order_number: 'ORD-123',
  client: { name: 'Grand Hotel' },
  status: 'quality_check',
  items: [
    { item_id: 'item-1', item_code: 'TWL', name: 'Towel', quantity: 4, qty_good: 4, qty_bad: 0, qty_stained: 0 },
  ],
}

describe('QualityCheckModal.vue', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setActivePinia(createPinia())
    mockFetchOrderById.mockResolvedValue(mockOrderApiData)
    mockUpdateOrder.mockResolvedValue({})
    mockUpdateOrderStatus.mockResolvedValue({})
  })

  function mountModal(props: Record<string, unknown> = {}) {
    return mount(QualityCheckModal, {
      global: {
        plugins: [createTestI18n()],
        stubs: {
          AppModal: AppModalStub,
        },
      },
      props: {
        show: true,
        order: mockOrderProp,
        ...props,
      },
    })
  }

  it('renders both Confirm & Release and Confirm & Print buttons', async () => {
    const wrapper = mountModal()
    await flushPromises()

    const text = wrapper.text()
    expect(text).toContain('Confirm & Release')
    expect(text).toContain('Confirm & Print')
  })

  it('confirming without print does not call printOrderPdf', async () => {
    const wrapper = mountModal()
    await flushPromises()

    // Find the Confirm & Release button
    const buttons = wrapper.findAll('button')
    const confirmBtn = buttons.find(b => b.text().includes('Confirm & Release'))
    expect(confirmBtn).toBeDefined()

    await confirmBtn!.trigger('click')
    await flushPromises()

    expect(mockUpdateOrderStatus).toHaveBeenCalledWith('ord-123', 'ready_to_delivery', expect.any(Object))
    expect(mockPrintOrderPdf).not.toHaveBeenCalled()
    expect(wrapper.emitted('success')).toBeTruthy()
    expect(wrapper.emitted('close')).toBeTruthy()
  })

  it('confirming with print calls printOrderPdf and updates status', async () => {
    const wrapper = mountModal()
    await flushPromises()

    // Find the Confirm & Print button
    const buttons = wrapper.findAll('button')
    const printBtn = buttons.find(b => b.text().includes('Confirm & Print'))
    expect(printBtn).toBeDefined()

    await printBtn!.trigger('click')
    await flushPromises()

    expect(mockUpdateOrderStatus).toHaveBeenCalledWith('ord-123', 'ready_to_delivery', expect.any(Object))
    expect(mockPrintOrderPdf).toHaveBeenCalledTimes(1)
    const printedArg = mockPrintOrderPdf.mock.calls[0][0]
    expect(printedArg.id).toBe('ORD-123')
    expect(printedArg.status).toBe('ready_to_delivery')
    expect(printedArg.items).toHaveLength(1)
    expect(wrapper.emitted('success')).toBeTruthy()
    expect(wrapper.emitted('close')).toBeTruthy()
  })
})
