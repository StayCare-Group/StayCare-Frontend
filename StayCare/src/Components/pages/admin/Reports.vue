<template>
  <div class="space-y-6">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <h2 class="text-lg font-semibold text-brand-700">{{ $t('reports.title') }}</h2>

      <div class="flex flex-wrap items-center gap-3">
        <div class="inline-flex items-center gap-2 rounded-lg bg-gray-100 p-1">
          <AppButton
            size="sm"
            :variant="reportPeriodType === 'month' ? 'primary' : 'ghost'"
            @click="reportPeriodType = 'month'"
          >
            {{ $t('admin.reportByMonth') }}
          </AppButton>
          <AppButton
            size="sm"
            :variant="reportPeriodType === 'year' ? 'primary' : 'ghost'"
            @click="reportPeriodType = 'year'"
          >
            {{ $t('admin.reportByYear') }}
          </AppButton>
        </div>

        <select
          v-if="reportPeriodType === 'month'"
          v-model="selectedMonth"
          class="rounded-lg border border-gray-200 bg-white text-gray-700 text-sm px-3 py-2
                 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent"
        >
          <option v-for="m in monthOptions" :key="m.value" :value="m.value" class="text-gray-800">
            {{ m.label }}
          </option>
        </select>
        <select
          v-else
          v-model="selectedYear"
          class="rounded-lg border border-gray-200 bg-white text-gray-700 text-sm px-3 py-2
                 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent"
        >
          <option v-for="y in yearOptions" :key="y" :value="y" class="text-gray-800">{{ y }}</option>
        </select>

        <button
          @click="exportToExcel"
          :disabled="loading || !hasOrdersInPeriod"
          class="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white
                 bg-gradient-to-r from-brand-700 to-brand-400 hover:opacity-90
                 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-sm"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V3"/>
          </svg>
          {{ $t('admin.exportExcel') }}
        </button>
      </div>
    </div>

    <div class="grid grid-cols-1 xl:grid-cols-2 gap-6">
      <!-- Revenue Chart -->
      <div class="bg-white rounded-xl shadow-sm p-5">
        <h3 class="text-sm font-semibold text-gray-700 mb-4">{{ $t('reports.revenueByMonth') }}</h3>
        <div class="flex items-end gap-2 sm:gap-3 h-48">
          <div
            v-for="(val, i) in revenueByMonth.values" :key="i"
            class="flex-1 flex flex-col items-center gap-1"
          >
            <span class="text-xs font-semibold text-gray-600">&euro;{{ (val / 1000).toFixed(1) }}k</span>
            <div
              class="w-full rounded-t-md bg-gradient-to-t from-brand-700 to-brand-400 transition-all duration-500"
              :style="{ height: (val / maxRevenue) * 100 + '%' }"
            ></div>
            <span class="text-xs text-gray-400">{{ revenueByMonth.labels[i] }}</span>
          </div>
        </div>
      </div>

      <!-- Orders by Client -->
      <div class="bg-white rounded-xl shadow-sm p-5">
        <h3 class="text-sm font-semibold text-gray-700 mb-4">{{ $t('reports.ordersByClient') }}</h3>
        <div class="space-y-3">
          <div v-for="row in ordersByClient" :key="row.client" class="flex items-center gap-3">
            <div class="flex-1 min-w-0">
              <div class="flex items-center justify-between mb-1">
                <span class="text-sm font-medium text-gray-800 truncate">{{ row.client }}</span>
                <span class="text-xs text-gray-400 whitespace-nowrap ml-2">{{ row.orders }} {{ $t('reports.orders') }}</span>
              </div>
              <div class="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <div class="h-full bg-brand-400 rounded-full transition-all"
                  :style="{ width: (row.revenue / maxClientRevenue) * 100 + '%' }"></div>
              </div>
            </div>
            <span class="text-sm font-semibold text-gray-700 w-16 text-right">&euro;{{ row.revenue.toLocaleString() }}</span>
          </div>
        </div>
      </div>

      <!-- SLA Report -->
      <div class="bg-white rounded-xl shadow-sm p-5">
        <h3 class="text-sm font-semibold text-gray-700 mb-4">{{ $t('reports.slaPerformance') }}</h3>
        <div class="grid grid-cols-2 gap-4">
          <div class="text-center p-4 bg-green-50 rounded-lg">
            <p class="text-2xl font-bold text-green-700">{{ slaReport.onTime }}%</p>
            <p class="text-xs text-green-600 mt-1">{{ $t('reports.onTime') }}</p>
          </div>
          <div class="text-center p-4 bg-yellow-50 rounded-lg">
            <p class="text-2xl font-bold text-yellow-700">{{ slaReport.late }}%</p>
            <p class="text-xs text-yellow-600 mt-1">{{ $t('reports.late') }}</p>
          </div>
          <div class="text-center p-4 bg-red-50 rounded-lg">
            <p class="text-2xl font-bold text-red-700">{{ slaReport.critical }}%</p>
            <p class="text-xs text-red-600 mt-1">{{ $t('reports.critical') }}</p>
          </div>
          <div class="text-center p-4 bg-blue-50 rounded-lg">
            <p class="text-2xl font-bold text-blue-700">{{ slaReport.avgProcessingHours }}h</p>
            <p class="text-xs text-blue-600 mt-1">{{ $t('reports.avgProcessing') }}</p>
          </div>
        </div>
      </div>

      <!-- Avg Delivery Time -->
      <div class="bg-white rounded-xl shadow-sm p-5">
        <h3 class="text-sm font-semibold text-gray-700 mb-4">{{ $t('reports.keyMetrics') }}</h3>
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <span class="text-sm text-gray-600">{{ $t('reports.avgProcessingTime') }}</span>
            <span class="text-sm font-bold text-gray-800">{{ slaReport.avgProcessingHours }}h</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-sm text-gray-600">{{ $t('reports.avgDeliveryTime') }}</span>
            <span class="text-sm font-bold text-gray-800">{{ slaReport.avgDeliveryHours }}h</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-sm text-gray-600">{{ $t('reports.totalClients') }}</span>
            <span class="text-sm font-bold text-gray-800">{{ clientsList.length }}</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-sm text-gray-600">{{ $t('reports.activeDrivers') }}</span>
            <span class="text-sm font-bold text-gray-800">{{ driversList.filter(d => d.status === 'Active').length }}</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-sm text-gray-600">{{ $t('reports.totalRevenue6mo') }}</span>
            <span class="text-sm font-bold text-gray-800">&euro;{{ totalRevenue.toLocaleString() }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
import { useReportsData } from '../../../composables/reports/useReportsData'
import { useReportExport } from '../../../composables/reports/useReportExport'
import AppButton from '../../ui/AppButton.vue'

const { t } = useI18n()

const {
  orders,
  invoices,
  clientsList,
  driversList,
  loading,
  monthOptions,
  yearOptions,
  selectedMonth,
  selectedYear,
  reportPeriodType,
  hasOrdersInPeriod,
  revenueByMonth,
  ordersByClient,
  slaReport,
  maxRevenue,
  maxClientRevenue,
  totalRevenue,
} = useReportsData(t)

const { exportToExcel } = useReportExport(t, {
  reportPeriodType,
  selectedMonth,
  selectedYear,
  monthOptions,
  orders,
  invoices,
  clientsList,
  driversList,
  slaReport,
  totalRevenue,
})
</script>
