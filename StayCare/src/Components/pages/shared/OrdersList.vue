<template>
  <div class="space-y-6">
    <!-- Header with action buttons -->
    <div class="flex items-center justify-between gap-4">
      <h2 class="text-lg font-semibold text-brand-700">{{ $t('client.allOrders') }}</h2>
      <div class="flex items-center gap-2">
        <AppButton
          variant="secondary"
          size="sm"
          @click="exportSelectedOrdersToExcel"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V3"/>
          </svg>
          {{ selectedOrderIds.length ? $t('invoices.exportExcel', { count: selectedOrderIds.length }) : $t('invoices.exportExcelAll') }}
        </AppButton>
        <AppButton :disabled="isClient && !canCreateOrder" @click="navStore.goToDetail('create-order', null)">{{ $t('client.newOrder') }}</AppButton>
      </div>
    </div>
    <p v-if="isClient && !canCreateOrder" class="text-sm text-amber-700">
      {{ $t('client.createOrderProfileRequired') }}
      <button type="button" class="font-semibold text-brand-700 hover:underline" @click="navStore.setPage('profile')">
        {{ $t('client.goToProfileCta') }}
      </button>
      {{ $t('client.goToProfileSuffix') }}
    </p>

    <!-- Filters & Client Select -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div class="flex flex-wrap gap-2">
        <button
          v-for="f in filters" :key="f.key"
          @click="activeFilter = f.key"
          class="px-3 py-1.5 rounded-full text-xs font-medium transition-colors"
          :class="activeFilter === f.key ? 'bg-brand-700 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'"
        >{{ f.label }}</button>
      </div>

      <!-- Client filter dropdown for admin -->
      <ClientFilterSelect
        v-if="isAdmin"
        v-model="selectedClientId"
        @change="onClientFilterChange"
      />
    </div>

    <LoadingPanel v-if="loading" :label="$t('common.loading')" />

    <!-- Orders table -->
    <DataTable v-else :headers="orderHeaders" :items="filteredOrders" min-width="700px">
      <template #header-select>
        <input
          type="checkbox"
          :checked="isAllSelected"
          @change="toggleSelectAll"
          class="rounded border-gray-300 text-brand-700 focus:ring-brand-500 cursor-pointer"
          :title="$t('invoices.selectAll')"
        />
      </template>
      <template #cell-select="{ item }">
        <input
          type="checkbox"
          :value="item._id"
          v-model="selectedOrderIds"
          @click.stop
          class="rounded border-gray-300 text-brand-700 focus:ring-brand-500 cursor-pointer"
        />
      </template>
      <template #cell-id="{ value }">
        <span class="font-medium text-gray-800">{{ value }}</span>
      </template>
      <template #cell-client="{ value }">
        <span class="text-gray-700">{{ value }}</span>
      </template>
      <template #cell-pickupDate="{ value }">
        <span class="text-gray-500">{{ value }}</span>
      </template>
      <template #cell-serviceType="{ value }">
        <span class="text-gray-500">{{ value }}</span>
      </template>
      <template #cell-bags="{ item }">
        <span class="text-gray-700">{{ item.actualBags ?? item.estimatedBags }}</span>
      </template>
      <template #cell-status="{ value }">
        <StatusBadge :status="value" />
      </template>
      <template #cell-total="{ value }">
        <span class="font-semibold text-gray-800">&euro;{{ value.toFixed(2) }}</span>
      </template>
      <template #cell-actions="{ item }">
        <div class="flex items-center gap-3">
          <button
            @click.stop="navStore.goToDetail('order-detail', item._id)"
            class="text-brand-700 hover:underline text-sm font-medium"
          >{{ $t('common.viewDetails') }}</button>
          <button
            v-if="isAdmin && isCancelableStatus(item.status)"
            @click.stop="promptCancelOrder(item)"
            class="text-red-600 hover:underline text-sm font-medium"
          >{{ $t('admin.cancelOrder') }}</button>
        </div>
      </template>
    </DataTable>

    <!-- Cancellation Confirmation Modal -->
    <CancelOrderModal
      :show="Boolean(orderToCancel)"
      :order="orderToCancel"
      @close="orderToCancel = null"
      @success="loadOrders"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import StatusBadge from '../../ui/StatusBadge.vue'
