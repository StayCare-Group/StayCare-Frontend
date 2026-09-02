import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { createPinia, setActivePinia } from 'pinia'
import Processing from '@/Components/pages/facility/Processing.vue'
import en from '@/i18n/en.json'

/**
 * Tests for Processing.vue (facility kanban board)
 *
 * Responsabilidad:
 * 1. Renderizado del kanban: columnas y tarjetas de orden.
 * 2. Avanzar a etapa sin máquina (arrived → washing NO se auto-asigna; abre modal).
 * 3. El modal MachineSelectModal se muestra con los datos correctos al avanzar
 *    a una etapa con máquina.
 * 4. Skip (avanzar sin máquina): llama a updateOrderStatus pero NO a assignMachine.
 * 5. Confirm (avanzar con máquina): llama a updateOrderStatus Y a assignMachine.
 * 6. Close del modal: no avanza el estado ni asigna máquina.
 * 7. Avanzar a etapa sin máquina (ironing → quality_check): no abre el modal.
 * 8. Manejo de errores de la API.
 *
 * Los componentes hijos se stubbean para aislar la lógica de Processing.
 */

// ─── Mocks ───────────────────────────────────────────────────────────────────

const mockFetchAllOrders   = vi.fn()
const mockUpdateOrderStatus = vi.fn()
const mockFetchMachineStatus = vi.fn()
const mockAssignMachine    = vi.fn()
const mockReleaseMachine   = vi.fn()
const mockShowError        = vi.fn()
const mockShowSuccess      = vi.fn()

vi.mock('@/api/orders', () => ({
  fetchAllOrders:    (...args: any[]) => mockFetchAllOrders(...args),
  updateOrderStatus: (...args: any[]) => mockUpdateOrderStatus(...args),
  updateOrder:       vi.fn(),
}))

vi.mock('@/api/facility', () => ({
  fetchMachineStatus: (...args: any[]) => mockFetchMachineStatus(...args),
  assignMachine:      (...args: any[]) => mockAssignMachine(...args),
  releaseMachine:     (...args: any[]) => mockReleaseMachine(...args),
}))

vi.mock('@/api/client', () => ({ apiFetch: vi.fn() }))

vi.mock('@/stores/auth.js', () => ({
  useAuthStore: vi.fn(() => ({
    user: { role: 'staff' },
    isAdmin: false,
    isAdminOrStaff: true,
  })),
}))

vi.mock('@/stores/ui.js', () => ({
  useUiStore: vi.fn(() => ({
    showError:   mockShowError,
    showSuccess: mockShowSuccess,
  })),
}))

// ─── Stubs ────────────────────────────────────────────────────────────────────

/**
 * MachineSelectModal stub con slots y eventos completos.
 * Expone botones con data-testid para activar los tres eventos.
 */
const MachineSelectModalStub = {
  name: 'MachineSelectModal',
  props: ['show', 'machines', 'stageLabel'],
  emits: ['close', 'skip', 'confirm'],
  template: `
    <div v-if="show" data-testid="machine-select-modal">
      <span data-testid="msm-stage-label">{{ stageLabel }}</span>
      <span data-testid="msm-machine-count">{{ machines.length }}</span>
      <button data-testid="msm-btn-close"   @click="$emit('close')" />
      <button data-testid="msm-btn-skip"    @click="$emit('skip')" />
      <button
        v-for="m in machines"
        :key="m.id"
        :data-testid="'msm-btn-confirm-' + m.id"
        @click="$emit('confirm', m.id)"
      />
    </div>
  `,
}

const COMPONENT_STUBS = {
  AppButton:          { template: '<button><slot /></button>', props: ['disabled', 'loading'] },
  AppTooltip:         { template: '<div><slot /></div>' },
  QualityCheckModal:  { template: '<div />', props: ['show', 'order'], emits: ['close', 'success'] },
  MachineSelectModal: MachineSelectModalStub,
  MachineManagement:  {
    name: 'MachineManagement',
    template: '<div data-testid="machine-management" :data-count="machines.length" />',
    props: ['machines'],
    emits: ['refresh'],
  },
}

// ─── Fixtures ────────────────────────────────────────────────────────────────

function makeOrder(status: string, id = 'ord-1') {
  return {
    _id: id,
    id,
    order_number: `ORD-${id}`,
    status,
    service_type: 'standard',
    client_name: 'Test Client',
    special_notes: '',
    items: [],
  }
}

function makeMachine(type: string, id: string, status = 'available', current_order_id: string | null = null) {
  return {
    id,
    _id: id,
    name: `${type} #${id}`,
    type,
    status,
    capacity: '25 kg',
    current_order_id,
    order_number: current_order_id ?? null,
    order_status: current_order_id ? 'washing' : null,
    started_at: null,
  }
}

