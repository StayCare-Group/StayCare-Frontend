<template>
  <div
    class="bg-white rounded-xl shadow-sm p-4 sm:p-5 flex flex-col justify-between overflow-hidden"
    data-testid="item-condition-chart"
  >
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-sm font-semibold text-brand-900">
        {{ $t('admin.itemConditionTitle') }}
      </h3>
      <span
        class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-150 text-brand-700 tabular-nums"
        data-testid="item-condition-total"
      >
        {{ totalItems }}
      </span>
    </div>

    <div
      v-if="totalItems === 0"
      class="flex-1 flex items-center justify-center py-8 text-center text-sm text-gray-400"
      data-testid="item-condition-empty"
    >
      {{ $t('admin.noVerifiedItemsInPeriod') }}
    </div>

    <div
      v-else
      class="flex flex-col sm:flex-row items-center gap-2.5 sm:gap-3 my-auto w-full"
    >
      <!-- SVG Donut Chart -->
      <div class="relative w-24 h-24 xl:w-28 xl:h-28 shrink-0">
        <svg viewBox="0 0 120 120" class="w-full h-full -rotate-90">
          <circle
            cx="60"
            cy="60"
            :r="RADIUS"
            fill="none"
            stroke="#f3f4f6"
            stroke-width="18"
          />
          <circle
            v-for="seg in segments"
            :key="seg.key"
            cx="60"
            cy="60"
            :r="RADIUS"
            fill="none"
            :stroke="seg.color"
            stroke-width="18"
            :stroke-dasharray="`${seg.dashLength} ${CIRCUMFERENCE}`"
            :stroke-dashoffset="-seg.dashOffset"
            class="transition-all duration-300"
          >
            <title>{{ seg.label }}: {{ seg.count }} ({{ seg.percentFormatted }}%)</title>
          </circle>
        </svg>
      </div>

      <!-- Legend with count and percentage -->
      <div class="flex-1 min-w-0 w-full space-y-2.5">
        <div
          v-for="item in legendItems"
          :key="item.key"
          class="flex items-center justify-between gap-1.5 text-xs"
          :data-testid="`condition-row-${item.key}`"
        >
          <div class="flex items-center gap-1.5 min-w-0">
            <span
              class="w-2.5 h-2.5 rounded-full shrink-0"
              :style="{ backgroundColor: item.color }"
            />
            <span class="font-medium text-gray-700 truncate">{{ item.label }}</span>
          </div>
          <div class="flex items-center gap-1 shrink-0 tabular-nums">
            <span class="font-bold text-brand-700">{{ item.count }}</span>
            <span class="text-gray-500">({{ item.percentFormatted }}%)</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { DashboardItemConditions } from '../../api/reports'

const RADIUS = 49
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

const props = withDefaults(
  defineProps<{
    conditions?: DashboardItemConditions
  }>(),
  {
    conditions: () => ({
      good: 0,
      bad: 0,
      stained: 0,
      total: 0,
    }),
  }
)

const { t } = useI18n()

const goodCount = computed(() => Math.max(0, Number(props.conditions?.good) || 0))
const badCount = computed(() => Math.max(0, Number(props.conditions?.bad) || 0))
const stainedCount = computed(() => Math.max(0, Number(props.conditions?.stained) || 0))

const totalItems = computed(() => goodCount.value + badCount.value + stainedCount.value)

function formatPercent(count: number, total: number): string {
  if (total <= 0 || count <= 0) return '0'
  const raw = (count / total) * 100
  return Number.isInteger(Math.round(raw * 10) / 10)
    ? String(Math.round(raw))
    : raw.toFixed(1)
}

const legendItems = computed(() => {
  const total = totalItems.value
  return [
    {
      key: 'good',
      label: t('admin.itemsGoodCondition'),
      count: goodCount.value,
      color: '#10b981', // emerald-500
      percentFormatted: formatPercent(goodCount.value, total),
    },
    {
      key: 'bad',
      label: t('admin.itemsBadCondition'),
      count: badCount.value,
      color: '#f43f5e', // rose-500
      percentFormatted: formatPercent(badCount.value, total),
    },
    {
      key: 'stained',
      label: t('admin.itemsStainedCondition'),
      count: stainedCount.value,
      color: '#f59e0b', // amber-500
      percentFormatted: formatPercent(stainedCount.value, total),
    },
  ]
})

const segments = computed(() => {
  const total = totalItems.value
  if (total <= 0) return []

  let cumulativeOffset = 0
  return legendItems.value
    .filter((item) => item.count > 0)
    .map((item) => {
      const fraction = item.count / total
      const dashLength = fraction * CIRCUMFERENCE
      const seg = {
        ...item,
        dashLength,
        dashOffset: cumulativeOffset,
      }
      cumulativeOffset += dashLength
      return seg
    })
})
</script>

