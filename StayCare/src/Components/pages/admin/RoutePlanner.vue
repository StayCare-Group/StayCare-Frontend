<template>
  <div class="space-y-6">
    <h2 class="text-lg font-semibold text-white">Route Planner</h2>

    <div class="grid grid-cols-1 xl:grid-cols-3 gap-6">
      <!-- Route form -->
      <form class="bg-white rounded-xl shadow-sm p-5 space-y-4" @submit.prevent="createRoute">
        <h3 class="text-sm font-semibold text-gray-700 uppercase tracking-wide">Create Route</h3>

        <div>
          <label class="block text-sm font-medium text-gray-600 mb-1">Date</label>
          <input
            v-model="form.date"
            type="date"
            required
            class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#FF56B0] focus:border-transparent outline-none"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-600 mb-1">Driver</label>
          <select
            v-model="form.driverId"
            required
            class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#FF56B0] focus:border-transparent outline-none"
          >
            <option value="">Select driver</option>
            <option v-for="d in drivers" :key="d.id" :value="d.id">
              {{ d.name }} — {{ d.email }}
            </option>
          </select>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-600 mb-1">Area / Zone</label>
          <input
            v-model="form.area"
            type="text"
            required
            class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#FF56B0] focus:border-transparent outline-none"
            placeholder="e.g. Valletta / Sliema"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-600 mb-1">Selected Orders</label>
          <p class="text-xs text-gray-500 mb-1">
            {{ selectedOrderIds.length }} order(s) selected.
          </p>
          <div class="flex flex-wrap gap-1">
            <span
              v-for="id in selectedOrderIds"
              :key="id"
              class="inline-flex items-center px-2 py-0.5 rounded-full bg-gray-100 text-xs text-gray-700"
            >
              {{ id }}
            </span>
          </div>
        </div>

        <div class="flex gap-3">
          <button
            type="submit"
            :disabled="submitting || !selectedOrderIds.length"
            class="bg-[#FF56B0] text-white font-bold py-2.5 px-6 rounded-lg shadow-[0_4px_0_#E63E8A] hover:opacity-90 transition text-sm disabled:opacity-60"
          >
            {{ submitting ? 'Creating...' : 'Create Route' }}
          </button>
        </div>
        <p v-if="errorMessage" class="text-xs text-red-500 mt-1">{{ errorMessage }}</p>
        <p v-if="successMessage" class="text-xs text-green-600 mt-1">{{ successMessage }}</p>
      </form>

      <!-- Pending orders -->
      <div class="bg-white rounded-xl shadow-sm p-5 xl:col-span-2 space-y-4">
        <div class="flex items-center justify-between">
          <h3 class="text-sm font-semibold text-gray-700 uppercase tracking-wide">Pending Orders</h3>
          <span class="text-xs text-gray-500">Select orders to include in the route</span>
        </div>
        <div class="max-h-[480px] overflow-y-auto divide-y divide-gray-100">
          <label
            v-for="o in pendingOrders"
            :key="o._id"
            class="flex items-start gap-3 py-3 cursor-pointer hover:bg-gray-50 px-2 rounded-lg"
          >
            <input
              type="checkbox"
              class="mt-1"
              :value="o._id"
              v-model="selectedOrderIds"
            />
            <div class="flex-1 min-w-0">
              <div class="flex items-center justify-between">
                <p class="text-sm font-medium text-gray-800">
                  {{ o.order_number ?? o._id }} — {{ o.client?.company_name ?? '' }}
                </p>
                <span class="text-xs text-gray-500">{{ o.pickupDate }}</span>
              </div>
              <p class="text-xs text-gray-500">
                {{ o.pickupAddress || 'No address' }}
              </p>
              <p class="text-xs text-gray-400 mt-0.5">
                {{ o.serviceType }} &middot; {{ o.estimatedBags ?? 0 }} bags
              </p>
            </div>
          </label>
          <p v-if="!pendingOrders.length" class="text-xs text-gray-400 py-4 px-2">
            No pending or assigned orders available.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { fetchOrders, mapOrderForList } from '../../../api/orders'
import { fetchUsers } from '../../../api/users'
import { apiFetch } from '../../../api/client'

const drivers = ref([])
const rawOrders = ref([])
const selectedOrderIds = ref([])

const form = reactive({
  date: new Date().toISOString().split('T')[0],
  driverId: '',
  area: '',
})

const submitting = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

onMounted(async () => {
  try {
    const [ordersData, usersData] = await Promise.all([
      fetchOrders().catch(() => []),
      fetchUsers().catch(() => []),
    ])

    rawOrders.value = ordersData ?? []
    drivers.value = (usersData ?? []).filter(u => u.role === 'driver').map(u => ({
      id: u._id ?? u.id,
      name: u.name,
      email: u.email,
    }))
  } catch (err) {
    errorMessage.value =
      err?.message ||
      err?.error ||
      err?.data?.message ||
      'Failed to load drivers or orders.'
  }
})

const pendingOrders = computed(() => {
  const candidates = rawOrders.value.filter(o =>
    ['Pending', 'Assigned', 'Transit'].includes(o.status)
  )
  return candidates.map(o => {
    const mapped = mapOrderForList(o)
    return {
      ...mapped,
      _id: o._id ?? mapped._id,
      pickupAddress: o.pickup_address ?? mapped.pickupAddress,
    }
  })
})

async function createRoute() {
  if (!form.driverId || !form.date || !form.area || !selectedOrderIds.value.length) return
  submitting.value = true
  errorMessage.value = ''
  successMessage.value = ''
  try {
    const routeDate = new Date(form.date)
    await apiFetch('/api/routes', {
      method: 'POST',
      body: JSON.stringify({
        route_date: routeDate.toISOString(),
        driver: form.driverId,
        area: form.area,
        orders: selectedOrderIds.value,
      }),
    })
    successMessage.value = 'Route created and orders assigned to driver.'
    selectedOrderIds.value = []
  } catch (err) {
    errorMessage.value =
      err?.message ||
      err?.error ||
      err?.data?.message ||
      'Failed to create route. Please try again.'
  } finally {
    submitting.value = false
  }
}
</script>

