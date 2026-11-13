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
    <div v-else class="space-y-6 print:space-y-4">
      <!-- Print-only Executive Header -->
      <div class="hidden print:flex items-center justify-between pb-3 border-b border-gray-200">
        <div>
          <h1 class="text-lg font-bold text-brand-900">StayCare — {{ $t('admin.generalSummary') }}</h1>
          <p class="text-xs text-gray-500">
            {{ $t('admin.printPeriodLabel') }}: {{ overviewParams.from }} – {{ overviewParams.to }}
          </p>
        </div>
        <div class="text-xs font-medium text-gray-600 tabular-nums">
          {{ currentDateTimeLabel }}
        </div>
      </div>

      <!-- Header & Global Filters (Compact single-bar layout) -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-100 px-4 py-3 flex flex-wrap items-center justify-between gap-3 print:hidden">
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

        <!-- Current Date & Time + Client Filter -->
        <div class="flex flex-wrap items-center gap-3">
          <div
            data-testid="dashboard-current-datetime"
            class="inline-flex items-center gap-1.5 rounded-lg bg-gray-50 border border-gray-200/80 px-2.5 py-1.5 text-xs font-medium text-gray-600 tabular-nums"
          >
            <svg
              class="w-3.5 h-3.5 text-brand-600 shrink-0"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="1.75"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
              />
            </svg>
            <span>{{ currentDateTimeLabel }}</span>
          </div>

          <ClientFilterSelect v-model="selectedClientId" />

          <button
            type="button"
            data-testid="dashboard-export-pdf-btn"
            class="inline-flex items-center gap-1.5 rounded-lg bg-brand-700 hover:bg-brand-800 text-white text-xs font-semibold px-3 py-1.5 shadow-xs transition-colors cursor-pointer"
            @click="handlePrintDashboard"
          >
            <svg
              class="w-3.5 h-3.5 shrink-0"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="1.75"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0 1 10.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0 .229 2.523a1.125 1.125 0 0 1-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0 0 21 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 0 0-1.913-.247M6.34 18H5.25A2.25 2.25 0 0 1 3 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 0 1 1.913-.247m10.5 0a48.536 48.536 0 0 0-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5Zm-3 0h.008v.008H15V10.5Z"
              />
            </svg>
            <span>{{ $t('admin.exportPdf') }}</span>
          </button>
        </div>
      </div>

      <LoadingPanel v-if="loading" />

      <template v-else>
        <!-- KPI Cards -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 print:grid-cols-5 print:break-inside-avoid">
          <KpiCard v-for="kpi in adminKPIs" :key="kpi.label" :label="kpi.label" :value="kpi.value" :color="kpi.color" />
        </div>

        <!-- Block B: Items in Process + Item Condition + Orders to Pick Up / Deliver -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 print:grid-cols-3 print:gap-4 print:break-inside-avoid">
          <ItemsInProcessCard :items-in-process="overviewData.itemsInProcess" />

          <ItemConditionChart :conditions="overviewData.itemConditions" />

          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4 print:grid-cols-1">
            <KpiCard
              data-testid="orders-to-pickup-card"
              class="flex flex-col justify-between p-5"
              :label="$t('admin.ordersToPickup')"
              :value="overviewData.ordersToPickup"
            />

            <KpiCard
              data-testid="orders-to-deliver-card"
              class="flex flex-col justify-between p-5"
              :label="$t('admin.ordersToDeliver')"
              :value="overviewData.ordersToDeliver"
            />
          </div>
        </div>

        <div class="grid grid-cols-1 xl:grid-cols-2 gap-6 print:grid-cols-2 print:gap-4 print:break-inside-avoid">
          <!-- Orders per Day Line Chart -->
          <OrdersLineChart
            :points="dailyOrdersSeries.points"
            :granularity="dailyOrdersSeries.granularity"
          />

          <!-- Real-Time Alerts Card -->
          <AlertsCard
            :alerts="alertsData"
            :loading="alertsLoading"
            @view-order="handleViewOrder"
          />
        </div>

        <!-- Monthly Comparison Table -->
        <MonthlyComparisonCard class="print:break-inside-avoid" :client-id="overviewParams.clientId" />
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import KpiCard from '../ui/KpiCard.vue'
import ClientFilterSelect from '../ui/ClientFilterSelect.vue'
import DateRangeFilter from '../ui/DateRangeFilter.vue'
import OrdersLineChart from './OrdersLineChart.vue'
import AlertsCard from './AlertsCard.vue'
import ItemsInProcessCard from './ItemsInProcessCard.vue'
import ItemConditionChart from './ItemConditionChart.vue'
import MonthlyComparisonCard from './MonthlyComparisonCard.vue'
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
import {
  fetchDashboardOverview,
  fetchDashboardDailyOrders,
  fetchDashboardAlerts,
} from '../../api/reports'
import { useDashboardFilters } from '../../composables/dashboard/useDashboardFilters'
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

