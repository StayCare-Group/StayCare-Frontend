import { ref, computed, onMounted, watch } from 'vue'
import { fetchDashboardStats } from '../../api/reports'
import { getUsers } from '../../api/users'
import { apiFetch } from '../../api/client'

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
  const revenueData = ref([])
  const clientsData = ref([])
  const slaData = ref(null)
  const driversList = ref([])
  const dashboardStats = ref(null)
  const loading = ref(true)

  const monthOptions = buildMonthOptions()
  const selectedMonth = ref(monthOptions[0].value)
  const yearOptions = buildYearOptions()
  const selectedYear = ref(yearOptions[0])
  const reportPeriodType = ref('month')

  // Calculate how many months back to pass to /api/reports/revenue
  function getMonthsParam() {
    if (reportPeriodType.value === 'year') {
      const currentYear = new Date().getFullYear()
      const diff = currentYear - Number(selectedYear.value)
      // Return all 12 months of the selected year relative to today
      return diff === 0 ? 12 : (diff + 1) * 12
    }
    // For month mode: calculate offset from current month
    const now = new Date()
    const [y, m] = selectedMonth.value.split('-').map(Number)
    const diffMonths = (now.getFullYear() - y) * 12 + (now.getMonth() + 1 - m)
    return Math.max(diffMonths + 1, 1)
  }

  async function loadData() {
    loading.value = true
    try {
      const months = getMonthsParam()

      const [revenueRes, clientsRes, slaRes, statsRes, usersData] = await Promise.all([
        apiFetch(`/api/reports/revenue?months=${months}`).catch(() => []),
        apiFetch('/api/reports/orders-by-client').catch(() => []),
        apiFetch('/api/reports/sla').catch(() => null),
        fetchDashboardStats().catch(() => null),
        getUsers({ role: 'driver', limit: '200' }).catch(() => []),
      ])

      revenueData.value = revenueRes
      clientsData.value = clientsRes
      slaData.value = slaRes
      dashboardStats.value = statsRes
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

  const hasOrdersInPeriod = computed(() => clientsData.value.length > 0 || revenueData.value.length > 0)

  // Transform backend { year, month, revenue } into { labels, values } for the bar chart
  const revenueByMonth = computed(() => {
    const MONTH_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
    const revMap = new Map()
    for (const r of revenueData.value) {
      revMap.set(`${r.year}-${r.month}`, r.revenue ?? 0)
    }

    const labels = []
    const values = []

    if (reportPeriodType.value === 'year') {
      const yr = Number(selectedYear.value)
      for (let m = 1; m <= 12; m++) {
        labels.push(MONTH_SHORT[m - 1])
        values.push(revMap.get(`${yr}-${m}`) ?? 0)
      }
    } else {
      // Month mode: show last 6 months ending at selectedMonth
      const [selYear, selMonth] = selectedMonth.value.split('-').map(Number)
      for (let i = 5; i >= 0; i--) {
        const d = new Date(selYear, selMonth - 1 - i, 1)
        const yr = d.getFullYear()
        const mo = d.getMonth() + 1
        labels.push(MONTH_SHORT[mo - 1])
        values.push(revMap.get(`${yr}-${mo}`) ?? 0)
      }
    }

    return { labels, values }
  })

  // Transform backend ClientStats into the shape the template expects
  const ordersByClient = computed(() =>
    clientsData.value.map(c => ({
      client: c.clientName,
      orders: c.totalOrders,
      revenue: c.totalRevenue,
    })).slice(0, 10)
  )

  // Normalize backend SLA field names to match template usage
  const slaReport = computed(() => {
    const s = slaData.value || {}
    return {
      onTime:             s.onTimePercent  ?? 0,
      late:               s.latePercent    ?? 0,
      critical:           s.criticalPercent ?? 0,
      avgProcessingHours: s.avgProcessingHours ?? 0,
      avgDeliveryHours:   s.avgDeliveryHours   ?? 0,
    }
  })

  // clientsList as array-like for backward compat with useReportExport (.length)
  // Uses dashboardStats.totalClients as the authoritative count.
  const clientsList = computed(() => {
    const stats = dashboardStats.value || {}
    const total = stats.totalClients ?? 0
    // Return an array of 'total' length so .length works in the export
    return Array.from({ length: total })
  })

  const maxRevenue = computed(() => Math.max(...revenueByMonth.value.values, 1))
  const maxClientRevenue = computed(() => Math.max(...ordersByClient.value.map(r => r.revenue), 1))
  const totalRevenue = computed(() => revenueByMonth.value.values.reduce((a, b) => a + b, 0))

  // Empty shims kept for useReportExport backward compatibility.
  // The Excel export will show 0 rows for orders/invoices (raw lists are
  // no longer downloaded for performance reasons). The dashboard charts
  // are now driven by the dedicated report endpoints above.
  const orders = { value: [] }
  const invoices = { value: [] }

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
