<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  modelValue: { type: String, default: '' },
  placeholder: { type: String, default: 'Search address...' },
})
const emit = defineEmits(['update:modelValue', 'select'])

const query = ref(props.modelValue)
const suggestions = ref([])
const open = ref(false)
let debounce = null

watch(() => props.modelValue, (v) => { query.value = v })

function onInput() {
  emit('update:modelValue', query.value)
  clearTimeout(debounce)
  if (query.value.length < 3) {
    suggestions.value = []
    open.value = false
    return
  }
  debounce = setTimeout(fetchSuggestions, 350)
}

async function fetchSuggestions() {
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=5&q=${encodeURIComponent(query.value)}`
    const res = await fetch(url, { headers: { 'Accept-Language': 'en' } })
    const data = await res.json()
    suggestions.value = data.map(item => ({
      display: item.display_name,
      address: item.address?.road
        ? [item.address.road, item.address.house_number].filter(Boolean).join(' ')
        : item.display_name.split(',')[0],
      city: item.address?.city || item.address?.town || item.address?.village || item.address?.municipality || '',
      area: item.address?.suburb || item.address?.county || item.address?.state || '',
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
    }))
    open.value = suggestions.value.length > 0
  } catch {
    suggestions.value = []
    open.value = false
  }
}

function pick(s) {
  query.value = s.display
  emit('update:modelValue', s.address)
  emit('select', s)
  open.value = false
  suggestions.value = []
}

function onBlur() {
  setTimeout(() => { open.value = false }, 200)
}
</script>

<template>
  <div class="relative">
    <input
      type="text"
      :value="query"
      @input="query = $event.target.value; onInput()"
      @focus="open = suggestions.length > 0"
      @blur="onBlur"
      :placeholder="placeholder"
      class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-400 focus:border-transparent outline-none"
      autocomplete="off"
    />
    <div
      v-if="open"
      class="absolute z-50 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-56 overflow-y-auto"
    >
      <button
        v-for="(s, i) in suggestions"
        :key="i"
        type="button"
        class="w-full text-left px-3 py-2 text-sm hover:bg-[#FFF0F7] transition cursor-pointer border-b border-gray-50 last:border-0"
        @mousedown.prevent="pick(s)"
      >
        <p class="font-medium text-gray-800 truncate">{{ s.address }}<span v-if="s.city" class="text-gray-400">, {{ s.city }}</span></p>
        <p class="text-xs text-gray-400 truncate">{{ s.display }}</p>
      </button>
    </div>
  </div>
</template>
