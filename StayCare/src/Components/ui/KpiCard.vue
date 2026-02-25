<template>
  <div :class="cardClass" class="rounded-xl p-5 shadow-sm">
    <p class="text-sm font-medium text-gray-500 mb-1">{{ label }}</p>
    <p class="text-2xl font-bold text-gray-800">{{ value }}</p>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  label: String,
  value: [String, Number],
  color: { type: String, default: 'blue' },
})

const colorMap = {
  blue: 'bg-blue-50 border-l-4 border-blue-500',
  green: 'bg-green-50 border-l-4 border-green-500',
  yellow: 'bg-yellow-50 border-l-4 border-yellow-500',
  red: 'bg-red-50 border-l-4 border-red-500',
  purple: 'bg-purple-50 border-l-4 border-purple-500',
  orange: 'bg-orange-50 border-l-4 border-orange-500',
  cyan: 'bg-cyan-50 border-l-4 border-cyan-500',
}

const cardClass = computed(() => colorMap[props.color] || colorMap.blue)
</script>
