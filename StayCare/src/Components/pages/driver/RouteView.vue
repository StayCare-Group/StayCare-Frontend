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
        v-for="stop in driverRoute.stops" :key="stop.viewKey"
        class="bg-white rounded-xl shadow-sm p-4 sm:p-5 hover:shadow-md transition-shadow"
        :class="{ 'opacity-60': stop.status === 'Completed' }"
      >
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div class="flex items-start gap-3">
            <!-- Stop number -->
            <div class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
              :class="stop.status === 'Completed' ? 'bg-green-100 text-green-700' : stop.status === 'In Transit' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'">
              {{ stop.displayIndex }}
            </div>
            <div>
              <div class="flex items-center gap-2 flex-wrap">
                <StatusBadge v-if="stop.status !== 'Completed'" :status="stop.type" />
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
              v-if="stop.type === 'Pickup' && stop.status === 'Pending'"
              size="sm"
              @click="navStore.goToDetail('pickup-confirm', stop._id ?? stop.id, stop.routeId)"
            >{{ $t('driver.confirmPickup') }}</AppButton>
            <AppButton
              v-if="stop.type === 'Delivery' && stop.status !== 'Completed'"
              size="sm" variant="secondary"
              @click="navStore.goToDetail('delivery-confirm', stop._id ?? stop.id, stop.routeId)"
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
import { useAuthStore } from '../../../stores/auth.js'
import AppButton from '../../ui/AppButton.vue'
import LoadingPanel from '../../ui/LoadingPanel.vue'
import { fetchRoutesByDriver, mapRouteForDriver } from '../../../api/routes'

const navStore = useNavStore()
const authStore = useAuthStore()

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

function pickCurrentOrNextRoute(routes) {
  if (!routes.length) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const sorted = [...routes].sort((a, b) => {
    const da = parseLocalDate(a.date)?.getTime() ?? Number.MAX_SAFE_INTEGER
    const db = parseLocalDate(b.date)?.getTime() ?? Number.MAX_SAFE_INTEGER
    return da - db
  })

  const todayRoute = sorted.find((route) => {
    const routeDate = parseLocalDate(route.date)
    return routeDate && routeDate.getTime() === today.getTime()
  })
  if (todayRoute) return todayRoute

  const nextRoute = sorted.find((route) => {
    const routeDate = parseLocalDate(route.date)
    return routeDate && routeDate.getTime() > today.getTime()
  })

  return nextRoute ?? sorted[sorted.length - 1]
}

function mergeRoutesForDate(routesForDate, date) {
  if (!routesForDate.length) {
    return { driverName: '', date: '', vehiclePlate: '', totalStops: 0, completedStops: 0, stops: [] }
  }

  const first = routesForDate[0]
  const mergedStops = routesForDate
    .flatMap(r => r?.stops ?? [])
    .map((stop, index) => ({
      ...stop,
      displayIndex: index + 1,
      viewKey: `${stop.routeId ?? 'route'}-${stop._id ?? stop.id ?? index}`,
    }))

  return {
    ...first,
    date,
    totalStops: routesForDate.reduce((acc, r) => acc + (r.totalStops ?? 0), 0),
    completedStops: routesForDate.reduce((acc, r) => acc + (r.completedStops ?? 0), 0),
    stops: mergedStops,
  }
}

onMounted(async () => {
  try {
    const driverId = authStore.user?.id
    if (!driverId) return

    const data = await fetchRoutesByDriver(driverId)
    const rawRoutes = data ?? []
    const mappedRoutes = rawRoutes.map(mapRouteForDriver)
    const selectedRoute = pickCurrentOrNextRoute(mappedRoutes)
    if (selectedRoute) {
      const day = selectedRoute.date
      const routesForDate = mappedRoutes.filter(route => route.date === day)
      rawRouteOrders.value = rawRoutes
        .filter(route => mapRouteForDriver(route).date === day)
        .flatMap(route => Array.isArray(route.orders) ? route.orders : [])
      driverRoute.value = mergeRoutesForDate(routesForDate, day)
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
        label: `${o.order_number ?? o._id} — ${clientObj.name ?? ''}`,
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
