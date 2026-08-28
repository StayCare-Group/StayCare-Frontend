import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import OrderTimeline from '@/Components/ui/OrderTimeline.vue'
import en from '@/i18n/en.json'

/**
 * Tests for OrderTimeline.vue
 *
 * Strategy: mount the component with a minimal real i18n instance to avoid
 * mocking the translation system, and assert on rendered output.
 *
 * We test:
 *   1. Rendering of steps (status, date, note)
 *   2. Executor text logic (isSystem / changedByName / unavailable)
 *   3. currentIndex logic — which dot is "active"
 */

// ─── Setup helpers ──────────────────────────────────────────────────────────

function createTestI18n() {
  return createI18n({
    legacy: false,
    locale: 'en',
    messages: { en },
  })
}

function mountTimeline(props: Record<string, unknown>) {
  const i18n = createTestI18n()
  return mount(OrderTimeline, {
    global: { plugins: [i18n] },
    props,
  })
}

// ─── Fixtures ────────────────────────────────────────────────────────────────

const STEP_SYSTEM = {
  status: 'Washing',
  date: '2025-01-15 11:00',
  note: '',
  changedByName: null,
  changedByRole: null,
  isSystem: true,
}

const STEP_BY_USER = {
  status: 'Drying',
  date: '2025-01-15 13:00',
  note: 'Moved to dryer 2',
  changedByName: 'John Staff',
  changedByRole: 'staff',
  isSystem: false,
}

const STEP_USER_UNAVAILABLE = {
  status: 'Ironing',
  date: '2025-01-15 15:00',
  note: '',
  changedByName: null,
  changedByRole: null,
  isSystem: false,
}

// ─── Rendering tests ─────────────────────────────────────────────────────────

describe('OrderTimeline — rendering', () => {
  it('renderiza un step por cada elemento del array steps', () => {
    const wrapper = mountTimeline({
      steps: [STEP_SYSTEM, STEP_BY_USER],
      currentStatus: 'Drying',
    })
    // Cada step tiene el status como texto visible
    expect(wrapper.text()).toContain('Washing')
    expect(wrapper.text()).toContain('Drying')
  })

  it('muestra la fecha del step si está presente', () => {
    const wrapper = mountTimeline({
      steps: [STEP_BY_USER],
      currentStatus: 'Drying',
    })
    expect(wrapper.text()).toContain('2025-01-15 13:00')
  })

  it('muestra la nota del step si está presente', () => {
    const wrapper = mountTimeline({
      steps: [STEP_BY_USER],
      currentStatus: 'Drying',
    })
    expect(wrapper.text()).toContain('Moved to dryer 2')
  })

  it('no muestra bloque de nota si el step no tiene note', () => {
    const wrapper = mountTimeline({
      steps: [STEP_SYSTEM],
      currentStatus: 'Washing',
    })
    // El párrafo de nota tiene v-if="step.note" — no debe aparecer si está vacío
    const noteParagraphs = wrapper.findAll('p').filter(p =>
      p.classes().includes('text-gray-500') && !p.classes().includes('font-medium')
    )
    expect(noteParagraphs.every(p => p.text() === '')).toBe(true)
  })

  it('no renderiza nada si steps es un array vacío', () => {
    const wrapper = mountTimeline({ steps: [], currentStatus: '' })
    expect(wrapper.findAll('.flex.gap-3')).toHaveLength(0)
  })
})

// ─── Executor text tests ──────────────────────────────────────────────────────

describe('OrderTimeline — texto del ejecutor', () => {
  it('muestra "Executed by: System" cuando isSystem es true', () => {
    const wrapper = mountTimeline({
      steps: [STEP_SYSTEM],
      currentStatus: 'Washing',
    })
    expect(wrapper.text()).toContain('Executed by')
    expect(wrapper.text()).toContain('System')
  })

  it('muestra el nombre del usuario y su rol cuando changedByName está disponible', () => {
    const wrapper = mountTimeline({
      steps: [STEP_BY_USER],
      currentStatus: 'Drying',
    })
    expect(wrapper.text()).toContain('Executed by')
    expect(wrapper.text()).toContain('John Staff')
    // El rol 'staff' debe aparecer en paréntesis
    expect(wrapper.text()).toMatch(/\(.*staff.*\)/i)
  })

  it('muestra "Executed by: User unavailable" cuando no hay nombre ni es sistema', () => {
    const wrapper = mountTimeline({
      steps: [STEP_USER_UNAVAILABLE],
      currentStatus: 'Ironing',
    })
    expect(wrapper.text()).toContain('Executed by')
    expect(wrapper.text()).toContain('unavailable')
  })
})

// ─── currentIndex tests ────────────────────────────────────────────────────────

describe('OrderTimeline — currentIndex (paso activo)', () => {
  const steps = [STEP_SYSTEM, STEP_BY_USER, STEP_USER_UNAVAILABLE]

  it('activa el último step si currentStatus no coincide con ningún step', () => {
    const wrapper = mountTimeline({ steps, currentStatus: 'unknown_status' })
    // El último dot debe tener la clase de color activo
    const dots = wrapper.findAll('.rounded-full')
    expect(dots.at(-1)?.classes()).toContain('bg-brand-700')
  })

  it('activa el step correcto cuando currentStatus coincide', () => {
    const wrapper = mountTimeline({ steps, currentStatus: 'Drying' })
    const dots = wrapper.findAll('.rounded-full')
    // index 0 (Washing) y index 1 (Drying) deben tener color activo
    expect(dots.at(0)?.classes()).toContain('bg-brand-700')
    expect(dots.at(1)?.classes()).toContain('bg-brand-700')
    // index 2 (Ironing) no debe estar activo
    expect(dots.at(2)?.classes()).toContain('bg-gray-300')
  })

  it('activa todos los steps si currentStatus es el último', () => {
    const wrapper = mountTimeline({ steps, currentStatus: 'Ironing' })
    const dots = wrapper.findAll('.rounded-full')
    dots.forEach(dot => {
      expect(dot.classes()).toContain('bg-brand-700')
    })
  })
})
