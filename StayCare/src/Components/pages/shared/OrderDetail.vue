<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center gap-3">
      <button @click="navStore.goBack('orders')" class="text-brand-700 hover:text-gray-400">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
      </button>
      <h2 class="text-lg font-semibold text-brand-700">{{ order?.id }}</h2>
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
    </div>

    <div v-if="order" class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Left column: details + items -->
      <div class="lg:col-span-2 space-y-6">
        <!-- Order Info -->
        <div class="bg-white rounded-xl shadow-sm p-5 space-y-3">
          <h3 class="text-sm font-semibold text-gray-700 uppercase tracking-wide">{{ $t('orderDetail.orderInformation') }}</h3>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div><span class="text-gray-400">{{ $t('common.client') }}</span><p class="font-medium text-gray-800">{{ order.client }}</p></div>
            <div><span class="text-gray-400">{{ $t('orderDetail.serviceType') }}</span><p class="font-medium text-gray-800">{{ order.serviceType }}</p></div>
            <div><span class="text-gray-400">{{ $t('orderDetail.pickupAddress') }}</span><p class="font-medium text-gray-800">{{ order.pickupAddress }}</p></div>
            <div><span class="text-gray-400">{{ $t('orderDetail.pickupDate') }}</span><p class="font-medium text-gray-800">{{ order.pickupDate }} &middot; {{ order.pickupTimeWindow }}</p></div>
            <div><span class="text-gray-400">{{ $t('orderDetail.estimatedBags') }}</span><p class="font-medium text-gray-800">{{ order.estimatedBags }}</p></div>
            <div><span class="text-gray-400">{{ $t('orderDetail.actualBags') }}</span><p class="font-medium text-gray-800">{{ order.actualBags ?? '—' }}</p></div>
            <div v-if="order.driverPickup"><span class="text-gray-400">{{ $t('orderDetail.pickupDriver') }}</span><p class="font-medium text-gray-800">{{ order.driverPickup }}</p></div>
            <div v-if="order.driverDelivery"><span class="text-gray-400">{{ $t('orderDetail.deliveryDriver') }}</span><p class="font-medium text-gray-800">{{ order.driverDelivery }}</p></div>
          </div>
          <div v-if="order.specialNotes" class="pt-2 border-t border-gray-100">
            <span class="text-xs text-gray-400">{{ $t('client.specialNotes') }}</span>
            <p class="text-sm text-gray-700 mt-0.5">{{ order.specialNotes }}</p>
          </div>
        </div>

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
            <template #cell-unitPrice="{ value }">
              <span class="text-gray-500">&euro;{{ value.toFixed(2) }}</span>
            </template>
            <template #cell-lineTotal="{ value }">
              <span class="font-medium text-gray-800">&euro;{{ value.toFixed(2) }}</span>
            </template>
          </DataTable>

          <div class="bg-gray-50 rounded-lg px-5 py-3 text-sm space-y-1">
            <div class="flex justify-end gap-4">
              <span class="text-gray-600 font-medium">{{ $t('orderDetail.vatAmount') }}</span>
              <span class="text-gray-800 font-medium">&euro;{{ (order.vatAmount ?? 0).toFixed(2) }}</span>
            </div>
            <div class="flex justify-end gap-4 font-semibold">
              <span class="text-gray-600">{{ $t('orderDetail.orderTotal') }}</span>
              <span class="text-gray-800">&euro;{{ order.total.toFixed(2) }}</span>
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
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import StatusBadge from '../../ui/StatusBadge.vue'
import OrderTimeline from '../../ui/OrderTimeline.vue'
import AppButton from '../../ui/AppButton.vue'
import DataTable from '../../ui/DataTable.vue'
import { useNavStore } from '../../../stores/nav.js'
import { fetchOrderById, mapOrderForDetail } from '../../../api/orders'
import { fetchClientById } from '../../../api/clients'
import { generateOrderPdf } from '../../../utils/generateOrderPdf.js'

const { t } = useI18n()
const navStore = useNavStore()

const order = ref(null)
const loading = ref(true)
const generatingPdf = ref(false)

async function downloadPdf() {
  if (!order.value || generatingPdf.value) return
  generatingPdf.value = true
  try {
    generateOrderPdf(order.value, t)
  } finally {
    generatingPdf.value = false
  }
}

const itemHeaders = computed(() => [
  { key: 'code', label: t('orderDetail.itemCode') },
  { key: 'name', label: t('orderDetail.itemName') },
  { key: 'qty', label: t('orderDetail.quantity'), tdClass: 'text-right', thClass: 'text-right' },
  { key: 'unitPrice', label: t('orderDetail.unitPrice'), tdClass: 'text-right', thClass: 'text-right' },
  { key: 'lineTotal', label: t('orderDetail.lineTotal'), tdClass: 'text-right', thClass: 'text-right' },
])

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
  } catch {
    order.value = null
  } finally {
    loading.value = false
  }
}

onMounted(loadOrder)
watch(() => navStore.selectedId, loadOrder)
</script>
