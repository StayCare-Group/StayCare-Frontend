<template>
  <div class="space-y-6">
    <h2 class="text-lg font-semibold text-white">Reception &amp; Check-In</h2>

    <!-- QR Scan -->
    <div class="bg-white rounded-xl shadow-sm p-5">
      <h3 class="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">Scan Order</h3>
      <div class="border-2 border-dashed border-gray-200 rounded-lg p-4 sm:p-5 text-center space-y-3">
        <div class="flex items-center justify-between gap-3">
          <div class="flex items-center gap-2">
            <svg class="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5h4m10 0h4M4 9h16M4 15h16M3 19h4m10 0h4"/>
            </svg>
            <div class="text-left">
              <p class="text-sm text-gray-700 font-medium">Camera Scan</p>
              <p class="text-xs text-gray-400">Scan QR code or barcode on bag label</p>
            </div>
          </div>
          <button
            type="button"
            @click="toggleScanner"
            class="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-200 hover:border-brand-700 hover:text-brand-700 transition"
          >
            {{ isScanning ? 'Stop Scan' : 'Start Scan' }}
          </button>
        </div>

        <div v-if="isScanning" class="relative mt-3">
          <video ref="videoRef" class="w-full max-h-64 rounded-lg bg-black object-cover"></video>
          <div class="absolute inset-4 border-2 border-white border-dashed rounded-lg pointer-events-none"></div>
        </div>

        <p v-if="scanError" class="text-xs text-red-500 mt-1">{{ scanError }}</p>
        <p v-if="lastScannedCode" class="text-xs text-gray-500 mt-1">
          Last scanned: <span class="font-mono">{{ lastScannedCode }}</span>
        </p>
      </div>
      <div class="mt-3">
        <label class="block text-sm font-medium text-gray-600 mb-1">Or enter Order ID manually</label>
        <div class="flex gap-2">
          <input v-model="manualOrderId" type="text"
            class="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-400 focus:border-transparent outline-none"
            placeholder="e.g. ORD-1024" />
          <AppButton @click="lookupOrder">
            {{ $t('facility.lookUp') }}
          </AppButton>
        </div>
      </div>
    </div>

    <!-- Order found -->
    <div v-if="foundOrder" class="space-y-5">
      <div class="bg-white rounded-xl shadow-sm p-5">
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-sm font-semibold text-gray-700">{{ foundOrder.id }} — {{ foundOrder.client }}</h3>
          <StatusBadge :status="foundOrder.status" />
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div><span class="text-gray-400">Service Type</span><p class="font-medium text-gray-800">{{ foundOrder.serviceType }}</p></div>
          <div><span class="text-gray-400">Expected Bags</span><p class="font-medium text-gray-800">{{ foundOrder.actualBags ?? foundOrder.estimatedBags }}</p></div>
          <div v-if="foundOrder.specialNotes"><span class="text-gray-400">Notes</span><p class="font-medium text-gray-800">{{ foundOrder.specialNotes }}</p></div>
        </div>
      </div>

      <!-- Check-in form -->
      <form @submit.prevent="checkIn" class="space-y-5">
        <div class="bg-white rounded-xl shadow-sm p-5 space-y-4">
          <h3 class="text-sm font-semibold text-gray-700 uppercase tracking-wide">Item Check-In</h3>

          <div class="divide-y divide-gray-100">
            <div v-for="item in foundOrder.items" :key="item.code"
              class="flex items-center justify-between py-3 gap-4">
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-gray-800">{{ item.name }} <span class="text-xs text-gray-400">({{ item.code }})</span></p>
                <p class="text-xs text-gray-400">Expected: {{ item.qty }}</p>
              </div>
              <div class="flex items-center gap-2">
                <input
                  v-model.number="checkinQtys[item.code]" type="number" min="0"
                  class="w-20 border border-gray-200 rounded-lg px-2 py-1.5 text-sm text-center focus:ring-2 focus:ring-brand-400 focus:border-transparent outline-none" />
                <span v-if="checkinQtys[item.code] !== item.qty" class="text-xs text-orange-500 font-medium">!</span>
              </div>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-600 mb-1">Damage Notes</label>
            <textarea v-model="damageNotes" rows="2"
              class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-400 focus:border-transparent outline-none resize-none"
              placeholder="Note any damaged items..."></textarea>
          </div>
        </div>

        <div class="flex gap-3">
          <AppButton type="submit" size="lg">
            {{ $t('facility.confirmCheckIn') }}
          </AppButton>
          <button type="button" @click="foundOrder = null"
            class="bg-gray-100 text-gray-600 font-medium py-2.5 px-6 rounded-lg hover:bg-gray-200 transition text-sm">
            Cancel
          </button>
        </div>
      </form>

      <!-- Success toast -->
      <div v-if="showSuccess" class="fixed bottom-6 right-6 bg-green-600 text-white px-5 py-3 rounded-lg shadow-lg text-sm font-medium z-50">
        Order checked in successfully!
      </div>
    </div>

    <!-- Recent check-ins -->
    <div class="bg-white rounded-xl shadow-sm overflow-hidden">
      <div class="px-5 py-4 border-b border-gray-100">
        <h3 class="text-sm font-semibold text-gray-700">Recent Check-Ins</h3>
      </div>
      <div class="divide-y divide-gray-100">
        <div v-for="order in recentCheckins" :key="order.id" class="px-5 py-3 flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-800">{{ order.id }}</p>
            <p class="text-xs text-gray-500">{{ order.client }}</p>
          </div>
          <StatusBadge :status="order.status" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onBeforeUnmount } from 'vue'
