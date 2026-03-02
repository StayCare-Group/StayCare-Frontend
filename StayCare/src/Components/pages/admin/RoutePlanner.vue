<template>
  <div class="space-y-6">
    <h2 class="text-lg font-semibold text-white">Route Planner</h2>

    <!-- Auto-Assign Section -->
    <div class="bg-white rounded-xl shadow-sm p-5 space-y-4">
      <div class="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 class="text-sm font-semibold text-gray-700 uppercase tracking-wide">Auto-Assign Routes</h3>
          <p class="text-xs text-gray-500 mt-0.5">
            Groups orders by their pickup window, then splits evenly across drivers (max {{ MAX_PICKUPS_PER_HOUR }}/hr per driver)
          </p>
        </div>
        <div class="flex items-center gap-3 flex-wrap">
          <input
            v-model="autoDate"
            type="date"
            class="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#FF56B0] focus:border-transparent outline-none"
          />
          <button
            @click="handleAutoAssign"
            :disabled="autoAssigning || !drivers.length"
            class="bg-gradient-to-r from-[#FF56B0] to-[#FF89C8] text-white font-bold py-2.5 px-6 rounded-lg shadow-[0_4px_0_#E63E8A] hover:opacity-90 transition text-sm disabled:opacity-60"
          >
            {{ autoAssigning ? 'Assigning...' : 'Auto-Assign' }}
          </button>
        </div>
      </div>

      <!-- Preview -->
      <div v-if="autoPreview" class="border border-gray-200 rounded-lg p-4 space-y-3">
        <div class="flex items-center justify-between">
          <span class="text-sm font-semibold text-gray-800">Preview — {{ autoPreview.date }}</span>
          <span class="text-xs text-gray-500">{{ autoPreview.totalOrders }} order(s) across {{ autoPreview.assignments.length }} driver(s)</span>
        </div>
        <div v-if="autoPreview.overflow" class="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2">
          {{ autoPreview.overflow }} order(s) exceed driver capacity and were not assigned.
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          <div
            v-for="a in autoPreview.assignments"
            :key="a.driverId"
            class="border border-gray-100 rounded-lg p-3"
          >
            <p class="text-sm font-medium text-gray-800">{{ a.driverName }}</p>
            <p class="text-xs text-gray-500 mt-0.5">{{ a.orders.length }} pickup(s)</p>
            <div class="mt-2 space-y-1 max-h-32 overflow-y-auto">
              <div v-for="(o, i) in a.orders" :key="o.id" class="text-xs text-gray-600 flex flex-col gap-0.5 py-0.5">
                <div class="flex items-center gap-1">
                  <span class="text-gray-400 w-4 shrink-0">{{ i + 1 }}.</span>
                  <span class="truncate">{{ o.label }}</span>
                  <span class="text-gray-400 ml-auto shrink-0">{{ o.slot }}</span>
                </div>
                <span v-if="o.address" class="text-gray-400 pl-5 truncate">{{ o.address }}</span>
              </div>
            </div>
          </div>
        </div>
        <div class="flex gap-3">
          <button
            @click="confirmAutoAssign"
            :disabled="autoConfirming"
            class="bg-[#FF56B0] text-white font-bold py-2 px-5 rounded-lg shadow-[0_4px_0_#E63E8A] hover:opacity-90 transition text-sm disabled:opacity-60"
          >
            {{ autoConfirming ? 'Creating routes...' : 'Confirm & Create Routes' }}
          </button>
          <button
            @click="autoPreview = null"
            class="text-sm text-gray-500 hover:text-gray-700"
          >Cancel</button>
        </div>
      </div>

      <p v-if="autoError" class="text-xs text-red-500">{{ autoError }}</p>
      <p v-if="autoSuccess" class="text-xs text-green-600">{{ autoSuccess }}</p>
    </div>

    <div class="grid grid-cols-1 xl:grid-cols-3 gap-6">
      <!-- Manual route form -->
      <form class="bg-white rounded-xl shadow-sm p-5 space-y-4" @submit.prevent="handleCreateRoute">
        <h3 class="text-sm font-semibold text-gray-700 uppercase tracking-wide">Manual Route</h3>

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
                  {{ o.id }} — {{ o.client }}
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

    <!-- Existing routes + Reassign -->
    <div class="bg-white rounded-xl shadow-sm p-5 space-y-4">
      <div class="flex items-center justify-between">
        <h3 class="text-sm font-semibold text-gray-700 uppercase tracking-wide">Existing Routes</h3>
        <button
          @click="loadRoutes"
          class="text-xs text-[#FF56B0] hover:underline"
        >Refresh</button>
      </div>

      <p v-if="routesLoading" class="text-sm text-gray-400">Loading routes...</p>
      <p v-else-if="!existingRoutes.length" class="text-sm text-gray-400">No routes found.</p>

      <div v-for="route in existingRoutes" :key="route._id" class="border border-gray-200 rounded-lg p-4 space-y-3">
        <div class="flex items-center justify-between flex-wrap gap-2">
          <div>
            <span class="text-sm font-semibold text-gray-800">{{ route.driverName || 'Unassigned' }}</span>
            <span class="text-xs text-gray-500 ml-2">{{ route.date }}</span>
            <span
              class="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
              :class="{
                'bg-green-100 text-green-700': route.status === 'completed',
                'bg-blue-100 text-blue-700': route.status === 'in_progress',
                'bg-gray-100 text-gray-600': route.status === 'planned',
              }"
            >{{ route.status }}</span>
          </div>
          <div class="flex items-center gap-3">
            <span class="text-xs text-gray-500">{{ route.totalStops }} stop(s) &middot; {{ route.completedStops }} done</span>
            <button
              @click="handleDeleteRoute(route._id)"
              :disabled="deleting[route._id]"
              class="text-xs text-red-500 hover:text-red-700 font-medium disabled:opacity-40"
            >
              {{ deleting[route._id] ? 'Deleting...' : 'Delete' }}
            </button>
          </div>
        </div>

        <!-- Stops with reassign -->
        <div class="divide-y divide-gray-50">
          <div
            v-for="stop in route.stops"
            :key="stop._id"
            class="flex items-center gap-3 py-2"
          >
            <div class="flex-1 min-w-0">
              <p class="text-sm text-gray-700 font-medium">
                {{ stop.orderId }} — {{ stop.client }}
              </p>
              <p class="text-xs text-gray-500">{{ stop.type }} &middot; {{ stop.status }} &middot; {{ stop.address || 'No address' }}</p>
            </div>

            <!-- Reassign dropdown -->
            <div class="flex items-center gap-2 shrink-0">
              <select
                v-model="reassignTargets[stop._id]"
                class="border border-gray-200 rounded-lg px-2 py-1 text-xs focus:ring-2 focus:ring-[#FF56B0] focus:border-transparent outline-none"
              >
                <option value="">Reassign to...</option>
                <option v-for="d in drivers" :key="d.id" :value="d.id">
                  {{ d.name }}
                </option>
              </select>
              <button
                @click="handleReassign(stop._id, reassignTargets[stop._id])"
                :disabled="!reassignTargets[stop._id] || reassigning[stop._id]"
                class="bg-[#FF56B0] text-white text-xs font-bold px-3 py-1 rounded-lg hover:opacity-90 transition disabled:opacity-40"
              >
                {{ reassigning[stop._id] ? '...' : 'Reassign' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { fetchOrders, mapOrderForList, reassignOrder } from '../../../api/orders'
import { fetchRoutes, mapRouteForDriver, deleteRoute } from '../../../api/routes'
import { fetchUsers } from '../../../api/users'
import { fetchClients } from '../../../api/clients'
import { apiFetch } from '../../../api/client'

/* ── Constants ── */
const MAX_PICKUPS_PER_HOUR = 4

const drivers = ref([])
const rawOrders = ref([])
const selectedOrderIds = ref([])
const existingRoutes = ref([])
const routesLoading = ref(false)
const clientMap = ref({})  // clientId -> client object

const reassignTargets = reactive({})
const reassigning = reactive({})
const deleting = reactive({})

/* ── Auto-assign state ── */
const autoDate = ref(new Date().toISOString().split('T')[0])
const autoAssigning = ref(false)
const autoConfirming = ref(false)
const autoPreview = ref(null)
const autoError = ref('')
const autoSuccess = ref('')

/* ── Manual form state ── */
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
    const [ordersData, usersData, clientsData] = await Promise.all([
      fetchOrders().catch(() => []),
      fetchUsers().catch(() => []),
      fetchClients().catch(() => []),
    ])

    rawOrders.value = ordersData ?? []
    drivers.value = (usersData ?? []).filter(u => u.role === 'driver').map(u => ({
      id: u._id ?? u.id,
      name: u.name,
      email: u.email,
    }))

    // Build client lookup by ID for address resolution
    const map = {}
    for (const c of (clientsData ?? [])) {
      const cid = c._id ?? c.id
      if (cid) map[cid] = c
    }
    clientMap.value = map
  } catch (err) {
    errorMessage.value =
      err?.message ||
      err?.error ||
      err?.data?.message ||
      'Failed to load drivers or orders.'
  }

  loadRoutes()
})

