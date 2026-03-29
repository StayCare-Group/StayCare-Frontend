<template>
  <div class="space-y-6">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <h2 class="text-lg font-semibold text-brand-700">Reports</h2>

      <div class="flex flex-wrap items-center gap-3">
        <div class="inline-flex items-center gap-2 rounded-lg bg-gray-100 p-1">
          <AppButton
            size="sm"
            :variant="reportPeriodType === 'month' ? 'primary' : 'ghost'"
            @click="reportPeriodType = 'month'"
          >
            {{ $t('admin.reportByMonth') }}
          </AppButton>
          <AppButton
            size="sm"
            :variant="reportPeriodType === 'year' ? 'primary' : 'ghost'"
            @click="reportPeriodType = 'year'"
          >
            {{ $t('admin.reportByYear') }}
          </AppButton>
        </div>

        <select
          v-if="reportPeriodType === 'month'"
          v-model="selectedMonth"
          class="rounded-lg border border-gray-200 bg-white text-gray-700 text-sm px-3 py-2
                 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent"
        >
          <option v-for="m in monthOptions" :key="m.value" :value="m.value" class="text-gray-800">
            {{ m.label }}
          </option>
        </select>
        <select
          v-else
          v-model="selectedYear"
          class="rounded-lg border border-gray-200 bg-white text-gray-700 text-sm px-3 py-2
                 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent"
        >
          <option v-for="y in yearOptions" :key="y" :value="y" class="text-gray-800">{{ y }}</option>
        </select>

        <button
          @click="exportToExcel"
          :disabled="loading || !hasOrdersInPeriod"
          class="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white
                 bg-gradient-to-r from-brand-700 to-brand-400 hover:opacity-90
                 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-sm"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V3"/>
          </svg>
          {{ $t('admin.exportExcel') }}
        </button>
      </div>
    </div>

    <div class="grid grid-cols-1 xl:grid-cols-2 gap-6">
      <!-- Revenue Chart -->
      <div class="bg-white rounded-xl shadow-sm p-5">
        <h3 class="text-sm font-semibold text-gray-700 mb-4">Revenue by Month</h3>
        <div class="flex items-end gap-2 sm:gap-3 h-48">
          <div
            v-for="(val, i) in revenueByMonth.values" :key="i"
            class="flex-1 flex flex-col items-center gap-1"
          >
            <span class="text-xs font-semibold text-gray-600">&euro;{{ (val / 1000).toFixed(1) }}k</span>
            <div
              class="w-full rounded-t-md bg-gradient-to-t from-brand-700 to-brand-400 transition-all duration-500"
              :style="{ height: (val / maxRevenue) * 100 + '%' }"
            ></div>
            <span class="text-xs text-gray-400">{{ revenueByMonth.labels[i] }}</span>
          </div>
        </div>
      </div>

      <!-- Orders by Client -->
      <div class="bg-white rounded-xl shadow-sm p-5">
        <h3 class="text-sm font-semibold text-gray-700 mb-4">Orders by Client</h3>
        <div class="space-y-3">
          <div v-for="row in ordersByClient" :key="row.client" class="flex items-center gap-3">
            <div class="flex-1 min-w-0">
              <div class="flex items-center justify-between mb-1">
                <span class="text-sm font-medium text-gray-800 truncate">{{ row.client }}</span>
                <span class="text-xs text-gray-400 whitespace-nowrap ml-2">{{ row.orders }} orders</span>
              </div>
              <div class="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <div class="h-full bg-brand-400 rounded-full transition-all"
                  :style="{ width: (row.revenue / maxClientRevenue) * 100 + '%' }"></div>
              </div>
            </div>
            <span class="text-sm font-semibold text-gray-700 w-16 text-right">&euro;{{ row.revenue.toLocaleString() }}</span>
          </div>
        </div>
      </div>

      <!-- SLA Report -->
      <div class="bg-white rounded-xl shadow-sm p-5">
        <h3 class="text-sm font-semibold text-gray-700 mb-4">SLA Performance</h3>
        <div class="grid grid-cols-2 gap-4">
          <div class="text-center p-4 bg-green-50 rounded-lg">
            <p class="text-2xl font-bold text-green-700">{{ slaReport.onTime }}%</p>
            <p class="text-xs text-green-600 mt-1">On Time</p>
          </div>
          <div class="text-center p-4 bg-yellow-50 rounded-lg">
            <p class="text-2xl font-bold text-yellow-700">{{ slaReport.late }}%</p>
            <p class="text-xs text-yellow-600 mt-1">Late</p>
          </div>
          <div class="text-center p-4 bg-red-50 rounded-lg">
            <p class="text-2xl font-bold text-red-700">{{ slaReport.critical }}%</p>
            <p class="text-xs text-red-600 mt-1">Critical</p>
          </div>
          <div class="text-center p-4 bg-blue-50 rounded-lg">
            <p class="text-2xl font-bold text-blue-700">{{ slaReport.avgProcessingHours }}h</p>
            <p class="text-xs text-blue-600 mt-1">Avg Processing</p>
          </div>
        </div>
      </div>

      <!-- Avg Delivery Time -->
      <div class="bg-white rounded-xl shadow-sm p-5">
        <h3 class="text-sm font-semibold text-gray-700 mb-4">Key Metrics</h3>
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <span class="text-sm text-gray-600">Avg. Processing Time</span>
            <span class="text-sm font-bold text-gray-800">{{ slaReport.avgProcessingHours }}h</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-sm text-gray-600">Avg. Delivery Time</span>
            <span class="text-sm font-bold text-gray-800">{{ slaReport.avgDeliveryHours }}h</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-sm text-gray-600">Total Clients</span>
            <span class="text-sm font-bold text-gray-800">{{ clientsList.length }}</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-sm text-gray-600">Active Drivers</span>
            <span class="text-sm font-bold text-gray-800">{{ driversList.filter(d => d.status === 'Active').length }}</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-sm text-gray-600">Total Revenue (6mo)</span>
            <span class="text-sm font-bold text-gray-800">&euro;{{ totalRevenue.toLocaleString() }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import * as XLSX from 'xlsx'
import { fetchAllOrders, mapOrderForList } from '../../../api/orders'
import { fetchInvoices, mapInvoiceForList } from '../../../api/invoices'
import { fetchClients } from '../../../api/clients'
import { fetchUsers } from '../../../api/users'
import AppButton from '../../ui/AppButton.vue'

const orders = ref([])
const rawOrders = ref([])
const invoices = ref([])
const clientsList = ref([])
const driversList = ref([])
const loading = ref(true)

// ── Month selector ─────────────────────────────────────────
const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December']

function buildMonthOptions() {
  const now = new Date()
  const opts = []
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    opts.push({ value, label: `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}` })
  }
  return opts
}

