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
import { fetchOrders, fetchAllOrders } from '../../api/orders'
import { mapOrderForList } from '@/utils/orderMappers'
import { fetchInvoices } from '../../api/invoices'
import { mapInvoiceForList } from '@/utils/invoiceMappers'
import { useAuthStore } from '../../stores/auth.js'
import { isClientProfileCompleteForOrder } from '../../utils/orderEligibility'
import { formatCurrency } from '@/utils/pricing'

const { t } = useI18n()
const navStore = useNavStore()
const authStore = useAuthStore()

const activeOrdersList = ref([])
const recentOrdersList = ref([])
const unpaidInvoicesList = ref([])
const recentInvoicesList = ref([])
const loading = ref(true)
const canCreateOrder = ref(true)

onMounted(async () => {
  try {
    const clientId = authStore.user?.id
    const orderParams = clientId ? { client_id: String(clientId) } : undefined
    const activeStatuses = 'pending,assigned,transit,arrived,washing,drying,ironing,quality_check,ready_to_delivery,collected,rescheduled'

    const [activeOrdersData, recentOrdersData, unpaidInvoicesData, recentInvoicesData] = await Promise.all([
      fetchAllOrders({ ...orderParams, status: activeStatuses }).catch(() => []),
      fetchOrders({ ...orderParams, limit: '5' }).catch(() => []),
      fetchInvoices({ status: 'pending,overdue', limit: '200' }).catch(() => []),
      fetchInvoices({ limit: '5' }).catch(() => []),
    ])

    activeOrdersList.value = (activeOrdersData ?? []).map(mapOrderForList)
    recentOrdersList.value = (recentOrdersData ?? []).map(mapOrderForList)
    unpaidInvoicesList.value = (unpaidInvoicesData ?? []).map(mapInvoiceForList)
    recentInvoicesList.value = (recentInvoicesData ?? []).map(mapInvoiceForList)
    
    canCreateOrder.value = isClientProfileCompleteForOrder(authStore.user, authStore.clientProfile)
  } catch { /* data stays empty */ } finally {
    loading.value = false
  }
})

const clientKPIs = computed(() => {
  const active = activeOrdersList.value.length

  const inProgress = activeOrdersList.value.filter(o =>
    !['pending', 'ready_to_delivery', 'collected'].includes(o.status)
  ).length

  const ready = activeOrdersList.value.filter(o => o.status === 'ready_to_delivery').length
  const outstanding = unpaidInvoicesList.value
    .reduce((sum, i) => sum + (i.grandTotal ?? 0), 0)
  
  return [
    { label: t('client.activeOrders'), value: active, color: 'blue' },
    { label: t('client.inProgress'), value: inProgress, color: 'yellow' },
    { label: t('client.readyForDelivery'), value: ready, color: 'green' },
    { label: t('client.outstandingBalance'), value: `€${outstanding.toFixed(0)}`, color: 'red' },
  ]
})

const recentOrders = computed(() =>
  recentOrdersList.value.map(o => ({
    id: o.id,
    date: o.pickupDate,
    items: o.estimatedBags,
    status: o.status,
    total: formatCurrency(o.total),
  }))
)

const openInvoices = computed(() =>
  recentInvoicesList.value.map(i => ({
    id: i.id,
    amount: formatCurrency(i.grandTotal),
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
