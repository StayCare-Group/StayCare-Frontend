<template>
  <div class="flex items-center gap-2">
    <label v-if="showLabel" class="text-xs font-medium text-gray-500 whitespace-nowrap">
      {{ label || $t('invoices.filterClient') }}:
    </label>
    <select
      :value="modelValue"
      @change="$emit('update:modelValue', $event.target.value); $emit('change', $event.target.value)"
      class="bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-xs text-gray-700 focus:ring-2 focus:ring-brand-400 focus:border-transparent outline-none cursor-pointer"
    >
      <option value="">{{ defaultOptionText || $t('invoices.filterAllClients') }}</option>
      <option v-for="c in clients" :key="getClientUserId(c)" :value="getClientUserId(c)">
        {{ getClientDisplayName(c) }}
      </option>
    </select>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { fetchClients } from '../../api/clients'
import { getClientDisplayName, getClientId } from '../../utils/client'

defineProps({
  modelValue: {
    type: String,
    default: '',
  },
  showLabel: {
    type: Boolean,
    default: true,
  },
  label: {
    type: String,
    default: '',
  },
  defaultOptionText: {
    type: String,
    default: '',
  },
})

defineEmits(['update:modelValue', 'change'])

const clients = ref([])

function getClientUserId(client) {
  if (!client || typeof client !== 'object') return ''
  return String(client.user_id ?? client._id ?? client.id ?? getClientId(client) ?? '')
}

onMounted(async () => {
  try {
    const res = await fetchClients({ is_active: 'true', limit: '200' })
    clients.value = res ?? []
  } catch {
    clients.value = []
  }
})
</script>