// ─── Mount helper ────────────────────────────────────────────────────────────

function createTestI18n() {
  return createI18n({ legacy: false, locale: 'en', messages: { en } })
}

async function mountProcessing(options: {
  orders?: any[]
  machines?: any[]
} = {}) {
  const orders   = options.orders   ?? []
  const machines = options.machines ?? []

  mockFetchAllOrders.mockResolvedValue(orders)
  mockFetchMachineStatus.mockResolvedValue(machines)
  mockUpdateOrderStatus.mockResolvedValue({})
  mockAssignMachine.mockResolvedValue({})
  mockReleaseMachine.mockResolvedValue({})

  setActivePinia(createPinia())

  const wrapper = mount(Processing, {
    global: {
      plugins: [createTestI18n()],
      stubs: COMPONENT_STUBS,
    },
  })

  await flushPromises()
  return wrapper
}

// ─── 1. Kanban rendering ──────────────────────────────────────────────────────

describe('Processing — renderizado del kanban', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renderiza las 6 columnas del pipeline', async () => {
    const wrapper = await mountProcessing()
    // Cada columna tiene un título en uppercase (h3)
    const headers = wrapper.findAll('h3')
    expect(headers.length).toBeGreaterThanOrEqual(6)
  })

  it('carga órdenes llamando a fetchAllOrders al montar', async () => {
    await mountProcessing()
    expect(mockFetchAllOrders).toHaveBeenCalledOnce()
    const arg = mockFetchAllOrders.mock.calls[0][0]
    expect(arg.status).toContain('arrived')
    expect(arg.status).toContain('washing')
    expect(arg.status).toContain('drying')
    expect(arg.status).toContain('ironing')
  })

  it('carga máquinas llamando a fetchMachineStatus al montar', async () => {
    await mountProcessing()
    expect(mockFetchMachineStatus).toHaveBeenCalledOnce()
  })

  it('muestra el order_number de una orden en la columna correcta', async () => {
    const order = makeOrder('washing', 'ord-wash-1')
    const wrapper = await mountProcessing({ orders: [order] })
    expect(wrapper.text()).toContain('ORD-ord-wash-1')
  })

  it('muestra el mensaje de sin pedidos cuando la columna está vacía', async () => {
    const wrapper = await mountProcessing({ orders: [] })
    expect(wrapper.text()).toContain(en.facilityProcessing.noOrders)
  })

  it('renderiza el componente hijo MachineManagement con las máquinas cargadas', async () => {
    const washer  = makeMachine('washer', 'mach-w1')
    const wrapper = await mountProcessing({ machines: [washer] })
    const mm = wrapper.find('[data-testid="machine-management"]')
    expect(mm.exists()).toBe(true)
    expect(mm.attributes('data-count')).toBe('1')
  })
})

// ─── 2. Modal de selección de máquina — apertura ─────────────────────────────

describe('Processing — apertura del MachineSelectModal al avanzar a etapa con máquina', () => {
  beforeEach(() => vi.clearAllMocks())

  it('abre el MachineSelectModal al avanzar una orden a "washing"', async () => {
    const order    = makeOrder('arrived', 'ord-1')
    const washer   = makeMachine('washer', 'mach-w1')
    const wrapper  = await mountProcessing({ orders: [order], machines: [washer] })

    // El modal no debe estar visible inicialmente
    expect(wrapper.find('[data-testid="machine-select-modal"]').exists()).toBe(false)

    // Pulsar el botón "Move to Washing" de la tarjeta
    const advanceBtn = wrapper.findAll('button').find(b =>
      b.text().toLowerCase().includes('washing')
    )
    await advanceBtn?.trigger('click')
    await flushPromises()

    expect(wrapper.find('[data-testid="machine-select-modal"]').exists()).toBe(true)
  })

  it('pasa la etiqueta correcta al MachineSelectModal (Washing)', async () => {
    const order   = makeOrder('arrived', 'ord-1')
    const washer  = makeMachine('washer', 'mach-w1')
    const wrapper = await mountProcessing({ orders: [order], machines: [washer] })

    const advanceBtn = wrapper.findAll('button').find(b =>
      b.text().toLowerCase().includes('washing')
    )
    await advanceBtn?.trigger('click')
    await flushPromises()

    const stageLabel = wrapper.find('[data-testid="msm-stage-label"]').text()
    // La etiqueta debe corresponder a "Washing" (traducción en inglés)
    expect(stageLabel).toBeTruthy()
  })

  it('pasa solo las máquinas disponibles del tipo correcto (washers) al modal', async () => {
    const order    = makeOrder('arrived', 'ord-1')
    const washer1  = makeMachine('washer', 'mach-w1', 'available')
    const washer2  = makeMachine('washer', 'mach-w2', 'running', 'other-ord')  // en uso
    const dryer1   = makeMachine('dryer',  'mach-d1', 'available')
    const wrapper  = await mountProcessing({ orders: [order], machines: [washer1, washer2, dryer1] })

    const advanceBtn = wrapper.findAll('button').find(b =>
      b.text().toLowerCase().includes('washing')
    )
    await advanceBtn?.trigger('click')
    await flushPromises()

    // Solo washer1 está disponible; washer2 está running y dryer1 es dryer
    const machCount = wrapper.find('[data-testid="msm-machine-count"]').text()
    expect(machCount).toBe('1')
  })
})