async function loadRoutes() {
  routesLoading.value = true
  try {
    const data = await fetchRoutes()
    existingRoutes.value = (data ?? []).map(mapRouteForDriver)
  } catch {
    existingRoutes.value = []
  } finally {
    routesLoading.value = false
  }
}

function resolveAddress(o) {
  // If client is a populated object, use it directly
  let clientObj = typeof o.client === 'object' && o.client ? o.client : null
  // If client is just a string ID, look it up from the clients we fetched
  if (!clientObj && typeof o.client === 'string') {
    clientObj = clientMap.value[o.client] ?? null
  }
  const prop = clientObj?.properties?.[0]
  if (prop?.address) return `${prop.address}${prop.city ? ', ' + prop.city : ''}`
  return clientObj?.billing_address ?? clientObj?.address ?? o.pickup_address ?? ''
}

// Set of order IDs already on a route — prevents duplicates
const assignedOrderIds = computed(() => {
  const ids = new Set()
  for (const route of existingRoutes.value) {
    for (const stop of (route.stops ?? [])) {
      if (stop._id) ids.add(stop._id)
    }
  }
  return ids
})

const pendingOrders = computed(() => {
  const candidates = rawOrders.value.filter(o =>
    ['Pending', 'Assigned', 'Transit'].includes(o.status) &&
    !assignedOrderIds.value.has(o._id ?? o.id)
  )
  return candidates.map(o => {
    const mapped = mapOrderForList(o)
    // If client name is empty (client was just an ID), resolve from client map
    let clientName = mapped.client
    if (!clientName && typeof o.client === 'string' && clientMap.value[o.client]) {
      const c = clientMap.value[o.client]
      clientName = c.company_name ?? c.name ?? ''
    }
    return {
      ...mapped,
      client: clientName,
      _id: o._id ?? mapped._id,
      pickupAddress: resolveAddress(o),
    }
  })
})

