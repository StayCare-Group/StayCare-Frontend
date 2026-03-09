<template>
  <div>
    <!-- Sub-pages -->
    <OrdersList v-if="navStore.currentPage === 'orders'" />
    <OrderDetail v-else-if="navStore.currentPage === 'order-detail'" />
    <AdminCreateOrder v-else-if="navStore.currentPage === 'create-order'" />
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

    <!-- Default dashboard overview -->
    <div v-else class="space-y-6">
      <!-- KPI Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
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
                  class="w-full max-w-[40px] rounded-t-md bg-gradient-to-t from-[#FF56B0] to-[#FF89C8] transition-all duration-500"
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
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import KpiCard from '../ui/KpiCard.vue'
import OrdersList from '../pages/client/OrdersList.vue'
import OrderDetail from '../pages/client/OrderDetail.vue'
import AdminCreateOrder from '../pages/admin/AdminCreateOrder.vue'
import ItemManagement from '../pages/admin/ItemManagement.vue'
import UserManagement from '../pages/admin/UserManagement.vue'
import ClientDetail from '../pages/admin/ClientDetail.vue'
import Processing from '../pages/facility/Processing.vue'
import RoutePlanner from '../pages/admin/RoutePlanner.vue'
import Reports from '../pages/admin/Reports.vue'
import Settings from '../pages/shared/Settings.vue'
import InvoicesList from '../pages/client/InvoicesList.vue'
import InvoiceDetail from '../pages/client/InvoiceDetail.vue'
import CreateInvoice from '../pages/admin/CreateInvoice.vue'
import { useNavStore } from '../../stores/nav.js'
import { fetchOrders, mapOrderForList } from '../../api/orders'
import { fetchInvoices, mapInvoiceForList } from '../../api/invoices'

const { t } = useI18n()
const navStore = useNavStore()

const orders = ref([])
const invoices = ref([])
const loading = ref(true)

onMounted(async () => {
  try {
    const [ordersData, invoicesData] = await Promise.all([
      fetchOrders(),
      fetchInvoices(),
    ])
    orders.value = (ordersData ?? []).map(mapOrderForList)
    invoices.value = (invoicesData ?? []).map(mapInvoiceForList)
  } catch { /* stays empty */ } finally {
    loading.value = false
  }
})

const adminKPIs = computed(() => {
  const d = new Date()
  const today = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
  const todayOrders = orders.value.filter(o => o.pickupDate === today).length
  const monthRevenue = invoices.value
    .filter(i => i.status === 'Paid')
    .reduce((sum, i) => sum + (i.grandTotal ?? 0), 0)
  const vatCollected = invoices.value
    .filter(i => i.status === 'Paid')
    .reduce((sum, i) => sum + ((i.grandTotal ?? 0) * 0.18 / 1.18), 0)
  const totalOrders = orders.value.length
  const delivered = orders.value.filter(o => ['Delivered', 'Completed'].includes(o.status)).length
  const sla = totalOrders > 0 ? Math.round((delivered / totalOrders) * 100) : 0
  return [
    { label: t('admin.ordersToday'), value: todayOrders, color: 'blue' },
    { label: t('admin.revenueThisMonth'), value: `€${monthRevenue.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`, color: 'green' },
    { label: t('admin.vatCollected'), value: `€${vatCollected.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`, color: 'purple' },
    { label: t('admin.slaCompliance'), value: `${sla}%`, color: 'yellow' },
  ]
})

const adminChartData = computed(() => {
  const dayKeys = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const labels = [t('common.dayMon'), t('common.dayTue'), t('common.dayWed'), t('common.dayThu'), t('common.dayFri'), t('common.daySat'), t('common.daySun')]
  const dayMap = {}
  for (const k of dayKeys) dayMap[k] = 0

  // Calculate current week bounds (Mon–Sun)
  const now = new Date()
  const day = now.getDay() // 0=Sun
  const diffToMon = day === 0 ? -6 : 1 - day
  const monday = new Date(now)
  monday.setHours(0, 0, 0, 0)
  monday.setDate(now.getDate() + diffToMon)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  sunday.setHours(23, 59, 59, 999)

  for (const o of orders.value) {
    if (o.pickupDate) {
      const d = new Date(o.pickupDate)
      if (d >= monday && d <= sunday) {
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
        const dayName = dayNames[d.getDay()]
        if (dayMap[dayName] !== undefined) dayMap[dayName]++
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
  return orders.value.slice(0, 6).map((o, i) => {
    const statusAction = {
      'Pending Pickup': t('admin.newOrderPlaced'),
      'Delivered': t('admin.orderCompleted'),
      'Completed': t('admin.orderCompleted'),
      'In Transit': t('admin.orderInTransit'),
      'Ready for Delivery': t('admin.orderReady'),
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
