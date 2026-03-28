<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center gap-3">
      <button @click="navStore.goBack('orders')" class="text-brand-700 hover:text-gray-400">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
      </button>
      <h2 class="text-lg font-semibold text-brand-700">{{ order?.id }}</h2>
      <StatusBadge v-if="order" :status="order.status" />
      <!-- Reschedule button for Pending Pickup orders -->
      <AppButton
        v-if="order && canReschedule"
        @click="showRescheduleModal = true"
        class="ml-auto"
      >{{ $t('common.reschedule') }}</AppButton>
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

          <div class="bg-gray-50 rounded-lg px-5 py-3 font-semibold text-sm flex justify-end gap-4">
            <span class="text-gray-600">{{ $t('orderDetail.orderTotal') }}</span>
            <span class="text-gray-800">&euro;{{ order.total.toFixed(2) }}</span>
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

    <!-- Reschedule Modal -->
    <div v-if="showRescheduleModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40" @click.self="showRescheduleModal = false">
      <div class="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
        <h3 class="text-lg font-semibold text-gray-800 mb-4">{{ $t('client.rescheduleOrder') }}</h3>

        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-600 mb-1">{{ $t('client.newPickupDate') }}</label>
            <input v-model="rescheduleForm.pickupDate" type="date" :min="todayStr" required
              class="w-full border-2 border-gray-300 bg-gray-50 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-400/40" />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-600 mb-1">{{ $t('client.newTimeWindow') }}</label>
            <select v-model="rescheduleForm.pickupTimeWindow" required
              class="w-full border-2 border-gray-300 bg-gray-50 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-400/40">
              <option value="">{{ $t('admin.selectTimeWindow') }}</option>
              <option v-for="tw in rescheduleTimeWindows" :key="tw" :value="tw">{{ tw }}</option>
            </select>
            <p v-if="!rescheduleTimeWindows.length" class="text-xs text-amber-500 mt-1">{{ $t('admin.noTimeWindows') }}</p>
          </div>
        </div>

        <p v-if="rescheduleError" class="text-red-500 text-sm mt-3">{{ rescheduleError }}</p>

        <div class="flex gap-3 mt-6">
          <button @click="showRescheduleModal = false"
            class="flex-1 py-2 border-2 border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition">
            {{ $t('common.cancel') }}
          </button>
          <AppButton @click="handleReschedule" class="flex-1" :loading="rescheduling">
            {{ $t('common.reschedule') }}
          </AppButton>
        </div>
      </div>
    </div>

    <!-- Success toast -->
    <div v-if="rescheduleSuccess" class="fixed bottom-6 right-6 bg-green-600 text-white px-5 py-3 rounded-lg shadow-lg text-sm font-medium z-50">
      {{ $t('client.rescheduleSuccess') }}
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import StatusBadge from '../../ui/StatusBadge.vue'
import OrderTimeline from '../../ui/OrderTimeline.vue'
import AppButton from '../../ui/AppButton.vue'
import DataTable from '../../ui/DataTable.vue'
import { useNavStore } from '../../../stores/nav.js'
import { useAuthStore } from '../../../stores/auth.js'
import { fetchOrderById, mapOrderForDetail, rescheduleOrder } from '../../../api/orders'
import { fetchClientById } from '../../../api/clients'

const { t } = useI18n()
const navStore = useNavStore()
const authStore = useAuthStore()

const order = ref(null)
const loading = ref(true)

const ALL_TIME_WINDOWS = ['08:00 - 10:00', '09:00 - 11:00', '10:00 - 12:00', '13:00 - 15:00', '14:00 - 16:00', '15:00 - 17:00']
const _now = new Date()
const todayStr = `${_now.getFullYear()}-${String(_now.getMonth()+1).padStart(2,'0')}-${String(_now.getDate()).padStart(2,'0')}`

// Reschedule is available for Pending Pickup orders (both clients and admins)
const canReschedule = computed(() => {
  if (!order.value) return false
  const role = authStore.user?.role
  const status = order.value.status
  return (role === 'admin' || role === 'Client') && status === 'Pending Pickup'
})

// Reschedule modal state
const showRescheduleModal = ref(false)
const rescheduleForm = reactive({ pickupDate: '', pickupTimeWindow: '' })
const rescheduleError = ref('')
const rescheduling = ref(false)
const rescheduleSuccess = ref(false)

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

const rescheduleTimeWindows = computed(() => {
  if (rescheduleForm.pickupDate && rescheduleForm.pickupDate !== todayStr) return ALL_TIME_WINDOWS
  const now = new Date()
  const nowMinutes = now.getHours() * 60 + now.getMinutes()
  return ALL_TIME_WINDOWS.filter(tw => {
    const [startStr] = tw.split(' - ')
    const [h, m] = startStr.split(':').map(Number)
    return (h * 60 + m + 30) > nowMinutes
  })
})

watch(() => rescheduleForm.pickupDate, () => {
  if (rescheduleForm.pickupTimeWindow && !rescheduleTimeWindows.value.includes(rescheduleForm.pickupTimeWindow)) {
    rescheduleForm.pickupTimeWindow = ''
  }
})

function parseTimeWindow(tw, date) {
  const [start, end] = tw.split(' - ')
  return {
    start_time: new Date(`${date}T${start}:00`).toISOString(),
    end_time: new Date(`${date}T${end}:00`).toISOString(),
  }
}

async function handleReschedule() {
  if (!rescheduleForm.pickupDate || !rescheduleForm.pickupTimeWindow) {
    rescheduleError.value = t('orderDetail.selectDateAndWindow')
    return
  }
  rescheduling.value = true
  rescheduleError.value = ''
  try {
    await rescheduleOrder(order.value._id, {
      pickup_date: rescheduleForm.pickupDate,
      pickup_window: parseTimeWindow(rescheduleForm.pickupTimeWindow, rescheduleForm.pickupDate),
    })
    showRescheduleModal.value = false
    rescheduleSuccess.value = true
    setTimeout(() => { rescheduleSuccess.value = false }, 2000)
    await loadOrder() // Refresh order data
  } catch (err) {
    rescheduleError.value = err?.message || t('orderDetail.rescheduleFailed')
  } finally {
    rescheduling.value = false
  }
}

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
        mapped.client = clientData.company_name ?? clientData.name ?? ''
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