const monthOptions = buildMonthOptions()
const selectedMonth = ref(monthOptions[0].value)

function buildYearOptions() {
  const now = new Date()
  const currentYear = now.getFullYear()
  const opts = []
  for (let i = 0; i < 10; i++) opts.push(currentYear - i)
  return opts
}

const yearOptions = buildYearOptions()
const selectedYear = ref(yearOptions[0])
const reportPeriodType = ref('month')

function monthRange(ym) {
  const [y, m] = ym.split('-').map(Number)
  const from = new Date(y, m - 1, 1)
  const to = new Date(y, m, 0, 23, 59, 59, 999)
  return { from: from.toISOString(), to: to.toISOString() }
}

function yearRange(year) {
  const y = Number(year)
  const from = new Date(y, 0, 1)
  const to = new Date(y, 11, 31, 23, 59, 59, 999)
  return { from: from.toISOString(), to: to.toISOString() }
}

function getDateParams() {
  return reportPeriodType.value === 'month'
    ? monthRange(selectedMonth.value)
    : yearRange(selectedYear.value)
}

// ── Data loading ───────────────────────────────────────────
async function loadData() {
  loading.value = true
  try {
    const { from, to } = getDateParams()
    const dateParams = { from, to }

    const [ordersData, invoicesData, clientsData, usersData] = await Promise.all([
      fetchAllOrders(dateParams).catch(() => []),
      fetchInvoices({ ...dateParams, limit: '200' }).catch(() => []),
      fetchClients().catch(() => []),
      fetchUsers().catch(() => []),
    ])

    rawOrders.value = ordersData ?? []
    orders.value = (ordersData ?? []).map(mapOrderForList)
    invoices.value = (invoicesData ?? []).map(mapInvoiceForList)
    clientsList.value = clientsData ?? []
    driversList.value = (usersData ?? []).filter(u => u.role === 'driver').map(u => ({
      ...u,
      status: u.is_active ? 'Active' : 'Inactive',
    }))
  } catch { /* stays empty */ } finally {
    loading.value = false
  }
}

