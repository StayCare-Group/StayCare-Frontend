<template>
  <div class="space-y-6">
    <!-- Header -->
    <TitleHeader
      :title="order?.id || ''"
      :on-back="() => navStore.goBack('orders')"
    >
      <StatusBadge v-if="order" :status="order.status" />
      <!-- PDF download -->
      <AppButton
        v-if="order"
        variant="secondary"
        size="sm"
        :loading="generatingPdf"
        @click="downloadPdf"
        class="ml-auto"
      >
        <svg class="w-3.5 h-3.5 mr-1 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        {{ generatingPdf ? $t('orderPdf.generating') : $t('orderPdf.download') }}
      </AppButton>
      <!-- Edit order (admin / staff only) -->
      <AppButton
        v-if="order && isAdminOrStaff"
        variant="secondary"
        size="sm"
        :disabled="!canEditOrder"
        :title="cannotEditTooltip"
        @click="showEditModal = true"
      >
        <svg class="w-3.5 h-3.5 mr-1 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
        {{ $t('admin.editOrder') }}
      </AppButton>
      <!-- Cancel order (admin only) -->
      <AppButton
        v-if="order && isAdmin && isCancelableStatus(order.status)"
        variant="danger"
        size="sm"
        @click="showCancelModal = true"
      >
        <svg class="w-3.5 h-3.5 mr-1 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
        {{ $t('admin.cancelOrder') }}
      </AppButton>
    </TitleHeader>

    <p v-if="order && isAdminOrStaff && order.isInvoiced" class="text-xs text-amber-600">
      {{ $t('orderDetail.cannotEditInvoicedOrder') }}
    </p>
    <p v-else-if="order && isAdminOrStaff && !isEditableStatus(order.status)" class="text-xs text-amber-600">
      {{ $t('orderDetail.cannotEditReceivedOrder') }}
    </p>

    <div v-if="order" class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Left column: details + items -->
      <div class="lg:col-span-2 space-y-6">
        <!-- Order Info -->
        <InfoGridCard
          :title="$t('orderDetail.orderInformation')"
          :items="orderInfoItems"
        >
          <template v-if="order.specialNotes" #footer>
            <span class="text-xs text-gray-400 block">{{ $t('common.specialNotes') }}</span>
            <p class="text-sm text-gray-700 mt-0.5">{{ order.specialNotes }}</p>
          </template>
        </InfoGridCard>

        <!-- Items -->
        <div class="space-y-2">
          <DataTable :title="$t('client.items')" :headers="itemHeaders" :items="orderItemRows" row-key="code" min-width="700px">
            <template #cell-code="{ value }">
              <span class="text-gray-500 font-mono text-xs">{{ value }}</span>
            </template>
            <template #cell-name="{ value }">
              <span class="text-gray-800">{{ value }}</span>
            </template>
            <template #cell-qty="{ value }">
              <span class="text-gray-700">{{ value }}</span>
            </template>
            <template #cell-qtyGood="{ value }">
              <span :class="value != null ? 'text-green-600 font-medium' : 'text-gray-300'">
                {{ value ?? '—' }}
              </span>
            </template>
            <template #cell-qtyBad="{ value }">
              <span :class="value != null && value > 0 ? 'text-red-500 font-medium' : value != null ? 'text-gray-400' : 'text-gray-300'">
                {{ value ?? '—' }}
              </span>
            </template>
            <template #cell-qtyStained="{ value }">
              <span :class="value != null && value > 0 ? 'text-orange-500 font-medium' : value != null ? 'text-gray-400' : 'text-gray-300'">
                {{ value ?? '—' }}
              </span>
            </template>
            <template #cell-unitPrice="{ value }">
              <span class="text-gray-500">{{ formatCurrency(value) }}</span>
            </template>
            <template #cell-lineTotal="{ value }">
              <span class="font-medium text-gray-800">{{ formatCurrency(value) }}</span>
            </template>
          </DataTable>

          <div class="bg-gray-50 rounded-lg px-5 py-3 text-sm space-y-1">
            <div class="flex justify-end gap-4">
              <span class="text-gray-600 font-medium">{{ $t('orderDetail.vatAmount') }}</span>
              <span class="text-gray-800 font-medium">{{ formatCurrency(order.vatAmount) }}</span>
            </div>
            <div class="flex justify-end gap-4 font-semibold">
              <span class="text-gray-600">{{ $t('orderDetail.orderTotal') }}</span>
              <span class="text-gray-800">{{ formatCurrency(order.total) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Right column: timeline -->
      <div class="space-y-6">
        <div class="bg-white rounded-xl shadow-sm p-5">
          <h3 class="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">{{ $t('orderDetail.statusTimeline') }}</h3>
          <OrderTimeline :steps="order.timeline" :currentStatus="order.status" />
        </div>
      </div>
    </div>

    <div v-else-if="loading" class="bg-white rounded-xl shadow-sm p-10 text-center">
      <p class="text-gray-400">{{ $t('orderDetail.loadingOrder') }}</p>
    </div>
    <div v-else class="bg-white rounded-xl shadow-sm p-10 text-center">
      <p class="text-gray-400">{{ $t('orderDetail.orderNotFound') }}</p>
    </div>
  </div>

  <!-- Edit Order Modal -->
  <EditOrderModal
    :show="showEditModal"
    :order="order"
    :is-admin-or-staff="isAdminOrStaff"
    @close="showEditModal = false"
    @success="handleOrderUpdated"
  />

  <!-- Cancel Order Modal -->
  <CancelOrderModal
    :show="showCancelModal"
    :order="order"
    @close="showCancelModal = false"
    @success="loadOrder"
  />
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import StatusBadge from '../../ui/StatusBadge.vue'
import TitleHeader from '../../ui/TitleHeader.vue'
import OrderTimeline from '../../ui/OrderTimeline.vue'
import AppButton from '../../ui/AppButton.vue'
import DataTable from '../../ui/DataTable.vue'
import CancelOrderModal from '../../ui/CancelOrderModal.vue'
import EditOrderModal from '../../ui/EditOrderModal.vue'
import InfoGridCard from '../../ui/InfoGridCard.vue'
import { useNavStore } from '../../../stores/nav.js'
import { useAuthStore } from '../../../stores/auth.js'
import { useUiStore } from '../../../stores/ui.js'
import { fetchOrderById } from '../../../api/orders'
import { mapOrderForDetail } from '@/utils/orderMappers'
import { fetchClientById } from '../../../api/clients'
import { generateOrderPdf } from '../../../utils/generateOrderPdf.js'
import { isCancelableStatus, isEditableStatus } from '../../../utils/orderFlow'
import { formatCurrency } from '@/utils/pricing'

const { t } = useI18n()
const navStore = useNavStore()
const authStore = useAuthStore()
const uiStore = useUiStore()

const order = ref(null)
const loading = ref(true)
const generatingPdf = ref(false)

const showCancelModal = ref(false)
const showEditModal = ref(false)

const isAdmin = computed(() => authStore.isAdmin)
const isAdminOrStaff = computed(() => authStore.isInternal)

const canEditOrder = computed(() => {
  if (!order.value) return false
  if (order.value.isInvoiced) return false
  return isEditableStatus(order.value.status)
})

const cannotEditTooltip = computed(() => {
  if (order.value?.isInvoiced) return t('orderDetail.cannotEditInvoicedOrder')
  if (!isEditableStatus(order.value?.status)) return t('orderDetail.cannotEditReceivedOrder')
  return ''
})

const orderInfoItems = computed(() => {
  if (!order.value) return []
  return [
    { label: t('common.client'), value: order.value.client },
    { label: t('orderDetail.serviceType'), value: order.value.serviceType },
    { label: t('orderDetail.pickupAddress'), value: order.value.pickupAddress },
    {
      label: t('orderDetail.pickupDate'),
      value: `${order.value.pickupDate} · ${order.value.pickupTimeWindow}`,
    },
    { label: t('orderDetail.estimatedBags'), value: order.value.estimatedBags },
    { label: t('orderDetail.actualBags'), value: order.value.actualBags ?? '—' },
    {
      label: t('orderDetail.pickupDriver'),
      value: order.value.driverPickup,
      show: Boolean(order.value.driverPickup),
    },
    {
      label: t('orderDetail.deliveryDriver'),
      value: order.value.driverDelivery,
      show: Boolean(order.value.driverDelivery),
    },
  ]
})

async function downloadPdf() {
  if (!order.value || generatingPdf.value) return
  generatingPdf.value = true
  try {
    generateOrderPdf(order.value, t)
  } finally {
    generatingPdf.value = false
  }
}

function handleOrderUpdated(updated) {
  order.value = mapOrderForDetail(updated)
}

const itemHeaders = computed(() => {
  const base = [
    { key: 'code', label: t('orderDetail.itemCode') },
    { key: 'name', label: t('orderDetail.itemName') },
    { key: 'qty', label: t('orderDetail.quantity'), tdClass: 'text-right', thClass: 'text-right' },
    { key: 'unitPrice', label: t('orderDetail.unitPrice'), tdClass: 'text-right', thClass: 'text-right' },
    { key: 'lineTotal', label: t('orderDetail.lineTotal'), tdClass: 'text-right', thClass: 'text-right' },
  ]
  // Condition breakdown only for internal roles (staff, admin, operator)
  if (isAdminOrStaff.value) {
    base.splice(3, 0,
      { key: 'qtyGood',    label: t('orderDetail.qtyGood'),    tdClass: 'text-center', thClass: 'text-center' },
      { key: 'qtyBad',     label: t('orderDetail.qtyBad'),     tdClass: 'text-center', thClass: 'text-center' },
      { key: 'qtyStained', label: t('orderDetail.qtyStained'), tdClass: 'text-center', thClass: 'text-center' },
    )
  }
  return base
})

const orderItemRows = computed(() =>
  (order.value?.items ?? []).map(item => ({
    ...item,
    lineTotal: (item.qty || 0) * (item.unitPrice || 0),
  }))
)

async function loadOrder() {
  const id = navStore.selectedId
  if (!id) return
  loading.value = true
  try {
    const data = await fetchOrderById(id)
    const mapped = mapOrderForDetail(data)

    // If client name is missing but we have a clientId, fetch client info
    if (!mapped.client && mapped.clientId) {
      try {
        const clientData = await fetchClientById(mapped.clientId)
        mapped.client = clientData.name ?? ''
        if (!mapped.pickupAddress) {
          const prop = clientData.properties?.[0]
          mapped.pickupAddress = prop?.address
            ? `${prop.address}, ${prop.city ?? ''}`
            : clientData.billing_address ?? clientData.address ?? ''
          mapped.deliveryAddress = mapped.pickupAddress
        }
      } catch { /* client fetch failed, leave empty */ }
    }

    order.value = mapped
  } catch (err) {
    order.value = null
    uiStore.showError(err?.message || t('orderDetail.orderNotFound'))
  } finally {
    loading.value = false
  }
}

onMounted(loadOrder)
watch(() => navStore.selectedId, loadOrder)
</script>