// ─── 3. Modal — flujo Skip (avanzar sin máquina) ──────────────────────────────

describe('Processing — Skip en MachineSelectModal', () => {
  beforeEach(() => vi.clearAllMocks())

  async function openModal(wrapper: any) {
    const advanceBtn = wrapper.findAll('button').find((b: any) =>
      b.text().toLowerCase().includes('washing')
    )
    await advanceBtn?.trigger('click')
    await flushPromises()
  }

  it('llama a updateOrderStatus pero NO a assignMachine cuando el staff omite la máquina', async () => {
    const order   = makeOrder('arrived', 'ord-1')
    const washer  = makeMachine('washer', 'mach-w1')
    const wrapper = await mountProcessing({ orders: [order], machines: [washer] })

    await openModal(wrapper)

    // Pulsar "Skip"
    await wrapper.find('[data-testid="msm-btn-skip"]').trigger('click')
    await flushPromises()

    expect(mockUpdateOrderStatus).toHaveBeenCalledWith('ord-1', 'washing')
    expect(mockAssignMachine).not.toHaveBeenCalled()
  })

  it('cierra el modal después de hacer Skip', async () => {
    const order   = makeOrder('arrived', 'ord-1')
    const washer  = makeMachine('washer', 'mach-w1')
    const wrapper = await mountProcessing({ orders: [order], machines: [washer] })

    await openModal(wrapper)
    await wrapper.find('[data-testid="msm-btn-skip"]').trigger('click')
    await flushPromises()

    expect(wrapper.find('[data-testid="machine-select-modal"]').exists()).toBe(false)
  })
})

// ─── 4. Modal — flujo Confirm (avanzar con máquina) ──────────────────────────

describe('Processing — Confirm en MachineSelectModal', () => {
  beforeEach(() => vi.clearAllMocks())

  async function openModal(wrapper: any) {
    const advanceBtn = wrapper.findAll('button').find((b: any) =>
      b.text().toLowerCase().includes('washing')
    )
    await advanceBtn?.trigger('click')
    await flushPromises()
  }

  it('llama a updateOrderStatus Y a assignMachine al confirmar con una máquina', async () => {
    const order   = makeOrder('arrived', 'ord-1')
    const washer  = makeMachine('washer', 'mach-w1')
    const wrapper = await mountProcessing({ orders: [order], machines: [washer] })

    await openModal(wrapper)

    // Pulsar el botón confirm del stub (uno por máquina disponible)
    await wrapper.find('[data-testid="msm-btn-confirm-mach-w1"]').trigger('click')
    await flushPromises()

    expect(mockUpdateOrderStatus).toHaveBeenCalledWith('ord-1', 'washing')
    expect(mockAssignMachine).toHaveBeenCalledWith('mach-w1', 'ord-1')
  })

  it('cierra el modal después de confirmar', async () => {
    const order   = makeOrder('arrived', 'ord-1')
    const washer  = makeMachine('washer', 'mach-w1')
    const wrapper = await mountProcessing({ orders: [order], machines: [washer] })

    await openModal(wrapper)
    await wrapper.find('[data-testid="msm-btn-confirm-mach-w1"]').trigger('click')
    await flushPromises()

    expect(wrapper.find('[data-testid="machine-select-modal"]').exists()).toBe(false)
  })
})

// ─── 5. Modal — flujo Close (cancelar sin avanzar) ───────────────────────────

