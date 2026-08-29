<template>
  <div class="flex items-center gap-2">
    <span class="text-xs font-medium text-gray-500 whitespace-nowrap">
      {{ label || $t('orderFilters.createdDate') }}:
    </span>
    <input
      :id="idFrom"
      type="date"
      :value="from"
      :max="maxFrom"
      @change="handleFromChange"
      class="bg-white border border-gray-200 rounded-lg px-2 py-1.5 text-xs text-gray-700 focus:ring-2 focus:ring-brand-400 focus:border-transparent outline-none cursor-pointer"
    />
    <span class="text-xs text-gray-400">&mdash;</span>
    <input
      :id="idTo"
      type="date"
      :value="to"
      :min="minTo"
      :max="effectiveMax"
      @change="handleToChange"
      class="bg-white border border-gray-200 rounded-lg px-2 py-1.5 text-xs text-gray-700 focus:ring-2 focus:ring-brand-400 focus:border-transparent outline-none cursor-pointer"
    />
    <button
      v-if="from || to"
      type="button"
      @click="$emit('clear')"
      class="text-gray-400 hover:text-red-500 transition-colors"
      :title="$t('orderFilters.clearDates')"
      :aria-label="$t('orderFilters.clearDates')"
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  </div>
</template>

<script setup>
import { computed } from 'vue'

function getTodayString() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

const props = defineProps({
  /** Start date value (YYYY-MM-DD) */
  from: {
    type: String,
    default: '',
  },
  /** End date value (YYYY-MM-DD) */
  to: {
    type: String,
    default: '',
  },
  /** Maximum date allowed (YYYY-MM-DD). Defaults to today */
  max: {
    type: String,
    default: undefined,
  },
  /** Optional label text. Defaults to the i18n key orderFilters.createdDate */
  label: {
    type: String,
    default: '',
  },
  /** Unique id prefix used to generate ids for the two inputs */
  idPrefix: {
    type: String,
    default: 'date-range',
  },
})

const emit = defineEmits(['update:from', 'update:to', 'clear'])

const effectiveMax = computed(() => (props.max !== undefined ? props.max : getTodayString()))

const maxFrom = computed(() => {
  if (props.to && effectiveMax.value) {
    return props.to < effectiveMax.value ? props.to : effectiveMax.value
  }
  return props.to || effectiveMax.value
})

const minTo = computed(() => props.from || undefined)

const idFrom = computed(() => `${props.idPrefix}-from`)
const idTo = computed(() => `${props.idPrefix}-to`)

function handleFromChange(e) {
  let val = e.target.value
  if (val && effectiveMax.value && val > effectiveMax.value) {
    val = effectiveMax.value
    e.target.value = val
  }
  if (val && props.to && val > props.to) {
    val = props.to
    e.target.value = val
  }
  emit('update:from', val)
}

function handleToChange(e) {
  let val = e.target.value
  if (val && effectiveMax.value && val > effectiveMax.value) {
    val = effectiveMax.value
    e.target.value = val
  }
  if (val && props.from && val < props.from) {
    val = props.from
    e.target.value = val
  }
  emit('update:to', val)
}
</script>

