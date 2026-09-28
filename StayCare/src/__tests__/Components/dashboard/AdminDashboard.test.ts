import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { createPinia, setActivePinia } from 'pinia'
import AdminDashboard from '@/Components/dashboard/AdminDashboard.vue'
import en from '@/i18n/en.json'

vi.mock('@/api/client', () => ({ apiFetch: vi.fn() }))
vi.mock('@/router', () => ({ default: { push: vi.fn(), currentRoute: { value: {} } } }))

vi.mock('@/api/orders', async () => {
  const actual = await vi.importActual('@/api/orders')
  return { ...actual, fetchOrders: vi.fn() }
})

vi.mock('@/api/reports', () => ({
  fetchDashboardStats: vi.fn(),
}))

vi.mock('@/stores/auth.js', () => ({
  useAuthStore: vi.fn(() => ({ user: { role: 'admin' } })),
}))

vi.mock('@/stores/ui.js', () => ({
  useUiStore: vi.fn(() => ({ showError: vi.fn(), showSuccess: vi.fn() })),
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
  KpiCard: {
    name: 'KpiCard',
    template: '<div class="kpi-card" :data-label="label" :data-value="value" :data-color="color" />',
    props: ['label', 'value', 'color'],
  },
}

function createTestI18n() {
  return createI18n({ legacy: false, locale: 'en', messages: { en } })
}

async function mountDashboard(currentPage = 'dashboard', weeklyOrders = [], recentOrders = [], statsData: any = null) {
  const { fetchOrders } = await import('@/api/orders')
  const { fetchDashboardStats } = await import('@/api/reports')

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
  return { wrapper, navStore, fetchOrders: vi.mocked(fetchOrders), fetchDashboardStats: vi.mocked(fetchDashboardStats) }
}

describe('AdminDashboard.vue', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches only weekly orders and recent 6 orders on mount instead of iterating full history', async () => {
    const { fetchOrders, fetchDashboardStats } = await mountDashboard()

    expect(fetchDashboardStats).toHaveBeenCalledOnce()
    expect(fetchOrders).toHaveBeenCalledTimes(2)

    // Call 1: weekly orders with from and to date params
    const call1 = fetchOrders.mock.calls[0][0] as Record<string, string>
    expect(call1).toHaveProperty('from')
    expect(call1).toHaveProperty('to')
    expect(call1.limit).toBe('200')

    // Call 2: recent orders limited to 6
    const call2 = fetchOrders.mock.calls[1][0] as Record<string, string>
    expect(call2.limit).toBe('6')
  })

  it('renders KPI cards with dashboard stats values', async () => {
    const { wrapper } = await mountDashboard('dashboard', [], [], {
      todayOrders: 18,
      monthlyRevenue: 2500,
      monthlyVat: 450,
      totalOrders: 100,
      activeOrders: 8,
    })

    const kpiCards = wrapper.findAllComponents({ name: 'KpiCard' })
    expect(kpiCards).toHaveLength(4)

    expect(kpiCards[0].props('value')).toBe(18)
    expect(kpiCards[1].props('value')).toBe('€2,500')
    expect(kpiCards[2].props('value')).toBe('€450')
    expect(kpiCards[3].props('value')).toBe('92%')
  })

  it('renders sub-page when navStore.currentPage changes', async () => {
    const { wrapper, navStore } = await mountDashboard('orders')

    expect(wrapper.find('[data-testid="orders-list"]').exists()).toBe(true)
    expect(wrapper.find('.kpi-card').exists()).toBe(false)

    navStore.currentPage = 'dashboard'
    await flushPromises()

    expect(wrapper.find('[data-testid="orders-list"]').exists()).toBe(false)
    expect(wrapper.findAllComponents({ name: 'KpiCard' })).toHaveLength(4)
  })
})
