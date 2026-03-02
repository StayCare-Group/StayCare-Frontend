<template>
  <div class="space-y-6">
    <h2 class="text-lg font-semibold text-white">Processing Board</h2>

    <!-- Kanban Board -->
    <div class="flex gap-3 overflow-x-auto pb-4 -mx-1 px-1">
      <div
        v-for="col in columns" :key="col.status"
        class="min-w-[240px] flex-shrink-0 bg-gray-50 rounded-xl p-3"
      >
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-xs font-semibold text-gray-600 uppercase tracking-wide">{{ col.status }}</h3>
          <span class="text-xs text-gray-400 bg-white px-2 py-0.5 rounded-full">{{ col.orders.length }}</span>
        </div>
        <div class="space-y-2">
          <div
            v-for="order in col.orders" :key="order.id"
            class="bg-white rounded-lg p-3 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
          >
            <div class="flex items-center justify-between mb-1">
              <span class="text-xs font-bold text-gray-800">{{ order.id }}</span>
              <span class="text-xs px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 font-medium">{{ order.serviceType }}</span>
            </div>
            <p class="text-xs text-gray-600">{{ order.client }}</p>
            <div class="mt-2 text-xs text-gray-400">
              <span v-for="item in order.items.slice(0, 3)" :key="item.code" class="mr-1">
                {{ item.code }}&times;{{ item.qty }}
              </span>
              <span v-if="order.items.length > 3" class="text-gray-300">+{{ order.items.length - 3 }} more</span>
            </div>
            <div v-if="col.assignable" class="mt-2">
              <select class="w-full border border-gray-200 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-[#FF56B0] outline-none">
                <option value="">Assign machine...</option>
                <option v-for="m in availableMachines(col.status)" :key="m.machine" :value="m.machine">{{ m.machine }} ({{ m.capacity }})</option>
              </select>
            </div>
          </div>
          <div v-if="col.orders.length === 0" class="text-xs text-gray-300 text-center py-4">No orders</div>
        </div>
      </div>
    </div>

    <!-- Machine Status -->
    <div class="bg-white rounded-xl shadow-sm overflow-hidden">
      <div class="px-5 py-4 border-b border-gray-100">
        <h3 class="text-sm font-semibold text-gray-700">Machine Status</h3>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-sm text-left min-w-[600px]">
          <thead class="bg-gray-50 text-gray-500 uppercase text-xs">
            <tr>
              <th class="px-5 py-2 font-medium">Machine</th>
              <th class="px-5 py-2 font-medium">Type</th>
              <th class="px-5 py-2 font-medium">Capacity</th>
              <th class="px-5 py-2 font-medium">Status</th>
              <th class="px-5 py-2 font-medium">Current Order</th>
              <th class="px-5 py-2 font-medium">ETA</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-for="m in machines" :key="m.machine" class="hover:bg-gray-50">
              <td class="px-5 py-2 font-medium text-gray-800">{{ m.machine }}</td>
              <td class="px-5 py-2 text-gray-500">{{ m.type }}</td>
              <td class="px-5 py-2 text-gray-500">{{ m.capacity }}</td>
              <td class="px-5 py-2"><StatusBadge :status="m.status" /></td>
              <td class="px-5 py-2 text-gray-700">{{ m.currentOrder || '—' }}</td>
              <td class="px-5 py-2 text-gray-500">{{ m.eta || '—' }}</td>
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
import { fetchOrders, mapOrderForList } from '../../../api/orders'
import { fetchMachineStatus } from '../../../api/facility'

const allOrders = ref([])
const machines = ref([])
const loading = ref(true)

onMounted(async () => {
  try {
    const [ordersData, machinesData] = await Promise.all([
      fetchOrders().catch(() => []),
      fetchMachineStatus().catch(() => []),
    ])

    allOrders.value = (ordersData ?? []).map(raw => {
      const mapped = mapOrderForList(raw)
      mapped.items = (raw.items ?? []).map(i => ({
        code: i.item_code,
        name: i.name,
        qty: i.quantity ?? 0,
      }))
      mapped.serviceType = raw.service_type === 'express' ? 'Express (24h)' : 'Standard (48h)'
      return mapped
    })

    machines.value = machinesData ?? []
  } catch {
    allOrders.value = []
    machines.value = []
  } finally {
    loading.value = false
  }
})

const processingStatuses = ['Received at Facility', 'Sorting', 'Washing', 'Drying', 'Ironing', 'Quality Control']

const columns = computed(() =>
  processingStatuses.map(status => ({
    status,
    orders: allOrders.value.filter(o => o.status === status),
    assignable: ['Washing', 'Drying', 'Ironing'].includes(status),
  }))
)

function availableMachines(status) {
  const typeMap = {
    Washing: 'Industrial Washer',
    Drying: 'Industrial Dryer',
    Ironing: 'Steam Iron',
  }
  const type = typeMap[status]
  if (!type) return []
  return machines.value.filter(m => m.type === type && m.status === 'Available')
}
</script>
