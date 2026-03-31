<template>
  <div class="space-y-6 bg-white rounded-xl shadow-sm p-5">
    <LoadingPanel v-if="loading" />

    <template v-else>
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div>
        <h2 class="text-lg font-semibold text-gray-800">Today's Route</h2>
        <p class="text-sm text-gray-500">{{ driverRoute.date }} &middot; {{ driverRoute.vehiclePlate }}</p>
      </div>
      <div class="flex items-center gap-3">
        <span class="text-sm text-gray-500">{{ driverRoute.completedStops }}/{{ driverRoute.totalStops }} stops completed</span>
        <div class="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div class="h-full bg-brand-700 rounded-full transition-all" :style="{ width: progress + '%' }"></div>
        </div>
      </div>
    </div>

    <!-- Route Map -->
    <div v-if="routeMarkers.length">
      <button @click="showMap = !showMap" class="text-xs text-brand-700 hover:underline mb-2">
        {{ showMap ? 'Hide Map' : 'Show Route on Map' }}
      </button>
      <MiniMap v-if="showMap" :markers="routeMarkers" height="260px" class="mb-2" />
    </div>

    <!-- Stops -->
    <div class="space-y-3">
      <div
        v-for="stop in driverRoute.stops" :key="stop.id"
        class="bg-white rounded-xl shadow-sm p-4 sm:p-5 hover:shadow-md transition-shadow"
        :class="{ 'opacity-60': stop.status === 'Completed' }"
      >
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div class="flex items-start gap-3">
            <!-- Stop number -->
            <div class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
              :class="stop.status === 'Completed' ? 'bg-green-100 text-green-700' : stop.status === 'In Transit' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'">
              {{ stop.id }}
            </div>
            <div>
              <div class="flex items-center gap-2 flex-wrap">
                <StatusBadge :status="stop.type" />
                <StatusBadge :status="stop.status" />
              </div>
              <h3 class="text-sm font-semibold text-gray-800 mt-1">{{ stop.client }}</h3>
              <p class="text-xs text-gray-500">{{ stop.address }}</p>
              <p class="text-xs text-gray-400 mt-1">{{ stop.timeWindow }} &middot; ~{{ stop.estimatedBags }} bags</p>
              <p v-if="stop.notes" class="text-xs text-gray-500 mt-1 italic">{{ stop.notes }}</p>
            </div>
          </div>

          <div class="flex gap-2 sm:flex-col sm:items-end">
            <AppButton
              v-if="stop.type === 'Pickup' && stop.status !== 'Completed'"
              size="sm"
              @click="navStore.goToDetail('pickup-confirm', stop.id)"
            >{{ $t('driver.confirmPickup') }}</AppButton>
            <AppButton
              v-if="stop.type === 'Delivery' && stop.status !== 'Completed'"
              size="sm" variant="secondary"
              @click="navStore.goToDetail('delivery-confirm', stop.id)"
            >{{ $t('driver.confirmDelivery') }}</AppButton>
            <span v-if="stop.status === 'Completed'" class="text-xs text-green-600 font-medium flex items-center gap-1">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
              Done
            </span>
          </div>
        </div>
      </div>
    </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import StatusBadge from '../../ui/StatusBadge.vue'
import MiniMap from '../../ui/MiniMap.vue'
import { useNavStore } from '../../../stores/nav.js'
import AppButton from '../../ui/AppButton.vue'
import LoadingPanel from '../../ui/LoadingPanel.vue'
import { fetchRoutes, mapRouteForDriver } from '../../../api/routes'

const navStore = useNavStore()

const driverRoute = ref({ driverName: '', date: '', vehiclePlate: '', totalStops: 0, completedStops: 0, stops: [] })
const rawRouteOrders = ref([])
const loading = ref(true)
const showMap = ref(false)

function parseLocalDate(dateStr) {
  if (!dateStr) return null
  const [y, m, d] = String(dateStr).split('-').map(Number)
  if (!y || !m || !d) return null
  return new Date(y, m - 1, d)
}

function pickCurrentOrNextRawRoute(routes) {
  if (!routes.length) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const sorted = [...routes].sort((a, b) => {
    const da = parseLocalDate(mapRouteForDriver(a).date)?.getTime() ?? Number.MAX_SAFE_INTEGER
    const db = parseLocalDate(mapRouteForDriver(b).date)?.getTime() ?? Number.MAX_SAFE_INTEGER
    return da - db
  })

  const todayRoute = sorted.find((raw) => {
    const mappedDate = mapRouteForDriver(raw).date
    const routeDate = parseLocalDate(mappedDate)
    return routeDate && routeDate.getTime() === today.getTime()
  })
  if (todayRoute) return todayRoute

  const nextRoute = sorted.find((raw) => {
    const mappedDate = mapRouteForDriver(raw).date
    const routeDate = parseLocalDate(mappedDate)
    return routeDate && routeDate.getTime() > today.getTime()
  })

  return nextRoute ?? sorted[sorted.length - 1]
}

onMounted(async () => {
  try {
    const data = await fetchRoutes()
    const selectedRawRoute = pickCurrentOrNextRawRoute(data ?? [])
    if (selectedRawRoute) {
      rawRouteOrders.value = selectedRawRoute.orders ?? []
      driverRoute.value = mapRouteForDriver(selectedRawRoute)
    }
  } catch { /* stays default */ } finally {
    loading.value = false
  }
})

const routeMarkers = computed(() => {
  const markers = []
  for (const o of rawRouteOrders.value) {
    const clientObj = typeof o.client === 'object' ? o.client : null
    if (!clientObj?.properties?.length) continue
    let prop = o.property
      ? clientObj.properties.find(p => p._id?.toString() === o.property?.toString())
      : clientObj.properties[0]
    if (!prop) prop = clientObj.properties[0]
    if (prop?.lat && prop?.lng) {
      markers.push({
        lat: prop.lat,
        lng: prop.lng,
        label: `${o.order_number ?? o._id} — ${clientObj.company_name ?? ''}`,
      })
    }
  }
  return markers
})

const progress = computed(() =>
  driverRoute.value.totalStops > 0
    ? Math.round((driverRoute.value.completedStops / driverRoute.value.totalStops) * 100)
    : 0
)
</script>