/* ─────────────────────────────────────────────
   Auto-Assign Logic
   Groups orders by their pickup window hour,
   then round-robins across drivers.
   Max 4 pickups per hour per driver.
   ───────────────────────────────────────────── */
function getPickupHour(order) {
  if (order.pickup_window?.start_time) {
    const d = new Date(order.pickup_window.start_time)
    if (!isNaN(d.getTime())) return d.getHours()
  }
  return null
}

function formatSlot(order) {
  const pw = order.pickup_window
  if (!pw?.start_time) return '—'
  const s = new Date(pw.start_time)
  const e = pw.end_time ? new Date(pw.end_time) : null
  const fmt = (d) => d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  return e ? `${fmt(s)} – ${fmt(e)}` : fmt(s)
}

function getOrderAddress(o) {
  // Reuse the same logic as resolveAddress
  return resolveAddress(o)
}

function buildAutoPreview(targetDate) {
  const targetStr = targetDate // YYYY-MM-DD
  const assigned = assignedOrderIds.value
  const ordersForDate = rawOrders.value.filter(o => {
    if (!['Pending', 'Assigned'].includes(o.status)) return false
    if (assigned.has(o._id ?? o.id)) return false
    const pDate = o.pickup_date
      ? new Date(o.pickup_date).toISOString().split('T')[0]
      : ''
    return pDate === targetStr
  })

  if (!ordersForDate.length) return null
  if (!drivers.value.length) return null

  const driverCount = drivers.value.length

  // Sort orders by pickup window start time so early windows go first
  const sorted = [...ordersForDate].sort((a, b) => {
    const ha = getPickupHour(a) ?? 99
    const hb = getPickupHour(b) ?? 99
    return ha - hb
  })

  // Track how many pickups each driver has per hour
  // driverSlots[driverIdx][hour] = count
  const driverSlots = drivers.value.map(() => ({}))

  const buckets = drivers.value.map(d => ({
    driverId: d.id,
    driverName: d.name,
    orders: [],
  }))

  let overflow = 0

  for (const o of sorted) {
    const hour = getPickupHour(o)
    let assigned = false

    // Try each driver round-robin style, starting from the one with fewest total orders
    const driverOrder = buckets
      .map((b, i) => ({ idx: i, count: b.orders.length }))
      .sort((a, b) => a.count - b.count)

    for (const { idx } of driverOrder) {
      if (hour !== null) {
        const hourCount = driverSlots[idx][hour] ?? 0
        if (hourCount >= MAX_PICKUPS_PER_HOUR) continue
        driverSlots[idx][hour] = hourCount + 1
      }

      const mapped = mapOrderForList(o)
      const address = getOrderAddress(o)
      buckets[idx].orders.push({
        id: o._id ?? o.id,
        label: `${mapped.id} — ${mapped.client}`,
        address,
        slot: formatSlot(o),
      })
      assigned = true
      break
    }

    if (!assigned) overflow++
  }

  return {
    date: targetStr,
    totalOrders: sorted.length - overflow,
    overflow,
    assignments: buckets.filter(b => b.orders.length > 0),
  }
}

