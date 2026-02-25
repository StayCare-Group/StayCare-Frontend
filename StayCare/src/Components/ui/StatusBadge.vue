<template>
  <span :class="badgeClass" class="px-2.5 py-0.5 rounded-full text-xs font-semibold">
    {{ status }}
  </span>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  status: String,
})

const statusColors = {
  'Completed': 'bg-green-100 text-green-800',
  'Delivered': 'bg-green-100 text-green-800',
  'Ready': 'bg-green-100 text-green-800',
  'In Progress': 'bg-blue-100 text-blue-800',
  'In Transit': 'bg-blue-100 text-blue-800',
  'Pending': 'bg-gray-100 text-gray-700',
  'Overdue': 'bg-red-100 text-red-800',
  'Delayed': 'bg-red-100 text-red-800',
  'High': 'bg-red-100 text-red-800',
  'Normal': 'bg-blue-100 text-blue-800',
  'Low': 'bg-gray-100 text-gray-600',
  'Pickup': 'bg-indigo-100 text-indigo-800',
  'Delivery': 'bg-teal-100 text-teal-800',
}

const badgeClass = computed(() => statusColors[props.status] || 'bg-gray-100 text-gray-700')
</script>