onMounted(loadData)
watch(selectedMonth, loadData)
watch(selectedYear, loadData)
watch(reportPeriodType, loadData)

const hasOrdersInPeriod = computed(() => (orders.value ?? []).length > 0)

// ── Computed data for charts ───────────────────────────────
const revenueByMonth = computed(() => {
  const months = {}
  for (const inv of invoices.value) {
    if (inv.status === 'Paid' && inv.issueDate) {
      const d = new Date(inv.issueDate)
      const label = `${MONTH_NAMES[d.getMonth()].slice(0, 3)}`
      months[label] = (months[label] || 0) + (inv.grandTotal ?? 0)
    }
  }
  const shortNames = MONTH_NAMES.map(n => n.slice(0, 3))
  const labels = Object.keys(months).length ? Object.keys(months) : shortNames.slice(-6)
  const values = labels.map(l => months[l] || 0)
  return { labels, values }
})

const ordersByClient = computed(() => {
  const map = {}
  for (const o of orders.value) {
    const name = o.client || 'Unknown'
    if (!map[name]) map[name] = { client: name, orders: 0, revenue: 0 }
    map[name].orders++
    map[name].revenue += o.total ?? 0
  }
  return Object.values(map).sort((a, b) => b.revenue - a.revenue).slice(0, 10)
})

