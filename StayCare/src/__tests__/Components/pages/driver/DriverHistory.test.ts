import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import DriverHistory from '@/Components/pages/driver/DriverHistory.vue'
import DateRangeFilter from '@/Components/ui/DateRangeFilter.vue'
import LoadingPanel from '@/Components/ui/LoadingPanel.vue'
import en from '@/i18n/en.json'

// ─── Mocks ────────────────────────────────────────────────────────────────────

const { mockFetchAllRoutes } = vi.hoisted(() => ({
  mockFetchAllRoutes: vi.fn(),
}))

vi.mock('@/api/routes', () => ({
  fetchAllRoutes: mockFetchAllRoutes,
  mapRouteForDriver: vi.fn((route: any) => ({
    _id: route._id || route.id,
    id: route._id || route.id,
    date: route.date || route.route_date,
    status: route.status || 'completed',
    totalStops: route.stops?.length ?? 0,
    completedStops: (route.stops ?? []).filter((s: any) => s.status === 'Completed').length,
    stops: route.stops || [],
  })),
}))

// Fixed today's date for deterministic testing: 2026-09-04
const MOCK_TODAY = '2026-09-04'
const MOCK_15_DAYS_AGO = '2026-08-20'

vi.mock('@/utils/date', () => ({
  getDefaultDateRange: (days = 15) => ({
    from: days === 15 ? MOCK_15_DAYS_AGO : '2026-08-05',
    to: MOCK_TODAY,
  }),
  getTodayDateString: () => MOCK_TODAY,
  normalizeDateString: (d: any) => (typeof d === 'string' ? d.slice(0, 10) : ''),
}))

function createTestI18n() {
  return createI18n({
    legacy: false,
    locale: 'en',
    messages: { en },
  })
}

function mountComponent() {
  const i18n = createTestI18n()
  return mount(DriverHistory, {
    global: {
      plugins: [i18n],
      components: {
        DateRangeFilter,
        LoadingPanel,
      },
    },
  })
}

// ─── Sample Data ─────────────────────────────────────────────────────────────

const mockRoutesData = [
  // 1. Within 15-day range, completed
  {
    id: 'route-1',
    date: '2026-08-25',
    status: 'completed',
    stops: [
      { id: 1, client: 'Hotel Alpha', address: 'Calle 10 #20', type: 'Pickup', timeWindow: '08:00 - 10:00', estimatedBags: 2, actualBags: 2, status: 'Completed' },
      { id: 2, client: 'Resort Beta', address: 'Calle 30 #40', type: 'Delivery', timeWindow: '10:00 - 12:00', estimatedBags: 3, actualBags: 3, status: 'Completed' },
    ],
  },
  // 2. Within 15-day range, past date planned (finished day without formal completion)
  {
    id: 'route-2',
    date: '2026-08-28',
    status: 'planned',
    stops: [
      { id: 1, client: 'Villa Gamma', address: 'Av 5 #10', type: 'Pickup', timeWindow: '09:00 - 11:00', estimatedBags: 1, actualBags: null, status: 'Pending' },
    ],
  },
  // 3. Today, completed (belongs to history)
  {
    id: 'route-3',
    date: '2026-09-04',
    status: 'completed',
    stops: [
      { id: 1, client: 'Hotel Delta', address: 'Calle 100', type: 'Pickup', timeWindow: '07:00 - 08:00', estimatedBags: 4, actualBags: 4, status: 'Completed' },
    ],
  },
  // 4. Today, in_progress (NOT history, should be excluded)
  {
    id: 'route-4',
    date: '2026-09-04',
    status: 'in_progress',
    stops: [
      { id: 1, client: 'Active Client', address: 'Av Principal', type: 'Delivery', timeWindow: '14:00 - 16:00', estimatedBags: 2, actualBags: null, status: 'Pending' },
    ],
  },
  // 5. Older than 15 days (outside default window)
  {
    id: 'route-5',
    date: '2026-08-10',
    status: 'completed',
    stops: [
      { id: 1, client: 'Old Client', address: 'Calle Vieja', type: 'Pickup', timeWindow: '10:00 - 12:00', estimatedBags: 1, actualBags: 1, status: 'Completed' },
    ],
  },
]

