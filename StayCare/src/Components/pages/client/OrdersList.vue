<template>
  <div class="space-y-6">
    <!-- Header with back button -->
    <div class="flex items-center justify-between">
      <h2 class="text-lg font-semibold text-white">All Orders</h2>
      <button
        v-if="!isAdmin"
        @click="navStore.goToDetail('create-order', null)"
        class="bg-[#FF56B0] text-white font-bold py-2 px-5 rounded-lg shadow-[0_4px_0_#E63E8A] hover:opacity-90 transition text-sm"
      >+ New Order</button>
    </div>

    <!-- Filters -->
    <div class="flex flex-wrap gap-2">
      <button
        v-for="f in filters" :key="f"
        @click="activeFilter = f"
        class="px-3 py-1.5 rounded-full text-xs font-medium transition-colors"
        :class="activeFilter === f ? 'bg-[#FF56B0] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'"
      >{{ f }}</button>
    </div>

    <!-- Orders table -->
    <div class="bg-white rounded-xl shadow-sm overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-sm text-left min-w-[700px]">
          <thead class="bg-gray-50 text-gray-500 uppercase text-xs">
            <tr>
              <th class="px-5 py-3 font-medium">Order ID</th>
              <th class="px-5 py-3 font-medium">Client</th>
              <th class="px-5 py-3 font-medium">Date</th>
              <th class="px-5 py-3 font-medium">Service</th>
              <th class="px-5 py-3 font-medium">Bags</th>
              <th class="px-5 py-3 font-medium">Status</th>
              <th class="px-5 py-3 font-medium">Total</th>
              <th class="px-5 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-for="order in filteredOrders" :key="order.id" class="hover:bg-gray-50 transition-colors">
              <td class="px-5 py-3 font-medium text-gray-800">{{ order.id }}</td>
              <td class="px-5 py-3 text-gray-700">{{ order.client }}</td>
              <td class="px-5 py-3 text-gray-500">{{ order.pickupDate }}</td>
              <td class="px-5 py-3 text-gray-500">{{ order.serviceType }}</td>
              <td class="px-5 py-3 text-gray-700">{{ order.actualBags ?? order.estimatedBags }}</td>
              <td class="px-5 py-3"><StatusBadge :status="order.status" /></td>
              <td class="px-5 py-3 font-semibold text-gray-800">&euro;{{ order.total.toFixed(2) }}</td>
              <td class="px-5 py-3">
                <button
                  @click="navStore.goToDetail('order-detail', order._id)"
                  class="text-[#FF56B0] hover:underline text-sm font-medium"
                >View</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import StatusBadge from '../../ui/StatusBadge.vue'
import { useNavStore } from '../../../stores/nav.js'
import { useAuthStore } from '../../../stores/auth.js'
import { fetchOrders, mapOrderForList } from '../../../api/orders'

const navStore = useNavStore()
const auth = useAuthStore()

const isAdmin = computed(() => auth.user?.role === 'admin')

const orders = ref([])
const loading = ref(true)

onMounted(async () => {
  try {
    const data = await fetchOrders()
    orders.value = (data ?? []).map(mapOrderForList)
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
</script>
