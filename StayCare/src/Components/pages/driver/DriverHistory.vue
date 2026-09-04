<template>
  <div class="space-y-6">
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <h2 class="text-lg font-semibold text-brand-700">{{ $t('driver.history') }}</h2>
      <div class="flex flex-wrap items-center gap-2">
        <DateRangeFilter
          id-prefix="driver-history"
          :from="dateFrom"
          :to="dateTo"
          :label="$t('driver.routeDate')"
          @update:from="onDateFromChange"
          @update:to="onDateToChange"
          @clear="clearDateFilter"
        />
        <button
          v-if="!isDefault15Days"
          type="button"
          data-testid="reset-15-days"
          @click="resetToLast15Days"
          class="text-xs text-brand-700 hover:text-brand-800 font-medium underline px-1"
        >
          {{ $t('driver.reset15Days') }}
        </button>
      </div>
    </div>

    <LoadingPanel v-if="loading" />

    <p v-else-if="!pastRoutes.length" class="text-sm text-gray-400 bg-white rounded-xl shadow-sm p-5">
      {{ $t('driver.noHistory') }}
    </p>

    <div v-for="route in pastRoutes" :key="route._id" class="bg-white rounded-xl shadow-sm p-5 space-y-4">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h3 class="text-sm font-semibold text-gray-800">{{ route.date }}</h3>
          <p class="text-xs text-gray-500">{{ route.totalStops }} {{ $t('driver.stops') }} &middot; {{ route.completedStops }} {{ $t('common.done').toLowerCase() }}</p>
        </div>
        <span
          class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
          :class="{
            'bg-green-100 text-green-700': route.status === 'completed',
            'bg-blue-100 text-blue-700': route.status === 'in_progress',
            'bg-gray-100 text-gray-600': route.status === 'planned',
          }"
        >{{ getRouteStatusLabel(route.status) }}</span>
      </div>

      <div class="divide-y divide-gray-50">
        <div
          v-for="stop in route.stops"
          :key="stop.id"
          class="flex items-center gap-3 py-3"
        >
          <div
            class="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
            :class="stop.status === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'"
          >{{ stop.id }}</div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-gray-800">{{ stop.client }}</p>
            <p class="text-xs text-gray-500">{{ stop.address || $t('driver.noAddress') }}</p>
            <p class="text-xs text-gray-400">{{ stop.type }} &middot; {{ stop.timeWindow }} &middot; Est: {{ stop.estimatedBags }} {{ $t('driver.bags') }}<span v-if="stop.actualBags !== null"> &middot; Act: {{ stop.actualBags }} {{ $t('driver.bags') }}</span></p>
          </div>
          <span
            class="text-xs font-medium shrink-0"
            :class="stop.status === 'Completed' ? 'text-green-600' : 'text-gray-400'"
          >{{ stop.status === 'Completed' ? $t('common.done') : $t('orderStatuses.pending') }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { fetchAllRoutes, mapRouteForDriver } from '../../../api/routes'
import DateRangeFilter from '../../ui/DateRangeFilter.vue'
import LoadingPanel from '../../ui/LoadingPanel.vue'
import { getDefaultDateRange, getTodayDateString } from '../../../utils/date'

const { t } = useI18n()

const defaultRange = getDefaultDateRange(15)
const dateFrom = ref(defaultRange.from)
const dateTo = ref(defaultRange.to)

const loading = ref(true)
const allRoutes = ref([])

const isDefault15Days = computed(() => {
  const current = getDefaultDateRange(15)
  return dateFrom.value === current.from && dateTo.value === current.to
})

function onDateFromChange(val) {
  dateFrom.value = val
}

function onDateToChange(val) {
  dateTo.value = val
}

function clearDateFilter() {
  dateFrom.value = ''
  dateTo.value = ''
}

function resetToLast15Days() {
  const range = getDefaultDateRange(15)
  dateFrom.value = range.from
  dateTo.value = range.to
}

function getRouteStatusLabel(status) {
  const map = {
    completed: t('routePlanner.statusCompleted'),
    in_progress: t('routePlanner.statusInProgress'),
    planned: t('routePlanner.statusPlanned'),
  }
  return map[status] ?? status
}

const pastRoutes = computed(() => {
  const today = getTodayDateString()
  return allRoutes.value.filter(r => {
    const isHistory = r.status === 'completed' || (r.date && r.date < today)
    if (!isHistory) return false
    if (dateFrom.value && r.date < dateFrom.value) return false
    if (dateTo.value && r.date > dateTo.value) return false
    return true
  })
})

async function loadHistory() {
  loading.value = true
  try {
    const data = await fetchAllRoutes().catch(() => [])
    allRoutes.value = (data ?? []).map(mapRouteForDriver)
  } catch {
    allRoutes.value = []
  } finally {
    loading.value = false
  }
}

onMounted(loadHistory)
</script>
