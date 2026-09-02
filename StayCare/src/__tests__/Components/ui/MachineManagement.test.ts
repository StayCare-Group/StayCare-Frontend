import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { createPinia, setActivePinia } from 'pinia'
import MachineManagement from '@/Components/ui/MachineManagement.vue'
import en from '@/i18n/en.json'

/**
 * Tests for MachineManagement.vue (facility machine table & CRUD management)
 *
 * Responsabilidad:
 * 1. Renderizado de estado de máquinas (título, contador de en uso, tabla de máquinas).
 * 2. Formulario de creación: apertura, envío vía POST /api/machines, éxito y emisión de @refresh.
 * 3. Formulario de edición: apertura con datos precargados, envío vía PUT /api/machines/:id, éxito y @refresh.
 * 4. Eliminación de máquina: envío vía DELETE /api/machines/:id, éxito y emisión de @refresh.
 * 5. Manejo de errores de la API.
 */

// ─── Mocks ───────────────────────────────────────────────────────────────────

const mockApiFetch = vi.fn()
const mockShowError = vi.fn()
const mockShowSuccess = vi.fn()

vi.mock('@/api/client', () => ({
  apiFetch: (...args: any[]) => mockApiFetch(...args),
}))

vi.mock('@/stores/auth.js', () => ({
  useAuthStore: vi.fn(() => ({
    user: { role: 'staff' },
    isAdmin: false,
    isAdminOrStaff: true,
  })),
}))

vi.mock('@/stores/ui.js', () => ({
  useUiStore: vi.fn(() => ({
    showError: mockShowError,
    showSuccess: mockShowSuccess,
  })),
}))

// ─── Stubs ────────────────────────────────────────────────────────────────────

const COMPONENT_STUBS = {
  StatusBadge: {
    name: 'StatusBadge',
    template: '<span class="status-badge" :data-status="status">{{ status }}</span>',
    props: ['status'],
  },
  DataTable: {
    name: 'DataTable',
    template: `
      <div data-testid="data-table">
        <div v-for="item in items" :key="item._id || item.id" class="table-row">
          <slot name="cell-name" :value="item.name" :item="item" />
          <slot name="cell-type" :value="item.type" :item="item" />
          <slot name="cell-capacity" :value="item.capacity" :item="item" />
          <slot name="cell-status" :value="item.status" :item="item" />
          <slot name="cell-currentOrder" :item="item" />
          <slot name="cell-runningSince" :item="item" />
          <slot name="cell-actions" :item="item" />
        </div>
      </div>
    `,
    props: ['headers', 'items', 'rowKey', 'minWidth'],
  },
  AppButton: {
    name: 'AppButton',
    template: '<button :disabled="loading"><slot /></button>',
    props: ['disabled', 'loading', 'type', 'size'],
  },
}

// ─── Fixtures ────────────────────────────────────────────────────────────────

const MACHINES = [
  {
    id: 'm1',
    _id: 'm1',
    name: 'Washer #1',
    type: 'washer',
    capacity: 25,
    status: 'running',
    current_order: { order_number: 'ORD-101' },
    started_at: '2026-09-02T10:00:00Z',
  },
  {
    id: 'm2',
    _id: 'm2',
    name: 'Dryer #1',
    type: 'dryer',
    capacity: 30,
    status: 'available',
    current_order: null,
    started_at: null,
  },
]

function createTestI18n() {
  return createI18n({ legacy: false, locale: 'en', messages: { en } })
}

function mountComponent(props: { machines?: any[] } = {}) {
  setActivePinia(createPinia())
  return mount(MachineManagement, {
    global: {
      plugins: [createTestI18n()],
      stubs: COMPONENT_STUBS,
    },
    props: {
      machines: props.machines ?? MACHINES,
    },
  })
}

// ─── 1. Renderizado ──────────────────────────────────────────────────────────

describe('MachineManagement — renderizado', () => {
  beforeEach(() => vi.clearAllMocks())

  it('muestra el título de la sección y contador de máquinas en uso', () => {
    const wrapper = mountComponent()
    expect(wrapper.text()).toContain(en.facility.machineStatus)
    expect(wrapper.text()).toContain('1/2 in use')
  })

  it('muestra el botón de agregar máquina para admin o staff', () => {
    const wrapper = mountComponent()
    expect(wrapper.text()).toContain(en.facilityProcessing.addMachine)
  })

  it('renderiza la lista de máquinas en la tabla', () => {
    const wrapper = mountComponent()
    expect(wrapper.text()).toContain('Washer #1')
    expect(wrapper.text()).toContain('Dryer #1')
    expect(wrapper.text()).toContain('ORD-101')
  })
})

