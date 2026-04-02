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
        <button
          @click.stop="navStore.goToDetail('order-detail', item._id)"
          class="text-brand-700 hover:underline text-sm font-medium"
        >{{ $t('common.viewDetails') }}</button>
      </template>
    </DataTable>
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
import { fetchOrders, mapOrderForList } from '../../../api/orders'
import { fetchMe } from '../../../api/users'
import { isClientProfileCompleteForOrder } from '../../../utils/orderEligibility'

const { t } = useI18n()
const navStore = useNavStore()
const auth = useAuthStore()

const isAdmin = computed(() => auth.user?.role === 'admin')
const isClient = computed(() => auth.user?.role === 'client')

const orders = ref([])
const loading = ref(true)
const canCreateOrder = ref(false)

onMounted(async () => {
  try {
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
})

const filters = ['All', 'Pending Pickup', 'In Progress', 'Ready for Delivery', 'Delivered']
const activeFilter = ref('All')

const filteredOrders = computed(() => {
  if (activeFilter.value === 'All') return orders.value
  if (activeFilter.value === 'In Progress') {
    return orders.value.filter(o =>
      !['Pending Pickup', 'Ready for Delivery', 'Out for Delivery', 'Delivered'].includes(o.status)
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
