import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { createPinia, setActivePinia } from 'pinia'
import AdminDashboard from '@/Components/dashboard/AdminDashboard.vue'
import en from '@/i18n/en.json'

const showErrorMock = vi.fn()
const showSuccessMock = vi.fn()

vi.mock('@/api/client', () => ({ apiFetch: vi.fn() }))
vi.mock('@/router', () => ({ default: { push: vi.fn(), currentRoute: { value: {} } } }))

vi.mock('@/api/orders', async () => {
  const actual = await vi.importActual('@/api/orders')
  return { ...actual, fetchOrders: vi.fn() }
})

vi.mock('@/api/reports', () => ({
  fetchDashboardStats: vi.fn(),
  fetchDashboardOverview: vi.fn(),
}))

vi.mock('@/stores/auth.js', () => ({
  useAuthStore: vi.fn(() => ({ user: { role: 'admin' } })),
}))

vi.mock('@/stores/ui.js', () => ({
  useUiStore: vi.fn(() => ({ showError: showErrorMock, showSuccess: showSuccessMock })),
}))

const COMPONENT_STUBS = {
  OrdersList: { template: '<div data-testid="orders-list" />' },
  PickupConfirm: { template: '<div data-testid="pickup-confirm" />' },
  DeliveryConfirm: { template: '<div data-testid="delivery-confirm" />' },
  OrderDetail: { template: '<div data-testid="order-detail" />' },
  OrderCreateForm: { template: '<div data-testid="order-create-form" />' },
  ItemManagement: { template: '<div data-testid="item-management" />' },
  UserManagement: { template: '<div data-testid="user-management" />' },
  ClientDetail: { template: '<div data-testid="client-detail" />' },
  Reception: { template: '<div data-testid="reception" />' },
  Processing: { template: '<div data-testid="processing" />' },
  RoutePlanner: { template: '<div data-testid="route-planner" />' },
  Reports: { template: '<div data-testid="reports" />' },
  Settings: { template: '<div data-testid="settings" />' },
  ProfileAccount: { template: '<div data-testid="profile-account" />' },
  InvoicesList: { template: '<div data-testid="invoices-list" />' },
  InvoiceDetail: { template: '<div data-testid="invoice-detail" />' },
  CreateInvoice: { template: '<div data-testid="create-invoice" />' },
  LoadingPanel: { template: '<div data-testid="loading-panel" />' },
  ClientFilterSelect: {
    name: 'ClientFilterSelect',
    template: '<select data-testid="client-filter-select" :value="modelValue" @change="$emit(\'update:modelValue\', $event.target.value)"><option value="">All</option><option value="client-123">Client 123</option></select>',
    props: ['modelValue'],
    emits: ['update:modelValue', 'change'],
  },
  DateRangeFilter: {
    name: 'DateRangeFilter',
    template: '<div data-testid="date-range-filter" :data-from="from" :data-to="to" />',
    props: ['from', 'to', 'idPrefix'],
    emits: ['update:from', 'update:to', 'clear'],
  },
  KpiCard: {
    name: 'KpiCard',
    template: '<div class="kpi-card" :data-label="label" :data-value="value" :data-color="color" />',
    props: ['label', 'value', 'color'],
  },
}

function createTestI18n() {
  return createI18n({ legacy: false, locale: 'en', messages: { en } })
}

async function mountDashboard(
  currentPage = 'dashboard',
  weeklyOrders = [],
  recentOrders = [],
  statsData: any = null,
  overviewData: any = null
) {
  const { fetchOrders } = await import('@/api/orders')
  const { fetchDashboardStats, fetchDashboardOverview } = await import('@/api/reports')

  vi.mocked(fetchOrders).mockImplementation(async (params?: Record<string, string>) => {
    if (params?.limit === '6') return recentOrders
    return weeklyOrders
  })
  vi.mocked(fetchDashboardStats).mockResolvedValue(
    statsData || {
      todayOrders: 5,
      monthlyRevenue: 1200,
      monthlyVat: 216,
      totalOrders: 10,
      activeOrders: 2,
    }
  )
  vi.mocked(fetchDashboardOverview).mockResolvedValue(
    overviewData || {
      ordersReceived: 24,
      itemsTotal: 380,
      itemsProcessed: 120,
      itemsPending: 80,
      itemsDelivered: 180,
    }
  )

  setActivePinia(createPinia())
  const { useNavStore } = await import('@/stores/nav.js')
  const navStore = useNavStore()
  navStore.currentPage = currentPage

  const wrapper = mount(AdminDashboard, {
    global: {
      plugins: [createTestI18n()],
      stubs: COMPONENT_STUBS,
    },
  })

  await flushPromises()
  return {
    wrapper,
    navStore,
    fetchOrders: vi.mocked(fetchOrders),
    fetchDashboardStats: vi.mocked(fetchDashboardStats),
    fetchDashboardOverview: vi.mocked(fetchDashboardOverview),
  }
}

