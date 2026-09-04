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

        <!-- Stops control / Toggle completed -->
        <div v-if="driverRoute.completedStops > 0" class="flex items-center justify-between flex-wrap gap-2 pt-1">
          <span class="text-xs text-gray-500 font-medium">
            {{ showCompleted ? $t('driver.stopsCompleted', { completed: driverRoute.completedStops, total: driverRoute.totalStops }) : $t('driver.pendingStopsCount', { count: displayedStops.length }) }}
          </span>
          <button
            type="button"
            @click="showCompleted = !showCompleted"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-200 hover:border-brand-700 hover:text-brand-700 transition"
          >
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path v-if="showCompleted" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
              <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            {{ showCompleted ? $t('driver.hideCompleted') : $t('driver.showCompleted', { count: driverRoute.completedStops }) }}
          </button>
        </div>

        <div v-if="!displayedStops.length && driverRoute.stops.length" class="text-center py-8 bg-green-50 rounded-xl border border-green-100 p-5 space-y-2">
          <p class="text-sm font-semibold text-green-800">{{ $t('driver.allStopsCompleted') }}</p>
          <p class="text-xs text-green-600">{{ $t('driver.allStopsCompletedHint') }}</p>
          <button
            type="button"
            @click="showCompleted = true"
            class="mt-2 text-xs font-medium text-brand-700 hover:underline inline-block"
          >
            {{ $t('driver.showCompleted', { count: driverRoute.completedStops }) }}
          </button>
        </div>

        <!-- Stops list sorted chronologically from oldest to newest -->
        <div v-else class="space-y-3">
          <div
            v-for="stop in displayedStops"
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

const showCompleted = ref(false)

const displayedStops = computed(() => {
  if (showCompleted.value) return driverRoute.value.stops
  return driverRoute.value.stops.filter((s) => s.status !== 'Completed')
})

const routeMarkers = computed(() => {
  const markers = []
  const stopsToMark = showCompleted.value
    ? driverRoute.value.stops
    : driverRoute.value.stops.filter((s) => s.status !== 'Completed')

  for (const stop of stopsToMark) {
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

