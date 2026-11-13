<template>
  <div class="bg-white rounded-xl shadow-sm p-4 sm:p-5">
    <h3 class="text-sm font-semibold text-brand-900 mb-3">
      {{ $t('admin.ordersTrend') }}
    </h3>

    <div
      v-if="!hasAnyOrders"
      data-testid="orders-line-chart-empty"
      class="h-32 sm:h-36 flex items-center justify-center text-xs sm:text-sm text-gray-400"
    >
      {{ $t('admin.noOrdersInPeriod') }}
    </div>

    <div v-else class="w-full">
      <svg
        data-testid="orders-line-chart-svg"
        :viewBox="`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`"
        class="w-full h-auto overflow-visible block"
        role="img"
        :aria-label="$t('admin.ordersTrend')"
      >
        <defs>
          <linearGradient id="orders-line-area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="currentColor" class="text-brand-950" stop-opacity="0.22" />
            <stop offset="100%" stop-color="currentColor" class="text-brand-950" stop-opacity="0.0" />
          </linearGradient>
        </defs>

        <!-- Subtle horizontal guide lines -->
        <line
          v-for="(gy, idx) in guideLinesY"
          :key="`guide-${idx}`"
          :x1="PAD_LEFT"
          :y1="gy"
          :x2="VIEW_WIDTH - PAD_RIGHT"
          :y2="gy"
          class="stroke-gray-100"
          stroke-width="1"
          stroke-dasharray="3 3"
        />

        <!-- Soft area fill under the points -->
        <polygon
          v-if="areaPolygonPoints"
          :points="areaPolygonPoints"
          fill="url(#orders-line-area)"
        />

        <!-- Data points, value labels & X-axis labels -->
        <g v-for="(pt, idx) in plottedPoints" :key="pt.date">
          <circle
            :cx="pt.x"
            :cy="pt.y"
            r="3.5"
            class="fill-white stroke-brand-700"
            stroke-width="2"
            data-testid="orders-line-point"
          >
            <title>{{ pt.date }}: {{ formatNumberWithDots(pt.orders) }}</title>
          </circle>

          <text
            v-if="pt.showValueLabel"
            :x="pt.x"
            :y="pt.y - 9"
            text-anchor="middle"
            class="fill-brand-700 text-[10px] font-semibold select-none"
            data-testid="orders-line-value"
          >
            {{ formatNumberWithDots(pt.orders) }}
          </text>

          <text
            v-if="pt.showAxisLabel"
            :x="pt.x"
            :y="VIEW_HEIGHT - 8"
            text-anchor="middle"
            class="fill-gray-400 text-[10px] select-none"
            data-testid="orders-line-axis-label"
          >
            {{ pt.axisLabel }}
          </text>
        </g>
      </svg>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { DashboardOrdersPoint, DashboardSeriesGranularity } from '@/api/reports'
import { formatNumberWithDots } from '@/utils/number'

const props = withDefaults(
  defineProps<{
    points?: DashboardOrdersPoint[]
    granularity?: DashboardSeriesGranularity
  }>(),
  {
    points: () => [],
    granularity: 'day',
  }
)

const { locale } = useI18n()

const VIEW_WIDTH = 680
const VIEW_HEIGHT = 210
const PAD_LEFT = 24
const PAD_RIGHT = 24
const PAD_TOP = 26
const PAD_BOTTOM = 30

const hasAnyOrders = computed(() =>
  props.points.some((p) => (Number(p?.orders) || 0) > 0)
)

const maxOrders = computed(() => {
  let max = 0
  for (const p of props.points) {
    const val = Number(p?.orders) || 0
    if (val > max) max = val
  }
  return Math.max(max, 1)
})

const guideLinesY = computed(() => {
  const plotHeight = VIEW_HEIGHT - PAD_TOP - PAD_BOTTOM
  return [
    PAD_TOP,
    PAD_TOP + plotHeight * 0.5,
    PAD_TOP + plotHeight,
  ]
})

function formatAxisLabel(dateStr: string, granularity: DashboardSeriesGranularity, currentLocale: string): string {
  const parts = String(dateStr ?? '').split('-').map(Number)
  if (granularity === 'month' && parts.length >= 2 && !parts.some(isNaN)) {
    const d = new Date(parts[0], parts[1] - 1, 1)
    const raw = new Intl.DateTimeFormat(currentLocale || 'en', { month: 'short' }).format(d)
    return raw.charAt(0).toUpperCase() + raw.slice(1).replace(/\.$/, '')
  }
  if (parts.length === 3 && !isNaN(parts[2])) {
    return String(parts[2])
  }
  return dateStr
}

const plottedPoints = computed(() => {
  const list = props.points
  const n = list.length
  if (n === 0) return []

  const plotWidth = VIEW_WIDTH - PAD_LEFT - PAD_RIGHT
  const plotHeight = VIEW_HEIGHT - PAD_TOP - PAD_BOTTOM
  const baselineY = PAD_TOP + plotHeight
  const maxVal = maxOrders.value
  const dense = n > 16

  return list.map((pt, idx) => {
    const orders = Number(pt?.orders) || 0
    const x = n === 1 ? PAD_LEFT + plotWidth / 2 : PAD_LEFT + (idx / (n - 1)) * plotWidth
    const y = baselineY - (orders / maxVal) * plotHeight

    const showAxisLabel = !dense || idx === 0 || idx === n - 1 || idx % 2 === 0
    const showValueLabel = !dense ? true : orders > 0 && (orders === maxVal || idx % 3 === 0)

    return {
      date: pt.date,
      orders,
      x: Math.round(x * 10) / 10,
      y: Math.round(y * 10) / 10,
      axisLabel: formatAxisLabel(pt.date, props.granularity, locale.value),
      showAxisLabel,
      showValueLabel,
    }
  })
})

const polylinePoints = computed(() =>
  plottedPoints.value.map((p) => `${p.x},${p.y}`).join(' ')
)

const areaPolygonPoints = computed(() => {
  const pts = plottedPoints.value
  if (pts.length < 2) return ''
  const baselineY = VIEW_HEIGHT - PAD_BOTTOM
  const firstX = pts[0].x
  const lastX = pts[pts.length - 1].x
  return `${firstX},${baselineY} ${polylinePoints.value} ${lastX},${baselineY}`
})
</script>

