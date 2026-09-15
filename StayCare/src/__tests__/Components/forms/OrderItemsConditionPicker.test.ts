import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import OrderItemsConditionPicker from '@/Components/forms/OrderItemsConditionPicker.vue'
import en from '@/i18n/en.json'

const mockFetchAllItems = vi.fn()

vi.mock('@/api/items', () => ({
  fetchAllItems: () => mockFetchAllItems(),
  mapItemForCatalog: (raw: any) => ({
    id: raw.id ?? raw._id,
    code: raw.item_code ?? raw.code,
    name: raw.name,
    unitPrice: Number(raw.unit_price ?? raw.base_price ?? 0),
    active: raw.is_active !== false,
  }),
}))

function createTestI18n() {
  return createI18n({ legacy: false, locale: 'en', messages: { en } })
}

describe('OrderItemsConditionPicker.vue', () => {
  const initialItems = [
    {
      itemId: 'item-1',
      code: 'SHT',
      name: 'Shirt',
      unitPrice: 5.0,
      qtyGood: 3,
      qtyBad: 1,
      qtyStained: 0,
    },
    {
      itemId: 'item-2',
      code: 'PNT',
      name: 'Pants',
      unitPrice: 8.0,
      qtyGood: 2,
      qtyBad: 0,
      qtyStained: 1,
    },
  ]

  const mockCatalog = [
    { _id: 'item-1', item_code: 'SHT', name: 'Shirt', base_price: 5.0, is_active: true },
    { _id: 'item-2', item_code: 'PNT', name: 'Pants', base_price: 8.0, is_active: true },
    { _id: 'item-3', item_code: 'TWL', name: 'Towel', base_price: 3.5, is_active: true },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    mockFetchAllItems.mockResolvedValue(mockCatalog)
  })

  it('renders item list with condition counts (good, bad, stained)', async () => {
    const wrapper = mount(OrderItemsConditionPicker, {
      props: { modelValue: initialItems },
      global: { plugins: [createTestI18n()] },
    })
    await flushPromises()

    expect(wrapper.text()).toContain('Shirt')
    expect(wrapper.text()).toContain('Pants')
    expect(wrapper.text()).toContain('7 items') // (3+1) + (2+1) = 7
  })

  it('emits update:modelValue when condition quantity is modified', async () => {
    const wrapper = mount(OrderItemsConditionPicker, {
      props: { modelValue: initialItems },
      global: { plugins: [createTestI18n()] },
    })
    await flushPromises()

    const inputs = wrapper.findAll('input[type="number"]')
    // First item's qtyGood input
    await inputs[0].setValue(5)

    const emitted = wrapper.emitted('update:modelValue')
    expect(emitted).toBeTruthy()
    const lastEmitted = emitted![emitted!.length - 1][0] as any[]
    expect(lastEmitted[0].qtyGood).toBe(5)
  })

  it('adds a new item from catalog with condition counters', async () => {
    const wrapper = mount(OrderItemsConditionPicker, {
      props: { modelValue: initialItems },
      global: { plugins: [createTestI18n()] },
    })
    await flushPromises()

    const select = wrapper.find('select')
    await select.setValue('TWL')

    const addBtn = wrapper.findAllComponents({ name: 'AppButton' })[0]
    await addBtn.trigger('click')

    const emitted = wrapper.emitted('update:modelValue')
    expect(emitted).toBeTruthy()
    const lastEmitted = emitted![emitted!.length - 1][0] as any[]
    expect(lastEmitted.length).toBe(3)
    expect(lastEmitted[2].code).toBe('TWL')
    expect(lastEmitted[2].qtyGood).toBe(1)
    expect(lastEmitted[2].qtyBad).toBe(0)
    expect(lastEmitted[2].qtyStained).toBe(0)
  })

  it('removes an item from the list when remove button is clicked', async () => {
    const wrapper = mount(OrderItemsConditionPicker, {
      props: { modelValue: initialItems },
      global: { plugins: [createTestI18n()] },
    })
    await flushPromises()

    const removeBtns = wrapper.findAll('button[title="Remove"]')
    await removeBtns[0].trigger('click')

    const emitted = wrapper.emitted('update:modelValue')
    expect(emitted).toBeTruthy()
    const lastEmitted = emitted![emitted!.length - 1][0] as any[]
    expect(lastEmitted.length).toBe(1)
    expect(lastEmitted[0].code).toBe('PNT')
  })
})
