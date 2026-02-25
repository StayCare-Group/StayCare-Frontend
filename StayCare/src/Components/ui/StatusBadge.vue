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
  // Order statuses
  'Pending Pickup': 'bg-yellow-100 text-yellow-800',
  'Picked Up': 'bg-blue-100 text-blue-800',
  'In Transit': 'bg-blue-100 text-blue-800',
  'Received at Facility': 'bg-purple-100 text-purple-800',
  'Sorting': 'bg-purple-100 text-purple-800',
  'Washing': 'bg-indigo-100 text-indigo-800',
  'Drying': 'bg-indigo-100 text-indigo-800',
  'Ironing': 'bg-violet-100 text-violet-800',
  'Quality Control': 'bg-orange-100 text-orange-800',
  'Ready for Delivery': 'bg-emerald-100 text-emerald-800',
  'Out for Delivery': 'bg-cyan-100 text-cyan-800',
  'Delivered': 'bg-green-100 text-green-800',
  'Completed': 'bg-green-100 text-green-800',
  'Ready': 'bg-green-100 text-green-800',
  // Invoice statuses
  'Paid': 'bg-green-100 text-green-800',
  'Pending': 'bg-yellow-100 text-yellow-800',
  'Overdue': 'bg-red-100 text-red-800',
  'Open': 'bg-blue-100 text-blue-800',
  // General
  'In Progress': 'bg-blue-100 text-blue-800',
  'Delayed': 'bg-red-100 text-red-800',
  'High': 'bg-red-100 text-red-800',
  'Normal': 'bg-blue-100 text-blue-800',
  'Low': 'bg-gray-100 text-gray-600',
  // Driver / stop types
  'Pickup': 'bg-indigo-100 text-indigo-800',
  'Delivery': 'bg-teal-100 text-teal-800',
  // User statuses
  'Active': 'bg-green-100 text-green-800',
  'Inactive': 'bg-gray-100 text-gray-600',
  'New': 'bg-blue-100 text-blue-800',
  'Off Duty': 'bg-gray-100 text-gray-500',
  // Machine statuses
  'Available': 'bg-green-100 text-green-800',
  'Running': 'bg-blue-100 text-blue-800',
  'In Use': 'bg-blue-100 text-blue-800',
}

const badgeClass = computed(() => statusColors[props.status] || 'bg-gray-100 text-gray-700')
</script>
