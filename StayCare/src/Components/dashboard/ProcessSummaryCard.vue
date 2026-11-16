<template>
  <div
    class="bg-white rounded-xl shadow-sm p-4 sm:p-5 flex flex-col justify-between"
    data-testid="process-summary-card"
  >
    <div class="flex items-center justify-between mb-3">
      <h3 class="text-sm font-semibold text-brand-900">
        {{ $t('admin.processSummaryTitle') }}
      </h3>
    </div>

    <div class="overflow-x-auto -mx-4 sm:mx-0 my-auto">
      <div class="inline-block min-w-full align-middle px-4 sm:px-0">
        <table class="min-w-full divide-y divide-gray-100 text-xs">
          <thead>
            <tr class="text-left text-gray-500 font-semibold uppercase tracking-wider text-[11px]">
              <th scope="col" class="py-2.5 pr-3">
                {{ $t('admin.garmentColumn') }}
              </th>
              <th scope="col" class="py-2.5 px-3 text-right">
                {{ $t('admin.stageWashing') }}
              </th>
              <th scope="col" class="py-2.5 px-3 text-right">
                {{ $t('admin.stageDrying') }}
              </th>
              <th scope="col" class="py-2.5 pl-3 text-right">
                {{ $t('admin.stageIroning') }}
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-50">
            <tr
              v-for="row in displayRows"
              :key="row.category"
              :data-testid="`process-summary-row-${row.category}`"
              class="hover:bg-gray-50/60 transition-colors"
            >
              <td class="py-2.5 pr-3 font-medium text-gray-800 whitespace-nowrap">
                {{ row.label }}
              </td>
              <td class="py-2.5 px-3 text-right font-semibold text-brand-800 tabular-nums whitespace-nowrap">
                {{ formatNumberWithDots(row.washing) }}
              </td>
              <td class="py-2.5 px-3 text-right font-semibold text-brand-700 tabular-nums whitespace-nowrap">
                {{ formatNumberWithDots(row.drying) }}
              </td>
              <td class="py-2.5 pl-3 text-right font-semibold text-brand-600 tabular-nums whitespace-nowrap">
                {{ formatNumberWithDots(row.ironing) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { ITEM_CATEGORIES } from '@/api/items'
import type { DashboardGarmentProcessItem } from '@/api/reports'
import { formatNumberWithDots } from '@/utils/number'

const props = withDefaults(
  defineProps<{
    items?: DashboardGarmentProcessItem[]
  }>(),
  {
    items: () => [],
  }
)

const { t } = useI18n()

const displayRows = computed(() => {
  const source =
    props.items && props.items.length > 0
      ? props.items
      : ITEM_CATEGORIES.map((category) => ({
          category,
          washing: 0,
          drying: 0,
          ironing: 0,
        }))

  return source.map((item) => ({
    category: item.category,
    label: t(`admin.garmentCategory.${item.category}`),
    washing: Number(item.washing) || 0,
    drying: Number(item.drying) || 0,
    ironing: Number(item.ironing) || 0,
  }))
})
</script>

