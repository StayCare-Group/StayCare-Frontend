import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { createPinia, setActivePinia } from 'pinia'
import en from '@/i18n/en.json'
import { useNavStore } from '@/stores/nav.js'

// ─── Mocks ────────────────────────────────────────────────────────────────────

const { mockFetchRoutesByDriver } = vi.hoisted(() => {
  return {
    mockFetchRoutesByDriver: vi.fn(),
  }
})

vi.mock('@/api/routes', () => ({
  fetchRoutesByDriver: mockFetchRoutesByDriver,
  mapRouteForDriver: vi.fn((route: any) => ({
    id: route.id || route._id,
    _id: route._id || route.id,
    date: route.date || route.route_date,
    driverName: 'Driver John',
    vehiclePlate: 'XYZ-123',
    status: route.status || 'planned',
    totalStops: route.stops?.length ?? 0,
    completedStops: (route.stops ?? []).filter((s: any) => s.status === 'Completed').length,
    stops: (route.stops ?? []).map((s: any, idx: number) => ({
      ...s,
      displayIndex: idx + 1,
      viewKey: `${route.id || route._id}-${s._id || s.id || idx}`,
    })),
  })),
}))

vi.mock('@/stores/auth.js', () => ({
  useAuthStore: () => ({
    user: { id: 'driver-1', name: 'Driver John', role: 'driver' },
  }),
}))

vi.mock('@/Components/pages/driver/RouteView.vue', () => ({ default: { template: '<div data-testid="route-view" />' } }))
vi.mock('@/Components/pages/driver/PickupConfirm.vue', () => ({ default: { template: '<div data-testid="pickup-confirm" />' } }))
vi.mock('@/Components/pages/driver/DeliveryConfirm.vue', () => ({ default: { template: '<div data-testid="delivery-confirm" />' } }))
vi.mock('@/Components/pages/driver/DriverHistory.vue', () => ({ default: { template: '<div data-testid="driver-history" />' } }))
vi.mock('@/Components/pages/shared/Settings.vue', () => ({ default: { template: '<div data-testid="settings" />' } }))
vi.mock('@/Components/pages/shared/ProfileAccount.vue', () => ({ default: { template: '<div data-testid="profile-account" />' } }))

import DriverDashboard from '@/Components/dashboard/DriverDashboard.vue'

const i18n = createI18n({
  legacy: false,
  locale: 'en',
  messages: { en },
})

const COMPONENT_STUBS = {
  LoadingPanel: { template: '<div data-testid="loading-panel" />' },
  StatusBadge: true,
  AppButton: true,
  KpiCard: {
    props: ['label', 'value', 'color'],
    template: '<div class="kpi-stub" :data-label="label">{{ label }}: {{ value }}</div>',
  },
}

function mountComponent() {
  return mount(DriverDashboard, {
    global: {
      plugins: [i18n],
      stubs: COMPONENT_STUBS,
    },
  })
}

describe('DriverDashboard.vue', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('fetches active routes with status planned,in_progress on mount', async () => {
    mockFetchRoutesByDriver.mockResolvedValue([])

    mountComponent()
    await flushPromises()

    expect(mockFetchRoutesByDriver).toHaveBeenCalledWith('driver-1', { status: 'planned,in_progress' })
  })

  it('calculates KPIs correctly based on all active stops', async () => {
    mockFetchRoutesByDriver.mockResolvedValue([
      {
        id: 'route-1',
        route_date: '2026-09-02',
        stops: [
          { id: 's1', type: 'Pickup', status: 'Completed', client: 'Client A' },
          { id: 's2', type: 'Pickup', status: 'Pending', client: 'Client B' },
        ],
      },
      {
        id: 'route-2',
        route_date: '2026-09-03',
        stops: [
          { id: 's3', type: 'Delivery', status: 'Completed', client: 'Client C' },
          { id: 's4', type: 'Delivery', status: 'In Transit', client: 'Client D' },
        ],
      },
    ])

    const wrapper = mountComponent()
    await flushPromises()

    const kpiCards = wrapper.findAll('.kpi-stub')
    expect(kpiCards).toHaveLength(3)

    // Pickups: 2
    expect(kpiCards[0].text()).toContain("Today's Pickups: 2")
    // Deliveries: 2
    expect(kpiCards[1].text()).toContain("Today's Deliveries: 2")
    // Route Progress: 2 completed out of 4 total = 50%
    expect(kpiCards[2].text()).toContain('Route Progress: 50%')
  })

  it('renders stops ordered chronologically with date badges', async () => {
    mockFetchRoutesByDriver.mockResolvedValue([
      {
        id: 'route-today',
        route_date: '2026-09-03',
        stops: [{ id: 's-today', type: 'Delivery', status: 'Pending', client: 'Client Today' }],
      },
      {
        id: 'route-old',
        route_date: '2026-07-24',
        stops: [{ id: 's-old', type: 'Pickup', status: 'Pending', client: 'Client Oldest' }],
      },
    ])

    const wrapper = mountComponent()
    await flushPromises()

    const headings = wrapper.findAll('h4')
    expect(headings[0].text()).toBe('Client Oldest')
    expect(headings[1].text()).toBe('Client Today')
  })

  it('renders sub-pages when currentPage is not dashboard', async () => {
    const navStore = useNavStore()
    navStore.currentPage = 'route'

    const wrapper = mountComponent()
    await flushPromises()

    expect(wrapper.find('[data-testid="route-view"]').exists()).toBe(true)
  })
})
