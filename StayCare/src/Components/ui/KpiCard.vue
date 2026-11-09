<template>
  <div class="rounded-xl px-4 py-3 bg-white shadow-lg shadow-brand-700/15">
    <p class="text-xs font-medium text-gray-500 mb-0.5 truncate">{{ label }}</p>
    <p class="text-2xl font-bold tracking-tight text-brand-700">{{ value }}</p>
  </div>
</template>

<script setup>
defineProps({
  label: String,
  value: [String, Number],
  // Mantenemos la prop color opcional por compatibilidad con otros dashboards
  color: {
    type: String,
    default: 'blue',
  },
})
</script>
