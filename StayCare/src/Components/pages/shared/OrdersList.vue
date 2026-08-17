<template>
  <div class="space-y-6">
    <!-- Header with back button -->
    <div class="flex items-center justify-between gap-4">
      <h2 class="text-lg font-semibold text-brand-700">{{ $t('client.allOrders') }}</h2>
      <AppButton :disabled="isClient && !canCreateOrder" @click="navStore.goToDetail('create-order', null)">{{ $t('client.newOrder') }}</AppButton>
    </div>
    <p v-if="isClient && !canCreateOrder" class="text-sm text-amber-700">
      {{ $t('client.createOrderProfileRequired') }}
      <button type="button" class="font-semibold text-brand-700 hover:underline" @click="navStore.setPage('profile')">
        {{ $t('client.goToProfileCta') }}
      </button>
      {{ $t('client.goToProfileSuffix') }}
    </p>

    <!-- Filters -->
    <div class="flex flex-wrap gap-2">
      <button
        v-for="f in filters" :key="f.key"
        @click="activeFilter = f.key"
        class="px-3 py-1.5 rounded-full text-xs font-medium transition-colors"
        :class="activeFilter === f.key ? 'bg-brand-700 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'"
      >{{ f.label }}</button>
    </div>

    <LoadingPanel v-if="loading" :label="$t('common.loading')" />

    <!-- Orders table -->
    <DataTable v-else :headers="orderHeaders" :items="filteredOrders" min-width="700px">
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
import { useNavStore } from '../../../stores/nav.js'
import { useAuthStore } from '../../../stores/auth.js'
import { useUiStore } from '../../../stores/ui.js'
import { fetchAllOrders, mapOrderForList } from '../../../api/orders'
import { isClientProfileCompleteForOrder } from '../../../utils/orderEligibility'
import { isCancelableStatus } from '../../../utils/orderFlow'

const { t } = useI18n()
const navStore = useNavStore()
const auth = useAuthStore()
const uiStore = useUiStore()

const isAdmin = computed(() => auth.user?.role === 'admin')
const isClient = computed(() => auth.user?.role === 'client')

const orders = ref([])
const loading = ref(true)
const canCreateOrder = ref(false)

const orderToCancel = ref(null)

const loadOrders = async () => {
  try {
    loading.value = true
    const params = auth.user?.role === 'client' && auth.user?.id
      ? { client_id: String(auth.user.id) }
      : undefined
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
