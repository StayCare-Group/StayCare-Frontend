<template>
  <div>
    <!-- Sub-pages -->
    <OrdersList v-if="navStore.currentPage === 'orders'" />
    <PickupConfirm v-else-if="navStore.currentPage === 'pickup-confirm'" />
    <DeliveryConfirm v-else-if="navStore.currentPage === 'delivery-confirm'" />
    <OrderDetail v-else-if="navStore.currentPage === 'order-detail'" />
    <OrderCreateForm v-else-if="navStore.currentPage === 'create-order'" mode="admin" />
    <Reception v-else-if="navStore.currentPage === 'reception'" />
    <ItemManagement v-else-if="navStore.currentPage === 'items'" />
    <InvoicesList v-else-if="navStore.currentPage === 'invoices'" />
    <InvoiceDetail v-else-if="navStore.currentPage === 'invoice-detail'" />
    <CreateInvoice v-else-if="navStore.currentPage === 'create-invoice'" />
    <UserManagement v-else-if="navStore.currentPage === 'users'" />
    <ClientDetail v-else-if="navStore.currentPage === 'client-detail'" />
    <Processing v-else-if="navStore.currentPage === 'processing'" />
    <RoutePlanner v-else-if="navStore.currentPage === 'routes'" />
    <Reports v-else-if="navStore.currentPage === 'reports'" />
    <Settings v-else-if="navStore.currentPage === 'settings'" />
    <ProfileAccount v-else-if="navStore.currentPage === 'profile'" />

    <!-- Default dashboard overview -->
    <div v-else class="space-y-6">
      <!-- Header & Global Filters (Compact single-bar layout) -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-100 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        <div class="flex flex-wrap items-center gap-3">
          <h2 class="text-base font-bold text-brand-700 tracking-tight">{{ $t('admin.generalSummary') }}</h2>

          <!-- Mode tabs (Rango | Mes | Año) -->
          <div class="inline-flex items-center gap-0.5 rounded-lg bg-gray-100 p-0.5">
            <button
              type="button"
              class="px-2.5 py-1 text-xs font-medium rounded-md transition-colors"
              :class="periodMode === 'range' ? 'bg-white text-brand-700 shadow-xs font-semibold' : 'text-gray-600 hover:text-gray-900'"
              data-testid="period-mode-range"
              @click="setPeriodMode('range')"
            >
              {{ $t('admin.filterByRange') }}
            </button>
            <button
              type="button"
              class="px-2.5 py-1 text-xs font-medium rounded-md transition-colors"
              :class="periodMode === 'month' ? 'bg-white text-brand-700 shadow-xs font-semibold' : 'text-gray-600 hover:text-gray-900'"
              data-testid="period-mode-month"
              @click="setPeriodMode('month')"
            >
              {{ $t('admin.filterByMonth') }}
            </button>
            <button
              type="button"
              class="px-2.5 py-1 text-xs font-medium rounded-md transition-colors"
              :class="periodMode === 'year' ? 'bg-white text-brand-700 shadow-xs font-semibold' : 'text-gray-600 hover:text-gray-900'"
              data-testid="period-mode-year"
              @click="setPeriodMode('year')"
            >
              {{ $t('admin.filterByYear') }}
            </button>
          </div>

          <!-- Active date selector -->
          <DateRangeFilter
            v-if="periodMode === 'range'"
            id-prefix="admin-dashboard"
            :from="rangeFrom"
            :to="rangeTo"
            @update:from="setRangeFrom"
            @update:to="setRangeTo"
            @clear="resetRangeDates"
          />
          <select
            v-else-if="periodMode === 'month'"
            v-model="selectedMonth"
            data-testid="dashboard-month-select"
            class="rounded-lg border border-gray-200 bg-white text-gray-700 text-xs px-2.5 py-1.5
                   focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent cursor-pointer"
          >
            <option v-for="m in monthOptions" :key="m.value" :value="m.value" class="text-gray-800">
              {{ m.label }}
            </option>
          </select>
          <select
            v-else
            v-model="selectedYear"
            data-testid="dashboard-year-select"
            class="rounded-lg border border-gray-200 bg-white text-gray-700 text-xs px-2.5 py-1.5
                   focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent cursor-pointer"
          >
            <option v-for="y in yearOptions" :key="y" :value="y" class="text-gray-800">
              {{ y }}
            </option>
          </select>
        </div>

        <ClientFilterSelect v-model="selectedClientId" />
      </div>

      <LoadingPanel v-if="loading" />

      <template v-else>
        <!-- KPI Cards -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
          <KpiCard v-for="kpi in adminKPIs" :key="kpi.label" :label="kpi.label" :value="kpi.value" :color="kpi.color" />
        </div>

        <div class="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <!-- Bar Chart -->
          <div class="bg-white rounded-xl shadow-sm p-4 sm:p-5">
            <h3 class="text-sm sm:text-base font-semibold text-gray-800 mb-4">{{ $t('admin.ordersThisWeek') }}</h3>
            <div class="flex gap-2 sm:gap-3 h-40 sm:h-48">
              <div
                v-for="(val, i) in adminChartData.values"
                :key="i"
                class="flex-1 flex flex-col items-center"
              >
                <span class="text-xs font-semibold text-gray-600 shrink-0">{{ val }}</span>
                <div class="flex-1 w-full flex items-end justify-center">
                  <div
                    class="w-full max-w-[40px] rounded-t-md bg-gradient-to-t from-brand-700 to-brand-400 transition-all duration-500"
                    :style="{ height: (val / maxVal) * 100 + '%', minHeight: val > 0 ? '4px' : '0' }"
                  ></div>
                </div>
                <span class="text-xs text-gray-400 shrink-0">{{ adminChartData.labels[i] }}</span>
              </div>
            </div>
          </div>

          <!-- Recent Activity -->
          <div class="bg-white rounded-xl shadow-sm">
            <div class="px-4 sm:px-5 py-3 sm:py-4 border-b border-gray-100">
              <h3 class="text-sm sm:text-base font-semibold text-gray-800">{{ $t('admin.recentActivity') }}</h3>
            </div>
            <div class="divide-y divide-gray-50">
              <div v-for="a in adminActivity" :key="a.id" class="px-4 sm:px-5 py-3 hover:bg-gray-50 transition-colors">
                <div class="flex items-center justify-between">
                  <p class="text-sm font-medium text-gray-800">{{ a.action }}</p>
                  <span class="text-xs text-gray-400 whitespace-nowrap ml-3">{{ a.time }}</span>
                </div>
                <p class="text-xs text-gray-500 mt-0.5">{{ a.detail }}</p>
              </div>
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import AppButton from '../ui/AppButton.vue'
import KpiCard from '../ui/KpiCard.vue'
import ClientFilterSelect from '../ui/ClientFilterSelect.vue'
import DateRangeFilter from '../ui/DateRangeFilter.vue'
import OrdersList from '../pages/shared/OrdersList.vue'
import OrderDetail from '../pages/shared/OrderDetail.vue'
import OrderCreateForm from '../pages/shared/OrderCreateForm.vue'
import ItemManagement from '../pages/admin/ItemManagement.vue'
import UserManagement from '../pages/admin/UserManagement.vue'
import ClientDetail from '../pages/admin/ClientDetail.vue'
import Reception from '../pages/facility/Reception.vue'
import Processing from '../pages/facility/Processing.vue'
import RoutePlanner from '../pages/admin/RoutePlanner.vue'
import Reports from '../pages/admin/Reports.vue'
import Settings from '../pages/shared/Settings.vue'
import ProfileAccount from '../pages/shared/ProfileAccount.vue'
import InvoicesList from '../pages/shared/InvoicesList.vue'
import InvoiceDetail from '../pages/shared/InvoiceDetail.vue'
import CreateInvoice from '../pages/admin/CreateInvoice.vue'
import LoadingPanel from '../ui/LoadingPanel.vue'
import PickupConfirm from '../pages/driver/PickupConfirm.vue'
import DeliveryConfirm from '../pages/driver/DeliveryConfirm.vue'
import { useNavStore } from '../../stores/nav.js'
import { useUiStore } from '../../stores/ui.js'
import { fetchOrders } from '../../api/orders'
import { mapOrderForList } from '@/utils/orderMappers'
import { fetchDashboardOverview } from '../../api/reports'
import { useDashboardFilters } from '../../composables/dashboard/useDashboardFilters'
import { getCurrentWeekBounds } from '@/utils/date'
import { formatApiErrorMessage } from '@/utils/errors'

