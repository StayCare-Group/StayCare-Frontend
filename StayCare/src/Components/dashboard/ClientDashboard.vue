<template>
  <div>
    <!-- Sub-pages -->
    <OrdersList v-if="navStore.currentPage === 'orders'" />
    <CreateOrder v-else-if="navStore.currentPage === 'create-order'" />
    <OrderDetail v-else-if="navStore.currentPage === 'order-detail'" />
    <InvoicesList v-else-if="navStore.currentPage === 'invoices'" />
    <InvoiceDetail v-else-if="navStore.currentPage === 'invoice-detail'" />
    <Settings v-else-if="navStore.currentPage === 'settings'" />

    <!-- Default dashboard overview -->
    <div v-else class="space-y-6">
      <!-- KPI Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <KpiCard v-for="kpi in clientKPIs" :key="kpi.label" :label="kpi.label" :value="kpi.value" :color="kpi.color" />
      </div>

      <!-- Create Order Button -->
      <div>
        <button @click="navStore.goToDetail('create-order', null)" class="bg-[#FF56B0] text-white font-bold py-2.5 px-6 rounded-lg shadow-[0_4px_0_#E63E8A] hover:opacity-90 transition">
          + Create Order
        </button>
      </div>

      <!-- Tables -->
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
        <DataTable title="Recent Orders" :columns="orderCols" :rows="recentOrders" />
        <DataTable title="Open Invoices" :columns="invoiceCols" :rows="openInvoices" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import KpiCard from '../ui/KpiCard.vue'
import DataTable from '../ui/DataTable.vue'
import OrdersList from '../pages/client/OrdersList.vue'
import CreateOrder from '../pages/client/CreateOrder.vue'
import OrderDetail from '../pages/client/OrderDetail.vue'
import InvoicesList from '../pages/client/InvoicesList.vue'
import InvoiceDetail from '../pages/client/InvoiceDetail.vue'
import Settings from '../pages/shared/Settings.vue'
import { useNavStore } from '../../stores/nav.js'
import { fetchOrders, mapOrderForList, mapStatus } from '../../api/orders'
import { fetchInvoices, mapInvoiceForList } from '../../api/invoices'

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
  } catch { /* data stays empty */ } finally {
    loading.value = false
  }
})

const clientKPIs = computed(() => {
  const active = orders.value.filter(o => !['Delivered', 'Completed'].includes(o.status)).length
  const inProgress = orders.value.filter(o =>
    !['Pending Pickup', 'Delivered', 'Completed', 'Ready for Delivery'].includes(o.status)
  ).length
  const ready = orders.value.filter(o => o.status === 'Ready for Delivery').length
  const outstanding = invoices.value
    .filter(i => i.status !== 'Paid')
    .reduce((sum, i) => sum + (i.grandTotal ?? 0), 0)
  return [
    { label: 'Active Orders', value: active, color: 'blue' },
    { label: 'In Progress', value: inProgress, color: 'yellow' },
    { label: 'Ready for Delivery', value: ready, color: 'green' },
    { label: 'Outstanding Balance', value: `€${outstanding.toFixed(0)}`, color: 'red' },
  ]
})

const recentOrders = computed(() =>
  orders.value.slice(0, 5).map(o => ({
    id: o.id,
    date: o.pickupDate,
    items: o.estimatedBags,
    status: o.status,
    total: `€${(o.total ?? 0).toFixed(2)}`,
  }))
)

const openInvoices = computed(() =>
  invoices.value.filter(i => i.status !== 'Paid').slice(0, 5).map(i => ({
    id: i.id,
    amount: `€${(i.grandTotal ?? 0).toFixed(2)}`,
    due: i.dueDate,
    status: i.status,
  }))
)

const orderCols = [
  { key: 'id', label: 'Order ID' },
  { key: 'date', label: 'Date' },
  { key: 'items', label: 'Items' },
  { key: 'status', label: 'Status', badge: true },
  { key: 'total', label: 'Total' },
]

const invoiceCols = [
  { key: 'id', label: 'Invoice' },
  { key: 'amount', label: 'Amount' },
  { key: 'due', label: 'Due Date' },
  { key: 'status', label: 'Status', badge: true },
]
</script>