const slaReport = computed(() => {
  const MS_PER_HOUR = 1000 * 60 * 60
  const processingDurations = []
  const deliveryDurations = []

  let onTimeCount = 0
  let lateCount = 0
  let criticalCount = 0

  for (const o of rawOrders.value) {
    const history = Array.isArray(o.status_history) ? o.status_history : []
    if (!history.length) continue

    const getFirstTimestamp = (statuses) => {
      const entry = history.find(h => statuses.includes(h.status))
      return entry?.timestamp ? new Date(entry.timestamp).getTime() : null
    }

    const arrivedAt = getFirstTimestamp(['Arrived'])
    const processingDoneAt = getFirstTimestamp(['ReadyToDeliver', 'Completed', 'Delivered'])
    if (arrivedAt && processingDoneAt && processingDoneAt > arrivedAt) {
      processingDurations.push((processingDoneAt - arrivedAt) / MS_PER_HOUR)
    }

    const deliveryStart = getFirstTimestamp(['ReadyToDeliver', 'Collected'])
    const deliveredAt = getFirstTimestamp(['Delivered', 'Completed'])
    if (deliveryStart && deliveredAt && deliveredAt > deliveryStart) {
      deliveryDurations.push((deliveredAt - deliveryStart) / MS_PER_HOUR)
    }

    if (deliveredAt && o.created_at) {
      const createdAt = new Date(o.created_at).getTime()
      if (!Number.isNaN(createdAt) && deliveredAt > createdAt) {
        const totalHours = (deliveredAt - createdAt) / MS_PER_HOUR
        const targetHours = o.service_type === 'express' ? 24 : 48

        if (totalHours <= targetHours) onTimeCount++
        else if (totalHours <= targetHours * 2) lateCount++
        else criticalCount++
      }
    }
  }

  const totalClassified = onTimeCount + lateCount + criticalCount
  const onTime = totalClassified ? Math.round((onTimeCount / totalClassified) * 100) : 0
  const late = totalClassified ? Math.round((lateCount / totalClassified) * 100) : 0
  const critical = Math.max(0, 100 - onTime - late)

  const avg = (arr) => arr.length ? Number((arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(1)) : 0

  return { onTime, late, critical, avgProcessingHours: avg(processingDurations), avgDeliveryHours: avg(deliveryDurations) }
})

const maxRevenue = computed(() => Math.max(...revenueByMonth.value.values, 1))
const maxClientRevenue = computed(() => Math.max(...ordersByClient.value.map(r => r.revenue), 1))
const totalRevenue = computed(() => revenueByMonth.value.values.reduce((a, b) => a + b, 0))

// ── Excel export ───────────────────────────────────────────
function exportToExcel() {
  const wb = XLSX.utils.book_new()
  const isYear = reportPeriodType.value === 'year'
  const periodLabel = isYear
    ? String(selectedYear.value)
    : (monthOptions.find(m => m.value === selectedMonth.value)?.label ?? selectedMonth.value)
  const periodMetricLabel = isYear ? 'Year' : 'Month'

  // Sheet 1: Client Summary
  const clientMap = {}
  for (const o of orders.value) {
    const name = o.client || 'Unknown'
    if (!clientMap[name]) clientMap[name] = { orders: 0, invoices: 0, invoiced: 0, paid: 0 }
    clientMap[name].orders++
  }
  for (const inv of invoices.value) {
    const name = inv.client || 'Unknown'
    if (!clientMap[name]) clientMap[name] = { orders: 0, invoices: 0, invoiced: 0, paid: 0 }
    clientMap[name].invoices++
    clientMap[name].invoiced += inv.grandTotal ?? 0
    if (inv.status === 'Paid') clientMap[name].paid += inv.grandTotal ?? 0
  }
  const clientRows = Object.entries(clientMap)
    .sort(([, a], [, b]) => b.invoiced - a.invoiced)
    .map(([name, d]) => ({
      Client: name,
      Orders: d.orders,
      Invoices: d.invoices,
      'Total Invoiced (€)': d.invoiced,
      'Total Paid (€)': d.paid,
    }))
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(clientRows.length ? clientRows : [{ Client: 'No data' }]), 'Client Summary')

  // Sheet 2: Orders
  const orderRows = orders.value.map(o => ({
    'Order ID': o.id,
    Client: o.client,
    'Pickup Date': o.pickupDate,
    'Service Type': o.serviceType,
    'Est. Bags': o.estimatedBags,
    'Actual Bags': o.actualBags ?? '',
    Status: o.status,
    'Total (€)': o.total,
  }))
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(orderRows.length ? orderRows : [{ 'Order ID': 'No data' }]), 'Orders')

  // Sheet 3: Invoices
  const invoiceRows = invoices.value.map(inv => ({
    'Invoice ID': inv.id,
    Order: inv.orderId,
    Client: inv.client,
    'Issue Date': inv.issueDate,
    'Due Date': inv.dueDate,
    Status: inv.status,
    'Total (€)': inv.grandTotal,
  }))
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(invoiceRows.length ? invoiceRows : [{ 'Invoice ID': 'No data' }]), 'Invoices')

  // Sheet 4: SLA & Metrics
  const sla = slaReport.value
  const metricsRows = [
    { Metric: periodMetricLabel, Value: periodLabel },
    { Metric: 'Total Orders', Value: orders.value.length },
    { Metric: 'Total Invoices', Value: invoices.value.length },
    { Metric: 'On Time', Value: `${sla.onTime}%` },
    { Metric: 'Late', Value: `${sla.late}%` },
    { Metric: 'Critical', Value: `${sla.critical}%` },
    { Metric: 'Avg Processing Time', Value: `${sla.avgProcessingHours}h` },
    { Metric: 'Avg Delivery Time', Value: `${sla.avgDeliveryHours}h` },
    { Metric: 'Total Clients', Value: clientsList.value.length },
    { Metric: 'Active Drivers', Value: driversList.value.filter(d => d.status === 'Active').length },
    { Metric: 'Total Revenue', Value: `€${totalRevenue.value.toLocaleString()}` },
  ]
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(metricsRows), 'SLA & Metrics')

  const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
  const blob = new Blob([buf], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = isYear ? `StayCare-Report-${selectedYear.value}.xlsx` : `StayCare-Report-${selectedMonth.value}.xlsx`
  a.click()
  URL.revokeObjectURL(url)
}
</script>
