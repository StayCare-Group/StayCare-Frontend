import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { createPinia, setActivePinia } from 'pinia'
import FacilityDashboard from '@/Components/dashboard/FacilityDashboard.vue'
import en from '@/i18n/en.json'

/**
 * Tests para FacilityDashboard.vue (src/Components/dashboard/FacilityDashboard.vue)
 *
 * Responsabilidad exclusiva de este test:
 * 1. Probar la lógica interna de FacilityDashboard (facilityKPIs computed, loadOrders, watch en navStore).
 * 2. Verificar que los componentes hijos importados (KpiCard, OrdersList, Reception, etc.) se invoquen/monten
 *    según el estado, SIN probar el comportamiento ni la UI interna de esos componentes (aislamiento mediante stubs).
 */

// ─── Mocks de servicios externos ─────────────────────────────────────────────

vi.mock('@/api/client', () => ({ apiFetch: vi.fn() }))
vi.mock('@/router', () => ({ default: { push: vi.fn(), currentRoute: { value: {} } } }))

vi.mock('@/api/orders', async () => {
  const actual = await vi.importActual('@/api/orders')
  return { ...actual, fetchAllOrders: vi.fn() }
})

vi.mock('@/stores/auth.js', () => ({
  useAuthStore: vi.fn(() => ({ user: { role: 'staff' } })),
}))

vi.mock('@/stores/ui.js', () => ({
  useUiStore: vi.fn(() => ({ showError: vi.fn(), showSuccess: vi.fn() })),
}))

