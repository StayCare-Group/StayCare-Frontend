<template>
  <div
    class="bg-white rounded-xl shadow-sm p-4 sm:p-5 flex flex-col justify-between"
    data-testid="top-garments-card"
  >
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-sm font-semibold text-brand-900">
        {{ $t('admin.topGarmentsTitle') }}
      </h3>
      <span
        class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-150 text-brand-700 tabular-nums"
        data-testid="top-garments-total"
      >
        {{ formatNumberWithDots(totalItems) }}
      </span>
    </div>

    <div class="space-y-3.5 my-auto">
      <div
        v-for="row in displayRows"
        :key="row.category"
        class="space-y-1.5"
        :data-testid="`top-garment-row-${row.category}`"
      >
        <div class="flex items-center justify-between text-xs">
          <span class="font-medium text-gray-700">{{ row.label }}</span>
          <div class="flex items-center gap-1.5 tabular-nums">
            <span class="font-bold text-brand-700">{{ formatNumberWithDots(row.quantity) }}</span>
            <span class="text-gray-500">({{ row.percentage }}%)</span>
          </div>
        </div>
        <div class="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            class="h-full rounded-full transition-all duration-300"
            :class="row.barClass"
            :style="{ width: `${row.widthPercent}%` }"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { ITEM_CATEGORIES } from '@/api/items'
import type { DashboardTopGarmentItem } from '@/api/reports'
import { formatNumberWithDots } from '@/utils/number'

const props = withDefaults(
  defineProps<{
    items?: DashboardTopGarmentItem[]
    totalItems?: number
  }>(),
  {
    items: () => [],
    totalItems: 0,
  }
)

const { t } = useI18n()

const BAR_CLASSES = [
  'bg-brand-800',
  'bg-brand-700',
  'bg-brand-500',
  'bg-brand-400',
  'bg-brand-300',
]

const normalizedItems = computed<DashboardTopGarmentItem[]>(() => {
  if (props.items && props.items.length > 0) {
    return props.items
  }
  return ITEM_CATEGORIES.map((category) => ({
    category,
    quantity: 0,
    percentage: 0,
  }))
})

const maxQuantity = computed(() => {
  const max = Math.max(...normalizedItems.value.map((i) => Number(i.quantity) || 0), 0)
  return max > 0 ? max : 1
})

const displayRows = computed(() =>
  normalizedItems.value.map((item, idx) => {
    const quantity = Number(item.quantity) || 0
    const percentage = Number(item.percentage) || 0
    const widthPercent = quantity > 0 ? Math.max(4, Math.round((quantity / maxQuantity.value) * 100)) : 0
    return {
      category: item.category,
      label: t(`admin.garmentCategory.${item.category}`),
      quantity,
      percentage,
      widthPercent,
      barClass: BAR_CLASSES[idx % BAR_CLASSES.length],
    }
  })
)
</script>

