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
        <p v-if="step.note" class="text-xs text-gray-500 mt-0.5">{{ step.note }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  steps: { type: Array, default: () => [] },
  currentStatus: String,
})

const currentIndex = computed(() => {
  if (!props.currentStatus) return props.steps.length - 1
  const idx = props.steps.findIndex(s => s.status === props.currentStatus)
  return idx >= 0 ? idx : props.steps.length - 1
})
</script>