const { t, locale } = useI18n()
const navStore = useNavStore()
const uiStore = useUiStore()

const {
  periodMode,
  rangeFrom,
  rangeTo,
  selectedMonth,
  selectedYear,
  selectedClientId,
  monthOptions,
  yearOptions,
  overviewParams,
  setPeriodMode,
  setRangeFrom,
  setRangeTo,
  resetRangeDates,
} = useDashboardFilters(locale)

const weeklyOrders = ref([])
const recentOrders = ref([])
const overviewData = ref({
  ordersReceived: 0,
  itemsTotal: 0,
  itemsProcessed: 0,
  itemsPending: 0,
  itemsDelivered: 0,
})
const loading = ref(true)
let latestOverviewRequestId = 0
let isInitialLoaded = false

function normalizeOverviewData(res) {
  return {
    ordersReceived: Number(res?.ordersReceived) || 0,
    itemsTotal: Number(res?.itemsTotal) || 0,
    itemsProcessed: Number(res?.itemsProcessed) || 0,
    itemsPending: Number(res?.itemsPending) || 0,
    itemsDelivered: Number(res?.itemsDelivered) || 0,
  }
}

async function loadOverviewData() {
  const params = overviewParams.value
  if (!params.from || !params.to) return
  const requestId = ++latestOverviewRequestId
  try {
    const res = await fetchDashboardOverview(params)
    if (requestId !== latestOverviewRequestId) return
    overviewData.value = normalizeOverviewData(res)
  } catch (err) {
    if (requestId !== latestOverviewRequestId) return
    uiStore.showError(formatApiErrorMessage(err, t('admin.errorLoadDashboard'), t))
  }
}

