<template>
  <div class="space-y-6">
    <h2 class="text-lg font-semibold text-white">Reports</h2>

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
              class="w-full rounded-t-md bg-gradient-to-t from-[#FF56B0] to-[#FF89C8] transition-all duration-500"
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
                <div class="h-full bg-[#00F5F3] rounded-full transition-all"
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
import { ref, computed, onMounted } from 'vue'
import { fetchOrders, mapOrderForList } from '../../../api/orders'
import { fetchInvoices, mapInvoiceForList } from '../../../api/invoices'
import { fetchClients } from '../../../api/clients'
import { fetchUsers } from '../../../api/users'

const orders = ref([])
const invoices = ref([])
const clientsList = ref([])
const driversList = ref([])
const loading = ref(true)

onMounted(async () => {
  try {
    const [ordersData, invoicesData, clientsData, usersData] = await Promise.all([
      fetchOrders().catch(() => []),
      fetchInvoices().catch(() => []),
      fetchClients().catch(() => []),
      fetchUsers().catch(() => []),
    ])
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
})

const revenueByMonth = computed(() => {
  const months = {}
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  for (const inv of invoices.value) {
    if (inv.status === 'Paid' && inv.issueDate) {
      const d = new Date(inv.issueDate)
      const label = monthNames[d.getMonth()]
      months[label] = (months[label] || 0) + (inv.grandTotal ?? 0)
    }
  }
  const labels = Object.keys(months).length ? Object.keys(months) : monthNames.slice(-6)
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
  const total = orders.value.length
  const delivered = orders.value.filter(o => ['Delivered', 'Completed'].includes(o.status)).length
  const onTime = total > 0 ? Math.round((delivered / total) * 100) : 0
  return {
    onTime,
    late: Math.max(0, 100 - onTime - 2),
    critical: Math.min(2, 100 - onTime),
    avgProcessingHours: 0,
    avgDeliveryHours: 0,
  }
})

const maxRevenue = computed(() => Math.max(...revenueByMonth.value.values, 1))
const maxClientRevenue = computed(() => Math.max(...ordersByClient.value.map(r => r.revenue), 1))
const totalRevenue = computed(() => revenueByMonth.value.values.reduce((a, b) => a + b, 0))
</script>
