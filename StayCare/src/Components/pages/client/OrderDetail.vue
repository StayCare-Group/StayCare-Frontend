<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center gap-3">
      <button @click="navStore.goBack('orders')" class="text-white hover:text-gray-400">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
      </button>
      <h2 class="text-lg font-semibold text-white">{{ order?.id }}</h2>
      <StatusBadge v-if="order" :status="order.status" />
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
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import StatusBadge from '../../ui/StatusBadge.vue'
import OrderTimeline from '../../ui/OrderTimeline.vue'
import { useNavStore } from '../../../stores/nav.js'
import { fetchOrderById, mapOrderForDetail } from '../../../api/orders'
import { fetchClientById } from '../../../api/clients'

const navStore = useNavStore()

const order = ref(null)
const loading = ref(true)

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