function handleAutoAssign() {
  autoError.value = ''
  autoSuccess.value = ''
  autoAssigning.value = true
  try {
    if (!drivers.value.length) {
      autoError.value = 'No drivers available.'
      return
    }
    const preview = buildAutoPreview(autoDate.value)
    if (!preview || !preview.assignments.length) {
      autoError.value = `No pending orders found for ${autoDate.value}.`
      return
    }
    autoPreview.value = preview
  } finally {
    autoAssigning.value = false
  }
}

async function confirmAutoAssign() {
  if (!autoPreview.value) return
  autoConfirming.value = true
  autoError.value = ''
  autoSuccess.value = ''
  try {
    const routeDate = new Date(autoPreview.value.date).toISOString()
    let created = 0
    for (const a of autoPreview.value.assignments) {
      await apiFetch('/api/routes', {
        method: 'POST',
        body: JSON.stringify({
          route_date: routeDate,
          driver: a.driverId,
          area: 'Auto-assigned',
          orders: a.orders.map(o => o.id),
        }),
      })
      created++
    }
    autoSuccess.value = `${created} route(s) created for ${autoPreview.value.date}.`
    autoPreview.value = null
    // Refresh data
    const ordersData = await fetchOrders().catch(() => [])
    rawOrders.value = ordersData ?? []
    await loadRoutes()
  } catch (err) {
    autoError.value =
      err?.message || err?.error || 'Failed to create auto-assigned routes.'
  } finally {
    autoConfirming.value = false
  }
}

/* ── Manual route creation ── */
async function handleCreateRoute() {
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
    const ordersData = await fetchOrders().catch(() => [])
    rawOrders.value = ordersData ?? []
    await loadRoutes()
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

async function handleReassign(orderId, driverId) {
  if (!orderId || !driverId) return
  reassigning[orderId] = true
  try {
    await reassignOrder(orderId, driverId)
    await loadRoutes()
    reassignTargets[orderId] = ''
  } catch (err) {
    alert(err?.message || err?.error || 'Reassign failed')
  } finally {
    reassigning[orderId] = false
  }
}

async function handleDeleteRoute(routeId) {
  if (!routeId) return
  if (!confirm('Delete this route? Orders will be unassigned.')) return
  deleting[routeId] = true
  try {
    await deleteRoute(routeId)
    await loadRoutes()
    // Refresh orders so they reappear in pending list
    const ordersData = await fetchOrders().catch(() => [])
    rawOrders.value = ordersData ?? []
  } catch (err) {
    alert(err?.message || err?.error || 'Failed to delete route')
  } finally {
    deleting[routeId] = false
  }
}
</script>