// ─── 2. Crear máquina ────────────────────────────────────────────────────────

describe('MachineManagement — creación de máquina', () => {
  beforeEach(() => vi.clearAllMocks())

  it('abre el formulario al hacer click en Add Machine y envía POST /api/machines', async () => {
    mockApiFetch.mockResolvedValueOnce({ id: 'm3', name: 'Washer #3' })
    const wrapper = mountComponent()

    // Abrir formulario
    const addBtn = wrapper.findAll('button').find(b => b.text().includes(en.facilityProcessing.addMachine))
    await addBtn?.trigger('click')

    // Rellenar formulario
    const inputs = wrapper.findAll('input')
    const nameInput = inputs[0]
    const capacityInput = inputs[1]

    await nameInput.setValue('Washer #3')
    await capacityInput.setValue('20')

    // Enviar
    await wrapper.find('form').trigger('submit.prevent')
    await flushPromises()

    expect(mockApiFetch).toHaveBeenCalledWith('/api/machines', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({
        name: 'Washer #3',
        type: 'washer',
        capacity: '20',
        status: 'available',
      }),
    }))

    expect(mockShowSuccess).toHaveBeenCalledWith(en.facilityProcessing.machineAdded)
    expect(wrapper.emitted('refresh')).toBeTruthy()
  })
})

// ─── 3. Editar máquina ───────────────────────────────────────────────────────

describe('MachineManagement — edición de máquina', () => {
  beforeEach(() => vi.clearAllMocks())

  it('abre el formulario en modo edición y envía PUT /api/machines/:id', async () => {
    mockApiFetch.mockResolvedValueOnce({ id: 'm1', name: 'Washer #1 Renamed' })
    const wrapper = mountComponent()

    // Click en botón Edit del primer item
    const editBtn = wrapper.findAll('button').find(b => b.text() === en.admin.edit)
    await editBtn?.trigger('click')

    expect(wrapper.text()).toContain(en.facilityProcessing.editMachine)

    // Modificar nombre
    const nameInput = wrapper.findAll('input')[0]
    await nameInput.setValue('Washer #1 Renamed')

    // Enviar
    await wrapper.find('form').trigger('submit.prevent')
    await flushPromises()

    expect(mockApiFetch).toHaveBeenCalledWith('/api/machines/m1', expect.objectContaining({
      method: 'PUT',
    }))

    expect(mockShowSuccess).toHaveBeenCalledWith(en.facilityProcessing.machineUpdated)
    expect(wrapper.emitted('refresh')).toBeTruthy()
  })
})

// ─── 4. Eliminar máquina ─────────────────────────────────────────────────────

describe('MachineManagement — eliminación de máquina', () => {
  beforeEach(() => vi.clearAllMocks())

  it('llama a DELETE /api/machines/:id y emite @refresh', async () => {
    mockApiFetch.mockResolvedValueOnce({})
    const wrapper = mountComponent()

    // Click en botón Delete del primer item
    const deleteBtn = wrapper.findAll('button').find(b => b.text() === en.admin.delete)
    await deleteBtn?.trigger('click')
    await flushPromises()

    expect(mockApiFetch).toHaveBeenCalledWith('/api/machines/m1', expect.objectContaining({
      method: 'DELETE',
    }))

    expect(mockShowSuccess).toHaveBeenCalledWith(en.facilityProcessing.machineDeleted)
    expect(wrapper.emitted('refresh')).toBeTruthy()
  })
})

// ─── 5. Manejo de errores ────────────────────────────────────────────────────

describe('MachineManagement — manejo de errores', () => {
  beforeEach(() => vi.clearAllMocks())

  it('muestra mensaje de error cuando falla la creación', async () => {
    mockApiFetch.mockRejectedValueOnce(new Error('Duplicate machine name'))
    const wrapper = mountComponent()

    const addBtn = wrapper.findAll('button').find(b => b.text().includes(en.facilityProcessing.addMachine))
    await addBtn?.trigger('click')

    await wrapper.findAll('input')[0].setValue('Washer #1')
    await wrapper.find('form').trigger('submit.prevent')
    await flushPromises()

    expect(mockShowError).toHaveBeenCalledWith('Duplicate machine name')
  })
})
