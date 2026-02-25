<template>
  <div>
    <!-- Sub-pages -->
    <RouteView v-if="navStore.currentPage === 'route'" />
    <PickupConfirm v-else-if="navStore.currentPage === 'pickup-confirm'" />
    <DeliveryConfirm v-else-if="navStore.currentPage === 'delivery-confirm'" />
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
          <h3 class="text-base font-semibold text-gray-800">Assigned Stops</h3>
        </div>
        <div class="p-3 sm:p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          <div
            v-for="stop in driverStops"
            :key="stop.id"
            class="border border-gray-100 rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <div class="flex items-center justify-between mb-2">
              <StatusBadge :status="stop.type" />
              <StatusBadge :status="stop.status" />
            </div>
            <h4 class="text-sm font-semibold text-gray-800">{{ stop.client }}</h4>
            <p class="text-xs text-gray-500 mt-1">{{ stop.address }}</p>
            <div class="mt-3 flex items-center justify-between">
              <span class="text-xs text-gray-500">Expected bags</span>
              <span class="text-sm font-bold text-gray-700">{{ stop.bags }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import KpiCard from '../ui/KpiCard.vue'
import StatusBadge from '../ui/StatusBadge.vue'
import RouteView from '../pages/driver/RouteView.vue'
import PickupConfirm from '../pages/driver/PickupConfirm.vue'
import DeliveryConfirm from '../pages/driver/DeliveryConfirm.vue'
import Settings from '../pages/shared/Settings.vue'
import { useNavStore } from '../../stores/nav.js'
import { driverKPIs, driverStops } from '../../data/mockData'

const navStore = useNavStore()
</script>
