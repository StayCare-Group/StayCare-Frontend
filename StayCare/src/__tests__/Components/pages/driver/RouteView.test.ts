import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { createPinia, setActivePinia } from 'pinia'
import RouteView from '@/Components/pages/driver/RouteView.vue'
import en from '@/i18n/en.json'

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

vi.mock('@/Components/ui/MiniMap.vue', () => ({
  default: {
    name: 'MiniMap',
    template: '<div class="mini-map-stub"></div>',
  },
}))

vi.mock('@/utils/date', () => ({
  normalizeDateString: (d: any) => {
    if (!d) return ''
    if (typeof d === 'string') return d.slice(0, 10)
    if (d instanceof Date) return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    return ''
  },
  getTodayDateString: () => '2026-09-03',
  isPastDate: (target: any, ref: string = '2026-09-03') => {
    const ts = String(target || '').slice(0, 10)
    const rs = String(ref || '').slice(0, 10)
    return Boolean(ts && rs && ts < rs)
  },
}))

vi.mock('@/stores/auth.js', () => ({
  useAuthStore: () => ({
    user: { id: 'driver-1', name: 'Driver John', role: 'driver' },
  }),
}))

vi.mock('@/stores/nav.js', () => ({
  useNavStore: () => ({
    goToDetail: vi.fn(),
    setPage: vi.fn(),
  }),
}))

const i18n = createI18n({
  legacy: false,
  locale: 'en',
  messages: { en },
})

function mountComponent() {
  return mount(RouteView, {
    global: {
      plugins: [i18n],
      stubs: {
        MiniMap: true,
        LoadingPanel: true,
        StatusBadge: true,
        AppButton: true,
      },
    },
  })
}

describe('RouteView.vue', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('fetches active routes with status planned,in_progress in a single call', async () => {
    mockFetchRoutesByDriver.mockResolvedValue([])

    mountComponent()
    await flushPromises()

    expect(mockFetchRoutesByDriver).toHaveBeenCalledTimes(1)
    expect(mockFetchRoutesByDriver).toHaveBeenCalledWith('driver-1', { status: 'planned,in_progress' })
  })

  it('renders stops ordered chronologically from oldest date to newest date', async () => {
    mockFetchRoutesByDriver.mockResolvedValue([
      {
        id: 'route-today',
        _id: 'route-today',
        route_date: '2026-09-03',
        status: 'planned',
        stops: [
          {
            id: 'stop-today-1',
            _id: 'stop-today-1',
            client: 'Today Client',
            address: '100 Ocean Dr',
            status: 'Pending',
            type: 'Delivery',
            estimatedBags: 4,
            actualBags: null,
          },
        ],
      },
      {
        id: 'route-overdue',
        _id: 'route-overdue',
        route_date: '2026-07-24',
        status: 'in_progress',
        stops: [
          {
            id: 'stop-overdue-1',
            _id: 'stop-overdue-1',
            client: 'Oldest Overdue Client',
            address: '50 Sunset Blvd',
            status: 'Pending',
            type: 'Pickup',
            estimatedBags: 2,
            actualBags: null,
          },
        ],
      },
    ])

    const wrapper = mountComponent()
    await flushPromises()

    const text = wrapper.text()
    expect(text).toContain('My Route')
    expect(text).toContain('2026-07-24 — 2026-09-03')

    // Oldest client should appear first (Stop 1) and Today client second (Stop 2)
    const clientHeadings = wrapper.findAll('h3')
    expect(clientHeadings[0].text()).toBe('Oldest Overdue Client')
    expect(clientHeadings[1].text()).toBe('Today Client')
  })

  it('shows map toggle button when stops have valid geographic coordinates', async () => {
    mockFetchRoutesByDriver.mockResolvedValue([
      {
        id: 'route-today',
        _id: 'route-today',
        route_date: '2026-09-03',
        status: 'planned',
        stops: [
          {
            id: 'stop-1',
            _id: 'stop-1',
            client: 'Test Client',
            address: 'Triq Hookham Frere, Pietà',
            lat: 35.8922,
            lng: 14.4947,
            status: 'Pending',
            type: 'Pickup',
            estimatedBags: 1,
            actualBags: null,
          },
        ],
      },
    ])

    const wrapper = mountComponent()
    await flushPromises()

    expect(wrapper.text()).toContain('Show Route on Map')
  })

  it('displays empty state when no active routes are found', async () => {
    mockFetchRoutesByDriver.mockResolvedValue([])

    const wrapper = mountComponent()
    await flushPromises()

    expect(wrapper.text()).toContain('No active routes assigned.')
  })
})