async function loadDashboardData() {
  try {
    loading.value = true
    const { fromStr, toStr } = getCurrentWeekBounds()
    const requestId = ++latestOverviewRequestId

    const [weeklyOrdersData, recentOrdersData, overviewRes] = await Promise.all([
      fetchOrders({ from: fromStr, to: toStr, limit: '200' }).catch(() => []),
      fetchOrders({ limit: '6' }).catch(() => []),
      fetchDashboardOverview(overviewParams.value).catch((err) => {
        if (requestId === latestOverviewRequestId) {
          uiStore.showError(formatApiErrorMessage(err, t('admin.errorLoadDashboard'), t))
        }
        return null
      }),
    ])
    weeklyOrders.value = (weeklyOrdersData ?? []).map(mapOrderForList)
    recentOrders.value = (recentOrdersData ?? []).map(mapOrderForList)
    if (requestId === latestOverviewRequestId && overviewRes) {
      overviewData.value = normalizeOverviewData(overviewRes)
    }
    isInitialLoaded = true
  } finally {
    loading.value = false
  }
}

onMounted(loadDashboardData)

watch(
  () => [overviewParams.value.from, overviewParams.value.to, overviewParams.value.clientId],
  () => {
    // Only refetch overview when user modifies filters after the initial full load
    if (navStore.currentPage === 'dashboard' && isInitialLoaded) {
      loadOverviewData()
    }
  }
)

watch(() => navStore.currentPage, (page) => {
  if (page === 'dashboard') {
    loadDashboardData()
  }
})

const adminKPIs = computed(() => {
  const {
    ordersReceived,
    itemsTotal,
    itemsProcessed,
    itemsPending,
    itemsDelivered,
  } = overviewData.value

  return [
    { label: t('admin.ordersReceived'), value: ordersReceived, color: 'blue' },
    { label: t('admin.itemsTotal'), value: itemsTotal, color: 'cyan' },
    { label: t('admin.itemsProcessed'), value: itemsProcessed, color: 'purple' },
    { label: t('admin.itemsPending'), value: itemsPending, color: 'amber' },
    { label: t('admin.itemsDelivered'), value: itemsDelivered, color: 'green' },
  ]
})

const adminChartData = computed(() => {
  const dayKeys = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const labels = [t('common.dayMon'), t('common.dayTue'), t('common.dayWed'), t('common.dayThu'), t('common.dayFri'), t('common.daySat'), t('common.daySun')]
  const dayMap = {}
  for (const k of dayKeys) dayMap[k] = 0

  const { monday, sunday } = getCurrentWeekBounds()

  for (const o of weeklyOrders.value) {
    const dateStr = o.createdAt
    if (dateStr) {
      const parts = dateStr.split('-').map(Number)
      if (parts.length === 3 && !parts.some(isNaN)) {
        const d = new Date(parts[0], parts[1] - 1, parts[2])
        if (d >= monday && d <= sunday) {
          const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
          const dayName = dayNames[d.getDay()]
          if (dayMap[dayName] !== undefined) dayMap[dayName]++
        }
      }
    }
  }
  return {
    labels,
    values: dayKeys.map(k => dayMap[k] || 0),
  }
})

const maxVal = computed(() => Math.max(...adminChartData.value.values, 1))

const adminActivity = computed(() => {
  return recentOrders.value.slice(0, 6).map((o, i) => {
    const statusAction = {
      pending: t('admin.newOrderPlaced'),
      delivered: t('admin.orderCompleted'),
      completed: t('admin.orderCompleted'),
      invoiced: t('admin.orderCompleted'),
      transit: t('admin.orderInTransit'),
      ready_to_delivery: t('admin.orderReady'),
    }
    return {
      id: i + 1,
      action: statusAction[o.status] || t('admin.orderUpdated'),
      detail: `${o.id} — ${o.client}`,
      time: o.pickupDate || '',
    }
  })
})
</script>
