import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import DateRangeFilter from '@/Components/ui/DateRangeFilter.vue'
import en from '@/i18n/en.json'

/**
 * Tests para DateRangeFilter.vue (src/Components/ui/DateRangeFilter.vue)
 *
 * Responsabilidades del componente:
 * - Renderizar dos inputs de fecha (from / to) con ids derivados de idPrefix.
 * - Mostrar el botón de limpieza (×) únicamente cuando al menos una fecha está presente.
 * - Emitir 'update:from' cuando cambia el input de inicio.
 * - Emitir 'update:to' cuando cambia el input de fin.
 * - Emitir 'clear' cuando se pulsa el botón de limpieza.
 * - Mostrar la etiqueta por defecto desde i18n (orderFilters.pickupDate) o una personalizada.
 */

// ─── Setup helpers ───────────────────────────────────────────────────────────

function createTestI18n() {
  return createI18n({ legacy: false, locale: 'en', messages: { en } })
}

function mountFilter(props: Record<string, unknown> = {}) {
  const i18n = createTestI18n()
  return mount(DateRangeFilter, {
    global: { plugins: [i18n] },
    props,
  })
}

// ─── Rendering ───────────────────────────────────────────────────────────────

describe('DateRangeFilter — renderizado', () => {
  it('renderiza los dos inputs de fecha', () => {
    const wrapper = mountFilter({ idPrefix: 'test' })
    expect(wrapper.find('#test-from').exists()).toBe(true)
    expect(wrapper.find('#test-to').exists()).toBe(true)
  })

  it('usa el idPrefix por defecto si no se pasa ninguno', () => {
    const wrapper = mountFilter()
    expect(wrapper.find('#date-range-from').exists()).toBe(true)
    expect(wrapper.find('#date-range-to').exists()).toBe(true)
  })

  it('refleja el valor del prop "from" en el input de inicio', () => {
    const wrapper = mountFilter({ from: '2026-08-01' })
    const input = wrapper.find('#date-range-from')
    expect((input.element as HTMLInputElement).value).toBe('2026-08-01')
  })

  it('refleja el valor del prop "to" en el input de fin', () => {
    const wrapper = mountFilter({ to: '2026-08-31' })
    const input = wrapper.find('#date-range-to')
    expect((input.element as HTMLInputElement).value).toBe('2026-08-31')
  })

  it('muestra la etiqueta personalizada cuando se pasa la prop "label"', () => {
    const wrapper = mountFilter({ label: 'Custom label' })
    expect(wrapper.text()).toContain('Custom label')
  })

  it('muestra la etiqueta por defecto de i18n cuando no se pasa "label"', () => {
    const wrapper = mountFilter()
    expect(wrapper.text()).toContain(en.orderFilters.createdDate)
  })

  it('aplica el atributo max con la fecha de hoy por defecto', () => {
    const wrapper = mountFilter()
    const today = new Date().toISOString().slice(0, 10)
    const inputFrom = wrapper.find('#date-range-from')
    const inputTo = wrapper.find('#date-range-to')
    expect(inputFrom.attributes('max')).toBe(today)
    expect(inputTo.attributes('max')).toBe(today)
  })

  it('permite personalizar el atributo max cuando se pasa la prop', () => {
    const wrapper = mountFilter({ max: '2026-12-31' })
    const inputFrom = wrapper.find('#date-range-from')
    expect(inputFrom.attributes('max')).toBe('2026-12-31')
  })
})

// ─── Botón de limpieza ────────────────────────────────────────────────────────

describe('DateRangeFilter — botón de limpieza', () => {
  it('NO muestra el botón de limpieza cuando from y to están vacíos', () => {
    const wrapper = mountFilter({ from: '', to: '' })
    expect(wrapper.find('button').exists()).toBe(false)
  })

  it('muestra el botón de limpieza cuando "from" tiene un valor', () => {
    const wrapper = mountFilter({ from: '2026-08-01', to: '' })
    expect(wrapper.find('button').exists()).toBe(true)
  })

  it('muestra el botón de limpieza cuando "to" tiene un valor', () => {
    const wrapper = mountFilter({ from: '', to: '2026-08-31' })
    expect(wrapper.find('button').exists()).toBe(true)
  })

  it('muestra el botón de limpieza cuando ambas fechas tienen valor', () => {
    const wrapper = mountFilter({ from: '2026-08-01', to: '2026-08-31' })
    expect(wrapper.find('button').exists()).toBe(true)
  })
})

// ─── Emits ───────────────────────────────────────────────────────────────────

describe('DateRangeFilter — emits', () => {
  it('emite "update:from" con el valor correcto al cambiar el input de inicio', async () => {
    const wrapper = mountFilter()
    const input = wrapper.find('#date-range-from')
    await input.setValue('2026-08-15')
    await input.trigger('change')
    expect(wrapper.emitted('update:from')).toBeTruthy()
    expect(wrapper.emitted('update:from')![0]).toEqual(['2026-08-15'])
  })

  it('emite "update:to" con el valor correcto al cambiar el input de fin', async () => {
    const wrapper = mountFilter()
    const input = wrapper.find('#date-range-to')
    await input.setValue('2026-08-20')
    await input.trigger('change')
    expect(wrapper.emitted('update:to')).toBeTruthy()
    expect(wrapper.emitted('update:to')![0]).toEqual(['2026-08-20'])
  })

  it('emite "clear" al pulsar el botón de limpieza', async () => {
    const wrapper = mountFilter({ from: '2026-08-01', to: '' })
    await wrapper.find('button').trigger('click')
    expect(wrapper.emitted('clear')).toBeTruthy()
  })
})
