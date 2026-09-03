<template>
  <div class="space-y-6 bg-white rounded-xl shadow-sm p-5">
    <LoadingPanel v-if="loading" />

    <template v-else>
      <!-- Empty State -->
      <div v-if="!driverRoute.stops.length" class="text-center py-12 text-gray-400">
        <p class="text-sm">{{ $t('driver.noActiveRoutes') }}</p>
      </div>

      <template v-else>
        <!-- Header -->
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 class="text-lg font-semibold text-gray-800">
              {{ $t('nav.myRoute') }}
            </h2>
            <p class="text-sm text-gray-500">
              {{ driverRoute.date }}<template v-if="driverRoute.vehiclePlate"> &middot; {{ driverRoute.vehiclePlate }}</template>
            </p>
          </div>
          <div class="flex items-center gap-3">
            <span class="text-sm text-gray-500">
              {{ $t('driver.stopsCompleted', { completed: driverRoute.completedStops, total: driverRoute.totalStops }) }}
            </span>
            <div class="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                class="h-full bg-brand-700 rounded-full transition-all"
                :style="{ width: progress + '%' }"
              ></div>
            </div>
          </div>
        </div>

        <!-- Route Map -->
        <div v-if="routeMarkers.length">
          <button
            type="button"
            class="text-xs text-brand-700 hover:underline mb-2"
            @click="showMap = !showMap"
          >
            {{ showMap ? $t('driver.hideMap') : $t('driver.showMap') }}
          </button>
          <MiniMap v-if="showMap" :markers="routeMarkers" height="260px" class="mb-2" />
        </div>

        <!-- Stops list sorted chronologically from oldest to newest -->
        <div class="space-y-3">
          <div
            v-for="stop in driverRoute.stops"
            :key="stop.viewKey"
            class="bg-white rounded-xl shadow-sm p-4 sm:p-5 hover:shadow-md transition-shadow border border-gray-100"
            :class="{ 'opacity-60': stop.status === 'Completed' }"
          >
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div class="flex items-start gap-3">
                <!-- Stop number -->
                <div
                  class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                  :class="stop.status === 'Completed' ? 'bg-green-100 text-green-700' : stop.status === 'In Transit' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'"
                >
                  {{ stop.displayIndex }}
                </div>
                <div>
                  <div class="flex items-center gap-2 flex-wrap">
                    <StatusBadge v-if="stop.status !== 'Completed'" :status="stop.type" />
                    <StatusBadge :status="stop.status" />
                    <span v-if="stop.date" class="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600 font-medium">
                      {{ stop.date }}
                    </span>
                  </div>
                  <h3 class="text-sm font-semibold text-gray-800 mt-1">{{ stop.client }}</h3>
                  <p class="text-xs text-gray-500">{{ stop.address || $t('driver.noAddress') }}</p>
                  <p class="text-xs text-gray-400 mt-1">
                    {{ stop.timeWindow }} &middot; {{ $t('driver.expectedBags') }}: ~{{ stop.estimatedBags }}
                    <span v-if="stop.actualBags !== null"> &middot; {{ $t('driver.actualBags') }}: {{ stop.actualBags }}</span>
                  </p>
                  <p v-if="stop.notes" class="text-xs text-gray-500 mt-1 italic">{{ stop.notes }}</p>
                </div>
              </div>

              <div class="flex gap-2 sm:flex-col sm:items-end">
                <AppButton
                  v-if="canConfirmPickup(stop.type, stop.originalStatus)"
                  size="sm"
                  @click="navStore.goToDetail('pickup-confirm', stop._id ?? stop.id, stop.routeId)"
                >
                  {{ $t('driver.confirmPickup') }}
                </AppButton>
                <AppButton
                  v-if="canConfirmDelivery(stop.type, stop.status)"
                  size="sm"
                  variant="secondary"
                  @click="navStore.goToDetail('delivery-confirm', stop._id ?? stop.id, stop.routeId)"
                >
                  {{ $t('driver.confirmDelivery') }}
                </AppButton>
                <span
                  v-if="stop.status === 'Completed'"
                  class="text-xs text-green-600 font-medium flex items-center gap-1"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                  </svg>
                  {{ $t('common.done') }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </template>
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
import { canConfirmPickup, canConfirmDelivery } from '../../../utils/orderFlow'
import { normalizeDateString, getTodayDateString } from '../../../utils/date'

const navStore = useNavStore()
const authStore = useAuthStore()

function createEmptyRouteState() {
  return {
    driverName: '',
    date: getTodayDateString(),
    vehiclePlate: '',
    totalStops: 0,
    completedStops: 0,
    stops: [],
  }
}

const driverRoute = ref(createEmptyRouteState())
const loading = ref(true)
const showMap = ref(false)

async function loadActiveRoutes() {
  loading.value = true
  try {
    const driverId = authStore.user?.id
    if (!driverId) return

    // Single API call requesting all active routes (planned and in_progress)
    const rawRoutes = await fetchRoutesByDriver(driverId, { status: 'planned,in_progress' }).catch(() => [])
    const routesArray = Array.isArray(rawRoutes) ? rawRoutes : []

    // Sort routes chronologically from oldest to newest
    const sorted = [...routesArray].sort((a, b) => {
      const da = normalizeDateString(a.route_date ?? a.date) || ''
      const db = normalizeDateString(b.route_date ?? b.date) || ''
      return da.localeCompare(db)
    })

    const mappedRoutes = sorted.map(mapRouteForDriver)

    if (mappedRoutes.length > 0) {
      const allStops = mappedRoutes
        .flatMap((r) =>
          (r.stops ?? []).map((s) => ({
            ...s,
            date: r.date,
          }))
        )
        .map((stop, index) => ({
          ...stop,
          displayIndex: index + 1,
          viewKey: `${stop.routeId ?? 'route'}-${stop._id ?? stop.id ?? index}`,
        }))

      const totalStops = mappedRoutes.reduce((acc, r) => acc + (r.totalStops ?? 0), 0)
      const completedStops = mappedRoutes.reduce((acc, r) => acc + (r.completedStops ?? 0), 0)
      const first = mappedRoutes[0]
      const last = mappedRoutes[mappedRoutes.length - 1]
      const dateDisplay = first.date === last.date ? first.date : `${first.date} — ${last.date}`

      driverRoute.value = {
        driverName: first.driverName || '',
        date: dateDisplay,
        vehiclePlate: first.vehiclePlate || '',
        totalStops,
        completedStops,
        stops: allStops,
      }
    } else {
      driverRoute.value = createEmptyRouteState()
    }
  } catch {
    driverRoute.value = createEmptyRouteState()
  } finally {
    loading.value = false
  }
}

onMounted(loadActiveRoutes)

const routeMarkers = computed(() => {
  const markers = []
  for (const stop of driverRoute.value.stops) {
    if (stop.lat !== null && stop.lng !== null && !isNaN(Number(stop.lat)) && !isNaN(Number(stop.lng))) {
      markers.push({
        lat: Number(stop.lat),
        lng: Number(stop.lng),
        label: `${stop.displayIndex}. ${stop.client} — ${stop.address || ''}`,
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

