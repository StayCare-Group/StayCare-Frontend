<template>
  <div class="space-y-6 max-w-2xl">
    <!-- Header -->
    <div class="flex items-center gap-3">
      <button @click="navStore.goBack('route')" class="text-white hover:text-gray-400">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
      </button>
      <h2 class="text-lg font-semibold text-white">Confirm Pickup</h2>
    </div>

    <div v-if="stop" class="space-y-6">
      <!-- Stop Info -->
      <div class="bg-white rounded-xl shadow-sm p-5">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div><span class="text-gray-400">Client</span><p class="font-medium text-gray-800">{{ stop.client }}</p></div>
          <div><span class="text-gray-400">Order</span><p class="font-medium text-gray-800">{{ stop.orderId }}</p></div>
          <div><span class="text-gray-400">Address</span><p class="font-medium text-gray-800">{{ stop.address }}</p></div>
          <div><span class="text-gray-400">Time Window</span><p class="font-medium text-gray-800">{{ stop.timeWindow }}</p></div>
          <div><span class="text-gray-400">Expected Bags</span><p class="font-medium text-gray-800">{{ stop.estimatedBags }}</p></div>
        </div>
      </div>

      <!-- Pickup Form -->
      <form @submit.prevent="confirmPickup" class="space-y-5">
        <div class="bg-white rounded-xl shadow-sm p-5 space-y-4">
          <h3 class="text-sm font-semibold text-gray-700 uppercase tracking-wide">Pickup Confirmation</h3>

          <div>
            <label class="block text-sm font-medium text-gray-600 mb-1">Actual Bag Count</label>
            <input v-model.number="form.actualBags" type="number" min="1" required
              class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#FF56B0] focus:border-transparent outline-none"
              placeholder="Number of bags picked up" />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-600 mb-1">Pickup Notes</label>
            <textarea v-model="form.notes" rows="2"
              class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#FF56B0] focus:border-transparent outline-none resize-none"
              placeholder="Any issues or observations..."></textarea>
          </div>

          <!-- Photo capture/upload -->
          <div>
            <label class="block text-sm font-medium text-gray-600 mb-1">Photo (optional)</label>
            <div class="border-2 border-dashed border-gray-200 rounded-lg p-4 text-center space-y-2">
              <input
                type="file"
                accept="image/*"
                capture="environment"
                @change="onPhotoChange"
                class="block w-full text-xs text-gray-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
              />
              <p class="text-xs text-gray-400">Capture or upload a photo of the bags at pickup.</p>
              <img
                v-if="photoPreview"
                :src="photoPreview"
                alt="Pickup photo preview"
                class="mt-2 mx-auto max-h-32 rounded-md object-cover"
              />
            </div>
          </div>

          <!-- Digital signature -->
          <div>
            <label class="block text-sm font-medium text-gray-600 mb-1">Signature</label>
            <div class="border border-gray-200 rounded-lg bg-gray-50 p-2">
              <canvas
                ref="signatureCanvas"
                class="w-full h-32 bg-white rounded-md border border-gray-200 touch-none"
                @mousedown="startSignature"
                @mousemove="moveSignature"
                @mouseup="endSignature"
                @mouseleave="endSignature"
                @touchstart.prevent="startSignature"
                @touchmove.prevent="moveSignature"
                @touchend.prevent="endSignature"
              ></canvas>
              <div class="flex items-center justify-between mt-2">
                <p class="text-xs text-gray-400">Have the client sign in the box.</p>
                <button
                  type="button"
                  @click="clearSignature"
                  class="text-xs text-gray-500 hover:text-gray-700"
                >
                  Clear
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="flex gap-3">
          <button type="submit"
            class="bg-[#FF56B0] text-white font-bold py-2.5 px-8 rounded-lg shadow-[0_4px_0_#E63E8A] hover:opacity-90 transition text-sm">
            Confirm Pickup
          </button>
          <button type="button" @click="navStore.goBack('route')"
            class="bg-gray-100 text-gray-600 font-medium py-2.5 px-6 rounded-lg hover:bg-gray-200 transition text-sm">
            Cancel
          </button>
        </div>
      </form>

      <!-- Success toast -->
      <div v-if="showSuccess" class="fixed bottom-6 right-6 bg-green-600 text-white px-5 py-3 rounded-lg shadow-lg text-sm font-medium z-50">
        Pickup confirmed!
      </div>
    </div>

    <div v-else class="bg-white rounded-xl shadow-sm p-10 text-center">
      <p class="text-gray-400">Stop not found.</p>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onBeforeUnmount } from 'vue'