import StatusBadge from '../../ui/StatusBadge.vue'
import AppButton from '../../ui/AppButton.vue'
import { fetchOrders, mapOrderForDetail, mapStatus } from '../../../api/orders'
import { receiveAtFacility } from '../../../api/orders'
import { BrowserMultiFormatReader } from '@zxing/browser'

const manualOrderId = ref('')
const foundOrder = ref(null)
const damageNotes = ref('')
const showSuccess = ref(false)
const checkinQtys = reactive({})

const isScanning = ref(false)
const videoRef = ref(null)
const scanError = ref('')
const lastScannedCode = ref('')
let codeReader = null

const allOrders = ref([])
const loading = ref(true)

onMounted(async () => {
  try {
    const data = await fetchOrders()
    allOrders.value = data ?? []
  } catch { /* stays empty */ } finally {
    loading.value = false
  }
})

onBeforeUnmount(() => {
  stopScanner()
})

const recentCheckins = computed(() =>
  allOrders.value
    .filter(o => ['Arrived', 'Washing', 'Drying', 'Ironing', 'QualityCheck'].includes(o.status))
    .map(o => ({
      id: o.order_number ?? o._id,
      client: o.client?.company_name ?? '',
      status: mapStatus(o.status),
    }))
)

function lookupOrder() {
  const term = manualOrderId.value.trim()
  const raw = allOrders.value.find(o => o.order_number === term || o._id === term)
  if (raw) {
    const mapped = mapOrderForDetail(raw)
    foundOrder.value = mapped
    mapped.items.forEach(item => { checkinQtys[item.code] = item.qty })
  }
}

async function startScanner() {
  if (isScanning.value) return
  scanError.value = ''
  try {
    if (!codeReader) {
      codeReader = new BrowserMultiFormatReader()
    }
    const videoElement = videoRef.value
    if (!videoElement) return

    isScanning.value = true
    const constraints = { video: { facingMode: 'environment' } }
    const stream = await navigator.mediaDevices.getUserMedia(constraints)
    videoElement.srcObject = stream
    videoElement.setAttribute('playsinline', 'true')
    await videoElement.play()

    codeReader.decodeFromVideoDevice(null, videoElement, (result) => {
      if (result) {
        lastScannedCode.value = result.getText()
        manualOrderId.value = result.getText()
        lookupOrder()
        stopScanner()
      }
    })
  } catch (err) {
    console.error(err)
    scanError.value = 'Unable to access camera. Check browser permissions.'
    isScanning.value = false
  }
}

function stopScanner() {
  isScanning.value = false
  scanError.value = ''
  if (codeReader) {
    try {
      codeReader.reset()
    } catch {}
  }
  const videoElement = videoRef.value
  const stream = videoElement && videoElement.srcObject
  if (stream && typeof stream.getTracks === 'function') {
    stream.getTracks().forEach(t => t.stop())
  }
  if (videoElement) {
    videoElement.srcObject = null
  }
}

function toggleScanner() {
  if (isScanning.value) {
    stopScanner()
  } else {
    startScanner()
  }
}

async function checkIn() {
  if (!foundOrder.value) return
  const rawOrder = allOrders.value.find(
    o => o.order_number === foundOrder.value.id || o._id === foundOrder.value._id
  )
  if (!rawOrder) return
  try {
    const items = foundOrder.value.items.map(i => ({
      item_code: i.code,
      name: i.name,
      quantity: checkinQtys[i.code] ?? i.qty,
      unit_price: i.unitPrice,
      total_price: (checkinQtys[i.code] ?? i.qty) * i.unitPrice,
    }))
    await receiveAtFacility(rawOrder._id, {
      items,
      internal_notes: damageNotes.value || undefined,
    })
    showSuccess.value = true
    const refreshed = await fetchOrders()
    allOrders.value = refreshed ?? []
    setTimeout(() => {
      showSuccess.value = false
      foundOrder.value = null
      manualOrderId.value = ''
    }, 1500)
  } catch {
    showSuccess.value = false
  }
}
</script>
