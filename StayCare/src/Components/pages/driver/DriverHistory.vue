<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <h2 class="text-lg font-semibold text-white">{{ $t('driver.history') }}</h2>
      <input
        v-model="dateFilter"
        type="date"
        class="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-400 focus:border-transparent outline-none"
      />
    </div>

    <p v-if="loading" class="text-sm text-gray-400">{{ $t('common.loading') }}</p>

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
        >{{ route.status }}</span>
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
            <p class="text-xs text-gray-400">{{ stop.type }} &middot; {{ stop.timeWindow }} &middot; {{ stop.estimatedBags }} {{ $t('driver.bags') }}</p>
          </div>
          <span
            class="text-xs font-medium shrink-0"
            :class="stop.status === 'Completed' ? 'text-green-600' : 'text-gray-400'"
          >{{ stop.status }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { fetchRoutes, mapRouteForDriver } from '../../../api/routes'

const loading = ref(true)
const pastRoutes = ref([])
const dateFilter = ref('')

async function loadHistory() {
  loading.value = true
  try {
    const params = {}
    if (dateFilter.value) {
      params.date = dateFilter.value
    }
    const data = await fetchRoutes(params)
    const all = (data ?? []).map(mapRouteForDriver)
    if (dateFilter.value) {
      pastRoutes.value = all
    } else {
      const _d = new Date()
      const today = `${_d.getFullYear()}-${String(_d.getMonth()+1).padStart(2,'0')}-${String(_d.getDate()).padStart(2,'0')}`
      pastRoutes.value = all.filter(r => r.date < today || r.status === 'completed')
    }
  } catch {
    pastRoutes.value = []
  } finally {
    loading.value = false
  }
}

onMounted(loadHistory)
watch(dateFilter, loadHistory)
</script>