describe('AdminDashboard.vue', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    showErrorMock.mockReset()
    showSuccessMock.mockReset()
  })

  it('fetches dashboard overview, weekly orders and recent 6 orders on mount', async () => {
    const { fetchOrders, fetchDashboardOverview } = await mountDashboard()

    expect(fetchDashboardOverview).toHaveBeenCalledOnce()
    expect(fetchOrders).toHaveBeenCalledTimes(2)

    const overviewArg = fetchDashboardOverview.mock.calls[0][0]
    expect(overviewArg).toHaveProperty('from')
    expect(overviewArg).toHaveProperty('to')
    expect(overviewArg.from).toMatch(/^\d{4}-\d{2}-01$/)
    expect(overviewArg.to).toMatch(/^\d{4}-\d{2}-\d{2}$/)

    // Call 1: weekly orders with from and to date params
    const call1 = fetchOrders.mock.calls[0][0] as Record<string, string>
    expect(call1).toHaveProperty('from')
    expect(call1).toHaveProperty('to')
    expect(call1.limit).toBe('200')

    // Call 2: recent orders limited to 6
    const call2 = fetchOrders.mock.calls[1][0] as Record<string, string>
    expect(call2.limit).toBe('6')
  })

  it('renders all 5 KPI cards with overview ordersReceived, itemsTotal, itemsProcessed, itemsPending & itemsDelivered', async () => {
    const { wrapper } = await mountDashboard(
      'dashboard',
      [],
      [],
      null,
      {
        ordersReceived: 42,
        itemsTotal: 615,
        itemsProcessed: 200,
        itemsPending: 115,
        itemsDelivered: 300,
      }
    )

    const kpiCards = wrapper.findAllComponents({ name: 'KpiCard' })
    expect(kpiCards).toHaveLength(5)

    expect(kpiCards[0].props('label')).toBe(en.admin.ordersReceived)
    expect(kpiCards[0].props('value')).toBe(42)
    expect(kpiCards[1].props('label')).toBe(en.admin.itemsTotal)
    expect(kpiCards[1].props('value')).toBe(615)
    expect(kpiCards[2].props('label')).toBe(en.admin.itemsProcessed)
    expect(kpiCards[2].props('value')).toBe(200)
    expect(kpiCards[3].props('label')).toBe(en.admin.itemsPending)
    expect(kpiCards[3].props('value')).toBe(115)
    expect(kpiCards[4].props('label')).toBe(en.admin.itemsDelivered)
    expect(kpiCards[4].props('value')).toBe(300)
  })

  it('refetches overview when switching period mode to year or selecting a client', async () => {
    const { wrapper, fetchDashboardOverview } = await mountDashboard()
    expect(fetchDashboardOverview).toHaveBeenCalledTimes(1)

    await wrapper.find('[data-testid="period-mode-year"]').trigger('click')
    await flushPromises()

    expect(fetchDashboardOverview).toHaveBeenCalledTimes(2)
    const yearCall = fetchDashboardOverview.mock.calls[1][0]
    expect(yearCall.from).toMatch(/^\d{4}-01-01$/)
    expect(yearCall.to).toMatch(/^\d{4}-12-31$/)

    await wrapper.find('[data-testid="client-filter-select"]').setValue('client-123')
    await flushPromises()

    expect(fetchDashboardOverview).toHaveBeenCalledTimes(3)
    expect(fetchDashboardOverview.mock.calls[2][0].clientId).toBe('client-123')
  })

  it('shows a toast error when fetchDashboardOverview fails', async () => {
    const { fetchDashboardOverview } = await import('@/api/reports')
    vi.mocked(fetchDashboardOverview).mockRejectedValueOnce(new Error('Network error'))

    setActivePinia(createPinia())
    const { useNavStore } = await import('@/stores/nav.js')
    const navStore = useNavStore()
    navStore.currentPage = 'dashboard'

    mount(AdminDashboard, {
      global: {
        plugins: [createTestI18n()],
        stubs: COMPONENT_STUBS,
      },
    })
    await flushPromises()

    expect(showErrorMock).toHaveBeenCalledOnce()
  })

  it('renders sub-page when navStore.currentPage changes', async () => {
    const { wrapper, navStore } = await mountDashboard('orders')

    expect(wrapper.find('[data-testid="orders-list"]').exists()).toBe(true)
    expect(wrapper.find('.kpi-card').exists()).toBe(false)

    navStore.currentPage = 'dashboard'
    await flushPromises()

    expect(wrapper.find('[data-testid="orders-list"]').exists()).toBe(false)
    expect(wrapper.findAllComponents({ name: 'KpiCard' })).toHaveLength(5)
  })
})