const overviewData = ref({
  ordersReceived: 0,
  itemsTotal: 0,
  itemsProcessed: 0,
  itemsPending: 0,
  itemsDelivered: 0,
  ordersToPickup: 0,
  ordersToDeliver: 0,
  itemsInProcess: {
    washing: 0,
    drying: 0,
    ironing: 0,
    qualityCheck: 0,
  },
  itemConditions: {
    good: 0,
    bad: 0,
    stained: 0,
    total: 0,
  },
})
const dailyOrdersSeries = ref({
  granularity: 'day',
  points: [],
})
const alertsData = ref({
  thresholdHours: 24,
  totalAlerts: 0,
  overduePickups: [],
  stalledOrders: [],
})
const loading = ref(true)
const alertsLoading = ref(false)
let latestFilterRequestId = 0
let latestAlertsRequestId = 0
let isInitialLoaded = false

function normalizeOverviewData(res) {
  const good = Number(res?.itemConditions?.good) || 0
  const bad = Number(res?.itemConditions?.bad) || 0
  const stained = Number(res?.itemConditions?.stained) || 0
  return {
    ordersReceived: Number(res?.ordersReceived) || 0,
    itemsTotal: Number(res?.itemsTotal) || 0,
    itemsProcessed: Number(res?.itemsProcessed) || 0,
    itemsPending: Number(res?.itemsPending) || 0,
    itemsDelivered: Number(res?.itemsDelivered) || 0,
    ordersToPickup: Number(res?.ordersToPickup) || 0,
    ordersToDeliver: Number(res?.ordersToDeliver) || 0,
    itemsInProcess: {
      washing: Number(res?.itemsInProcess?.washing) || 0,
      drying: Number(res?.itemsInProcess?.drying) || 0,
      ironing: Number(res?.itemsInProcess?.ironing) || 0,
      qualityCheck: Number(res?.itemsInProcess?.qualityCheck) || 0,
    },
    itemConditions: {
      good,
      bad,
      stained,
      total: Number(res?.itemConditions?.total) || (good + bad + stained),
    },
  }
}

function normalizeDailyOrdersSeries(res) {
  return {
    granularity: res?.granularity === 'month' ? 'month' : 'day',
    points: Array.isArray(res?.points)
      ? res.points.map((p) => ({
          date: String(p?.date ?? ''),
          orders: Number(p?.orders) || 0,
        }))
      : [],
  }
}

function normalizeAlertsData(res) {
  return {
    thresholdHours: Number(res?.thresholdHours) || 24,
    totalAlerts: Number(res?.totalAlerts) || 0,
    overduePickups: Array.isArray(res?.overduePickups) ? res.overduePickups : [],
    stalledOrders: Array.isArray(res?.stalledOrders) ? res.stalledOrders : [],
  }
}

function handleViewOrder(orderId) {
  if (orderId) {
    navStore.goToDetail('order-detail', orderId)
  }
}

function handlePrintDashboard() {
  window.print()
}

async function loadFilteredDashboardMetrics() {
  const params = overviewParams.value
  if (!params.from || !params.to) return
  const requestId = ++latestFilterRequestId
  let errorShown = false

  const handleError = (err) => {
    if (requestId === latestFilterRequestId && !errorShown) {
      errorShown = true
      uiStore.showError(formatApiErrorMessage(err, t('admin.errorLoadDashboard'), t))
    }
    return null
  }

  const [overviewRes, dailyOrdersRes] = await Promise.all([
    fetchDashboardOverview(params).catch(handleError),
    fetchDashboardDailyOrders(params).catch(handleError),
  ])

  if (requestId !== latestFilterRequestId) return
  if (overviewRes) {
    overviewData.value = normalizeOverviewData(overviewRes)
  }
  if (dailyOrdersRes) {
    dailyOrdersSeries.value = normalizeDailyOrdersSeries(dailyOrdersRes)
  }
}

async function loadDashboardAlerts() {
  const requestId = ++latestAlertsRequestId
  alertsLoading.value = true

  try {
    const res = await fetchDashboardAlerts({ clientId: overviewParams.value.clientId })
    if (requestId !== latestAlertsRequestId) return
    alertsData.value = normalizeAlertsData(res)
  } catch (err) {
    if (requestId === latestAlertsRequestId) {
      uiStore.showError(formatApiErrorMessage(err, t('admin.errorLoadAlerts'), t))
    }
  } finally {
    if (requestId === latestAlertsRequestId) {
      alertsLoading.value = false
    }
  }
}

async function loadDashboardData() {
  try {
    loading.value = true
    await Promise.all([loadFilteredDashboardMetrics(), loadDashboardAlerts()])
    isInitialLoaded = true
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadDashboardData()
})

const currentNow = ref(new Date())
const clockInterval = setInterval(() => {
  currentNow.value = new Date()
}, 15000)

onUnmounted(() => {
  clearInterval(clockInterval)
})

const currentDateTimeLabel = computed(() =>
  new Intl.DateTimeFormat(locale.value || 'en', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(currentNow.value)
)

watch(
  () => [overviewParams.value.from, overviewParams.value.to, overviewParams.value.clientId],
  ([from, to, clientId], [prevFrom, prevTo, prevClientId]) => {
    if (navStore.currentPage !== 'dashboard' || !isInitialLoaded) return

    const datesChanged = from !== prevFrom || to !== prevTo
    const clientChanged = clientId !== prevClientId

    if (datesChanged || clientChanged) {
      loadFilteredDashboardMetrics()
    }
    if (clientChanged) {
      loadDashboardAlerts()
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
</script>
