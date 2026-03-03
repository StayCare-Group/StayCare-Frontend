<script setup>
import { ref, onMounted, watch } from 'vue'
import L from 'leaflet'

const props = defineProps({
  lat: { type: Number, default: 0 },
  lng: { type: Number, default: 0 },
  zoom: { type: Number, default: 15 },
  height: { type: String, default: '200px' },
  markers: { type: Array, default: () => [] },
})

const mapEl = ref(null)
let map = null
let markerLayer = null

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
  map = L.map(mapEl.value, { attributionControl: false, zoomControl: true })
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
  }).addTo(map)

  markerLayer = L.layerGroup().addTo(map)
  renderMarkers()
})

function renderMarkers() {
  if (!map || !markerLayer) return
  markerLayer.clearLayers()

  const points = props.markers.length
    ? props.markers.filter(m => m.lat && m.lng)
    : (props.lat && props.lng ? [{ lat: props.lat, lng: props.lng, label: '' }] : [])

  if (!points.length) return

  for (const p of points) {
    const m = L.marker([p.lat, p.lng], { icon: defaultIcon }).addTo(markerLayer)
    if (p.label) m.bindPopup(p.label)
  }

  if (points.length === 1) {
    map.setView([points[0].lat, points[0].lng], props.zoom)
  } else {
    const bounds = L.latLngBounds(points.map(p => [p.lat, p.lng]))
    map.fitBounds(bounds, { padding: [30, 30] })
  }
}

watch(() => [props.lat, props.lng, props.markers], renderMarkers, { deep: true })
</script>

<template>
  <div ref="mapEl" class="rounded-lg overflow-hidden" :style="{ height }"></div>
</template>
