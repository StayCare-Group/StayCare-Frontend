<template>
  <div class="space-y-6 bg-white rounded-xl shadow-sm p-5">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div>
        <h2 class="text-lg font-semibold text-gray-800">Today's Route</h2>
        <p class="text-sm text-gray-500">{{ driverRoute.date }} &middot; {{ driverRoute.vehiclePlate }}</p>
      </div>
      <div class="flex items-center gap-3">
        <span class="text-sm text-gray-500">{{ driverRoute.completedStops }}/{{ driverRoute.totalStops }} stops completed</span>
        <div class="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div class="h-full bg-[#FF56B0] rounded-full transition-all" :style="{ width: progress + '%' }"></div>
        </div>
      </div>
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
            <button
              v-if="stop.type === 'Pickup' && stop.status !== 'Completed'"
              @click="navStore.goToDetail('pickup-confirm', stop.id)"
              class="bg-[#FF56B0] text-white font-medium py-1.5 px-4 rounded-lg text-xs hover:opacity-90 transition"
            >Confirm Pickup</button>
            <button
              v-if="stop.type === 'Delivery' && stop.status !== 'Completed'"
              @click="navStore.goToDetail('delivery-confirm', stop.id)"
              class="bg-[#00F5F3] text-gray-800 font-medium py-1.5 px-4 rounded-lg text-xs hover:opacity-90 transition"
            >Confirm Delivery</button>
            <span v-if="stop.status === 'Completed'" class="text-xs text-green-600 font-medium flex items-center gap-1">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
              Done
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import StatusBadge from '../../ui/StatusBadge.vue'
import { useNavStore } from '../../../stores/nav.js'
import { driverRoute } from '../../../data/extendedMockData.js'

const navStore = useNavStore()

const progress = computed(() =>
  driverRoute.totalStops > 0
    ? Math.round((driverRoute.completedStops / driverRoute.totalStops) * 100)
    : 0
)
</script>
