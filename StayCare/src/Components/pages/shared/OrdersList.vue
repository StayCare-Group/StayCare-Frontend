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
        v-for="f in filters" :key="f"
        @click="activeFilter = f"
        class="px-3 py-1.5 rounded-full text-xs font-medium transition-colors"
        :class="activeFilter === f ? 'bg-brand-700 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'"
      >{{ f }}</button>
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
            v-if="isAdmin && (item.status === 'Pending Pickup' || item.status === 'Assigned')"
            @click.stop="promptCancelOrder(item)"
            class="text-red-600 hover:underline text-sm font-medium"
          >{{ $t('admin.cancelOrder') }}</button>
        </div>
      </template>
    </DataTable>

    <!-- Cancellation Confirmation Modal -->
    <Teleport to="body">
      <div v-if="orderToCancel" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
        <div class="bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
          <h3 class="text-base font-semibold text-gray-900">{{ $t('admin.cancelConfirmTitle') }}</h3>
          <p class="text-sm text-gray-600">
            {{ $t('admin.cancelConfirmMessage', { id: orderToCancel.id }) }}
          </p>
          <div class="flex justify-end gap-3 pt-2">
            <AppButton variant="secondary" size="sm" :disabled="cancelling" @click="orderToCancel = null">
              {{ $t('common.cancel') }}
            </AppButton>
            <AppButton variant="danger" size="sm" :loading="cancelling" @click="handleCancelOrder">
              {{ $t('admin.cancelOrder') }}
            </AppButton>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import StatusBadge from '../../ui/StatusBadge.vue'
import DataTable from '../../ui/DataTable.vue'
import AppButton from '../../ui/AppButton.vue'
import LoadingPanel from '../../ui/LoadingPanel.vue'
import { useNavStore } from '../../../stores/nav.js'
import { useAuthStore } from '../../../stores/auth.js'
import { useUiStore } from '../../../stores/ui.js'
import { fetchOrders, deleteOrder, mapOrderForList } from '../../../api/orders'
import { fetchMe } from '../../../api/users'
import { isClientProfileCompleteForOrder } from '../../../utils/orderEligibility'

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
const cancelling = ref(false)

const loadOrders = async () => {
  try {
    loading.value = true
    const params = auth.user?.role === 'client' && auth.user?.id
      ? { client_id: String(auth.user.id) }
      : undefined
    const [data, meData] = await Promise.all([
      fetchOrders(params),
      isClient.value ? fetchMe().catch(() => null) : Promise.resolve(null),
    ])
    orders.value = (data ?? []).map(mapOrderForList)
    if (isClient.value) {
      canCreateOrder.value = isClientProfileCompleteForOrder(meData)
    } else {
      canCreateOrder.value = true
    }
  } catch { /* stays empty */ } finally {
    loading.value = false
  }
}

onMounted(loadOrders)

const promptCancelOrder = (item) => {
  orderToCancel.value = item
}

const handleCancelOrder = async () => {
  if (!orderToCancel.value) return
  try {
    cancelling.value = true
    await deleteOrder(orderToCancel.value._id)
    uiStore.showSuccess(t('admin.cancelSuccess'))
    orderToCancel.value = null
    await loadOrders()
  } catch (err) {
    uiStore.showError(err?.message || t('admin.cancelError'))
  } finally {
    cancelling.value = false
  }
}

const filters = ['All', 'Pending Pickup', 'In Progress', 'Ready for Delivery', 'Delivered', 'Cancelled']
const activeFilter = ref('All')

const filteredOrders = computed(() => {
  if (activeFilter.value === 'All') return orders.value
  if (activeFilter.value === 'In Progress') {
    return orders.value.filter(o =>
      !['Pending Pickup', 'Ready for Delivery', 'Out for Delivery', 'Delivered', 'Cancelled'].includes(o.status)
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
