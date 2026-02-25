<template>
  <div class="space-y-6">
    <!-- KPI Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      <KpiCard v-for="kpi in adminKPIs" :key="kpi.label" :label="kpi.label" :value="kpi.value" :color="kpi.color" />
    </div>

    <div class="grid grid-cols-1 xl:grid-cols-2 gap-6">
      <!-- Bar Chart -->
      <div class="bg-white rounded-xl shadow-sm p-4 sm:p-5">
        <h3 class="text-sm sm:text-base font-semibold text-gray-800 mb-4">Orders This Week</h3>
        <div class="flex items-end gap-2 sm:gap-3 h-40 sm:h-48">
          <div
            v-for="(val, i) in adminChartData.values"
            :key="i"
            class="flex-1 flex flex-col items-center gap-1"
          >
            <span class="text-xs font-semibold text-gray-600">{{ val }}</span>
            <div
              class="w-full rounded-t-md bg-gradient-to-t from-[#FF56B0] to-[#FF89C8] transition-all duration-500"
              :style="{ height: (val / maxVal) * 100 + '%' }"
            ></div>
            <span class="text-xs text-gray-400">{{ adminChartData.labels[i] }}</span>
          </div>
        </div>
      </div>

      <!-- Recent Activity -->
      <div class="bg-white rounded-xl shadow-sm">
        <div class="px-4 sm:px-5 py-3 sm:py-4 border-b border-gray-100">
          <h3 class="text-sm sm:text-base font-semibold text-gray-800">Recent Activity</h3>
        </div>
        <div class="divide-y divide-gray-50">
          <div v-for="a in adminActivity" :key="a.id" class="px-4 sm:px-5 py-3 hover:bg-gray-50 transition-colors">
            <div class="flex items-center justify-between">
              <p class="text-sm font-medium text-gray-800">{{ a.action }}</p>
              <span class="text-xs text-gray-400 whitespace-nowrap ml-3">{{ a.time }}</span>
            </div>
            <p class="text-xs text-gray-500 mt-0.5">{{ a.detail }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import KpiCard from '../ui/KpiCard.vue'
import { adminKPIs, adminChartData, adminActivity } from '../../data/mockData'

const maxVal = computed(() => Math.max(...adminChartData.values))
</script>
