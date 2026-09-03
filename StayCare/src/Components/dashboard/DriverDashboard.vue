<template>
  <div>
    <!-- Sub-pages -->
    <RouteView v-if="navStore.currentPage === 'route'" />
    <PickupConfirm v-else-if="navStore.currentPage === 'pickup-confirm'" />
    <DeliveryConfirm v-else-if="navStore.currentPage === 'delivery-confirm'" />
    <DriverHistory v-else-if="navStore.currentPage === 'history'" />
    <Settings v-else-if="navStore.currentPage === 'settings'" />
    <ProfileAccount v-else-if="navStore.currentPage === 'profile'" />

    <!-- Default dashboard overview -->
    <LoadingPanel v-else-if="loading" />

    <div v-else class="space-y-6">
      <!-- KPI Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <KpiCard v-for="kpi in driverKPIs" :key="kpi.label" :label="kpi.label" :value="kpi.value" :color="kpi.color" />
      </div>

      <!-- Stops List -->
      <div class="bg-white rounded-xl shadow-sm p-5 space-y-4">
        <div class="flex items-center justify-between flex-wrap gap-3">
          <h3 class="text-base font-semibold text-gray-800">{{ $t('driver.assignedStops') }}</h3>
        </div>

        <p v-if="!driverStops.length" class="text-sm text-gray-400 py-6 text-center">
          {{ $t('driver.noActiveRoutes') }}
        </p>

        <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          <div
            v-for="stop in driverStops"
            :key="stop.id"
            class="border border-gray-100 rounded-lg p-4 hover:shadow-md transition-shadow flex flex-col justify-between"
          >
            <div>
              <div class="flex items-center justify-between mb-2">
                <div class="flex items-center gap-1.5 flex-wrap">
                  <StatusBadge v-if="stop.status !== 'Completed'" :status="stop.type" />
                  <StatusBadge :status="stop.status" />
                </div>
                <span v-if="stop.date" class="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600 font-medium">
                  {{ stop.date }}
                </span>
              </div>
              <h4 class="text-sm font-semibold text-gray-800">{{ stop.company || stop.client }}</h4>
              <div class="mt-1 space-y-0.5">
                <p v-if="stop.area" class="text-xs text-gray-500">{{ $t('common.area') }}: {{ stop.area }}</p>
                <p v-if="stop.address" class="text-xs text-gray-500">{{ $t('common.address') }}: {{ stop.address }}</p>
                <p v-if="stop.timeWindow" class="text-xs text-gray-400">{{ $t('driver.timeWindow') }}: {{ stop.timeWindow }}</p>
              </div>
              <div class="mt-2 space-y-1">
                <div class="flex items-center justify-between">
                  <span class="text-xs text-gray-500">{{ $t('driver.expectedBags') }}</span>
                  <span class="text-sm font-bold text-gray-700">{{ stop.estimatedBags }}</span>
                </div>
                <div v-if="stop.actualBags !== null" class="flex items-center justify-between">
                  <span class="text-xs text-gray-500">{{ $t('driver.actualBags') }}</span>
                  <span class="text-sm font-bold text-gray-700">{{ stop.actualBags }}</span>
                </div>
              </div>
            </div>
            <div class="mt-3 flex flex-wrap gap-2">
              <AppButton
                v-if="canConfirmPickup(stop.type, stop.originalStatus)"
                size="sm"
                @click="navStore.goToDetail('pickup-confirm', stop.id, stop.routeId)"
              >
                {{ $t('driver.confirmPickup') }}
              </AppButton>
              <AppButton
                v-if="canConfirmDelivery(stop.type, stop.status)"
                size="sm"
                variant="secondary"
                @click="navStore.goToDetail('delivery-confirm', stop.id, stop.routeId)"
              >
                {{ $t('driver.confirmDelivery') }}
              </AppButton>
              <span
                v-if="stop.status === 'Completed'"
                class="text-xs text-green-600 font-medium flex items-center gap-1"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                {{ $t('common.done') }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import KpiCard from '../ui/KpiCard.vue'
import StatusBadge from '../ui/StatusBadge.vue'
import RouteView from '../pages/driver/RouteView.vue'
import PickupConfirm from '../pages/driver/PickupConfirm.vue'
import DeliveryConfirm from '../pages/driver/DeliveryConfirm.vue'
import DriverHistory from '../pages/driver/DriverHistory.vue'
import Settings from '../pages/shared/Settings.vue'
import ProfileAccount from '../pages/shared/ProfileAccount.vue'
import LoadingPanel from '../ui/LoadingPanel.vue'
import { useNavStore } from '../../stores/nav.js'
import { useAuthStore } from '../../stores/auth.js'
import AppButton from '../ui/AppButton.vue'
import { fetchRoutesByDriver, mapRouteForDriver } from '../../api/routes'
import { canConfirmPickup, canConfirmDelivery } from '../../utils/orderFlow'
import { normalizeDateString } from '../../utils/date'

const { t } = useI18n()
const navStore = useNavStore()
const authStore = useAuthStore()

const routesList = ref([])
const loading = ref(true)

async function loadDriverRoutes() {
  const driverId = authStore.user?.id
  if (!driverId) return
  const rawRoutes = await fetchRoutesByDriver(driverId, { status: 'planned,in_progress' }).catch(() => [])
  const routesArray = Array.isArray(rawRoutes) ? rawRoutes : []

  // Sort routes chronologically from oldest to newest
  const sorted = [...routesArray].sort((a, b) => {
    const da = normalizeDateString(a.route_date ?? a.date) || ''
    const db = normalizeDateString(b.route_date ?? b.date) || ''
    return da.localeCompare(db)
  })

  routesList.value = sorted.map(mapRouteForDriver)
}

onMounted(async () => {
  try {
    await loadDriverRoutes()
  } catch {
    routesList.value = []
  } finally {
    loading.value = false
  }
})

watch(
  () => navStore.currentPage,
  async (page) => {
    if (page !== 'dashboard') return
    try {
      await loadDriverRoutes()
    } catch {
      // keep existing list if refresh fails
    }
  }
)

const driverStops = computed(() => {
  return routesList.value.flatMap((r) =>
    (r?.stops ?? []).map((s) => ({
      id: s._id ?? s.id,
      routeId: s.routeId ?? r.id,
      date: r.date,
      client: s.client,
      company: s.company,
      contactPerson: s.contactPerson,
      clientPhone: s.clientPhone,
      area: s.area,
      address: s.address,
      timeWindow: s.timeWindow,
      estimatedBags: s.estimatedBags,
      actualBags: s.actualBags,
      status: s.status,
      originalStatus: s.originalStatus,
      type: s.type,
    }))
  )
})

const driverKPIs = computed(() => {
  const stops = driverStops.value
  const pickups = stops.filter((s) => s.type === 'Pickup').length
  const deliveries = stops.filter((s) => s.type === 'Delivery').length
  const completed = stops.filter((s) => s.status === 'Completed').length
  const total = stops.length
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0
  return [
    { label: t('driver.todaysPickups'), value: pickups, color: 'blue' },
    { label: t('driver.todaysDeliveries'), value: deliveries, color: 'green' },
    { label: t('driver.routeProgress'), value: `${pct}%`, color: 'yellow' },
  ]
})
</script>
