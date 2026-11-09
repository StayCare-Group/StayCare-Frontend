import { ref, computed, unref, type MaybeRef } from 'vue'
import {
  getDefaultDateRange,
  getMonthDateRange,
  getYearDateRange,
  buildRecentMonthOptions,
  buildRecentYearOptions,
} from '@/utils/date'

export type DashboardPeriodMode = 'range' | 'month' | 'year'

export function useDashboardFilters(
  locale: MaybeRef<string> = 'en',
  refDate: Date = new Date()
) {
  const defaultRange = getDefaultDateRange(30)
  const initialMonths = buildRecentMonthOptions(12, refDate, unref(locale))
  const yearOptions = buildRecentYearOptions(10, refDate)

  const periodMode = ref<DashboardPeriodMode>('month')
  const rangeFrom = ref<string>(defaultRange.from)
  const rangeTo = ref<string>(defaultRange.to)
  const selectedMonth = ref<string>(initialMonths[0]?.value ?? '')
  const selectedYear = ref<number>(yearOptions[0] ?? refDate.getFullYear())
  const selectedClientId = ref<string>('')

  const monthOptions = computed(() =>
    buildRecentMonthOptions(12, refDate, unref(locale) || 'en')
  )

  const dateRange = computed<{ from: string; to: string }>(() => {
    if (periodMode.value === 'range') {
      return { from: rangeFrom.value, to: rangeTo.value }
    }
    if (periodMode.value === 'year') {
      return getYearDateRange(selectedYear.value)
    }
    return getMonthDateRange(selectedMonth.value)
  })

  const overviewParams = computed(() => {
    const params: { from: string; to: string; clientId?: string } = {
      from: dateRange.value.from,
      to: dateRange.value.to,
    }
    if (selectedClientId.value) {
      params.clientId = selectedClientId.value
    }
    return params
  })

  function setPeriodMode(mode: DashboardPeriodMode) {
    periodMode.value = mode
  }

  function setRangeFrom(val: string) {
    rangeFrom.value = val
  }

  function setRangeTo(val: string) {
    rangeTo.value = val
  }

  function resetRangeDates() {
    const fresh = getDefaultDateRange(30)
    rangeFrom.value = fresh.from
    rangeTo.value = fresh.to
  }

  return {
    periodMode,
    rangeFrom,
    rangeTo,
    selectedMonth,
    selectedYear,
    selectedClientId,
    monthOptions,
    yearOptions,
    dateRange,
    overviewParams,
    setPeriodMode,
    setRangeFrom,
    setRangeTo,
    resetRangeDates,
  }
}