describe('DriverHistory.vue', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('carga por defecto los últimos 15 días e inicializa DateRangeFilter', async () => {
    mockFetchAllRoutes.mockResolvedValueOnce(mockRoutesData)
    const wrapper = mountComponent()

    expect(mockFetchAllRoutes).toHaveBeenCalledTimes(1)
    await flushPromises()

    // DateRangeFilter debe existir y reflejar el rango de 15 días
    const filter = wrapper.findComponent(DateRangeFilter)
    expect(filter.exists()).toBe(true)
    expect(filter.props('from')).toBe(MOCK_15_DAYS_AGO)
    expect(filter.props('to')).toBe(MOCK_TODAY)
  })

  it('muestra solo las rutas que pertenecen al historial y caen dentro del rango por defecto de 15 días', async () => {
    mockFetchAllRoutes.mockResolvedValueOnce(mockRoutesData)
    const wrapper = mountComponent()
    await flushPromises()

    const text = wrapper.text()
    // route-1 (2026-08-25, completed) -> visible
    expect(text).toContain('2026-08-25')
    expect(text).toContain('Hotel Alpha')

    // route-2 (2026-08-28, planned past date) -> visible
    expect(text).toContain('2026-08-28')
    expect(text).toContain('Villa Gamma')

    // route-3 (2026-09-04, completed today) -> visible
    expect(text).toContain('2026-09-04')
    expect(text).toContain('Hotel Delta')

    // route-4 (2026-09-04, in_progress today) -> EXCLUDED (active route)
    expect(text).not.toContain('Active Client')

    // route-5 (2026-08-10, older than 15 days) -> EXCLUDED by date range
    expect(text).not.toContain('2026-08-10')
    expect(text).not.toContain('Old Client')
  })

  it('filtra reactivamente cuando DateRangeFilter emite update:from y update:to', async () => {
    mockFetchAllRoutes.mockResolvedValueOnce(mockRoutesData)
    const wrapper = mountComponent()
    await flushPromises()

    const filter = wrapper.findComponent(DateRangeFilter)

    // Ampliar el rango para incluir la ruta antigua (2026-08-10)
    await filter.vm.$emit('update:from', '2026-08-01')
    await filter.vm.$emit('update:to', '2026-08-15')
    await flushPromises()

    const text = wrapper.text()
    // Ahora solo route-5 debe estar visible
    expect(text).toContain('2026-08-10')
    expect(text).toContain('Old Client')
    expect(text).not.toContain('2026-08-25')
    expect(text).not.toContain('2026-08-28')
  })

  it('muestra el botón de restablecer a 15 días cuando el filtro cambia y restaura el rango al pulsarlo', async () => {
    mockFetchAllRoutes.mockResolvedValueOnce(mockRoutesData)
    const wrapper = mountComponent()
    await flushPromises()

    // En rango por defecto, el botón de restablecer NO debe existir
    expect(wrapper.find('[data-testid="reset-15-days"]').exists()).toBe(false)

    // Cambiar la fecha de inicio
    const filter = wrapper.findComponent(DateRangeFilter)
    await filter.vm.$emit('update:from', '2026-08-22')
    await flushPromises()

    // Ahora el botón de restablecer debe ser visible
    const resetBtn = wrapper.find('[data-testid="reset-15-days"]')
    expect(resetBtn.exists()).toBe(true)
    expect(resetBtn.text()).toBe(en.driver.reset15Days)

    // Al hacer clic en restablecer, vuelve a 15 días
    await resetBtn.trigger('click')
    await flushPromises()

    expect(filter.props('from')).toBe(MOCK_15_DAYS_AGO)
    expect(filter.props('to')).toBe(MOCK_TODAY)
    expect(wrapper.find('[data-testid="reset-15-days"]').exists()).toBe(false)
  })

  it('permite limpiar el filtro con clear para ver todo el historial sin restricción de fechas', async () => {
    mockFetchAllRoutes.mockResolvedValueOnce(mockRoutesData)
    const wrapper = mountComponent()
    await flushPromises()

    const filter = wrapper.findComponent(DateRangeFilter)
    await filter.vm.$emit('clear')
    await flushPromises()

    const text = wrapper.text()
    // Todas las rutas de historial (incluida la de hace más de 15 días) deben ser visibles
    expect(text).toContain('2026-08-10')
    expect(text).toContain('2026-08-25')
    expect(text).toContain('2026-08-28')
    expect(text).toContain('2026-09-04')
  })

  it('muestra el mensaje de estado vacío cuando no hay rutas en el rango seleccionado', async () => {
    mockFetchAllRoutes.mockResolvedValueOnce(mockRoutesData)
    const wrapper = mountComponent()
    await flushPromises()

    const filter = wrapper.findComponent(DateRangeFilter)
    // Seleccionar rango futuro sin rutas
    await filter.vm.$emit('update:from', '2026-01-01')
    await filter.vm.$emit('update:to', '2026-01-05')
    await flushPromises()

    expect(wrapper.text()).toContain(en.driver.noHistory)
  })
})