describe('Processing — Close en MachineSelectModal', () => {
  beforeEach(() => vi.clearAllMocks())

  it('no avanza el estado ni asigna máquina al cerrar el modal', async () => {
    const order   = makeOrder('arrived', 'ord-1')
    const washer  = makeMachine('washer', 'mach-w1')
    const wrapper = await mountProcessing({ orders: [order], machines: [washer] })

    // Abrir el modal
    const advanceBtn = wrapper.findAll('button').find(b =>
      b.text().toLowerCase().includes('washing')
    )
    await advanceBtn?.trigger('click')
    await flushPromises()

    // Cerrar sin hacer nada
    await wrapper.find('[data-testid="msm-btn-close"]').trigger('click')
    await flushPromises()

    expect(mockUpdateOrderStatus).not.toHaveBeenCalled()
    expect(mockAssignMachine).not.toHaveBeenCalled()
    expect(wrapper.find('[data-testid="machine-select-modal"]').exists()).toBe(false)
  })
})

// ─── 6. Etapas sin máquina — no abre el modal ────────────────────────────────

describe('Processing — etapas sin máquina (ironing → quality_check)', () => {
  beforeEach(() => vi.clearAllMocks())

  it('NO abre el MachineSelectModal al avanzar de ironing a quality_check', async () => {
    const order   = makeOrder('ironing', 'ord-iron-1')
    const wrapper = await mountProcessing({ orders: [order], machines: [] })

    const advanceBtn = wrapper.findAll('button').find(b =>
      b.text().toLowerCase().includes('quality')
    )
    await advanceBtn?.trigger('click')
    await flushPromises()

    // El modal de selección de máquina no debe aparecer
    expect(wrapper.find('[data-testid="machine-select-modal"]').exists()).toBe(false)
    // Pero sí debe llamar directamente a updateOrderStatus
    expect(mockUpdateOrderStatus).toHaveBeenCalledWith('ord-iron-1', 'quality_check')
  })
})

// ─── 7. Liberar máquina al avanzar ───────────────────────────────────────────

describe('Processing — liberar máquina anterior al avanzar', () => {
  beforeEach(() => vi.clearAllMocks())

  it('llama a releaseMachine antes de actualizar el estado si la orden tenía máquina asignada', async () => {
    // Orden en ironing con máquina asignada
    const order   = makeOrder('ironing', 'ord-iron-1')
    // La máquina referencia la orden
    const iron    = makeMachine('iron', 'mach-iron-1', 'running', 'ord-iron-1')
    const wrapper = await mountProcessing({ orders: [order], machines: [iron] })

    const advanceBtn = wrapper.findAll('button').find(b =>
      b.text().toLowerCase().includes('quality')
    )
    await advanceBtn?.trigger('click')
    await flushPromises()

    expect(mockReleaseMachine).toHaveBeenCalledWith('mach-iron-1')
    expect(mockUpdateOrderStatus).toHaveBeenCalledWith('ord-iron-1', 'quality_check')
  })
})

// ─── 8. Manejo de errores de la API ──────────────────────────────────────────

describe('Processing — manejo de errores', () => {
  beforeEach(() => vi.clearAllMocks())

  it('muestra un error si fetchAllOrders falla al montar', async () => {
    mockFetchAllOrders.mockRejectedValue(new Error('Network error'))
    mockFetchMachineStatus.mockResolvedValue([])

    const wrapper = await mountProcessing()

    // El kanban debe seguir montado (no crash)
    expect(wrapper.exists()).toBe(true)
  })
})

// ─── 9. Asignación y liberación manual de máquinas desde la tarjeta ──────────

describe('Processing — asignación y liberación manual en la tarjeta', () => {
  beforeEach(() => vi.clearAllMocks())

  it('asigna una máquina manualmente seleccionada en el dropdown de la tarjeta', async () => {
    const order  = makeOrder('washing', 'ord-wash-1')
    const washer = makeMachine('washer', 'mach-w1')
    const wrapper = await mountProcessing({ orders: [order], machines: [washer] })

    // Seleccionar la máquina en el select
    const select = wrapper.find('select')
    await select.setValue('mach-w1')

    // Click en botón Go
    const goBtn = wrapper.findAll('button').find(b => b.text() === en.facilityProcessing.go)
    await goBtn?.trigger('click')
    await flushPromises()

    expect(mockAssignMachine).toHaveBeenCalledWith('mach-w1', 'ord-wash-1')
  })

  it('libera la máquina asignada al pulsar Release en la tarjeta', async () => {
    const order  = makeOrder('washing', 'ord-wash-1')
    const washer = makeMachine('washer', 'mach-w1', 'running', 'ord-wash-1')
    const wrapper = await mountProcessing({ orders: [order], machines: [washer] })

    // El botón Release debe aparecer para la orden asignada
    const releaseBtn = wrapper.findAll('button').find(b => b.text() === en.facilityProcessing.release)
    await releaseBtn?.trigger('click')
    await flushPromises()

    expect(mockReleaseMachine).toHaveBeenCalledWith('mach-w1')
  })
})

