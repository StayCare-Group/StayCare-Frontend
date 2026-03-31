<template>
  <div class="space-y-6">
    <LoadingPanel v-if="loading" />

    <template v-else>
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
            <div v-for="(item, idx) in checkinItems" :key="`${item.code}-${idx}`"
              class="flex items-center justify-between py-3 gap-4">
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-gray-800">{{ item.name }} <span class="text-xs text-gray-400">({{ item.code }})</span></p>
                <p class="text-xs text-gray-400">
                  Expected: {{ expectedQtyMap[item.code] ?? 0 }}
                </p>
              </div>
              <div class="flex items-center gap-2">
                <input
                  v-model.number="item.qty" type="number" min="0"
                  class="w-20 border border-gray-200 rounded-lg px-2 py-1.5 text-sm text-center focus:ring-2 focus:ring-brand-400 focus:border-transparent outline-none" />
                <button
                  type="button"
                  @click="removeCheckinItem(idx)"
                  class="text-xs text-red-500 hover:text-red-700 font-medium"
                >Remove</button>
                <span v-if="item.qty !== (expectedQtyMap[item.code] ?? 0)" class="text-xs text-orange-500 font-medium">!</span>
              </div>
            </div>
          </div>

          <p v-if="!checkinItems.length" class="text-xs text-gray-400">No items currently in check-in list. Add items below.</p>

          <div class="border-t border-gray-100 pt-3 space-y-2">
            <label class="block text-sm font-medium text-gray-600">Add item to check-in</label>
            <div class="flex flex-wrap items-center gap-2">
              <select
                v-model="selectedCatalogCode"
                class="min-w-[220px] border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-400 focus:border-transparent outline-none"
              >
                <option value="">Select item</option>
                <option v-for="catItem in itemCatalog" :key="catItem.code" :value="catItem.code">
                  {{ catItem.name }} ({{ catItem.code }})
                </option>
              </select>
              <button
                type="button"
                @click="addCatalogItem"
                class="bg-gray-100 text-gray-700 text-sm font-medium px-3 py-2 rounded-lg hover:bg-gray-200 transition"
              >
                Add item
              </button>
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
    </template>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onBeforeUnmount } from 'vue'
import StatusBadge from '../../ui/StatusBadge.vue'
import AppButton from '../../ui/AppButton.vue'
import LoadingPanel from '../../ui/LoadingPanel.vue'
import { fetchOrders, mapOrderForDetail, mapStatus } from '../../../api/orders'
import { receiveAtFacility } from '../../../api/orders'
import { getItems, mapItemForCatalog } from '../../../api/items'
import { useUiStore } from '../../../stores/ui.js'
import { BrowserMultiFormatReader } from '@zxing/browser'

const ui = useUiStore()

const manualOrderId = ref('')
const foundOrder = ref(null)
const damageNotes = ref('')
const showSuccess = ref(false)
const checkinItems = ref([])
const itemCatalog = ref([])
const selectedCatalogCode = ref('')

const isScanning = ref(false)
const videoRef = ref(null)
const scanError = ref('')
const lastScannedCode = ref('')
let codeReader = null

const allOrders = ref([])
const loading = ref(true)

onMounted(async () => {
  try {
    const [data, catalogData] = await Promise.all([
      fetchOrders(),
      getItems().catch(() => []),
    ])
    allOrders.value = data ?? []
    itemCatalog.value = (catalogData ?? []).map(mapItemForCatalog)
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
      client: o.client?.name ?? o.client ?? '',
      status: mapStatus(o.status),
    }))
)

const expectedQtyMap = computed(() => {
  const map = {}
  for (const item of foundOrder.value?.items ?? []) {
    map[item.code] = item.qty ?? 0
  }
  return map
})

function normalizeQty(value) {
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed < 0) return 0
  return Math.floor(parsed)
}

function seedCheckinItems(mappedOrder) {
  checkinItems.value = (mappedOrder.items ?? []).map((item) => ({
    code: item.code,
    name: item.name,
    qty: normalizeQty(item.qty),
    unitPrice: Number(item.unitPrice) || 0,
  }))
}

function lookupOrder() {
  const term = manualOrderId.value.trim()
  const raw = allOrders.value.find(o => o.order_number === term || o._id === term)
  if (raw) {
    const mapped = mapOrderForDetail(raw)
    foundOrder.value = mapped
    seedCheckinItems(mapped)
  }
}

function addCatalogItem() {
  if (!selectedCatalogCode.value) return
  const selected = itemCatalog.value.find(i => i.code === selectedCatalogCode.value)
  if (!selected) return

  const existing = checkinItems.value.find(i => i.code === selected.code)
  if (existing) {
    existing.qty = normalizeQty(existing.qty) + 1
  } else {
    checkinItems.value.push({
      code: selected.code,
      name: selected.name,
      qty: 1,
      unitPrice: Number(selected.unitPrice) || 0,
    })
  }
  selectedCatalogCode.value = ''
}

function removeCheckinItem(index) {
  checkinItems.value.splice(index, 1)
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
    const items = checkinItems.value
      .map((i) => ({
        item_code: i.code,
        name: i.name,
        quantity: normalizeQty(i.qty),
        unit_price: Number(i.unitPrice) || 0,
      }))
      .filter((i) => i.quantity > 0)
      .map((i) => ({
        ...i,
        total_price: i.quantity * i.unit_price,
      }))

    if (!items.length) {
      ui.showError('Add at least one item with quantity greater than zero.')
      return
    }

    const invalidPrice = items.find(i => i.unit_price <= 0 || i.total_price <= 0)
    if (invalidPrice) {
      ui.showError(`Invalid price for item ${invalidPrice.item_code}. Please verify item catalog pricing.`)
      return
    }

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
      checkinItems.value = []
    }, 1500)
  } catch (err) {
    ui.showError(err?.message || 'Check-in failed. Please try again.')
    showSuccess.value = false
  }
}
</script>