// Stubs: No testeamos la implementación interna de los componentes importados
const COMPONENT_STUBS = {
  OrdersList: { template: '<div data-testid="orders-list" />' },
  PickupConfirm: { template: '<div data-testid="pickup-confirm" />' },
  DeliveryConfirm: { template: '<div data-testid="delivery-confirm" />' },
  OrderDetail: { template: '<div data-testid="order-detail" />' },
  OrderCreateForm: { template: '<div data-testid="order-create-form" />' },
  Reception: { template: '<div data-testid="reception" />' },
  Processing: { template: '<div data-testid="processing" />' },
  RoutePlanner: { template: '<div data-testid="route-planner" />' },
  Settings: { template: '<div data-testid="settings" />' },
  ProfileAccount: { template: '<div data-testid="profile-account" />' },
  LoadingPanel: { template: '<div data-testid="loading-panel" />' },
  KpiCard: {
    name: 'KpiCard',
    template: '<div class="kpi-card" :data-label="label" :data-value="value" :data-color="color" />',
    props: ['label', 'value', 'color'],
  },
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function createTestI18n() {
  return createI18n({ legacy: false, locale: 'en', messages: { en } })
}

async function mountDashboard(currentPage = 'dashboard', ordersData: any[] = []) {
  const { fetchAllOrders } = await import('@/api/orders')
  vi.mocked(fetchAllOrders).mockResolvedValue(ordersData)

  setActivePinia(createPinia())

  const { useNavStore } = await import('@/stores/nav.js')
  const navStore = useNavStore()
  navStore.currentPage = currentPage

  const wrapper = mount(FacilityDashboard, {
    global: {
      plugins: [createTestI18n()],
      stubs: COMPONENT_STUBS,
    },
  })

  await flushPromises()
  return { wrapper, navStore, fetchAllOrders: vi.mocked(fetchAllOrders) }
}

function makeOrder(status: string, id: string) {
  return {
    _id: id,
    order_number: id,
    client_name: 'Test Client',
    status,
    service_type: 'standard',
    created_at: '2025-01-15',
    pickup_date: '2025-01-16',
    estimated_bags: 1,
    total: 50,
  }
}

// ─── 1. KPIs del Facility Dashboard (facilityKPIs + KpiCard invocation) ───────

describe('FacilityDashboard — Lógica de KPIs y uso de KpiCard', () => {
  beforeEach(() => vi.clearAllMocks())

  it('llama a fetchAllOrders con los 6 estados del flujo de facility al inicializarse', async () => {
    const { fetchAllOrders } = await mountDashboard()

    expect(fetchAllOrders).toHaveBeenCalledOnce()
    const callArg = fetchAllOrders.mock.calls[0][0] as { status: string }
    const statuses = callArg.status.split(',')
    expect(statuses).toEqual(
      expect.arrayContaining(['arrived', 'washing', 'drying', 'ironing', 'quality_check', 'ready_to_delivery'])
    )
  })

  it('renderiza exactamente 6 componentes KpiCard (uno por cada estado)', async () => {
    const { wrapper } = await mountDashboard('dashboard', [])
    const kpiCards = wrapper.findAllComponents({ name: 'KpiCard' })
    expect(kpiCards).toHaveLength(6)
  })

  it('calcula los conteos propios y los pasa como props a KpiCard', async () => {
    const orders = [
      makeOrder('arrived', 'o1'),
      makeOrder('arrived', 'o2'),
      makeOrder('washing', 'o3'),
      makeOrder('quality_check', 'o4'),
    ]
    const { wrapper } = await mountDashboard('dashboard', orders)

    const kpiCards = wrapper.findAllComponents({ name: 'KpiCard' })

    const arrivedCard = kpiCards.find(c => c.props('label') === en.facility.incoming)
    expect(arrivedCard?.props('value')).toBe(2)
    expect(arrivedCard?.props('color')).toBe('blue')

    const washingCard = kpiCards.find(c => c.props('label') === en.facility.washing)
    expect(washingCard?.props('value')).toBe(1)
    expect(washingCard?.props('color')).toBe('cyan')

    const dryingCard = kpiCards.find(c => c.props('label') === en.facility.drying)
    expect(dryingCard?.props('value')).toBe(0)
    expect(dryingCard?.props('color')).toBe('yellow')
  })

  it('maneja errores de la API sin crashear y manteniendo los KPIs en 0', async () => {
    const { fetchAllOrders } = await import('@/api/orders')
    vi.mocked(fetchAllOrders).mockRejectedValue(new Error('Network error'))

    setActivePinia(createPinia())
    const wrapper = mount(FacilityDashboard, {
      global: { plugins: [createTestI18n()], stubs: COMPONENT_STUBS },
    })
    await flushPromises()

    const kpiCards = wrapper.findAllComponents({ name: 'KpiCard' })
    expect(kpiCards).toHaveLength(6)
    kpiCards.forEach(card => {
      expect(card.props('value')).toBe(0)
    })
  })
})

// ─── 2. Renderizado condicional de sub-páginas (navStore.currentPage) ────────

describe('FacilityDashboard — Renderizado de sub-páginas', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renderiza OrdersList cuando currentPage es "orders"', async () => {
    const { wrapper } = await mountDashboard('orders')
    expect(wrapper.find('[data-testid="orders-list"]').exists()).toBe(true)
  })

  it('renderiza Reception cuando currentPage es "reception"', async () => {
    const { wrapper } = await mountDashboard('reception')
    expect(wrapper.find('[data-testid="reception"]').exists()).toBe(true)
  })

  it('renderiza Processing cuando currentPage es "processing"', async () => {
    const { wrapper } = await mountDashboard('processing')
    expect(wrapper.find('[data-testid="processing"]').exists()).toBe(true)
  })

  it('renderiza el resumen de KPIs cuando currentPage es "dashboard"', async () => {
    const { wrapper } = await mountDashboard('dashboard', [])
    expect(wrapper.findAllComponents({ name: 'KpiCard' }).length).toBe(6)
  })
})

// ─── 3. Lógica reactiva (Watch en currentPage) ──────────────────────────────

describe('FacilityDashboard — Reactividad de navegación', () => {
  beforeEach(() => vi.clearAllMocks())

  it('recarga las órdenes al regresar a la vista "dashboard"', async () => {
    const { navStore, fetchAllOrders } = await mountDashboard('orders')

    navStore.currentPage = 'dashboard'
    await flushPromises()

    expect(fetchAllOrders).toHaveBeenCalledTimes(2)
  })

  it('no ejecuta recargas innecesarias al navegar entre otras sub-páginas', async () => {
    const { navStore, fetchAllOrders } = await mountDashboard('dashboard')

    navStore.currentPage = 'orders'
    await flushPromises()

    expect(fetchAllOrders).toHaveBeenCalledTimes(1)
  })
})
