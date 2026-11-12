<template>
  <div class="bg-white rounded-xl shadow-sm p-4 sm:p-5 flex flex-col xl:h-0 xl:min-h-full">
    <!-- Header -->
    <div class="flex items-center justify-between mb-2.5 gap-2 flex-wrap flex-shrink-0">
      <div class="flex items-center gap-2">
        <h3 class="text-sm font-semibold text-brand-900">
          {{ $t('admin.alertsTitle') }}
        </h3>
        <span
          data-testid="alerts-total-badge"
          :class="totalCount > 0 ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'"
          class="px-2 py-0.5 rounded-full text-xs font-semibold"
        >
          {{ totalCount }}
        </span>
      </div>

      <!-- Tabs -->
      <div class="inline-flex rounded-lg bg-gray-100 p-0.5 text-xs font-medium">
        <button
          type="button"
          data-testid="tab-overdue-pickups"
          :class="activeTab === 'pickups' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'"
          class="px-2.5 py-1 rounded-md transition-all flex items-center gap-1.5 cursor-pointer"
          @click="activeTab = 'pickups'"
        >
          <span>{{ $t('admin.alertOverduePickups') }}</span>
          <span
            v-if="overduePickups.length > 0"
            class="px-1.5 py-0.2 rounded-full text-[10px] bg-red-100 text-red-700 font-semibold"
          >
            {{ overduePickups.length }}
          </span>
        </button>

        <button
          type="button"
          data-testid="tab-stalled-orders"
          :class="activeTab === 'stalled' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'"
          class="px-2.5 py-1 rounded-md transition-all flex items-center gap-1.5 cursor-pointer"
          @click="activeTab = 'stalled'"
        >
          <span>{{ $t('admin.alertStalledOrders') }}</span>
          <span
            v-if="stalledOrders.length > 0"
            class="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-100 text-amber-700 font-semibold"
          >
            {{ stalledOrders.length }}
          </span>
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div
      v-if="loading"
      data-testid="alerts-loading"
      class="flex-1 min-h-[128px] flex items-center justify-center text-xs text-gray-400"
    >
      {{ $t('common.loading') }}
    </div>

    <!-- Active Tab Content -->
    <div v-else class="flex-1 min-h-0 flex flex-col">
      <!-- Empty State -->
      <div
        v-if="activeItems.length === 0"
        data-testid="alerts-empty"
        class="flex-1 min-h-[128px] flex flex-col items-center justify-center text-center p-2 text-gray-400"
      >
        <svg class="w-7 h-7 text-emerald-500 mb-1.5 stroke-current" fill="none" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="9" stroke-width="2" />
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.5 12.5l2.5 2.5 5-5" />
        </svg>
        <p class="text-xs sm:text-sm font-medium text-gray-600">
          {{ activeTab === 'pickups' ? $t('admin.noOverduePickups') : $t('admin.noStalledOrders') }}
        </p>
      </div>

      <!-- Items List -->
      <div
        v-else
        data-testid="alerts-list"
        class="flex-1 min-h-0 max-h-40 xl:max-h-none overflow-y-auto space-y-2 pr-1"
      >
        <div
          v-for="item in activeItems"
          :key="item.orderId"
          data-testid="alert-item"
          class="flex items-center justify-between p-2 sm:p-2.5 rounded-lg border border-gray-100 hover:border-brand-200 hover:bg-gray-50/70 transition-all cursor-pointer group"
          @click="$emit('view-order', item.orderId)"
        >
          <!-- Left: Order info -->
          <div class="min-w-0 flex-1 mr-3">
            <div class="flex items-center gap-2">
              <span class="text-xs font-semibold text-gray-900 group-hover:text-brand-600 transition-colors">
                {{ item.orderNumber }}
              </span>
              <StatusBadge :status="item.status" />
            </div>
            <p class="text-[11px] sm:text-xs text-gray-500 truncate mt-0.5">
              {{ item.clientName }}
            </p>
          </div>

          <!-- Right: Delay tag & arrow -->
          <div class="flex items-center gap-2 flex-shrink-0">
            <span
              :class="item.hoursDelayed >= 48 ? 'bg-red-50 text-red-700 border-red-200' : 'bg-amber-50 text-amber-700 border-amber-200'"
              class="px-2 py-0.5 rounded-md text-[11px] font-medium border flex items-center gap-1"
            >
              <svg class="w-3 h-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>
                {{
                  activeTab === 'pickups'
                    ? $t('admin.hoursDelayed', { hours: item.hoursDelayed })
                    : $t('admin.hoursStalled', { hours: item.hoursDelayed })
                }}
              </span>
            </span>

            <svg
              class="w-4 h-4 text-gray-300 group-hover:text-brand-500 group-hover:translate-x-0.5 transition-all"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import StatusBadge from '../ui/StatusBadge.vue'

const props = defineProps({
  alerts: {
    type: Object,
    default: () => ({
      thresholdHours: 24,
      totalAlerts: 0,
      overduePickups: [],
      stalledOrders: [],
    }),
  },
  loading: {
    type: Boolean,
    default: false,
  },
})

defineEmits(['view-order'])

const activeTab = ref('pickups')

const overduePickups = computed(() => props.alerts?.overduePickups || [])
const stalledOrders = computed(() => props.alerts?.stalledOrders || [])
const totalCount = computed(() => (overduePickups.value.length + stalledOrders.value.length))

const activeItems = computed(() => {
  return activeTab.value === 'pickups' ? overduePickups.value : stalledOrders.value
})
</script>

