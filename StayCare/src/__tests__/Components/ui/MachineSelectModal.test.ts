import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import MachineSelectModal from '@/Components/ui/MachineSelectModal.vue'
import en from '@/i18n/en.json'

/**
 * Tests for MachineSelectModal.vue
 *
 * Responsabilidad:
 * 1. Rendering: título, descripción con stage, lista de máquinas, mensaje sin máquinas.
 * 2. Interacción: selección de máquina con radio button habilita botón Confirm.
 * 3. Eventos: @close, @skip, @confirm (con el machineId seleccionado).
 * 4. Reset: la selección se limpia cuando el modal se reabre.
 *
 * AppModal se stubbea para aislar la lógica de Teleport/portal.
 */

// ─── AppModal stub ────────────────────────────────────────────────────────────
const AppModalStub = {
  name: 'AppModal',
  props: ['show', 'title', 'size', 'closeOnBackdrop', 'loading'],
  emits: ['close'],
  template: `
    <div v-if="show" data-testid="modal">
      <div data-testid="modal-title">{{ title }}</div>
      <slot />
      <div data-testid="modal-footer"><slot name="footer" /></div>
      <button data-testid="modal-close-x" @click="$emit('close')" />
    </div>
  `,
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function createTestI18n() {
  return createI18n({ legacy: false, locale: 'en', messages: { en } })
}

const MACHINES = [
  { id: 'machine-1', name: 'Washer #1', type: 'washer', status: 'available', capacity: '25 kg' },
  { id: 'machine-2', name: 'Washer #2', type: 'washer', status: 'available', capacity: '15 kg' },
]

function mountModal(props: Record<string, unknown> = {}) {
  return mount(MachineSelectModal, {
    global: {
      plugins: [createTestI18n()],
      stubs: { AppModal: AppModalStub },
    },
    props: {
      show: true,
      machines: MACHINES,
      stageLabel: 'Washing',
      ...props,
    },
  })
}

// ─── 1. Rendering ─────────────────────────────────────────────────────────────

describe('MachineSelectModal — rendering', () => {
  it('no renderiza el modal cuando show es false', () => {
    const wrapper = mountModal({ show: false })
    expect(wrapper.find('[data-testid="modal"]').exists()).toBe(false)
  })

  it('renderiza el modal cuando show es true', () => {
    const wrapper = mountModal({ show: true })
    expect(wrapper.find('[data-testid="modal"]').exists()).toBe(true)
  })

  it('muestra el título del modal traducido', () => {
    const wrapper = mountModal()
    expect(wrapper.find('[data-testid="modal-title"]').text()).toBe(en.machineSelectModal.title)
  })

  it('incluye el nombre de la etapa en el texto de descripción', () => {
    const wrapper = mountModal({ stageLabel: 'Drying' })
    expect(wrapper.text()).toContain('Drying')
  })

  it('renderiza un radio button por cada máquina disponible', () => {
    const wrapper = mountModal()
    expect(wrapper.findAll('input[type="radio"]')).toHaveLength(MACHINES.length)
  })

  it('muestra el nombre de cada máquina', () => {
    const wrapper = mountModal()
    expect(wrapper.text()).toContain('Washer #1')
    expect(wrapper.text()).toContain('Washer #2')
  })

  it('muestra la capacidad de cada máquina', () => {
    const wrapper = mountModal()
    expect(wrapper.text()).toContain('25 kg')
    expect(wrapper.text()).toContain('15 kg')
  })

  it('muestra el mensaje de sin máquinas cuando la lista está vacía', () => {
    const wrapper = mountModal({ machines: [] })
    expect(wrapper.text()).toContain(en.machineSelectModal.noMachines)
  })

  it('no muestra radio buttons cuando no hay máquinas', () => {
    const wrapper = mountModal({ machines: [] })
    expect(wrapper.findAll('input[type="radio"]')).toHaveLength(0)
  })
})

// ─── 2. Botones — estado habilitado / deshabilitado ───────────────────────────

describe('MachineSelectModal — estado de botones', () => {
  it('el botón Confirm está deshabilitado sin selección', () => {
    const wrapper = mountModal()
    const confirmBtn = wrapper.findAll('button').find(b =>
      b.text().includes(en.machineSelectModal.confirm)
    )
    expect(confirmBtn?.element.hasAttribute('disabled')).toBe(true)
  })

  it('el botón Skip está siempre habilitado', () => {
    const wrapper = mountModal()
    const skipBtn = wrapper.findAll('button').find(b =>
      b.text().includes(en.machineSelectModal.skipAssign)
    )
    expect(skipBtn?.element.hasAttribute('disabled')).toBe(false)
  })

  it('el botón Confirm se habilita al seleccionar una máquina', async () => {
    const wrapper = mountModal()
    const radio = wrapper.findAll('input[type="radio"]')[0]
    await radio.setValue(MACHINES[0].id)

    const confirmBtn = wrapper.findAll('button').find(b =>
      b.text().includes(en.machineSelectModal.confirm)
    )
    expect(confirmBtn?.element.hasAttribute('disabled')).toBe(false)
  })

  it('el botón Cancel está siempre habilitado', () => {
    const wrapper = mountModal()
    const cancelBtn = wrapper.findAll('button').find(b =>
      b.text().includes(en.common.cancel)
    )
    expect(cancelBtn?.element.hasAttribute('disabled')).toBe(false)
  })
})

// ─── 3. Eventos ──────────────────────────────────────────────────────────────

describe('MachineSelectModal — eventos', () => {
  beforeEach(() => vi.clearAllMocks())

  it('emite @close al pulsar el botón Cancel', async () => {
    const wrapper = mountModal()
    const cancelBtn = wrapper.findAll('button').find(b =>
      b.text().includes(en.common.cancel)
    )
    await cancelBtn?.trigger('click')
    expect(wrapper.emitted('close')).toBeTruthy()
    expect(wrapper.emitted('close')).toHaveLength(1)
  })

  it('emite @close cuando el AppModal emite close (botón X)', async () => {
    const wrapper = mountModal()
    await wrapper.find('[data-testid="modal-close-x"]').trigger('click')
    expect(wrapper.emitted('close')).toBeTruthy()
  })

  it('emite @skip al pulsar "Skip & Advance"', async () => {
    const wrapper = mountModal()
    const skipBtn = wrapper.findAll('button').find(b =>
      b.text().includes(en.machineSelectModal.skipAssign)
    )
    await skipBtn?.trigger('click')
    expect(wrapper.emitted('skip')).toBeTruthy()
    expect(wrapper.emitted('skip')).toHaveLength(1)
  })

  it('emite @confirm con el machineId correcto al confirmar', async () => {
    const wrapper = mountModal()

    // Seleccionar la primera máquina
    await wrapper.findAll('input[type="radio"]')[0].setValue(MACHINES[0].id)

    const confirmBtn = wrapper.findAll('button').find(b =>
      b.text().includes(en.machineSelectModal.confirm)
    )
    await confirmBtn?.trigger('click')

    expect(wrapper.emitted('confirm')).toBeTruthy()
    expect(wrapper.emitted('confirm')![0]).toEqual([MACHINES[0].id])
  })

  it('emite @confirm con el id de la segunda máquina si se selecciona esa', async () => {
    const wrapper = mountModal()
    await wrapper.findAll('input[type="radio"]')[1].setValue(MACHINES[1].id)

    const confirmBtn = wrapper.findAll('button').find(b =>
      b.text().includes(en.machineSelectModal.confirm)
    )
    await confirmBtn?.trigger('click')

    expect(wrapper.emitted('confirm')![0]).toEqual([MACHINES[1].id])
  })

  it('no emite @confirm si no hay máquina seleccionada', async () => {
    const wrapper = mountModal()
    // No seleccionamos nada, intentamos hacer click en confirm (deshabilitado)
    const confirmBtn = wrapper.findAll('button').find(b =>
      b.text().includes(en.machineSelectModal.confirm)
    )
    await confirmBtn?.trigger('click')
    expect(wrapper.emitted('confirm')).toBeFalsy()
  })
})

// ─── 4. Reset al reabrir ─────────────────────────────────────────────────────

describe('MachineSelectModal — reset al reabrir', () => {
  it('limpia la selección cuando el modal se cierra y vuelve a abrir', async () => {
    const wrapper = mountModal()

    // Seleccionar la primera máquina
    await wrapper.findAll('input[type="radio"]')[0].setValue(MACHINES[0].id)

    // Confirmar que el botón estaba habilitado
    const confirmBtn = () =>
      wrapper.findAll('button').find(b => b.text().includes(en.machineSelectModal.confirm))
    expect(confirmBtn()?.element.hasAttribute('disabled')).toBe(false)

    // Cerrar y reabrir
    await wrapper.setProps({ show: false })
    await flushPromises()
    await wrapper.setProps({ show: true })
    await flushPromises()

    // El botón debe volver a estar deshabilitado (sin selección)
    expect(confirmBtn()?.element.hasAttribute('disabled')).toBe(true)
  })
})
