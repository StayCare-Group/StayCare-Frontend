import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { createPinia, setActivePinia } from 'pinia'
import OrdersList from '@/Components/pages/shared/OrdersList.vue'
import en from '@/i18n/en.json'

// ─── Mocks de servicios y composables ────────────────────────────────────────

const { mockDownloadOrdersFlatCsv, mockDownloadOrdersStainedCsv, mockFetchAllOrders } = vi.hoisted(() => ({
  mockDownloadOrdersFlatCsv: vi.fn().mockResolvedValue(undefined),
  mockDownloadOrdersStainedCsv: vi.fn().mockResolvedValue(undefined),
  mockFetchAllOrders: vi.fn(),
}))

vi.mock('@/router', () => ({
  default: {
    push: vi.fn(),
    currentRoute: { value: { name: 'Dashboard' } },
  },
}))

vi.mock('@/api/clients', () => ({
  fetchClients: vi.fn().mockResolvedValue([
    { id: 'client-1', name: 'Hotel Luxe', user_id: 'client-1' },
    { id: 'client-2', name: 'Grand Resort', user_id: 'client-2' },
  ]),
}))

vi.mock('@/api/orders', () => ({
  fetchAllOrders: mockFetchAllOrders,
  downloadOrdersFlatCsv: mockDownloadOrdersFlatCsv,
  downloadOrdersStainedCsv: mockDownloadOrdersStainedCsv,
}))

let mockIsAdminOrStaff = true
let mockIsClient = false
vi.mock('@/stores/auth.js', () => ({
  useAuthStore: () => ({
    user: { id: 'u1', name: 'Test User', role: mockIsAdminOrStaff ? 'admin' : 'client' },
    isAdmin: mockIsAdminOrStaff,
    isAdminOrStaff: mockIsAdminOrStaff,
    isClient: mockIsClient,
    hasPermission: () => true,
    clientProfile: { is_complete: true },
  }),
}))

const mockShowError = vi.fn()
const mockShowSuccess = vi.fn()
vi.mock('@/stores/ui.js', () => ({
  useUiStore: () => ({
    showError: mockShowError,
    showSuccess: mockShowSuccess,
  }),
}))

// ─── Helpers y Stubs ────────────────────────────────────────────────────────

function createTestI18n() {
  return createI18n({ legacy: false, locale: 'en', messages: { en } })
}

function makeRawOrder(id: string, overrides: Partial<any> = {}) {
  return {
    _id: id,
    id,
    order_number: `ORD-${id}`,
    client_name: 'Hotel Luxe',
    client_id: 'client-1',
    created_at: '2026-10-01',
    pickup_date: '2026-10-02',
    status: 'pending',
    actual_bags: 2,
    special_notes: 'Fragile linens',
    total: 100,
    ...overrides,
  }
}

