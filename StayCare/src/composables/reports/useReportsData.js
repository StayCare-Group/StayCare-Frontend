import { ref, computed, onMounted, watch } from 'vue'
import { fetchAllOrders, mapOrderForList } from '../../api/orders'
import { fetchInvoices, mapInvoiceForList } from '../../api/invoices'
import { fetchClients } from '../../api/clients'
import { fetchUsers } from '../../api/users'

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

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

function buildYearOptions() {
  const now = new Date()
  const currentYear = now.getFullYear()
  const opts = []
  for (let i = 0; i < 10; i++) opts.push(currentYear - i)
  return opts
}

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

export function useReportsData(t) {
  const orders = ref([])
  const rawOrders = ref([])
  const invoices = ref([])
  const clientsList = ref([])
  const driversList = ref([])
  const loading = ref(true)

  const monthOptions = buildMonthOptions()
  const selectedMonth = ref(monthOptions[0].value)
  const yearOptions = buildYearOptions()
  const selectedYear = ref(yearOptions[0])
  const reportPeriodType = ref('month')

  function getDateParams() {
    return reportPeriodType.value === 'month'
      ? monthRange(selectedMonth.value)
      : yearRange(selectedYear.value)
  }

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
    } catch {
      // Keep empty state on failure.
    } finally {
      loading.value = false
    }
  }

  onMounted(loadData)
  watch(selectedMonth, loadData)
  watch(selectedYear, loadData)
  watch(reportPeriodType, loadData)

  const hasOrdersInPeriod = computed(() => (orders.value ?? []).length > 0)

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
      const name = o.client || t('reports.unknown')
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

    return {
      onTime,
      late,
      critical,
      avgProcessingHours: avg(processingDurations),
      avgDeliveryHours: avg(deliveryDurations),
    }
  })

  const maxRevenue = computed(() => Math.max(...revenueByMonth.value.values, 1))
  const maxClientRevenue = computed(() => Math.max(...ordersByClient.value.map(r => r.revenue), 1))
  const totalRevenue = computed(() => revenueByMonth.value.values.reduce((a, b) => a + b, 0))

  return {
    orders,
    invoices,
    clientsList,
    driversList,
    loading,
    monthOptions,
    yearOptions,
    selectedMonth,
    selectedYear,
    reportPeriodType,
    hasOrdersInPeriod,
    revenueByMonth,
    ordersByClient,
    slaReport,
    maxRevenue,
    maxClientRevenue,
    totalRevenue,
  }
}
