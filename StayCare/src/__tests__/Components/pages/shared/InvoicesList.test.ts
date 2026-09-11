import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { createPinia, setActivePinia } from 'pinia'
import InvoicesList from '@/Components/pages/shared/InvoicesList.vue'
import en from '@/i18n/en.json'

// ─── Mocks de servicios y composables ────────────────────────────────────────

const { mockDownloadInvoicesCsv } = vi.hoisted(() => ({
  mockDownloadInvoicesCsv: vi.fn().mockResolvedValue(undefined),
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

vi.mock('@/api/invoices', () => ({
  fetchInvoices: vi.fn(),
  downloadInvoicesCsv: mockDownloadInvoicesCsv,
}))

let mockIsAdmin = true
vi.mock('@/stores/auth.js', () => ({
  useAuthStore: () => ({
    user: { id: 'u1', name: 'Test User', role: mockIsAdmin ? 'admin' : 'client' },
    isAdmin: mockIsAdmin,
  }),
}))

const mockShowError = vi.fn()
vi.mock('@/stores/ui.js', () => ({
  useUiStore: () => ({
    showError: mockShowError,
    showSuccess: vi.fn(),
  }),
}))

// ─── Helpers y Stubs ────────────────────────────────────────────────────────

function createTestI18n() {
  return createI18n({ legacy: false, locale: 'en', messages: { en } })
}

function makeRawInvoice(id: string, overrides: Partial<any> = {}) {
  return {
    id,
    invoice_number: id,
    orders: [{ id: `ORD-${id}` }],
    client_name: 'Hotel Luxe',
    client_id: 'client-1',
    issue_date: '2026-08-15',
    due_date: '2026-09-15',
    subtotal: 100,
    vat_amount: 18,
    total: 118,
    status: 'pending',
    ...overrides,
  }
}

async function mountInvoicesList(options: {
  isAdmin?: boolean
  invoicesData?: any[]
} = {}) {
  mockIsAdmin = options.isAdmin ?? true

  const { fetchInvoices } = await import('@/api/invoices')
  vi.mocked(fetchInvoices).mockResolvedValue(options.invoicesData ?? [
    makeRawInvoice('INV-001', { total: 150, status: 'pending' }),
    makeRawInvoice('INV-002', { total: 280, status: 'paid' }),
    makeRawInvoice('INV-003', { total: 95.5, status: 'overdue' }),
  ])

  setActivePinia(createPinia())

  const { useNavStore } = await import('@/stores/nav.js')
  const navStore = useNavStore()
  vi.spyOn(navStore, 'setPage')
  vi.spyOn(navStore, 'goToDetail')

  const wrapper = mount(InvoicesList, {
    global: {
      plugins: [createTestI18n()],
      stubs: {
        ClientFilterSelect: {
          name: 'ClientFilterSelect',
          props: ['modelValue'],
          template: '<div data-testid="client-filter-select" :data-value="modelValue" />',
        },
        DateRangeFilter: {
          name: 'DateRangeFilter',
          props: ['from', 'to'],
          template: '<div data-testid="date-range-filter" :data-from="from" :data-to="to" />',
        },
      },
    },
  })

  await flushPromises()
  return { wrapper, navStore, fetchInvoices: vi.mocked(fetchInvoices) }
}

describe('InvoicesList.vue', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockIsAdmin = true
  })

  // ─── 1. Carga y renderizado de facturas ────────────────────────────────────

  describe('Carga y renderizado', () => {
    it('llama a fetchInvoices al montarse con los parámetros por defecto', async () => {
      const { fetchInvoices } = await mountInvoicesList()
      expect(fetchInvoices).toHaveBeenCalledOnce()
      const params = fetchInvoices.mock.calls[0][0]
      expect(params).toMatchObject({ limit: '200' })
      expect(params.from).toBeDefined()
      expect(params.to).toBeDefined()
    })

    it('renderiza la cantidad exacta de facturas devueltas por la API', async () => {
      const { wrapper } = await mountInvoicesList()
      const rows = wrapper.findAll('tbody tr')
      expect(rows).toHaveLength(3)
    })

    it('muestra los datos y montos formateados correctamente en cada fila', async () => {
      const { wrapper } = await mountInvoicesList()
      const rows = wrapper.findAll('tbody tr')

      // Primera fila
      expect(rows[0].text()).toContain('INV-001')
      expect(rows[0].text()).toContain('Hotel Luxe')
      expect(rows[0].text()).toContain('€150.00')

      // Segunda fila
      expect(rows[1].text()).toContain('INV-002')
      expect(rows[1].text()).toContain('€280.00')

      // Tercera fila
      expect(rows[2].text()).toContain('INV-003')
      expect(rows[2].text()).toContain('€95.50')
    })

    it('maneja errores de la API sin crashear y mostrando la lista vacía', async () => {
      const { fetchInvoices } = await import('@/api/invoices')
      vi.mocked(fetchInvoices).mockRejectedValueOnce(new Error('Network error'))

      const { wrapper } = await mountInvoicesList({ invoicesData: [] })
      expect(wrapper.findAll('tbody tr')).toHaveLength(0)
      expect(wrapper.text()).toContain(en.common.noData)
    })
  })

  // ─── 2. Control de acceso por Rol ──────────────────────────────────────────

  describe('Control por Rol (Admin vs No-Admin)', () => {
    it('muestra el botón "Create Invoice" y el selector de cliente cuando el usuario es Admin', async () => {
      const { wrapper } = await mountInvoicesList({ isAdmin: true })

      const createBtn = wrapper.findAll('button').find(b => b.text().includes(en.admin.createInvoice))
      expect(createBtn?.exists()).toBe(true)

      const clientSelect = wrapper.find('[data-testid="client-filter-select"]')
      expect(clientSelect.exists()).toBe(true)
    })

    it('OCULTA el botón "Create Invoice" y el selector de cliente cuando el usuario NO es Admin', async () => {
      const { wrapper } = await mountInvoicesList({ isAdmin: false })

      const createBtn = wrapper.findAll('button').find(b => b.text().includes(en.admin.createInvoice))
      expect(createBtn).toBeUndefined()

      const clientSelect = wrapper.find('[data-testid="client-filter-select"]')
      expect(clientSelect.exists()).toBe(false)
    })
  })

  // ─── 3. Acciones y Navegación ──────────────────────────────────────────────

  describe('Acciones y Navegación', () => {
    it('navega a "create-invoice" al pulsar el botón de crear factura', async () => {
      const { wrapper, navStore } = await mountInvoicesList({ isAdmin: true })

      const createBtn = wrapper.findAll('button').find(b => b.text().includes(en.admin.createInvoice))
      await createBtn?.trigger('click')

      expect(navStore.setPage).toHaveBeenCalledWith('create-invoice')
    })

    it('navega a "invoice-detail" con el ID correspondiente al pulsar "View Details"', async () => {
      const { wrapper, navStore } = await mountInvoicesList()

      const viewDetailsBtns = wrapper.findAll('tbody tr button')
      expect(viewDetailsBtns.length).toBeGreaterThanOrEqual(1)

      // Clic en el botón de la primera fila
      await viewDetailsBtns[0].trigger('click')
      expect(navStore.goToDetail).toHaveBeenCalledWith('invoice-detail', 'INV-001')
    })
  })

  // ─── 4. Filtros de Estado ──────────────────────────────────────────────────

  describe('Filtros de Estado', () => {
    it('cambia el filtro activo y recarga con el status correspondiente al hacer clic', async () => {
      const { wrapper, fetchInvoices } = await mountInvoicesList()

      // Buscar el botón de filtro "Pending"
      const pendingBtn = wrapper.findAll('button').find(b => b.text() === en.invoices.filterPending)
      expect(pendingBtn?.exists()).toBe(true)

      await pendingBtn?.trigger('click')
      await flushPromises()

      expect(fetchInvoices).toHaveBeenCalledTimes(2)
      const lastCallParams = fetchInvoices.mock.calls[1][0]
      expect(lastCallParams.status).toBe('pending')
      expect(pendingBtn?.classes()).toContain('bg-brand-700')
    })

    it('vuelve a cargar todas las facturas al seleccionar "All"', async () => {
      const { wrapper, fetchInvoices } = await mountInvoicesList()

      const pendingBtn = wrapper.findAll('button').find(b => b.text() === en.invoices.filterPending)
      await pendingBtn?.trigger('click')
      await flushPromises()

      const allBtn = wrapper.findAll('button').find(b => b.text() === en.invoices.filterAll)
      await allBtn?.trigger('click')
      await flushPromises()

      const lastCallParams = fetchInvoices.mock.calls[2][0]
      expect(lastCallParams.status).toBeUndefined()
    })
  })

  // ─── 5. Exportación a CSV ──────────────────────────────────────────────────

  describe('Exportación a CSV', () => {
    it('llama a downloadInvoicesCsv con los parámetros y filtros activos al pulsar Descargar CSV', async () => {
      const { wrapper } = await mountInvoicesList()

      const exportBtn = wrapper.findAll('button').find(b => b.text().includes(en.invoices.exportCsv))
      expect(exportBtn?.exists()).toBe(true)

      await exportBtn?.trigger('click')
      await flushPromises()

      expect(mockDownloadInvoicesCsv).toHaveBeenCalledOnce()
      const params = mockDownloadInvoicesCsv.mock.calls[0][0]
      expect(params.from).toBeDefined()
      expect(params.to).toBeDefined()
    })

    it('incluye el filtro de cliente y status al exportar cuando están seleccionados', async () => {
      const { wrapper } = await mountInvoicesList({ isAdmin: true })

      // 1. Filtrar por status 'pending'
      const pendingBtn = wrapper.findAll('button').find(b => b.text() === en.invoices.filterPending)
      await pendingBtn?.trigger('click')
      await flushPromises()

      // 2. Filtrar por cliente
      const clientSelectComp = wrapper.findComponent({ name: 'ClientFilterSelect' })
      clientSelectComp.vm.$emit('update:modelValue', 'client-1')
      clientSelectComp.vm.$emit('change', 'client-1')
      await flushPromises()

      // 3. Exportar
      const exportBtn = wrapper.findAll('button').find(b => b.text().includes(en.invoices.exportCsv))
      await exportBtn?.trigger('click')
      await flushPromises()

      expect(mockDownloadInvoicesCsv).toHaveBeenCalledOnce()
      const params = mockDownloadInvoicesCsv.mock.calls[0][0]
      expect(params.status).toBe('pending')
      expect(params.client_id).toBe('client-1')
    })

    it('muestra error usando uiStore cuando falla la descarga del CSV', async () => {
      mockDownloadInvoicesCsv.mockRejectedValueOnce(new Error('Network export error'))
      const { wrapper } = await mountInvoicesList()

      const exportBtn = wrapper.findAll('button').find(b => b.text().includes(en.invoices.exportCsv))
      await exportBtn?.trigger('click')
      await flushPromises()

      expect(mockShowError).toHaveBeenCalledWith('Network export error')
    })
  })
})
