<template>
  <div>
    <!-- Sub-pages -->
    <OrdersList v-if="navStore.currentPage === 'orders'" />
    <OrderCreateForm v-else-if="navStore.currentPage === 'create-order'" mode="client" />
    <OrderDetail v-else-if="navStore.currentPage === 'order-detail'" />
    <InvoicesList v-else-if="navStore.currentPage === 'invoices'" />
    <InvoiceDetail v-else-if="navStore.currentPage === 'invoice-detail'" />
    <Settings v-else-if="navStore.currentPage === 'settings'" />
    <ProfileAccount v-else-if="navStore.currentPage === 'profile'" />

    <!-- Default dashboard overview -->
    <LoadingPanel v-else-if="loading" />

    <div v-else class="space-y-6">
      <!-- KPI Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <KpiCard v-for="kpi in clientKPIs" :key="kpi.label" :label="kpi.label" :value="kpi.value" :color="kpi.color" />
      </div>

      <!-- Create Order Button -->
      <div>
        <AppButton @click="navStore.goToDetail('create-order', null)">
          {{ $t('client.createOrder') }}
        </AppButton>
      </div>

      <!-- Tables -->
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
        <DataTable :title="$t('client.recentOrders')" :columns="orderCols" :rows="recentOrders" />
        <DataTable :title="$t('client.openInvoices')" :columns="invoiceCols" :rows="openInvoices" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import KpiCard from '../ui/KpiCard.vue'
import DataTable from '../ui/DataTable.vue'
import OrdersList from '../pages/shared/OrdersList.vue'
import OrderCreateForm from '../pages/shared/OrderCreateForm.vue'
import OrderDetail from '../pages/shared/OrderDetail.vue'
import InvoicesList from '../pages/shared/InvoicesList.vue'
import InvoiceDetail from '../pages/shared/InvoiceDetail.vue'
import Settings from '../pages/shared/Settings.vue'
import ProfileAccount from '../pages/shared/ProfileAccount.vue'
import { useNavStore } from '../../stores/nav.js'
import AppButton from '../ui/AppButton.vue'
import LoadingPanel from '../ui/LoadingPanel.vue'
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
    { label: t('client.activeOrders'), value: active, color: 'blue' },
    { label: t('client.inProgress'), value: inProgress, color: 'yellow' },
    { label: t('client.readyForDelivery'), value: ready, color: 'green' },
    { label: t('client.outstandingBalance'), value: `€${outstanding.toFixed(0)}`, color: 'red' },
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

const orderCols = computed(() => [
  { key: 'id', label: t('client.orderId') },
  { key: 'date', label: t('client.date') },
  { key: 'items', label: t('client.items') },
  { key: 'status', label: t('client.status'), badge: true },
  { key: 'total', label: t('client.total') },
])

const invoiceCols = computed(() => [
  { key: 'id', label: t('client.invoice') },
  { key: 'amount', label: t('client.amount') },
  { key: 'due', label: t('client.dueDate') },
  { key: 'status', label: t('client.status'), badge: true },
])
</script>