describe('OrdersList.vue — Stained Items and Flat CSV Exports', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    mockIsAdminOrStaff = true
    mockIsClient = false
    mockFetchAllOrders.mockResolvedValue([
      makeRawOrder('ord-1', { order_number: 'ORD-001' }),
      makeRawOrder('ord-2', { order_number: 'ORD-002' }),
    ])
  })

  it('renders both Download CSV and Download Stained buttons for admin/staff', async () => {
    const wrapper = mount(OrdersList, {
      global: {
        plugins: [createTestI18n()],
        stubs: {
          DataTable: false,
          AppButton: false,
          LoadingPanel: false,
          StatusBadge: true,
          ClientFilterSelect: true,
          DateRangeFilter: true,
          OrderNotesBadge: true,
          CancelOrderModal: true,
        },
      },
    })

    await flushPromises()

    const buttons = wrapper.findAll('button')
    const flatCsvBtn = buttons.find(b => b.text().includes(en.invoices.exportCsv))
    const stainedBtn = buttons.find(b => b.text().includes(en.invoices.exportStained))

    expect(flatCsvBtn).toBeDefined()
    expect(stainedBtn).toBeDefined()
  })

  it('hides export buttons when user is a client', async () => {
    mockIsAdminOrStaff = false
    mockIsClient = true

    const wrapper = mount(OrdersList, {
      global: {
        plugins: [createTestI18n()],
        stubs: {
          DataTable: false,
          AppButton: false,
          LoadingPanel: false,
          StatusBadge: true,
          ClientFilterSelect: true,
          DateRangeFilter: true,
          OrderNotesBadge: true,
          CancelOrderModal: true,
        },
      },
    })

    await flushPromises()

    const buttons = wrapper.findAll('button')
    const flatCsvBtn = buttons.find(b => b.text().includes(en.invoices.exportCsv))
    const stainedBtn = buttons.find(b => b.text().includes(en.invoices.exportStained))

    expect(flatCsvBtn).toBeUndefined()
    expect(stainedBtn).toBeUndefined()
  })

  it('shows validation error when clicking Download Stained without selected orders', async () => {
    const wrapper = mount(OrdersList, {
      global: {
        plugins: [createTestI18n()],
        stubs: {
          DataTable: false,
          AppButton: false,
          LoadingPanel: false,
          StatusBadge: true,
          ClientFilterSelect: true,
          DateRangeFilter: true,
          OrderNotesBadge: true,
          CancelOrderModal: true,
        },
      },
    })

    await flushPromises()

    const stainedBtn = wrapper.findAll('button').find(b => b.text().includes(en.invoices.exportStained))
    expect(stainedBtn).toBeDefined()

    await stainedBtn!.trigger('click')

    expect(mockShowError).toHaveBeenCalledWith(en.invoices.exportSelectRequired)
    expect(mockDownloadOrdersStainedCsv).not.toHaveBeenCalled()
  })

  it('calls downloadOrdersStainedCsv with selected order IDs when orders are checked', async () => {
    const wrapper = mount(OrdersList, {
      global: {
        plugins: [createTestI18n()],
        stubs: {
          DataTable: false,
          AppButton: false,
          LoadingPanel: false,
          StatusBadge: true,
          ClientFilterSelect: true,
          DateRangeFilter: true,
          OrderNotesBadge: true,
          CancelOrderModal: true,
        },
      },
    })

    await flushPromises()

    // Select the first order via its checkbox
    const checkboxes = wrapper.findAll('tbody input[type="checkbox"]')
    expect(checkboxes.length).toBeGreaterThanOrEqual(1)
    await checkboxes[0].setValue(true)

    const stainedBtn = wrapper.findAll('button').find(b => b.text().includes('Download Stained'))
    expect(stainedBtn).toBeDefined()
    expect(stainedBtn!.text()).toContain('(1)')

    await stainedBtn!.trigger('click')
    await flushPromises()

    expect(mockDownloadOrdersStainedCsv).toHaveBeenCalledWith(['ord-1'])
  })

  it('calls downloadOrdersFlatCsv with selected order IDs when flat CSV button is clicked', async () => {
    const wrapper = mount(OrdersList, {
      global: {
        plugins: [createTestI18n()],
        stubs: {
          DataTable: false,
          AppButton: false,
          LoadingPanel: false,
          StatusBadge: true,
          ClientFilterSelect: true,
          DateRangeFilter: true,
          OrderNotesBadge: true,
          CancelOrderModal: true,
        },
      },
    })

    await flushPromises()

    const checkboxes = wrapper.findAll('tbody input[type="checkbox"]')
    await checkboxes[1].setValue(true)

    const flatCsvBtn = wrapper.findAll('button').find(b => b.text().includes('Download CSV'))
    expect(flatCsvBtn).toBeDefined()
    expect(flatCsvBtn!.text()).toContain('(1)')

    await flatCsvBtn!.trigger('click')
    await flushPromises()

    expect(mockDownloadOrdersFlatCsv).toHaveBeenCalledWith(['ord-2'])
  })

  it('displays error toast if downloadOrdersStainedCsv fails', async () => {
    mockDownloadOrdersStainedCsv.mockRejectedValueOnce(new Error('Network failure'))

    const wrapper = mount(OrdersList, {
      global: {
        plugins: [createTestI18n()],
        stubs: {
          DataTable: false,
          AppButton: false,
          LoadingPanel: false,
          StatusBadge: true,
          ClientFilterSelect: true,
          DateRangeFilter: true,
          OrderNotesBadge: true,
          CancelOrderModal: true,
        },
      },
    })

    await flushPromises()

    const checkboxes = wrapper.findAll('tbody input[type="checkbox"]')
    await checkboxes[0].setValue(true)

    const stainedBtn = wrapper.findAll('button').find(b => b.text().includes('Download Stained'))
    await stainedBtn!.trigger('click')
    await flushPromises()

    expect(mockShowError).toHaveBeenCalled()
  })
})
