<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center gap-3">
      <button @click="navStore.goBack('orders')" class="text-white hover:text-gray-400">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
      </button>
      <h2 class="text-lg font-semibold text-white">{{ order?.id }}</h2>
      <StatusBadge v-if="order" :status="order.status" />
      <!-- Reschedule button for Pending Pickup orders -->
      <button
        v-if="order && canReschedule"
        @click="showRescheduleModal = true"
        class="ml-auto bg-[#FF56B0] text-white font-bold py-1.5 px-4 rounded-lg shadow-[0_3px_0_#E63E8A] hover:opacity-90 transition text-sm"
      >{{ $t('common.reschedule') }}</button>
    </div>

    <div v-if="order" class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Left column: details + items -->
      <div class="lg:col-span-2 space-y-6">
        <!-- Order Info -->
        <div class="bg-white rounded-xl shadow-sm p-5 space-y-3">
          <h3 class="text-sm font-semibold text-gray-700 uppercase tracking-wide">Order Information</h3>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div><span class="text-gray-400">Client</span><p class="font-medium text-gray-800">{{ order.client }}</p></div>
            <div><span class="text-gray-400">Service Type</span><p class="font-medium text-gray-800">{{ order.serviceType }}</p></div>
            <div><span class="text-gray-400">Pickup Address</span><p class="font-medium text-gray-800">{{ order.pickupAddress }}</p></div>
            <div><span class="text-gray-400">Pickup Date</span><p class="font-medium text-gray-800">{{ order.pickupDate }} &middot; {{ order.pickupTimeWindow }}</p></div>
            <div><span class="text-gray-400">Estimated Bags</span><p class="font-medium text-gray-800">{{ order.estimatedBags }}</p></div>
            <div><span class="text-gray-400">Actual Bags</span><p class="font-medium text-gray-800">{{ order.actualBags ?? '—' }}</p></div>
            <div v-if="order.driverPickup"><span class="text-gray-400">Pickup Driver</span><p class="font-medium text-gray-800">{{ order.driverPickup }}</p></div>
            <div v-if="order.driverDelivery"><span class="text-gray-400">Delivery Driver</span><p class="font-medium text-gray-800">{{ order.driverDelivery }}</p></div>
          </div>
          <div v-if="order.specialNotes" class="pt-2 border-t border-gray-100">
            <span class="text-xs text-gray-400">Special Notes</span>
            <p class="text-sm text-gray-700 mt-0.5">{{ order.specialNotes }}</p>
          </div>
        </div>

        <!-- Items -->
        <div class="bg-white rounded-xl shadow-sm overflow-hidden">
          <div class="px-5 py-4 border-b border-gray-100">
            <h3 class="text-sm font-semibold text-gray-700 uppercase tracking-wide">Items</h3>
          </div>
          <table class="w-full text-sm">
            <thead class="bg-gray-50 text-gray-500 text-xs uppercase">
              <tr>
                <th class="px-5 py-2 text-left font-medium">Code</th>
                <th class="px-5 py-2 text-left font-medium">Item</th>
                <th class="px-5 py-2 text-right font-medium">Qty</th>
                <th class="px-5 py-2 text-right font-medium">Unit Price</th>
                <th class="px-5 py-2 text-right font-medium">Total</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr v-for="item in order.items" :key="item.code">
                <td class="px-5 py-2 text-gray-500 font-mono text-xs">{{ item.code }}</td>
                <td class="px-5 py-2 text-gray-800">{{ item.name }}</td>
                <td class="px-5 py-2 text-right text-gray-700">{{ item.qty }}</td>
                <td class="px-5 py-2 text-right text-gray-500">&euro;{{ item.unitPrice.toFixed(2) }}</td>
                <td class="px-5 py-2 text-right font-medium text-gray-800">&euro;{{ (item.qty * item.unitPrice).toFixed(2) }}</td>
              </tr>
            </tbody>
            <tfoot>
              <tr class="bg-gray-50 font-semibold text-sm">
                <td colspan="4" class="px-5 py-3 text-right text-gray-600">Order Total</td>
                <td class="px-5 py-3 text-right text-gray-800">&euro;{{ order.total.toFixed(2) }}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <!-- Right column: timeline -->
      <div class="space-y-6">
        <div class="bg-white rounded-xl shadow-sm p-5">
          <h3 class="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">Status Timeline</h3>
          <OrderTimeline :steps="order.timeline" :currentStatus="order.status" />
        </div>
      </div>
    </div>

    <div v-else-if="loading" class="bg-white rounded-xl shadow-sm p-10 text-center">
      <p class="text-gray-400">Loading order...</p>
    </div>
    <div v-else class="bg-white rounded-xl shadow-sm p-10 text-center">
      <p class="text-gray-400">Order not found.</p>
    </div>

    <!-- Reschedule Modal -->
    <div v-if="showRescheduleModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40" @click.self="showRescheduleModal = false">
      <div class="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
        <h3 class="text-lg font-semibold text-gray-800 mb-4">{{ $t('client.rescheduleOrder') }}</h3>

        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-600 mb-1">{{ $t('client.newPickupDate') }}</label>
            <input v-model="rescheduleForm.pickupDate" type="date" :min="todayStr" required
              class="w-full border-2 border-gray-300 bg-gray-50 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-[#FF56B0] focus:ring-2 focus:ring-[#FF56B0]/40" />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-600 mb-1">{{ $t('client.newTimeWindow') }}</label>
            <select v-model="rescheduleForm.pickupTimeWindow" required
              class="w-full border-2 border-gray-300 bg-gray-50 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-[#FF56B0] focus:ring-2 focus:ring-[#FF56B0]/40">
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
          <button @click="handleReschedule" :disabled="rescheduling"
            class="flex-1 py-2 bg-[#FF56B0] text-white rounded-lg text-sm font-semibold shadow-[0_3px_0_#E63E8A] hover:bg-[#00F5F3] hover:shadow-[inset_0_2px_6px_rgba(0,140,140,0.7)] transition duration-300 disabled:opacity-50">
            {{ rescheduling ? $t('common.saving') : $t('common.reschedule') }}
          </button>
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
import StatusBadge from '../../ui/StatusBadge.vue'
import OrderTimeline from '../../ui/OrderTimeline.vue'
import { useNavStore } from '../../../stores/nav.js'
import { useAuthStore } from '../../../stores/auth.js'
import { fetchOrderById, mapOrderForDetail, rescheduleOrder } from '../../../api/orders'
import { fetchClientById } from '../../../api/clients'

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
    rescheduleError.value = 'Please select a date and time window.'
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
    rescheduleError.value = err?.message || 'Failed to reschedule order.'
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
