<template>
  <div class="space-y-1">
    <div v-for="(step, i) in steps" :key="i" class="flex gap-3">
      <!-- Vertical line + dot -->
      <div class="flex flex-col items-center">
        <div
          class="w-3 h-3 rounded-full shrink-0 mt-1"
          :class="i <= currentIndex ? 'bg-brand-700' : 'bg-gray-300'"
        ></div>
        <div v-if="i < steps.length - 1" class="w-0.5 flex-1 min-h-[32px]"
          :class="i < currentIndex ? 'bg-brand-700' : 'bg-gray-200'"
        ></div>
      </div>
      <!-- Content -->
      <div class="pb-4">
        <p class="text-sm font-semibold" :class="i <= currentIndex ? 'text-gray-800' : 'text-gray-400'">
          {{ step.status }}
        </p>
        <p v-if="step.date" class="text-xs text-gray-400">{{ step.date }}</p>
        <p v-if="getExecutorText(step)" class="text-xs text-gray-500 font-medium mt-0.5">
          {{ getExecutorText(step) }}
        </p>
        <p v-if="step.note" class="text-xs text-gray-500 mt-0.5">{{ step.note }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { t, te } = useI18n()

const props = defineProps({
  steps: { type: Array, default: () => [] },
  currentStatus: String,
})

const currentIndex = computed(() => {
  if (!props.currentStatus) return props.steps.length - 1
  const idx = props.steps.findIndex(s => s.status === props.currentStatus)
  return idx >= 0 ? idx : props.steps.length - 1
})

function getExecutorText(step) {
  if (!step) return ''
  if (step.isSystem) {
    return `${t('orderDetail.executedBy')}: ${t('orderDetail.bySystem')}`
  }
  if (step.changedByName) {
    let roleText = ''
    if (step.changedByRole) {
      const roleKey = `profile.role${step.changedByRole.charAt(0).toUpperCase() + step.changedByRole.slice(1)}`
      roleText = te(roleKey) ? ` (${t(roleKey)})` : ` (${step.changedByRole})`
    }
    return `${t('orderDetail.executedBy')}: ${step.changedByName}${roleText}`
  }
  return `${t('orderDetail.executedBy')}: ${t('orderDetail.userUnavailable')}`
}
</script>
