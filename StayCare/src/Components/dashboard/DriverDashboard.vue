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
          <div class="flex items-center gap-3">
            <button @click="shiftSelectedDate(-1)" class="text-gray-400 hover:text-gray-700 p-1">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
            </button>
            <input
              v-model="selectedDate"
              type="date"
              class="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-400 focus:border-transparent outline-none"
            />
            <button @click="shiftSelectedDate(1)" class="text-gray-400 hover:text-gray-700 p-1">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
            </button>
            <button @click="selectedDate = localDateStr()" class="text-xs text-brand-700 hover:underline font-medium">{{ $t('common.today') }}</button>
          </div>
        </div>

        <div class="flex gap-2 flex-wrap">
          <button
            v-for="day in routeDateOptions"
            :key="day.date"
            @click="selectedDate = day.date"
            class="px-3 py-1.5 rounded-lg text-xs font-medium border transition"
            :class="selectedDate === day.date
              ? 'bg-brand-700 text-white border-brand-700'
              : day.count > 0 ? 'bg-gray-50 text-gray-700 border-gray-200 hover:border-brand-700' : 'bg-white text-gray-400 border-gray-100'"
          >
            {{ day.label }} <span v-if="day.count" class="ml-1 opacity-75">({{ day.count }})</span>
          </button>
        </div>

        <p v-if="!driverStops.length" class="text-sm text-gray-400">{{ $t('routePlanner.noRoutesFor', { date: selectedDate }) }}</p>

        <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          <div
            v-for="stop in driverStops"
            :key="stop.id"
            class="border border-gray-100 rounded-lg p-4 hover:shadow-md transition-shadow flex flex-col justify-between"
          >
            <div>
              <div class="flex items-center justify-between mb-2">
                <StatusBadge v-if="stop.status !== 'Completed'" :status="stop.type" />
                <StatusBadge :status="stop.status" />
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
                size="sm" variant="secondary"
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

const { t } = useI18n()
const navStore = useNavStore()
const authStore = useAuthStore()

const routesList = ref([])
const selectedDate = ref('')
const loading = ref(true)

function localDateStr(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

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

  const todayRoute = sorted.find((r) => {
    const routeDate = parseLocalDate(r.date)
    return routeDate && routeDate.getTime() === today.getTime()
  })
  if (todayRoute) return todayRoute

  const nextRoute = sorted.find((r) => {
    const routeDate = parseLocalDate(r.date)
    return routeDate && routeDate.getTime() > today.getTime()
  })

  return nextRoute ?? sorted[sorted.length - 1]
}

function pickDefaultDate(routes) {
  if (!routes.length) return localDateStr()
  const today = localDateStr()
  if (routes.some(r => r.date === today)) return today
  return pickCurrentOrNextRoute(routes)?.date ?? routes[0]?.date ?? today
}

function shiftSelectedDate(offset) {
  const baseDate = parseLocalDate(selectedDate.value) ?? new Date()
  const shifted = new Date(baseDate)
  shifted.setDate(baseDate.getDate() + offset)
  selectedDate.value = localDateStr(shifted)
}

async function loadDriverRoutes() {
  const driverId = authStore.user?.id
  if (!driverId) return
  const data = await fetchRoutesByDriver(driverId)
  routesList.value = (data ?? []).map(mapRouteForDriver)
  if (!selectedDate.value) {
    selectedDate.value = pickDefaultDate(routesList.value)
  }
}

onMounted(async () => {
  try {
    await loadDriverRoutes()
  } catch { /* stays null */ } finally {
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

const filteredRoutes = computed(() => {
  if (!selectedDate.value) return []
  return routesList.value.filter(r => r.date === selectedDate.value)
})

const driverStops = computed(() => {
  return filteredRoutes.value.flatMap(r =>
    (r?.stops ?? []).map(s => ({
      id: s._id ?? s.id,
      routeId: s.routeId ?? r.id,
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

const routeDateOptions = computed(() => {
  const today = new Date()
  const dayKeys = ['daySun', 'dayMon', 'dayTue', 'dayWed', 'dayThu', 'dayFri', 'daySat']
  const days = []

  for (let i = -2; i <= 4; i++) {
    const d = new Date(today)
    d.setDate(today.getDate() + i)
    const dateStr = localDateStr(d)
    const count = routesList.value.filter(r => r.date === dateStr).reduce((total, route) => total + (route?.stops?.length ?? 0), 0)
    const label = i === 0
      ? t('common.today')
      : i === 1
        ? t('routePlanner.tomorrow')
        : `${t('common.' + dayKeys[d.getDay()])} ${d.getDate()}`
    days.push({ date: dateStr, label, count })
  }

  if (selectedDate.value && !days.some(day => day.date === selectedDate.value)) {
    const selected = parseLocalDate(selectedDate.value)
    if (selected) {
      days.push({
        date: selectedDate.value,
        label: `${t('common.' + dayKeys[selected.getDay()])} ${selected.getDate()}`,
        count: filteredRoutes.value.reduce((total, route) => total + (route?.stops?.length ?? 0), 0),
      })
    }
  }

  return days.sort((a, b) => {
    const da = parseLocalDate(a.date)?.getTime() ?? Number.MAX_SAFE_INTEGER
    const db = parseLocalDate(b.date)?.getTime() ?? Number.MAX_SAFE_INTEGER
    return da - db
  })
})

const driverKPIs = computed(() => {
  const stops = driverStops.value
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
</script>
