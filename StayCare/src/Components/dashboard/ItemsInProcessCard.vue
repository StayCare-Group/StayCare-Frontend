<template>
  <div
    class="bg-white rounded-xl shadow-sm p-5 flex flex-col justify-between"
    data-testid="items-in-process-card"
  >
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-sm font-semibold text-brand-900">
        {{ $t('admin.itemsInProcess') }}
      </h3>
      <span
        class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-150 text-brand-700 tabular-nums"
        data-testid="items-in-process-total"
      >
        {{ formatNumberWithDots(totalInProcess) }}
      </span>
    </div>

    <div class="space-y-4 my-auto">
      <div
        v-for="stage in stages"
        :key="stage.key"
        class="space-y-1.5"
        :data-testid="`process-stage-${stage.key}`"
      >
        <div class="flex items-center justify-between text-xs">
          <span class="font-medium text-gray-700">{{ stage.label }}</span>
          <span class="font-bold text-brand-700 tabular-nums">{{ formatNumberWithDots(stage.count) }}</span>
        </div>
        <div class="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            class="h-full rounded-full transition-all duration-300"
            :class="stage.barClass"
            :style="{ width: `${stage.widthPercent}%` }"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { DashboardItemsInProcess } from '../../api/reports'
import { formatNumberWithDots } from '@/utils/number'

const props = withDefaults(
  defineProps<{
    itemsInProcess?: DashboardItemsInProcess
  }>(),
  {
    itemsInProcess: () => ({
      washing: 0,
      drying: 0,
      ironing: 0,
      qualityCheck: 0,
    }),
  }
)

const { t } = useI18n()

const rawStages = computed(() => [
  {
    key: 'washing',
    label: t('admin.stageWashing'),
    count: Number(props.itemsInProcess?.washing) || 0,
    barClass: 'bg-brand-800',
  },
  {
    key: 'drying',
    label: t('admin.stageDrying'),
    count: Number(props.itemsInProcess?.drying) || 0,
    barClass: 'bg-brand-700',
  },
  {
    key: 'ironing',
    label: t('admin.stageIroning'),
    count: Number(props.itemsInProcess?.ironing) || 0,
    barClass: 'bg-brand-400',
  },
  {
    key: 'qualityCheck',
    label: t('admin.stageQualityCheck'),
    count: Number(props.itemsInProcess?.qualityCheck) || 0,
    barClass: 'bg-brand-300',
  },
])

const maxCount = computed(() => {
  const max = Math.max(...rawStages.value.map((s) => s.count), 0)
  return max > 0 ? max : 1
})

const totalInProcess = computed(() =>
  rawStages.value.reduce((sum, s) => sum + s.count, 0)
)

const stages = computed(() =>
  rawStages.value.map((s) => ({
    ...s,
    widthPercent: s.count > 0 ? Math.max(6, Math.round((s.count / maxCount.value) * 100)) : 0,
  }))
)
</script>

