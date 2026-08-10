<template>
  <div class="space-y-6">
    <h2 class="text-lg font-semibold text-brand-700">{{ $t('routePlanner.title') }}</h2>

    <!-- Auto-Assign Section (disabled — to be re-enabled in a future release) -->
    <template v-if="false">
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
            class="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-400 focus:border-transparent outline-none"
          />
          <AppButton
            @click="handleAutoAssign"
            :disabled="autoAssigning || !drivers.length"
            :loading="autoAssigning"
          >
            {{ autoAssigning ? 'Assigning...' : 'Auto-Assign' }}
          </AppButton>
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
          <AppButton
            @click="confirmAutoAssign"
            :disabled="autoConfirming"
            :loading="autoConfirming"
          >
            {{ autoConfirming ? 'Creating routes...' : 'Confirm & Create Routes' }}
          </AppButton>
          <button
            @click="autoPreview = null"
            class="text-sm text-gray-500 hover:text-gray-700"
          >Cancel</button>
        </div>
      </div>

      <p v-if="autoError" class="text-xs text-red-500">{{ autoError }}</p>
      <p v-if="autoSuccess" class="text-xs text-green-600">{{ autoSuccess }}</p>

      <!-- Background Auto-Assign Toggle -->
      <div class="border-t border-gray-100 pt-4 space-y-3">
        <div class="flex items-center justify-between">
          <div>
            <h4 class="text-sm font-semibold text-gray-700">Automatic Route Assignment</h4>
            <p class="text-xs text-gray-500 mt-0.5">
              When enabled, new orders are automatically assigned to routes for their pickup date every 30 seconds.
            </p>
          </div>
          <label class="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" v-model="bgAutoAssignEnabled" class="sr-only peer" />
            <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-brand-400 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-700"></div>
          </label>
        </div>

        <div v-if="bgAutoAssignEnabled" class="flex items-center gap-2">
          <span class="relative flex h-2.5 w-2.5">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
          </span>
          <span class="text-xs text-green-600 font-medium">
            {{ bgAutoAssigning ? 'Checking for new orders...' : 'Watching for new orders' }}
          </span>
        </div>

        <!-- Activity log -->
        <div v-if="bgAutoAssignLog.length" class="space-y-1">
          <p class="text-xs font-medium text-gray-500 uppercase tracking-wide">Recent auto-assignments</p>
          <div v-for="(entry, i) in bgAutoAssignLog" :key="i" class="text-xs text-gray-600 flex items-center gap-2">
            <span class="text-gray-400">{{ entry.ts }}</span>
            <span>{{ entry.count }} order(s) → {{ entry.routes }} route(s) for {{ entry.date }}</span>
          </div>
        </div>
      </div>
    </div>
    </template>

    <div class="grid grid-cols-1 xl:grid-cols-3 gap-6">
      <!-- Manual route form -->
      <form class="bg-white rounded-xl shadow-sm p-5 space-y-4" @submit.prevent="handleCreateRoute">
        <h3 class="text-sm font-semibold text-gray-700 uppercase tracking-wide">{{ $t('routePlanner.manualRouteTitle') }}</h3>

        <PickupWindowFields
          v-model:pickup-date="form.date"
          :show-time-window="false"
          :label="$t('routePlanner.date')"
          :min-date="todayStr"
        />

        <div>
          <label class="block text-sm font-medium text-gray-600 mb-1">{{ $t('admin.driver') }}</label>
          <select
            v-model="form.driverId"
            required
            class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-400 focus:border-transparent outline-none"
          >
            <option value="">{{ $t('routePlanner.selectDriver') }}</option>
            <option v-for="d in drivers" :key="d.id" :value="d.id">
              {{ d.name }} — {{ d.email }}
            </option>
          </select>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-600 mb-1">{{ $t('routePlanner.areaZone') }}</label>
          <input
            v-model="form.area"
            type="text"
            required
            class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-400 focus:border-transparent outline-none"
            :placeholder="$t('routePlanner.areaPlaceholder')"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-600 mb-1">{{ $t('routePlanner.selectedOrders') }}</label>
          <p class="text-xs text-gray-500 mb-1">
            {{ $t('routePlanner.ordersSelected', { count: selectedOrderIds.length }) }}
          </p>
        </div>

        <div class="flex gap-3">
          <AppButton
            type="submit"
            :disabled="submitting || !selectedOrderIds.length"
            :loading="submitting"
          >
            {{ submitting ? $t('routePlanner.creatingRoute') : $t('routePlanner.createRoute') }}
          </AppButton>
        </div>
        <p v-if="errorMessage" class="text-xs text-red-500 mt-1">{{ errorMessage }}</p>
        <p v-if="successMessage" class="text-xs text-green-600 mt-1">{{ successMessage }}</p>
      </form>

      <!-- Pending orders -->
      <div class="bg-white rounded-xl shadow-sm p-5 xl:col-span-2 space-y-4">
        <div class="flex items-center justify-between">
          <h3 class="text-sm font-semibold text-gray-700 uppercase tracking-wide">{{ $t('routePlanner.ordersToAssign') }}</h3>
          <span class="text-xs text-gray-500">{{ $t('routePlanner.pendingOrdersHint') }}</span>
        </div>
        <div class="flex items-center gap-2">
          <button
            class="px-3 py-1.5 rounded-lg text-xs font-medium border transition"
            :class="assignQueue === 'pickup' ? 'bg-brand-700 text-white border-brand-700' : 'bg-white text-gray-600 border-gray-200 hover:border-brand-700'"
            @click="assignQueue = 'pickup'"
          >{{ $t('routePlanner.pickupOrders') }} ({{ pickupQueueCount }})</button>
          <button
            class="px-3 py-1.5 rounded-lg text-xs font-medium border transition"
            :class="assignQueue === 'delivery' ? 'bg-brand-700 text-white border-brand-700' : 'bg-white text-gray-600 border-gray-200 hover:border-brand-700'"
            @click="assignQueue = 'delivery'"
          >{{ $t('routePlanner.deliveryOrders') }} ({{ deliveryQueueCount }})</button>
        </div>
        <p v-if="initializingRoutes || routesLoading" class="text-sm text-gray-400 py-2">{{ $t('routePlanner.loadingRoutes') }}</p>
        <div v-else class="max-h-[480px] overflow-y-auto divide-y divide-gray-100">
          <label
            v-for="o in pendingOrders"
            :key="o._id"
            class="flex items-start gap-4 py-3 cursor-pointer hover:bg-gray-50 px-2 rounded-lg"
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
                <div class="flex items-center gap-2">
                  <span class="text-[11px] px-2 py-0.5 rounded-full font-medium"
                    :class="o.routeType === 'Delivery' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'"
                  >{{ o.routeType }}</span>
                </div>
              </div>
              <p class="text-xs text-gray-600 mt-0.5">
                Area / Property: {{ o.areaOrProperty || '-' }}
              </p>
              <p class="text-xs text-gray-600 mt-0.5">
                Address: {{ o.address || '-' }}
              </p>
              <p class="text-xs text-gray-600 mt-0.5">
                Pickup Date: {{ o.pickupDate || '-' }}
              </p>
              <p class="text-xs text-gray-600 mt-0.5">
                Pickup Time Window: {{ o.pickupTimeWindow || '-' }}
              </p>
              <p class="text-xs text-gray-400 mt-0.5">
                {{ o.serviceType }} &middot; Est: {{ o.estimatedBags ?? 0 }} {{ $t('routePlanner.bags') }} &middot; Act: {{ o.actualBags ?? '-' }} {{ $t('routePlanner.bags') }}
              </p>
            </div>
            <AppButton
              size="sm"
              variant="secondary"
              @click="assignQueue === 'pickup' ? navStore.goToDetail('pickup-confirm', o._id, null) : navStore.goToDetail('delivery-confirm', o._id, null)"
              >
              {{ $t('routePlanner.continueWithoutDriver') }}
            </AppButton>
          </label>
          <p v-if="!pendingOrders.length" class="text-xs text-gray-400 py-4 px-2">
            {{ assignQueue === 'pickup' ? $t('routePlanner.noPickupOrders') : $t('routePlanner.noDeliveryOrders') }}
          </p>
        </div>
      </div>
    </div>

    <!-- Existing routes + Reassign -->
    <div class="bg-white rounded-xl shadow-sm p-5 space-y-4">
      <div class="flex items-center justify-between flex-wrap gap-3">
        <h3 class="text-sm font-semibold text-gray-700 uppercase tracking-wide">{{ $t('routePlanner.routesCalendar') }}</h3>
        <div class="flex items-center gap-3">
          <button @click="shiftRouteDate(-1)" class="text-gray-400 hover:text-gray-700 p-1">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
          </button>
          <input
            v-model="routeFilterDate"
            type="date"
            class="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-400 focus:border-transparent outline-none"
          />
          <button @click="shiftRouteDate(1)" class="text-gray-400 hover:text-gray-700 p-1">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
          </button>
          <button @click="routeFilterDate = localDateStr()" class="text-xs text-brand-700 hover:underline font-medium">{{ $t('common.today') }}</button>
          <button @click="loadRoutes" class="text-xs text-brand-700 hover:underline">{{ $t('routePlanner.refresh') }}</button>
        </div>
      </div>

      <!-- Day summary pills -->
      <div class="flex gap-2 flex-wrap">
        <button
          v-for="day in routeDateOptions"
          :key="day.date"
          @click="routeFilterDate = day.date"
          class="px-3 py-1.5 rounded-lg text-xs font-medium border transition"
          :class="routeFilterDate === day.date
            ? 'bg-brand-700 text-white border-brand-700'
            : day.count > 0 ? 'bg-gray-50 text-gray-700 border-gray-200 hover:border-brand-700' : 'bg-white text-gray-400 border-gray-100'"
        >
          {{ day.label }} <span v-if="day.count" class="ml-1 opacity-75">({{ day.count }})</span>
        </button>
      </div>

      <p v-if="initializingRoutes || routesLoading" class="text-sm text-gray-400">{{ $t('routePlanner.loadingRoutes') }}</p>
      <p v-else-if="!filteredRoutes.length" class="text-sm text-gray-400">{{ $t('routePlanner.noRoutesFor', { date: routeFilterDate }) }}</p>

      <div v-for="route in (initializingRoutes || routesLoading ? [] : filteredRoutes)" :key="route._id" class="border border-gray-200 rounded-lg p-4 space-y-3">
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
            >{{ getStatusLabel(route.status) }}</span>
            <span class="ml-2 text-xs text-gray-500">
              {{ route.pickupStops }} {{ $t('routePlanner.pickups') }} · {{ route.deliveryStops }} {{ $t('routePlanner.deliveries') }}
            </span>
          </div>
          <div class="flex items-center gap-3">
            <span class="text-xs text-gray-500">{{ route.totalStops }} {{ $t('routePlanner.stops') }} &middot; {{ route.completedStops }} {{ $t('routePlanner.done') }}</span>
            <button
              @click="toggleRouteMap(route._id)"
              class="text-xs text-brand-700 hover:underline font-medium"
            >
              {{ showRouteMap[route._id] ? $t('routePlanner.hideMap') : $t('routePlanner.showMap') }}
            </button>
            <button
              @click="handleDeleteRoute(route._id)"
              :disabled="deleting[route._id]"
              class="text-xs text-red-500 hover:text-red-700 font-medium disabled:opacity-40"
            >
              {{ deleting[route._id] ? $t('routePlanner.deleting') : $t('admin.delete') }}
            </button>
          </div>
        </div>

        <!-- Route map -->
        <MiniMap
          v-if="showRouteMap[route._id] && getRouteMarkers(route).length"
          :markers="getRouteMarkers(route)"
          height="240px"
          class="mt-2"
        />
        <p v-if="showRouteMap[route._id] && !getRouteMarkers(route).length" class="text-xs text-gray-400">
          {{ $t('routePlanner.noMapCoords') }}
        </p>

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
              <p class="text-xs text-gray-500">{{ stop.type }} &middot; {{ stop.status }} &middot; {{ stop.address || $t('routePlanner.noAddress') }}</p>
              <p class="text-xs text-gray-400 mt-0.5">
                {{ stop.timeWindow || '—' }} &middot; Est: {{ stop.estimatedBags ?? 0 }} {{ $t('routePlanner.bags') }} &middot; Act: {{ stop.actualBags ?? '-' }} {{ $t('routePlanner.bags') }}
              </p>
            </div>

            <!-- Reassign dropdown -->
            <div v-if="canReassignStop(stop)" class="flex items-center gap-2 shrink-0">
              <select
                v-model="reassignTargets[stop._id]"
                class="border border-gray-200 rounded-lg px-2 py-1 text-xs focus:ring-2 focus:ring-brand-400 focus:border-transparent outline-none"
              >
                <option value="">{{ $t('routePlanner.reassignTo') }}</option>
                <option v-for="d in drivers" :key="d.id" :value="d.id">
                  {{ d.name }}
                </option>
              </select>
              <AppButton
                size="sm"
                @click="handleReassign(stop._id, reassignTargets[stop._id], route.date)"
                :disabled="!reassignTargets[stop._id] || reassigning[stop._id]"
                :loading="reassigning[stop._id]"
              >
                {{ reassigning[stop._id] ? $t('routePlanner.reassigning') : $t('routePlanner.reassign') }}
              </AppButton>
            </div>
            <span v-else class="text-xs text-gray-400 font-medium">{{ $t('routePlanner.done') }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { fetchOrders, fetchAllOrders, mapOrderForList, reassignOrder, confirmPickup as apiConfirmPickup } from '@/api/orders'
import { fetchRoutes, fetchAllRoutes, mapRouteForDriver, deleteRoute } from '../../../api/routes'
import { getUsers } from '../../../api/users'
import { fetchClients } from '../../../api/clients'
import { apiFetch } from '../../../api/client'
import { useUiStore } from '../../../stores/ui.js'
import {
  getRouteTypeFromOrderStatus,
  isDeliveryAssignableStatus,
  isPickupAssignableStatus,
  normalizeStatus,
} from '../../../utils/orderFlow'
import MiniMap from '../../ui/MiniMap.vue'
import AppButton from '../../ui/AppButton.vue'
import { useNavStore } from '../../../stores/nav.js'
import PickupWindowFields from '../../forms/PickupWindowFields.vue'
import { getTodayDateString, normalizeDateString, isPastDate } from '../../../utils/date'
import { formatApiErrorMessage } from '../../../utils/errors'


const navStore = useNavStore()

const { t } = useI18n()
const processingOrderId = ref(null)
const showManualDeliveryModal = ref(false)
const selectedManualDeliveryOrder = ref(null)

const manualDeliveryForm = ref({
  packagesDelivered: null,
  receivedBy: '',
  notes: '',
})
const ui = useUiStore()

function getStatusLabel(status) {
  const map = {
    completed: t('routePlanner.statusCompleted'),
    in_progress: t('routePlanner.statusInProgress'),
    planned: t('routePlanner.statusPlanned'),
  }
  return map[status] ?? status
}

function canReassignStop(stop) {
  return String(stop?.status || '').toLowerCase() !== 'completed'
}

/* ── Constants ── */
const MAX_PICKUPS_PER_HOUR = 4
const ROUTE_ORDER_STATUSES = 'pending,assigned,transit,ready_to_delivery,collected'

/** Returns a Date as YYYY-MM-DD in local timezone (no UTC shift) */
function localDateStr(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

const drivers = ref([])
const rawOrders = ref([])
const selectedOrderIds = ref([])
const existingRoutes = ref([])
const routesLoading = ref(false)
const initializingRoutes = ref(true)
const clientMap = ref({})  // clientId -> client object
const assignQueue = ref('pickup')

const reassignTargets = reactive({})
const reassigning = reactive({})
const deleting = reactive({})

/* ── Auto-assign state ── */
const autoDate = ref(localDateStr())
const autoAssigning = ref(false)
const autoConfirming = ref(false)
const autoPreview = ref(null)
const autoError = ref('')
const autoSuccess = ref('')

/* ── Route calendar filter ── */
const routeFilterDate = ref(localDateStr())

/* ── Background auto-assign ── */
const bgAutoAssignEnabled = ref(localStorage.getItem('staycare_bg_autoassign') === 'true')
const bgAutoAssignLog = ref([])   // { date, count, ts }
const bgAutoAssigning = ref(false)
let pollTimer = null
const POLL_INTERVAL = 30_000 // 30 seconds

watch(bgAutoAssignEnabled, (v) => {
  localStorage.setItem('staycare_bg_autoassign', v ? 'true' : 'false')
  if (v) startPolling()
  else stopPolling()
})

const todayStr = computed(() => getTodayDateString())

/* ── Manual form state ── */
const form = reactive({
  date: getTodayDateString(),
  driverId: '',
  area: '',
})

const submitting = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

onMounted(async () => {
  try {
    const [ordersData, usersData, clientsData] = await Promise.all([
      fetchAllOrders({ status: ROUTE_ORDER_STATUSES }).catch(() => []),
      getUsers({ role: 'driver', limit: '200' }).catch(() => []),
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
      t('admin.errorLoadDriversOrders')
  } finally {
    await loadRoutes()
    initializingRoutes.value = false
  }

  // Start background auto-assign polling if enabled
  if (bgAutoAssignEnabled.value && drivers.value.length) {
    startPolling()
  }
})

async function loadRoutes() {
  routesLoading.value = true
  try {
    const data = await fetchAllRoutes().catch(() => [])
    existingRoutes.value = (data ?? []).map(mapRouteForDriver)
  } catch {
    existingRoutes.value = []
  } finally {
    routesLoading.value = false
  }
}

/* ── Route calendar helpers ── */
const filteredRoutes = computed(() => {
  return existingRoutes.value.filter(r => r.date === routeFilterDate.value)
})

const routeDateOptions = computed(() => {
  const today = new Date()
  const days = []
  for (let i = -2; i <= 4; i++) {
    const d = new Date(today)
    d.setDate(today.getDate() + i)
    const dateStr = localDateStr(d)
    const count = existingRoutes.value.filter(r => r.date === dateStr).length
    const dayKeys = ['daySun', 'dayMon', 'dayTue', 'dayWed', 'dayThu', 'dayFri', 'daySat']
    const label = i === 0 ? t('common.today') : i === -1 ? t('routePlanner.yesterday') : i === 1 ? t('routePlanner.tomorrow') : `${t('common.' + dayKeys[d.getDay()])} ${d.getDate()}`
    days.push({ date: dateStr, label, count })
  }
  return days
})

function shiftRouteDate(offset) {
  const d = new Date(routeFilterDate.value + 'T12:00:00') // local noon to avoid UTC shift
  d.setDate(d.getDate() + offset)
  routeFilterDate.value = localDateStr(d)
}

function resolveAddress(o) {
  let clientObj = typeof o.client === 'object' && o.client ? o.client : null
  if (!clientObj && typeof o.client === 'string') {
    clientObj = clientMap.value[o.client] ?? null
  }
  let prop = null
  if (clientObj?.properties?.length) {
    const propId = o.property ?? o.property_id
    if (propId) {
      prop = clientObj.properties.find(p => p._id?.toString() === propId?.toString())
    }
    if (!prop) prop = clientObj.properties[0]
  }
  if (prop?.address) return `${prop.address}${prop.city ? ', ' + prop.city : ''}`
  if (o?.property_address) {
    return `${o.property_address}${o.property_city ? ', ' + o.property_city : ''}`
  }
  return clientObj?.billing_address ?? clientObj?.address ?? o.pickup_address ?? ''
}

function resolveAreaOrProperty(o) {
  if (o?.area) return String(o.area)

  let clientObj = typeof o.client === 'object' && o.client ? o.client : null
  if (!clientObj && typeof o.client === 'string') {
    clientObj = clientMap.value[o.client] ?? null
  }

  let prop = null
  if (clientObj?.properties?.length) {
    if (o.property) {
      prop = clientObj.properties.find(p => p._id?.toString() === o.property?.toString())
    }
    if (!prop) prop = clientObj.properties[0]
  }

  return prop?.name ?? o?.property_name ?? ''
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

const assignableOrders = computed(() => {
  const candidates = rawOrders.value.filter(o => {
    const isPickup = isPickupAssignableStatus(o.status)
    const isDelivery = isDeliveryAssignableStatus(o.status)
    if (!isPickup && !isDelivery) return false

    // Prevent duplicates for pickup pipeline, but keep delivery orders assignable
    // so admin can create delivery routes after facility processing.
    if (isPickup && assignedOrderIds.value.has(o._id ?? o.id)) return false
    return true
  })

  return candidates.map(o => {
    const mapped = mapOrderForList(o)
    // If client name is empty (client was just an ID), resolve from client map
    let clientName = mapped.client
    if (!clientName && typeof o.client === 'string' && clientMap.value[o.client]) {
      const c = clientMap.value[o.client]
      clientName = c.name ?? ''
    }
    return {
      ...mapped,
      client: clientName,
      _id: o._id ?? mapped._id,
      address: resolveAddress(o),
      areaOrProperty: resolveAreaOrProperty(o),
      pickupTimeWindow: formatSlot(o),
      routeType: getRouteTypeFromOrderStatus(o.status),
    }
  })
})

const pickupQueueCount = computed(() =>
  assignableOrders.value.filter(o => o.routeType === 'Pickup' && normalizeStatus(o.status) === 'pending').length
)
const deliveryQueueCount = computed(() => assignableOrders.value.filter(o => o.routeType === 'Delivery').length)

const pendingOrders = computed(() => {
  const targetType = assignQueue.value === 'delivery' ? 'Delivery' : 'Pickup'
  return assignableOrders.value.filter(o => {
    if (o.routeType !== targetType) return false
    if (targetType === 'Pickup') return normalizeStatus(o.status) === 'pending'
    return true
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
  const startRaw = order?.pickup_window?.start_time ?? order?.pickup_window_start ?? ''
  const endRaw = order?.pickup_window?.end_time ?? order?.pickup_window_end ?? ''

  const toHourLabel = (raw) => {
    if (!raw) return ''
    const s = String(raw)
    const timeOnly = s.match(/^(\d{2}):(\d{2})(?::\d{2})?$/)
    if (timeOnly) return `${timeOnly[1]}:${timeOnly[2]}`

    const d = new Date(s)
    if (Number.isNaN(d.getTime())) return ''
    return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  }

  const start = toHourLabel(startRaw)
  const end = toHourLabel(endRaw)

  if (start && end) return `${start} - ${end}`
  if (start) return start
  return '—'
}

function getOrderAddress(o) {
  // Reuse the same logic as resolveAddress
  return resolveAddress(o)
}

function buildAutoPreview(targetDate) {
  const targetStr = targetDate // YYYY-MM-DD
  const assigned = assignedOrderIds.value
  // Only include orders whose pickup_date matches the selected date exactly
  const ordersForDate = rawOrders.value.filter(o => {
    if (!['Pending', 'Assigned'].includes(o.status)) return false
    if (assigned.has(o._id ?? o.id)) return false
    const pDate = normalizeDateString(o.pickup_date)
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

function normalizeId(value) {
  return String(value)
}

function buildRouteCreatePayload({ date, driverId, area, orderIds }) {
  return {
    route_date: date,
    driver_id: normalizeId(driverId),
    area,
    order_ids: (orderIds ?? []).map(normalizeId),
  }
}

async function handleAutoAssign() {
  autoError.value = ''
  autoSuccess.value = ''
  autoAssigning.value = true
  try {
    if (!drivers.value.length) {
      autoError.value = 'No drivers available.'
      return
    }
    // Re-fetch ALL orders so we always have the latest data
    // Merge with existing to avoid losing any already-loaded orders
    const freshOrders = await fetchAllOrders({ status: ROUTE_ORDER_STATUSES }).catch(() => [])
    const merged = new Map()
    for (const o of rawOrders.value) merged.set(o._id ?? o.id, o)
    for (const o of (freshOrders ?? [])) merged.set(o._id ?? o.id, o)
    rawOrders.value = [...merged.values()]

    const preview = buildAutoPreview(autoDate.value)
    if (!preview || !preview.assignments.length) {
      const pendingCount = rawOrders.value.filter(o => ['Pending', 'Assigned'].includes(o.status)).length
      const notAssigned = rawOrders.value.filter(o =>
        ['Pending', 'Assigned'].includes(o.status) &&
        !assignedOrderIds.value.has(o._id ?? o.id)
      ).length
      autoError.value = `No unassigned pending orders found up to ${autoDate.value}. (${pendingCount} pending, ${notAssigned} not yet on a route, ${rawOrders.value.length} total)`
      return
    }
    autoPreview.value = preview
  } catch (err) {
    autoError.value = err?.message || err?.error || 'Failed to fetch orders.'
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
    // Create one route per driver using the API contract date format (YYYY-MM-DD).
    const routeDate = autoPreview.value.date
    let created = 0
    for (const a of autoPreview.value.assignments) {
      // Separate delivery orders from pickup orders for this driver
      const deliveryOrderIds = []
      const pickupOrderIds = []

      for (const orderObj of a.orders) {
        const order = rawOrders.value.find(o => (o._id ?? o.id) === orderObj.id)
        if (order && isDeliveryAssignableStatus(order.status)) {
          deliveryOrderIds.push(orderObj.id)
        } else {
          pickupOrderIds.push(orderObj.id)
        }
      }

      // Reassign delivery orders (preserves their status)
      for (const orderId of deliveryOrderIds) {
        await reassignOrder(orderId, a.driverId, {
          route_date: routeDate,
          area: 'Auto-assigned',
        })
        created++
      }

      // Create route for pickup orders (changes status to ASSIGNED)
      if (pickupOrderIds.length > 0) {
        await apiFetch('/api/routes', {
          method: 'POST',
          body: JSON.stringify(buildRouteCreatePayload({
            date: routeDate,
            driverId: a.driverId,
            area: 'Auto-assigned',
            orderIds: pickupOrderIds,
          })),
        })
        created++
      }
    }
    autoSuccess.value = t('routePlanner.routesCreated', { count: created, date: autoPreview.value.date })
    autoPreview.value = null
    // Refresh data
    const ordersData = await fetchAllOrders({ status: ROUTE_ORDER_STATUSES }).catch(() => [])
    rawOrders.value = ordersData ?? []
    await loadRoutes()
  } catch (err) {
    autoError.value =
      err?.message || err?.error || t('admin.errorAutoAssign')
  } finally {
    autoConfirming.value = false
  }
}

/* ── Manual route creation ── */
async function handleCreateRoute() {
  if (!form.driverId || !form.date || !form.area || !selectedOrderIds.value.length) return
  if (isPastDate(form.date)) {
    errorMessage.value = t('admin.pickupDateInPast')
    return
  }
  submitting.value = true
  errorMessage.value = ''
  successMessage.value = ''
  try {
    const routeDate = form.date

    // Separate delivery orders from pickup orders
    const deliveryOrderIds = []
    const pickupOrderIds = []

    for (const orderId of selectedOrderIds.value) {
      const order = rawOrders.value.find(o => (o._id ?? o.id) === orderId)
      if (order && isDeliveryAssignableStatus(order.status)) {
        deliveryOrderIds.push(orderId)
      } else {
        pickupOrderIds.push(orderId)
      }
    }

    // Reassign delivery orders (preserves their status)
    for (const orderId of deliveryOrderIds) {
      await reassignOrder(orderId, form.driverId, {
        route_date: routeDate,
        area: form.area,
      })
    }

    // Create route for pickup orders (changes status to ASSIGNED)
    if (pickupOrderIds.length > 0) {
      await apiFetch('/api/routes', {
        method: 'POST',
        body: JSON.stringify(buildRouteCreatePayload({
          date: routeDate,
          driverId: form.driverId,
          area: form.area,
          orderIds: pickupOrderIds,
        })),
      })
    }

    successMessage.value = t('routePlanner.routeCreatedSuccess')
    selectedOrderIds.value = []
    const ordersData = await fetchAllOrders({ status: ROUTE_ORDER_STATUSES }).catch(() => [])
    rawOrders.value = ordersData ?? []
    await loadRoutes()
  } catch (err) {
    errorMessage.value = formatApiErrorMessage(
      err,
      t('admin.errorCreateRoute'),
      t
    )
  } finally {
    submitting.value = false
  }
}

async function handleReassign(orderId, driverId, routeDate) {
  if (!orderId || !driverId) return
  reassigning[orderId] = true
  try {
    await reassignOrder(orderId, driverId, routeDate ? { route_date: routeDate } : undefined)
    await loadRoutes()
    reassignTargets[orderId] = ''
  } catch (err) {
    ui.showError(err?.message || err?.error || 'Reassign failed')
  } finally {
    reassigning[orderId] = false
  }
}

const showRouteMap = reactive({})

function toggleRouteMap(routeId) {
  showRouteMap[routeId] = !showRouteMap[routeId]
}

function getRouteMarkers(route) {
  const markers = []
  for (const stop of (route.stops ?? [])) {
    const rawOrder = rawOrders.value.find(o => (o._id ?? o.id) === stop._id)
    if (!rawOrder) continue
    let clientObj = typeof rawOrder.client === 'object' ? rawOrder.client : clientMap.value[rawOrder.client]
    if (!clientObj?.properties?.length) continue
    let prop = rawOrder.property
      ? clientObj.properties.find(p => p._id?.toString() === rawOrder.property?.toString())
      : clientObj.properties[0]
    if (!prop) prop = clientObj.properties[0]
    if (prop?.lat && prop?.lng) {
      markers.push({ lat: prop.lat, lng: prop.lng, label: `${stop.orderId} — ${stop.client}` })
    }
  }
  return markers
}

async function handleDeleteRoute(routeId) {
  if (!routeId) return
  if (!confirm(t('routePlanner.confirmDeleteRoute'))) return
  deleting[routeId] = true
  try {
    await deleteRoute(routeId)
    await loadRoutes()
    // Refresh orders so they reappear in pending list
    const ordersData = await fetchAllOrders({ status: ROUTE_ORDER_STATUSES }).catch(() => [])
    rawOrders.value = ordersData ?? []
  } catch (err) {
    ui.showError(err?.message || err?.error || t('admin.errorDeleteRoute'))
  } finally {
    deleting[routeId] = false
  }
}


async function continueWithoutDriver(order) {
  console.log(order)
  const confirmed = window.confirm(
    'This order will continue without a driver. The facility must still confirm when the order arrives.'
  )

  if (!confirmed) return

  try {
    await apiConfirmPickup(order._id)
  } catch (error) {
    console.error(error)
    window.alert(
      error?.message || 'The order could not be updated.'
    )
  } finally {
    processingOrderId.value = null
  }
}

/* ─────────────────────────────────────────────
   Background Auto-Assign
   Polls for new unassigned orders every 30s.
   Groups them by pickup_date, then creates one
   route per driver per date automatically.
   ───────────────────────────────────────────── */
async function runBackgroundAutoAssign() {
  if (bgAutoAssigning.value || !drivers.value.length) return
  bgAutoAssigning.value = true
  try {
    // Refresh orders & routes
    const freshOrders = await fetchAllOrders({ status: ROUTE_ORDER_STATUSES }).catch(() => [])
    const merged = new Map()
    for (const o of rawOrders.value) merged.set(o._id ?? o.id, o)
    for (const o of (freshOrders ?? [])) merged.set(o._id ?? o.id, o)
    rawOrders.value = [...merged.values()]
    await loadRoutes()

    const assigned = assignedOrderIds.value
    const today = localDateStr()

    // Find all unassigned Pending/Assigned orders with a pickup_date from today onward
    const unassigned = rawOrders.value.filter(o => {
      if (!['Pending', 'Assigned'].includes(o.status)) return false
      if (assigned.has(o._id ?? o.id)) return false
      const pDate = normalizeDate(o.pickup_date)
      return pDate && pDate >= today
    })

    if (!unassigned.length) return

    // Group by pickup_date
    const byDate = {}
    for (const o of unassigned) {
      const d = normalizeDate(o.pickup_date)
      if (!byDate[d]) byDate[d] = []
      byDate[d].push(o)
    }

    // For each date group, build assignments and create routes
    for (const [dateStr, orders] of Object.entries(byDate)) {
      const preview = buildAutoPreview(dateStr)
      if (!preview || !preview.assignments.length) continue

      const routeDate = dateStr
      let created = 0
      for (const a of preview.assignments) {
        // Separate delivery orders from pickup orders for this driver
        const deliveryOrderIds = []
        const pickupOrderIds = []

        for (const orderObj of a.orders) {
          const order = rawOrders.value.find(o => (o._id ?? o.id) === orderObj.id)
          if (order && isDeliveryAssignableStatus(order.status)) {
            deliveryOrderIds.push(orderObj.id)
          } else {
            pickupOrderIds.push(orderObj.id)
          }
        }

        // Reassign delivery orders (preserves their status)
        for (const orderId of deliveryOrderIds) {
          await reassignOrder(orderId, a.driverId, {
            route_date: routeDate,
            area: 'Auto-assigned',
          })
          created++
        }

        // Create route for pickup orders (changes status to ASSIGNED)
        if (pickupOrderIds.length > 0) {
          await apiFetch('/api/routes', {
            method: 'POST',
            body: JSON.stringify(buildRouteCreatePayload({
              date: routeDate,
              driverId: a.driverId,
              area: 'Auto-assigned',
              orderIds: pickupOrderIds,
            })),
          })
          created++
        }
      }

      if (created > 0) {
        bgAutoAssignLog.value.unshift({
          date: dateStr,
          count: preview.totalOrders,
          routes: created,
          ts: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
        })
        // Keep log short
        if (bgAutoAssignLog.value.length > 10) bgAutoAssignLog.value.length = 10
      }
    }

    // Refresh after creating routes
    const updatedOrders = await fetchAllOrders({ status: ROUTE_ORDER_STATUSES }).catch(() => [])
    rawOrders.value = updatedOrders ?? []
    await loadRoutes()
  } catch (err) {
    console.error('[BG AutoAssign] Error:', err)
  } finally {
    bgAutoAssigning.value = false
  }
}

function startPolling() {
  stopPolling()
  pollTimer = setInterval(runBackgroundAutoAssign, POLL_INTERVAL)
  // Also run immediately
  runBackgroundAutoAssign()
}

function stopPolling() {
  if (pollTimer) {
    clearInterval(pollTimer)
    pollTimer = null
  }
}

onUnmounted(() => {
  stopPolling()
})
</script>

