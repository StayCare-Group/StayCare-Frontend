<template>
  <AppTooltip
    v-if="hasNotes"
    :text="notes"
    :title="title || $t('common.specialNotes')"
  >
    <span
      class="cursor-help px-1.5 py-0.5 rounded text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200/60 inline-flex items-center gap-1 hover:bg-amber-100 transition-colors whitespace-nowrap"
    >
      <svg class="w-3 h-3 text-amber-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
      <span>{{ label || $t('facility.notes') }}</span>
    </span>
  </AppTooltip>
  <span v-else-if="fallback" class="text-gray-400 text-xs">{{ fallback }}</span>
</template>

<script setup>
import { computed } from 'vue'
import AppTooltip from './AppTooltip.vue'

const props = defineProps({
  notes: {
    type: String,
    default: '',
  },
  title: {
    type: String,
    default: '',
  },
  label: {
    type: String,
    default: '',
  },
  fallback: {
    type: String,
    default: '',
  },
})

const hasNotes = computed(() => Boolean(props.notes && props.notes.trim()))
</script>
