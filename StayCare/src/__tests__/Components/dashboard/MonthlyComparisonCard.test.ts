import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { createPinia, setActivePinia } from 'pinia'
import MonthlyComparisonCard from '@/Components/dashboard/MonthlyComparisonCard.vue'
import en from '@/i18n/en.json'

const showErrorMock = vi.fn()

vi.mock('@/stores/ui', () => ({
  useUiStore: vi.fn(() => ({ showError: showErrorMock })),
}))

vi.mock('@/api/reports', () => ({
  fetchDashboardComparison: vi.fn(),
}))

function createTestI18n() {
  return createI18n({ legacy: false, locale: 'en', messages: { en } })
}

describe('MonthlyComparisonCard.vue', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    showErrorMock.mockReset()
    setActivePinia(createPinia())
  })

  it('fetches comparison metrics on mount with default monthA and monthB', async () => {
    const { fetchDashboardComparison } = await import('@/api/reports')
    vi.mocked(fetchDashboardComparison).mockResolvedValue({
      monthA: '2026-10',
      monthB: '2026-11',
      rows: [
        { key: 'totalItems', monthA: 800, monthB: 1000, difference: 200, variationPercent: 25 },
        { key: 'totalOrders', monthA: 40, monthB: 50, difference: 10, variationPercent: 25 },
        { key: 'totalStained', monthA: 10, monthB: 15, difference: 5, variationPercent: 50 },
        { key: 'totalInvoiced', monthA: 5000, monthB: 6500.5, difference: 1500.5, variationPercent: 30 },
      ],
    })

    const wrapper = mount(MonthlyComparisonCard, {
      global: { plugins: [createTestI18n()] },
    })

    await flushPromises()

    expect(fetchDashboardComparison).toHaveBeenCalledOnce()
    const callArg = vi.mocked(fetchDashboardComparison).mock.calls[0][0]
    expect(callArg.monthA).toMatch(/^\d{4}-\d{2}$/)
    expect(callArg.monthB).toMatch(/^\d{4}-\d{2}$/)

    expect(wrapper.find('[data-testid="comparison-row-totalItems"]').text()).toContain('800')
    expect(wrapper.find('[data-testid="comparison-row-totalItems"]').text()).toContain('1,000')
    expect(wrapper.find('[data-testid="comparison-row-totalItems"]').text()).toContain('+200')
    expect(wrapper.find('[data-testid="comparison-row-totalItems"]').text()).toContain('+25%')

    expect(wrapper.find('[data-testid="comparison-row-totalInvoiced"]').text()).toContain('€5,000.00')
    expect(wrapper.find('[data-testid="comparison-row-totalInvoiced"]').text()).toContain('€6,500.50')
    expect(wrapper.find('[data-testid="comparison-row-totalInvoiced"]').text()).toContain('+€1,500.50')
    expect(wrapper.find('[data-testid="comparison-row-totalInvoiced"]').text()).toContain('+30%')
  })

  it('renders em dash when variationPercent is null', async () => {
    const { fetchDashboardComparison } = await import('@/api/reports')
    vi.mocked(fetchDashboardComparison).mockResolvedValue({
      monthA: '2026-09',
      monthB: '2026-10',
      rows: [
        { key: 'totalItems', monthA: 0, monthB: 120, difference: 120, variationPercent: null },
        { key: 'totalOrders', monthA: 0, monthB: 5, difference: 5, variationPercent: null },
        { key: 'totalStained', monthA: 0, monthB: 0, difference: 0, variationPercent: null },
        { key: 'totalInvoiced', monthA: 0, monthB: 450, difference: 450, variationPercent: null },
      ],
    })

    const wrapper = mount(MonthlyComparisonCard, {
      global: { plugins: [createTestI18n()] },
    })

    await flushPromises()

    const stainedRow = wrapper.find('[data-testid="comparison-row-totalStained"]')
    expect(stainedRow.text()).toContain('—')
  })

  it('refetches when selecting a different monthA or monthB', async () => {
    const { fetchDashboardComparison } = await import('@/api/reports')
    vi.mocked(fetchDashboardComparison).mockResolvedValue({
      monthA: '2026-08',
      monthB: '2026-09',
      rows: [],
    })

    const wrapper = mount(MonthlyComparisonCard, {
      global: { plugins: [createTestI18n()] },
    })

    await flushPromises()
    expect(fetchDashboardComparison).toHaveBeenCalledTimes(1)

    const selectA = wrapper.find('[data-testid="comparison-month-a-select"]')
    const options = selectA.findAll('option')
    if (options.length > 2) {
      await selectA.setValue(options[2].element.value)
      await flushPromises()
      expect(fetchDashboardComparison).toHaveBeenCalledTimes(2)
    }
  })

  it('shows error toast when fetch fails', async () => {
    const { fetchDashboardComparison } = await import('@/api/reports')
    vi.mocked(fetchDashboardComparison).mockRejectedValue(new Error('Comparison network error'))

    mount(MonthlyComparisonCard, {
      global: { plugins: [createTestI18n()] },
    })

    await flushPromises()
    expect(showErrorMock).toHaveBeenCalledOnce()
  })
})