import DataTable from '../../ui/DataTable.vue'
import AppButton from '../../ui/AppButton.vue'
import LoadingPanel from '../../ui/LoadingPanel.vue'
import CancelOrderModal from '../../ui/CancelOrderModal.vue'
import ClientFilterSelect from '../../ui/ClientFilterSelect.vue'
import { useNavStore } from '../../../stores/nav.js'
import { useAuthStore } from '../../../stores/auth.js'
import { useUiStore } from '../../../stores/ui.js'
import { fetchAllOrders, mapOrderForList } from '../../../api/orders'
import { isClientProfileCompleteForOrder } from '../../../utils/orderEligibility'
import { isCancelableStatus } from '../../../utils/orderFlow'
import { useExcelExporter } from '../../../composables/useExcelExporter.js'

const { t } = useI18n()
const navStore = useNavStore()
const auth = useAuthStore()
const uiStore = useUiStore()
const { exportOrdersDetailed } = useExcelExporter()

const isAdmin = computed(() => auth.user?.role === 'admin')
const isClient = computed(() => auth.user?.role === 'client')

const orders = ref([])
const loading = ref(true)
const canCreateOrder = ref(false)
const selectedClientId = ref('')
const selectedOrderIds = ref([])

const orderToCancel = ref(null)

const isAllSelected = computed(() => {
  if (!filteredOrders.value.length) return false
  return filteredOrders.value.every(o => selectedOrderIds.value.includes(o._id))
})

function toggleSelectAll(e) {
  if (e.target.checked) {
    const visibleIds = filteredOrders.value.map(o => o._id)
    const set = new Set([...selectedOrderIds.value, ...visibleIds])
    selectedOrderIds.value = Array.from(set)
  } else {
    const visibleSet = new Set(filteredOrders.value.map(o => o._id))
    selectedOrderIds.value = selectedOrderIds.value.filter(id => !visibleSet.has(id))
  }
}

const loadOrders = async () => {
  try {
    loading.value = true
    const params = {}
    if (auth.user?.role === 'client' && auth.user?.id) {
      params.client_id = String(auth.user.id)
    } else if (selectedClientId.value) {
      params.client_id = selectedClientId.value
    }
    const data = await fetchAllOrders(params)
    orders.value = (data ?? []).map(mapOrderForList)
    if (isClient.value) {
      canCreateOrder.value = isClientProfileCompleteForOrder(auth.user, auth.clientProfile)
    } else {
      canCreateOrder.value = true
    }
  } catch (err) {
    uiStore.showError(err?.message || t('admin.errorFetchOrders'))
  } finally {
    loading.value = false
  }
}

function onClientFilterChange() {
  loadOrders()
}

async function exportSelectedOrdersToExcel() {
  const selectedSet = new Set(selectedOrderIds.value)
  const itemsToExport = selectedSet.size
    ? filteredOrders.value.filter(o => selectedSet.has(o._id))
    : filteredOrders.value

  if (!itemsToExport.length) return
  await exportOrdersDetailed(itemsToExport)
}

onMounted(loadOrders)

const promptCancelOrder = (item) => {
  orderToCancel.value = item
}

const filters = computed(() => [
  { key: 'all', label: t('orderFilters.all') },
  { key: 'pending', label: t('orderStatuses.pending') },
  { key: 'in_progress', label: t('orderFilters.inProgress') },
  { key: 'ready_to_delivery', label: t('orderStatuses.ready_to_delivery') },
  { key: 'delivered', label: t('orderStatuses.delivered') },
  { key: 'cancelled', label: t('orderStatuses.cancelled') },
])
const activeFilter = ref('all')

const filteredOrders = computed(() => {
  if (activeFilter.value === 'all') return orders.value
  if (activeFilter.value === 'in_progress') {
    return orders.value.filter(o =>
      !['pending', 'ready_to_delivery', 'collected', 'delivered', 'completed', 'invoiced', 'cancelled'].includes(o.status)
    )
  }
  return orders.value.filter(o => o.status === activeFilter.value)
})

const orderHeaders = computed(() => [
  { key: 'select', label: '', thClass: 'w-10 text-center', tdClass: 'text-center' },
  { key: 'id', label: t('client.orderId') },
  { key: 'client', label: t('common.client') },
  { key: 'pickupDate', label: t('client.date') },
  { key: 'serviceType', label: t('client.service') },
  { key: 'bags', label: t('client.bagsLabel') },
  { key: 'status', label: t('common.status') },
  { key: 'total', label: t('client.total') },
  { key: 'actions', label: t('admin.actions') },
])
</script>
