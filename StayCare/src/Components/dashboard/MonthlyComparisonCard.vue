<template>
  <div
    class="bg-white rounded-xl shadow-sm p-4 sm:p-5 flex flex-col"
    data-testid="monthly-comparison-card"
  >
    <!-- Header -->
    <div class="flex items-center justify-between mb-3 gap-2 flex-wrap">
      <div class="flex items-center gap-2">
        <h3 class="text-sm font-semibold text-brand-900">
          {{ $t('admin.monthlyComparisonTitle') }}
        </h3>
        <span
          v-if="loading"
          data-testid="comparison-loading"
          class="inline-flex items-center gap-1.5 text-xs font-medium text-brand-600"
        >
          <svg
            class="animate-spin h-3.5 w-3.5 text-brand-600"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              class="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              stroke-width="4"
            />
            <path
              class="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
            />
          </svg>
          <span class="text-[11px]">{{ $t('common.loading') }}</span>
        </span>
      </div>
    </div>

    <!-- Table container with horizontal scroll on small screens -->
    <div class="overflow-x-auto -mx-4 sm:mx-0">
      <div class="inline-block min-w-full align-middle px-4 sm:px-0">
        <table class="min-w-full divide-y divide-gray-100 text-xs">
          <thead>
            <tr class="text-left text-gray-500 font-semibold uppercase tracking-wider text-[11px]">
              <th scope="col" class="py-2.5 pr-3">
                {{ $t('admin.indicator') }}
              </th>

              <!-- Mes 1 Selector -->
              <th scope="col" class="py-2.5 px-3">
                <div class="flex items-center gap-1.5 flex-wrap">
                  <span class="text-gray-600 font-bold uppercase">{{ $t('admin.month1') }}</span>
                  <select
                    v-model="selectedMonthA"
                    data-testid="comparison-month-a-select"
                    class="rounded-lg border border-gray-200 bg-white text-gray-800 font-normal text-xs px-2 py-1
                           focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent cursor-pointer"
                  >
                    <option v-for="m in monthOptions" :key="m.value" :value="m.value">
                      {{ m.label }}
                    </option>
                  </select>
                </div>
              </th>

              <!-- Mes 2 Selector -->
              <th scope="col" class="py-2.5 px-3">
                <div class="flex items-center gap-1.5 flex-wrap">
                  <span class="text-gray-600 font-bold uppercase">{{ $t('admin.month2') }}</span>
                  <select
                    v-model="selectedMonthB"
                    data-testid="comparison-month-b-select"
                    class="rounded-lg border border-gray-200 bg-white text-gray-800 font-normal text-xs px-2 py-1
                           focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent cursor-pointer"
                  >
                    <option v-for="m in monthOptions" :key="m.value" :value="m.value">
                      {{ m.label }}
                    </option>
                  </select>
                </div>
              </th>

              <th scope="col" class="py-2.5 px-3 text-right">
                {{ $t('admin.difference') }}
              </th>
              <th scope="col" class="py-2.5 pl-3 text-right">
                {{ $t('admin.variation') }}
              </th>
            </tr>
          </thead>

          <tbody
            class="divide-y divide-gray-50 transition-opacity duration-200"
            :class="{ 'opacity-50 pointer-events-none': loading }"
          >
            <tr
              v-for="row in displayRows"
              :key="row.key"
              :data-testid="`comparison-row-${row.key}`"
              class="hover:bg-gray-50/60 transition-colors"
            >
              <!-- Indicator label -->
              <td class="py-3 pr-3 font-medium text-gray-800 whitespace-nowrap">
                {{ row.label }}
              </td>

              <!-- Month 1 Value -->
              <td class="py-3 px-3 font-semibold text-gray-700 tabular-nums whitespace-nowrap">
                {{ row.formattedA }}
              </td>

              <!-- Month 2 Value -->
              <td class="py-3 px-3 font-semibold text-gray-900 tabular-nums whitespace-nowrap">
                {{ row.formattedB }}
              </td>

              <!-- Difference -->
              <td
                class="py-3 px-3 text-right font-semibold tabular-nums whitespace-nowrap"
                :class="row.diffColorClass"
              >
                {{ row.formattedDiff }}
              </td>

              <!-- Variation % -->
              <td class="py-3 pl-3 text-right tabular-nums whitespace-nowrap">
                <span
                  class="inline-flex items-center px-2 py-0.5 rounded-md font-semibold text-[11px]"
                  :class="row.badgeClass"
                >
                  {{ row.formattedVariation }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { buildRecentMonthOptions } from '@/utils/date'
import {
  fetchDashboardComparison,
  type DashboardMonthlyComparisonRow,
  type DashboardComparisonIndicatorKey,
} from '@/api/reports'
import { useUiStore } from '@/stores/ui'
import { formatApiErrorMessage } from '@/utils/errors'

const props = defineProps<{
  clientId?: string
}>()

const { t, locale } = useI18n()
const uiStore = useUiStore()

const monthOptions = computed(() =>
  buildRecentMonthOptions(24, new Date(), locale.value || 'en')
)

// Default: Month 1 = previous month, Month 2 = current month
const selectedMonthA = ref<string>(monthOptions.value[1]?.value ?? '')
const selectedMonthB = ref<string>(monthOptions.value[0]?.value ?? '')

const rows = ref<DashboardMonthlyComparisonRow[]>([])
const loading = ref<boolean>(false)
let latestRequestId = 0

async function loadComparison() {
  if (!selectedMonthA.value || !selectedMonthB.value) return

  const requestId = ++latestRequestId
  loading.value = true

  try {
    const res = await fetchDashboardComparison({
      monthA: selectedMonthA.value,
      monthB: selectedMonthB.value,
      clientId: props.clientId || undefined,
    })

    if (requestId === latestRequestId && res?.rows) {
      rows.value = res.rows
    }
  } catch (err) {
    if (requestId === latestRequestId) {
      uiStore.showError(formatApiErrorMessage(err, t('admin.errorLoadComparison'), t))
    }
  } finally {
    if (requestId === latestRequestId) {
      loading.value = false
    }
  }
}

onMounted(loadComparison)

watch(
  () => [selectedMonthA.value, selectedMonthB.value, props.clientId],
  () => {
    loadComparison()
  }
)

const indicatorLabels: Record<DashboardComparisonIndicatorKey, string> = {
  totalItems: 'admin.indicatorTotalItems',
  totalOrders: 'admin.indicatorTotalOrders',
  totalStained: 'admin.indicatorTotalStained',
  totalInvoiced: 'admin.indicatorTotalInvoiced',
}

function formatValue(key: DashboardComparisonIndicatorKey, val: number): string {
  if (key === 'totalInvoiced') {
    return `€${val.toLocaleString(locale.value || 'en', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`
  }
  return val.toLocaleString(locale.value || 'en')
}

function formatDiff(key: DashboardComparisonIndicatorKey, diff: number): string {
  if (key === 'totalInvoiced') {
    if (diff > 0) {
      return `+€${diff.toLocaleString(locale.value || 'en', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`
    }
    if (diff < 0) {
      return `-€${Math.abs(diff).toLocaleString(locale.value || 'en', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`
    }
    return '€0.00'
  }

  if (diff > 0) return `+${diff.toLocaleString(locale.value || 'en')}`
  return diff.toLocaleString(locale.value || 'en')
}

const displayRows = computed(() => {
  const currentRows = rows.value.length
    ? rows.value
    : [
        { key: 'totalItems' as const, monthA: 0, monthB: 0, difference: 0, variationPercent: null },
        { key: 'totalOrders' as const, monthA: 0, monthB: 0, difference: 0, variationPercent: null },
        { key: 'totalStained' as const, monthA: 0, monthB: 0, difference: 0, variationPercent: null },
        { key: 'totalInvoiced' as const, monthA: 0, monthB: 0, difference: 0, variationPercent: null },
      ]

  return currentRows.map((r) => {
    const isStained = r.key === 'totalStained'
    const isPositiveGood = !isStained

    let diffColorClass = 'text-gray-600'
    let badgeClass = 'bg-gray-100 text-gray-600'

    if (r.difference > 0) {
      diffColorClass = isPositiveGood ? 'text-emerald-600' : 'text-rose-600'
      badgeClass = isPositiveGood ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
    } else if (r.difference < 0) {
      diffColorClass = isPositiveGood ? 'text-rose-600' : 'text-emerald-600'
      badgeClass = isPositiveGood ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'
    }

    const formattedVariation =
      r.variationPercent === null
        ? '—'
        : `${r.variationPercent > 0 ? '+' : ''}${r.variationPercent}%`

    return {
      key: r.key,
      label: t(indicatorLabels[r.key] || r.key),
      formattedA: formatValue(r.key, r.monthA),
      formattedB: formatValue(r.key, r.monthB),
      formattedDiff: formatDiff(r.key, r.difference),
      formattedVariation,
      diffColorClass,
      badgeClass,
    }
  })
})
</script>

