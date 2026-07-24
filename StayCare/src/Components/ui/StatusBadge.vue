<template>
  <span :class="badgeClass" class="px-2.5 py-0.5 rounded-full text-xs font-semibold">
    {{ displayLabel }}
  </span>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { normalizeStatus } from '../../utils/orderFlow'

const props = defineProps({
  status: String,
  type: String, // 'order' | 'invoice'
})

const { te, t } = useI18n()

const displayLabel = computed(() => {
  if (!props.status) return ''
  const lower = String(props.status).toLowerCase().trim()

  // 1. If explicitly marked as invoice or matching invoice-specific statuses, check invoiceStatuses first
  if (props.type === 'invoice' || ['paid', 'unpaid', 'overdue', 'open', 'draft'].includes(lower)) {
    const invKey = `invoiceStatuses.${lower}`
    if (te(invKey)) return t(invKey)
  }

  // 2. Order status lookup
  const norm = normalizeStatus(props.status)
  const orderKey = `orderStatuses.${norm}`
  if (te(orderKey)) {
    return t(orderKey)
  }

  // 3. Fallback invoice status lookup
  const invKey = `invoiceStatuses.${lower}`
  if (te(invKey)) {
    return t(invKey)
  }

  // 4. Common key fallback
  const commonKey = `common.${props.status}`
  if (te(commonKey)) {
    return t(commonKey)
  }

  return props.status
})

const statusColors = {
  // Order statuses (canonical lowercase snake_case)
  'pending': 'bg-yellow-100 text-yellow-800',
  'assigned': 'bg-blue-100 text-blue-800',
  'transit': 'bg-blue-100 text-blue-800',
  'arrived': 'bg-purple-100 text-purple-800',
  'sorting': 'bg-purple-100 text-purple-800',
  'washing': 'bg-indigo-100 text-indigo-800',
  'drying': 'bg-indigo-100 text-indigo-800',
  'ironing': 'bg-violet-100 text-violet-800',
  'quality_check': 'bg-orange-100 text-orange-800',
  'ready_to_delivery': 'bg-emerald-100 text-emerald-800',
  'collected': 'bg-cyan-100 text-cyan-800',
  'delivered': 'bg-green-100 text-green-800',
  'completed': 'bg-green-100 text-green-800',
  'cancelled': 'bg-gray-100 text-gray-700',
  'rescheduled': 'bg-yellow-100 text-yellow-800',
  'in_progress': 'bg-blue-100 text-blue-800',

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

const badgeClass = computed(() => {
  const norm = normalizeStatus(props.status)
  return statusColors[norm] || statusColors[props.status] || 'bg-gray-100 text-gray-700'
})
</script>
