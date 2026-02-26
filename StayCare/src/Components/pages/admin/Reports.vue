<template>
  <div class="space-y-6">
    <h2 class="text-lg font-semibold text-white">Reports</h2>

    <div class="grid grid-cols-1 xl:grid-cols-2 gap-6">
      <!-- Revenue Chart -->
      <div class="bg-white rounded-xl shadow-sm p-5">
        <h3 class="text-sm font-semibold text-gray-700 mb-4">Revenue by Month</h3>
        <div class="flex items-end gap-2 sm:gap-3 h-48">
          <div
            v-for="(val, i) in revenueByMonth.values" :key="i"
            class="flex-1 flex flex-col items-center gap-1"
          >
            <span class="text-xs font-semibold text-gray-600">&euro;{{ (val / 1000).toFixed(1) }}k</span>
            <div
              class="w-full rounded-t-md bg-gradient-to-t from-[#FF56B0] to-[#FF89C8] transition-all duration-500"
              :style="{ height: (val / maxRevenue) * 100 + '%' }"
            ></div>
            <span class="text-xs text-gray-400">{{ revenueByMonth.labels[i] }}</span>
          </div>
        </div>
      </div>

      <!-- Orders by Client -->
      <div class="bg-white rounded-xl shadow-sm p-5">
        <h3 class="text-sm font-semibold text-gray-700 mb-4">Orders by Client</h3>
        <div class="space-y-3">
          <div v-for="row in ordersByClient" :key="row.client" class="flex items-center gap-3">
            <div class="flex-1 min-w-0">
              <div class="flex items-center justify-between mb-1">
                <span class="text-sm font-medium text-gray-800 truncate">{{ row.client }}</span>
                <span class="text-xs text-gray-400 whitespace-nowrap ml-2">{{ row.orders }} orders</span>
              </div>
              <div class="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <div class="h-full bg-[#00F5F3] rounded-full transition-all"
                  :style="{ width: (row.revenue / maxClientRevenue) * 100 + '%' }"></div>
              </div>
            </div>
            <span class="text-sm font-semibold text-gray-700 w-16 text-right">&euro;{{ row.revenue.toLocaleString() }}</span>
          </div>
        </div>
      </div>

      <!-- SLA Report -->
      <div class="bg-white rounded-xl shadow-sm p-5">
        <h3 class="text-sm font-semibold text-gray-700 mb-4">SLA Performance</h3>
        <div class="grid grid-cols-2 gap-4">
          <div class="text-center p-4 bg-green-50 rounded-lg">
            <p class="text-2xl font-bold text-green-700">{{ slaReport.onTime }}%</p>
            <p class="text-xs text-green-600 mt-1">On Time</p>
          </div>
          <div class="text-center p-4 bg-yellow-50 rounded-lg">
            <p class="text-2xl font-bold text-yellow-700">{{ slaReport.late }}%</p>
            <p class="text-xs text-yellow-600 mt-1">Late</p>
          </div>
          <div class="text-center p-4 bg-red-50 rounded-lg">
            <p class="text-2xl font-bold text-red-700">{{ slaReport.critical }}%</p>
            <p class="text-xs text-red-600 mt-1">Critical</p>
          </div>
          <div class="text-center p-4 bg-blue-50 rounded-lg">
            <p class="text-2xl font-bold text-blue-700">{{ slaReport.avgProcessingHours }}h</p>
            <p class="text-xs text-blue-600 mt-1">Avg Processing</p>
          </div>
        </div>
      </div>

      <!-- Avg Delivery Time -->
      <div class="bg-white rounded-xl shadow-sm p-5">
        <h3 class="text-sm font-semibold text-gray-700 mb-4">Key Metrics</h3>
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <span class="text-sm text-gray-600">Avg. Processing Time</span>
            <span class="text-sm font-bold text-gray-800">{{ slaReport.avgProcessingHours }}h</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-sm text-gray-600">Avg. Delivery Time</span>
            <span class="text-sm font-bold text-gray-800">{{ slaReport.avgDeliveryHours }}h</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-sm text-gray-600">Total Clients</span>
            <span class="text-sm font-bold text-gray-800">{{ clientsList.length }}</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-sm text-gray-600">Active Drivers</span>
            <span class="text-sm font-bold text-gray-800">{{ driversList.filter(d => d.status === 'Active').length }}</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-sm text-gray-600">Total Revenue (6mo)</span>
            <span class="text-sm font-bold text-gray-800">&euro;{{ totalRevenue.toLocaleString() }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { revenueByMonth, ordersByClient, slaReport, clientsList, driversList } from '../../../data/extendedMockData.js'

const maxRevenue = computed(() => Math.max(...revenueByMonth.values))
const maxClientRevenue = computed(() => Math.max(...ordersByClient.map(r => r.revenue)))
const totalRevenue = computed(() => revenueByMonth.values.reduce((a, b) => a + b, 0))
</script>
