<script setup>
import { ref, onMounted, watch, nextTick } from 'vue'
import L from 'leaflet'

const props = defineProps({
  lat: { type: Number, default: null },
  lng: { type: Number, default: null },
  height: { type: String, default: '320px' },
})

const emit = defineEmits(['update'])

const mapEl = ref(null)
const searchQuery = ref('')
const searchResults = ref([])
const searchOpen = ref(false)
const resolvedLabel = ref('')
let debounce = null
let map = null
let marker = null

const defaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

onMounted(() => {
  if (!mapEl.value) return

  const startLat = props.lat ?? 35.9
  const startLng = props.lng ?? 14.44
  const startZoom = props.lat ? 16 : 12

  map = L.map(mapEl.value, { zoomControl: true }).setView([startLat, startLng], startZoom)
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap',
  }).addTo(map)

  if (props.lat && props.lng) {
    placeMarker(props.lat, props.lng, false)
  }

  map.on('click', (e) => {
    placeMarker(e.latlng.lat, e.latlng.lng, true)
  })
})

function placeMarker(lat, lng, doReverse) {
  if (marker) {
    marker.setLatLng([lat, lng])
  } else {
    marker = L.marker([lat, lng], { icon: defaultIcon, draggable: true }).addTo(map)
    marker.on('dragend', () => {
      const pos = marker.getLatLng()
      reverseGeocode(pos.lat, pos.lng)
    })
  }
  if (doReverse) {
    reverseGeocode(lat, lng)
  }
}

async function reverseGeocode(lat, lng) {
  resolvedLabel.value = 'Resolving address...'
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`
    const res = await fetch(url, { headers: { 'Accept-Language': 'en' } })
    const data = await res.json()
    const a = data.address || {}

    const address = a.road
      ? [a.road, a.house_number].filter(Boolean).join(' ')
      : data.display_name?.split(',')[0] ?? ''
    const city = a.city || a.town || a.village || a.municipality || ''
    const area = a.suburb || a.county || a.state || ''

    resolvedLabel.value = [address, city].filter(Boolean).join(', ')
    emit('update', { address, city, area, lat, lng })
  } catch {
    resolvedLabel.value = `${lat.toFixed(5)}, ${lng.toFixed(5)}`
    emit('update', { address: '', city: '', area: '', lat, lng })
  }
}

function onSearchInput() {
  clearTimeout(debounce)
  if (searchQuery.value.length < 3) {
    searchResults.value = []
    searchOpen.value = false
    return
  }
  debounce = setTimeout(fetchSearch, 350)
}

async function fetchSearch() {
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=5&q=${encodeURIComponent(searchQuery.value)}`
    const res = await fetch(url, { headers: { 'Accept-Language': 'en' } })
    const data = await res.json()
    searchResults.value = data.map(item => ({
      display: item.display_name,
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
      address: item.address,
    }))
    searchOpen.value = searchResults.value.length > 0
  } catch {
    searchResults.value = []
    searchOpen.value = false
  }
}

function pickSearchResult(r) {
  searchQuery.value = ''
  searchResults.value = []
  searchOpen.value = false
  if (map) {
    map.setView([r.lat, r.lng], 16)
  }
  placeMarker(r.lat, r.lng, true)
}

function onSearchBlur() {
  setTimeout(() => { searchOpen.value = false }, 200)
}
</script>

<template>
  <div class="space-y-2">
    <!-- Search box -->
    <div class="relative">
      <input
        v-model="searchQuery"
        @input="onSearchInput"
        @focus="searchOpen = searchResults.length > 0"
        @blur="onSearchBlur"
        type="text"
        placeholder="Search for a place to jump to..."
        autocomplete="off"
        class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#FF56B0] focus:border-transparent outline-none"
      />
      <div
        v-if="searchOpen"
        class="absolute z-50 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto"
      >
        <button
          v-for="(r, i) in searchResults"
          :key="i"
          type="button"
          class="w-full text-left px-3 py-2 text-sm hover:bg-[#FFF0F7] transition cursor-pointer border-b border-gray-50 last:border-0"
          @mousedown.prevent="pickSearchResult(r)"
        >
          <p class="text-gray-700 truncate">{{ r.display }}</p>
        </button>
      </div>
    </div>

    <!-- Map -->
    <div ref="mapEl" class="rounded-lg overflow-hidden border border-gray-200" :style="{ height }"></div>

    <!-- Resolved address -->
    <p v-if="resolvedLabel" class="text-xs text-gray-500 flex items-center gap-1">
      <span class="text-[#FF56B0]">&#x1f4cd;</span> {{ resolvedLabel }}
    </p>
    <p v-else class="text-xs text-gray-400">Click on the map to place a pin, or search above to jump to a location.</p>
  </div>
</template>
