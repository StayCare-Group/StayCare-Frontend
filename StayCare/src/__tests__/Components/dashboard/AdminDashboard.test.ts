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

vi.mock('@/api/reports', () => ({
  fetchDashboardStats: vi.fn(),
  fetchDashboardOverview: vi.fn(),
  fetchDashboardDailyOrders: vi.fn(),
  fetchDashboardAlerts: vi.fn(),
  fetchDashboardComparison: vi.fn(),
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
    template: '<div class="kpi-card" :data-label="label" :data-value="value" :data-color="color">{{ label }} {{ value }}</div>',
    props: ['label', 'value', 'color'],
  },
  AlertsCard: {
    name: 'AlertsCard',
    template: '<div data-testid="alerts-card" :data-total="alerts?.totalAlerts" />',
    props: ['alerts', 'loading'],
    emits: ['view-order'],
  },
  MonthlyComparisonCard: {
    name: 'MonthlyComparisonCard',
    template: '<div data-testid="monthly-comparison-card" :data-client-id="clientId" />',
    props: ['clientId'],
  },
}

function createTestI18n() {
  return createI18n({ legacy: false, locale: 'en', messages: { en } })
}

async function mountDashboard(
  currentPage = 'dashboard',
  overviewData: any = null,
  dailyOrdersData: any = null,
  alertsData: any = null
) {
  const { fetchDashboardOverview, fetchDashboardDailyOrders, fetchDashboardAlerts } =
    await import('@/api/reports')

  vi.mocked(fetchDashboardOverview).mockResolvedValue(
    overviewData || {
      ordersReceived: 24,
      itemsTotal: 380,
      itemsProcessed: 120,
      itemsPending: 80,
      itemsDelivered: 180,
    }
  )
  vi.mocked(fetchDashboardDailyOrders).mockResolvedValue(
    dailyOrdersData || {
      granularity: 'day',
      points: [
        { date: '2026-11-01', orders: 10 },
        { date: '2026-11-02', orders: 14 },
      ],
    }
  )
  vi.mocked(fetchDashboardAlerts).mockResolvedValue(
    alertsData || {
      thresholdHours: 24,
      totalAlerts: 1,
      overduePickups: [
        {
          orderId: 'ord-1',
          orderNumber: 'ORD-001',
          clientId: 'client-1',
          clientName: 'Client 1',
          status: 'pending',
          hoursDelayed: 26,
          referenceDate: '2026-11-09T18:00:00.000Z',
        },
      ],
      stalledOrders: [],
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
    fetchDashboardOverview: vi.mocked(fetchDashboardOverview),
    fetchDashboardDailyOrders: vi.mocked(fetchDashboardDailyOrders),
    fetchDashboardAlerts: vi.mocked(fetchDashboardAlerts),
  }
}

describe('AdminDashboard.vue', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    showErrorMock.mockReset()
    showSuccessMock.mockReset()
  })

  it('fetches dashboard overview and daily orders series on mount', async () => {
    const { wrapper, fetchDashboardOverview, fetchDashboardDailyOrders, fetchDashboardAlerts } =
      await mountDashboard()

    expect(fetchDashboardOverview).toHaveBeenCalledOnce()
    expect(fetchDashboardDailyOrders).toHaveBeenCalledOnce()
    expect(fetchDashboardAlerts).toHaveBeenCalledOnce()

    const overviewArg = fetchDashboardOverview.mock.calls[0][0]
    expect(overviewArg).toHaveProperty('from')
    expect(overviewArg).toHaveProperty('to')
    expect(overviewArg.from).toMatch(/^\d{4}-\d{2}-01$/)
    expect(overviewArg.to).toMatch(/^\d{4}-\d{2}-\d{2}$/)

    expect(fetchDashboardDailyOrders.mock.calls[0][0]).toEqual(overviewArg)
    expect(fetchDashboardAlerts).toHaveBeenCalledWith({ clientId: undefined })
    expect(wrapper.find('[data-testid="orders-line-chart-svg"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="alerts-card"]').exists()).toBe(true)
  })

  it('renders all 5 KPI cards, Items in Process bars, Item Condition chart and Orders to Pick Up / Deliver cards', async () => {
    const { wrapper } = await mountDashboard('dashboard', {
      ordersReceived: 42,
      itemsTotal: 615,
      itemsProcessed: 200,
      itemsPending: 115,
      itemsDelivered: 300,
      ordersToPickup: 7,
      ordersToDeliver: 5,
      itemsInProcess: {
        washing: 80,
        drying: 50,
        ironing: 40,
        qualityCheck: 30,
      },
      itemConditions: {
        good: 450,
        bad: 20,
        stained: 30,
        total: 500,
      },
    })

    const kpiCards = wrapper.findAllComponents({ name: 'KpiCard' })
    expect(kpiCards).toHaveLength(7)

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
    expect(kpiCards[5].props('label')).toBe(en.admin.ordersToPickup)
    expect(kpiCards[5].props('value')).toBe(7)
    expect(kpiCards[6].props('label')).toBe(en.admin.ordersToDeliver)
    expect(kpiCards[6].props('value')).toBe(5)

    expect(wrapper.find('[data-testid="items-in-process-total"]').text()).toBe('200')
    expect(wrapper.find('[data-testid="process-stage-washing"]').text()).toContain('80')
    expect(wrapper.find('[data-testid="process-stage-drying"]').text()).toContain('50')
    expect(wrapper.find('[data-testid="process-stage-ironing"]').text()).toContain('40')
    expect(wrapper.find('[data-testid="process-stage-qualityCheck"]').text()).toContain('30')

    expect(wrapper.find('[data-testid="item-condition-total"]').text()).toBe('500')
    expect(wrapper.find('[data-testid="condition-row-good"]').text()).toContain('450')
    expect(wrapper.find('[data-testid="condition-row-good"]').text()).toContain('90%')
    expect(wrapper.find('[data-testid="condition-row-bad"]').text()).toContain('20')
    expect(wrapper.find('[data-testid="condition-row-stained"]').text()).toContain('30')

    expect(wrapper.find('[data-testid="orders-to-pickup-card"]').text()).toContain('7')
    expect(wrapper.find('[data-testid="orders-to-deliver-card"]').text()).toContain('5')
  })

  it('refetches overview and daily orders when switching period mode to year, and only refetches alerts when selecting a client', async () => {
    const {
      wrapper,
      fetchDashboardOverview,
      fetchDashboardDailyOrders,
      fetchDashboardAlerts,
    } = await mountDashboard()
    expect(fetchDashboardOverview).toHaveBeenCalledTimes(1)
    expect(fetchDashboardDailyOrders).toHaveBeenCalledTimes(1)
    expect(fetchDashboardAlerts).toHaveBeenCalledTimes(1)

    await wrapper.find('[data-testid="period-mode-year"]').trigger('click')
    await flushPromises()

    expect(fetchDashboardOverview).toHaveBeenCalledTimes(2)
    expect(fetchDashboardDailyOrders).toHaveBeenCalledTimes(2)
    // Changing date range does not refetch real-time alerts
    expect(fetchDashboardAlerts).toHaveBeenCalledTimes(1)
    const yearCall = fetchDashboardDailyOrders.mock.calls[1][0]
    expect(yearCall.from).toMatch(/^\d{4}-01-01$/)
    expect(yearCall.to).toMatch(/^\d{4}-12-31$/)

    await wrapper.find('[data-testid="client-filter-select"]').setValue('client-123')
    await flushPromises()

    expect(fetchDashboardOverview).toHaveBeenCalledTimes(3)
    expect(fetchDashboardDailyOrders).toHaveBeenCalledTimes(3)
    expect(fetchDashboardAlerts).toHaveBeenCalledTimes(2)
    expect(fetchDashboardDailyOrders.mock.calls[2][0].clientId).toBe('client-123')
    expect(fetchDashboardAlerts).toHaveBeenLastCalledWith({ clientId: 'client-123' })
  })

  it('shows a single toast error when dashboard metrics requests fail', async () => {
    const { fetchDashboardOverview, fetchDashboardDailyOrders } = await import('@/api/reports')
    vi.mocked(fetchDashboardOverview).mockRejectedValueOnce(new Error('Network error'))
    vi.mocked(fetchDashboardDailyOrders).mockRejectedValueOnce(new Error('Network error'))

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
    expect(wrapper.findAllComponents({ name: 'KpiCard' })).toHaveLength(7)
  })
})
