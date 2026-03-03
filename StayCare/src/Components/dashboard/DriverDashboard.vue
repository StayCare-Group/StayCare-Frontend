<template>
  <div>
    <!-- Sub-pages -->
    <RouteView v-if="navStore.currentPage === 'route'" />
    <PickupConfirm v-else-if="navStore.currentPage === 'pickup-confirm'" />
    <DeliveryConfirm v-else-if="navStore.currentPage === 'delivery-confirm'" />
    <DriverHistory v-else-if="navStore.currentPage === 'history'" />
    <Settings v-else-if="navStore.currentPage === 'settings'" />

    <!-- Default dashboard overview -->
    <div v-else class="space-y-6">
      <!-- KPI Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <KpiCard v-for="kpi in driverKPIs" :key="kpi.label" :label="kpi.label" :value="kpi.value" :color="kpi.color" />
      </div>

      <!-- Stops List -->
      <div class="bg-white rounded-xl shadow-sm">
        <div class="px-5 py-4 border-b border-gray-100">
          <h3 class="text-base font-semibold text-gray-800">{{ $t('driver.assignedStops') }}</h3>
        </div>
        <div class="p-3 sm:p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          <div
            v-for="stop in driverStops"
            :key="stop.id"
            class="border border-gray-100 rounded-lg p-4 hover:shadow-md transition-shadow flex flex-col justify-between"
          >
            <div>
              <div class="flex items-center justify-between mb-2">
                <StatusBadge :status="stop.type" />
                <StatusBadge :status="stop.status" />
              </div>
              <h4 class="text-sm font-semibold text-gray-800">{{ stop.client }}</h4>
              <p class="text-xs text-gray-500 mt-1">{{ stop.address }}</p>
              <div class="mt-3 flex items-center justify-between">
                <span class="text-xs text-gray-500">{{ $t('driver.expectedBags') }}</span>
                <span class="text-sm font-bold text-gray-700">{{ stop.bags }}</span>
              </div>
            </div>
            <div class="mt-3 flex flex-wrap gap-2">
              <button
                v-if="stop.type === 'Pickup' && stop.status !== 'Completed'"
                @click="navStore.goToDetail('pickup-confirm', stop.id)"
                class="bg-[#FF56B0] text-white font-medium py-1.5 px-3 rounded-lg text-xs hover:opacity-90 transition"
              >
                {{ $t('driver.confirmPickup') }}
              </button>
              <button
                v-if="stop.type === 'Delivery' && stop.status !== 'Completed'"
                @click="navStore.goToDetail('delivery-confirm', stop.id)"
                class="bg-[#00F5F3] text-gray-800 font-medium py-1.5 px-3 rounded-lg text-xs hover:opacity-90 transition"
              >
                {{ $t('driver.confirmDelivery') }}
              </button>
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
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import KpiCard from '../ui/KpiCard.vue'
import StatusBadge from '../ui/StatusBadge.vue'
import RouteView from '../pages/driver/RouteView.vue'
import PickupConfirm from '../pages/driver/PickupConfirm.vue'
import DeliveryConfirm from '../pages/driver/DeliveryConfirm.vue'
import DriverHistory from '../pages/driver/DriverHistory.vue'
import Settings from '../pages/shared/Settings.vue'
import { useNavStore } from '../../stores/nav.js'
import { fetchRoutes, mapRouteForDriver } from '../../api/routes'

const { t } = useI18n()
const navStore = useNavStore()

const route = ref(null)
const loading = ref(true)

onMounted(async () => {
  try {
    const today = new Date().toISOString().split('T')[0]
    const data = await fetchRoutes({ date: today })
    const routes = (data ?? []).map(mapRouteForDriver)
    route.value = routes[0] ?? null
  } catch { /* stays null */ } finally {
    loading.value = false
  }
})

const driverKPIs = computed(() => {
  const stops = route.value?.stops ?? []
  const pickups = stops.filter(s => s.type === 'Pickup').length
  const deliveries = stops.filter(s => s.type === 'Delivery').length
  const completed = stops.filter(s => s.status === 'Completed').length
  const total = stops.length
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0
  return [
    { label: t('driver.todaysPickups'), value: pickups, color: 'blue' },
    { label: t('driver.todaysDeliveries'), value: deliveries, color: 'green' },
    { label: t('driver.routeProgress'), value: `${pct}%`, color: 'yellow' },
  ]
})

const driverStops = computed(() => {
  const stops = route.value?.stops ?? []
  return stops.map(s => ({
    id: s.id,
    client: s.client,
    address: s.address,
    bags: s.estimatedBags,
    status: s.status,
    type: s.type,
  }))
})
</script>