import { useNavStore } from '../../../stores/nav.js'
import { fetchRoutes, mapRouteForDriver } from '../../../api/routes'
import { confirmPickup as apiConfirmPickup } from '../../../api/orders'

const navStore = useNavStore()
const showSuccess = ref(false)
const stop = ref(null)
const loading = ref(true)

const photoPreview = ref(null)
const signatureCanvas = ref(null)
let signatureCtx = null
let isDrawing = false

onMounted(async () => {
  try {
    const today = new Date().toISOString().split('T')[0]
    const data = await fetchRoutes({ date: today })
    const routes = (data ?? []).map(mapRouteForDriver)
    const allStops = routes.flatMap(r => r.stops)
    stop.value = allStops.find(s => s.id === navStore.selectedId) ?? null
  } catch { /* stays null */ } finally {
    loading.value = false
  }

  const canvas = signatureCanvas.value
  if (canvas) {
    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    signatureCtx = canvas.getContext('2d')
    signatureCtx.scale(dpr, dpr)
    signatureCtx.lineWidth = 2
    signatureCtx.lineCap = 'round'
    signatureCtx.strokeStyle = '#111827'
  }
})

onBeforeUnmount(() => {
  isDrawing = false
})

const form = reactive({
  actualBags: null,
  notes: '',
})

function onPhotoChange(event) {
  const file = event.target.files?.[0]
  if (!file) {
    photoPreview.value = null
    return
  }
  const reader = new FileReader()
  reader.onload = e => {
    photoPreview.value = e.target?.result || null
  }
  reader.readAsDataURL(file)
}

function getCanvasPos(evt) {
  const canvas = signatureCanvas.value
  const rect = canvas.getBoundingClientRect()
  const isTouch = evt.touches && evt.touches.length > 0
  const point = isTouch ? evt.touches[0] : evt
  return {
    x: point.clientX - rect.left,
    y: point.clientY - rect.top,
  }
}

function startSignature(evt) {
  if (!signatureCtx) return
  isDrawing = true
  const { x, y } = getCanvasPos(evt)
  signatureCtx.beginPath()
  signatureCtx.moveTo(x, y)
}

function moveSignature(evt) {
  if (!isDrawing || !signatureCtx) return
  const { x, y } = getCanvasPos(evt)
  signatureCtx.lineTo(x, y)
  signatureCtx.stroke()
}

function endSignature() {
  if (!signatureCtx) return
  isDrawing = false
}

function clearSignature() {
  const canvas = signatureCanvas.value
  if (!canvas || !signatureCtx) return
  signatureCtx.clearRect(0, 0, canvas.width, canvas.height)
}

async function confirmPickup() {
  if (!stop.value?._id) return
  try {
    const payload = {
      actual_bags: form.actualBags,
      notes: form.notes,
    }

    const photos = []
    if (photoPreview.value) {
      photos.push({
        photo_url: photoPreview.value,
        type: 'before',
      })
    }

    const canvas = signatureCanvas.value
    if (canvas) {
      const blank = document.createElement('canvas')
      blank.width = canvas.width
      blank.height = canvas.height
      if (canvas.toDataURL() !== blank.toDataURL()) {
        photos.push({
          photo_url: canvas.toDataURL('image/png'),
          type: 'before',
        })
      }
    }

    if (photos.length > 0) {
      payload.photos = photos
    }

    await apiConfirmPickup(stop.value._id, payload)
    showSuccess.value = true
    setTimeout(() => {
      showSuccess.value = false
      navStore.goBack('route')
    }, 1500)
  } catch {
    showSuccess.value = false
  }
}
</script>
