import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { createPinia, setActivePinia } from 'pinia'
import InvoicesList from '@/Components/pages/shared/InvoicesList.vue'
import en from '@/i18n/en.json'

// ─── Mocks de servicios y composables ────────────────────────────────────────

const mockExportInvoicesDetailed = vi.fn()

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
}))

vi.mock('@/composables/useExcelExporter.js', () => ({
  useExcelExporter: () => ({
    exportInvoicesDetailed: mockExportInvoicesDetailed,
  }),
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

  // ─── 5. Selección múltiple y Exportación a Excel ────────────────────────────

  describe('Selección y Exportación Excel', () => {
    it('selecciona y deselecciona todas las facturas con el checkbox maestro', async () => {
      const { wrapper } = await mountInvoicesList()

      const masterCheckbox = wrapper.find('thead input[type="checkbox"]')
      expect(masterCheckbox.exists()).toBe(true)

      // Marcar checkbox maestro
      await masterCheckbox.setValue(true)
      await flushPromises()

      const rowCheckboxes = wrapper.findAll('tbody input[type="checkbox"]')
      rowCheckboxes.forEach(cb => {
        expect((cb.element as HTMLInputElement).checked).toBe(true)
      })

      // El botón de exportación debe indicar 3 seleccionadas
      const exportBtn = wrapper.find('button')
      expect(exportBtn.text()).toContain('3')

      // Desmarcar checkbox maestro
      await masterCheckbox.setValue(false)
      await flushPromises()

      rowCheckboxes.forEach(cb => {
        expect((cb.element as HTMLInputElement).checked).toBe(false)
      })
    })

    it('muestra error y NO exporta cuando no hay ninguna factura seleccionada', async () => {
      const { wrapper } = await mountInvoicesList()

      const exportBtn = wrapper.findAll('button').find(b => b.text().includes(en.invoices.exportExcelAll))
      await exportBtn?.trigger('click')

      expect(mockShowError).toHaveBeenCalledWith(en.invoices.exportSelectRequired)
      expect(mockExportInvoicesDetailed).not.toHaveBeenCalled()
    })

    it('exporta únicamente las facturas seleccionadas cuando se marcan checkboxes individuales', async () => {
      const { wrapper } = await mountInvoicesList()

      const rowCheckboxes = wrapper.findAll('tbody input[type="checkbox"]')
      // Seleccionar solo la primera factura
      await rowCheckboxes[0].setValue(true)
      await flushPromises()

      const exportBtn = wrapper.findAll('button').find(b => b.text().includes('1'))
      await exportBtn?.trigger('click')

      expect(mockExportInvoicesDetailed).toHaveBeenCalledOnce()
      const exportedItems = mockExportInvoicesDetailed.mock.calls[0][0]
      expect(exportedItems).toHaveLength(1)
      expect(exportedItems[0]._id).toBe('INV-001')
      expect(mockShowError).not.toHaveBeenCalled()
    })

    it('resetea la selección de facturas al cambiar el filtro de fecha o limpiarlo', async () => {
      const { wrapper } = await mountInvoicesList()

      // 1. Seleccionar facturas
      const masterCheckbox = wrapper.find('thead input[type="checkbox"]')
      ;(masterCheckbox.element as HTMLInputElement).checked = true
      await masterCheckbox.trigger('change')
      await flushPromises()
      expect(wrapper.find('button').text()).toContain('3')

      // 2. Simular cambio en DateRangeFilter (update:from)
      const dateRangeComp = wrapper.findComponent({ name: 'DateRangeFilter' })
      dateRangeComp.vm.$emit('update:from', '2026-08-01')
      await flushPromises()

      // La selección debe haberse reseteado
      expect(wrapper.find('button').text()).toContain(en.invoices.exportExcelAll)

      // 3. Volver a seleccionar y simular clear
      ;(masterCheckbox.element as HTMLInputElement).checked = true
      await masterCheckbox.trigger('change')
      await flushPromises()
      expect(wrapper.find('button').text()).toContain('3')

      dateRangeComp.vm.$emit('clear')
      await flushPromises()
      expect(wrapper.find('button').text()).toContain(en.invoices.exportExcelAll)
    })

    it('resetea la selección de facturas al cambiar el filtro de cliente o de estado', async () => {
      const { wrapper } = await mountInvoicesList({ isAdmin: true })

      // 1. Seleccionar facturas
      const masterCheckbox = wrapper.find('thead input[type="checkbox"]')
      ;(masterCheckbox.element as HTMLInputElement).checked = true
      await masterCheckbox.trigger('change')
      await flushPromises()
      expect(wrapper.find('button').text()).toContain('3')

      // 2. Cambiar filtro de estado
      const pendingBtn = wrapper.findAll('button').find(b => b.text() === en.invoices.filterPending)
      await pendingBtn?.trigger('click')
      await flushPromises()

      expect(wrapper.find('button').text()).toContain(en.invoices.exportExcelAll)

      // 3. Volver a seleccionar y cambiar filtro de cliente
      ;(masterCheckbox.element as HTMLInputElement).checked = true
      await masterCheckbox.trigger('change')
      await flushPromises()
      expect(wrapper.find('button').text()).toContain('3')

      const clientSelectComp = wrapper.findComponent({ name: 'ClientFilterSelect' })
      clientSelectComp.vm.$emit('change', 'client-2')
      await flushPromises()

      expect(wrapper.find('button').text()).toContain(en.invoices.exportExcelAll)
    })
  })
})
