<template>
  <div class="space-y-6">
    <LoadingPanel v-if="loading" />

    <template v-else>
    <h2 class="text-lg font-semibold text-brand-700">{{ $t('facility.receptionTitle') }}</h2>

    <!-- QR Scan -->
    <div class="bg-white rounded-xl shadow-sm p-5">
      <h3 class="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">{{ $t('facility.getOrder') }}</h3>
      <!-- <div class="border-2 border-dashed border-gray-200 rounded-lg p-4 sm:p-5 text-center space-y-3">
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
      </div> -->
      <div class="mt-3">
        <!-- <label class="block text-sm font-medium text-gray-600 mb-1">Or enter Order ID manually</label> -->
        <div class="flex gap-2">
          <input v-model="manualOrderId" type="text"
            class="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-400 focus:border-transparent outline-none"
            :placeholder="$t('facility.orderIdPlaceholder')" />
          <AppButton @click="lookupOrder">
            {{ $t('facility.lookUp') }}
          </AppButton>
        </div>
      </div>
    </div>

    <!-- Orders ready to receive -->
    <div class="bg-white rounded-xl shadow-sm overflow-hidden">
      <div class="px-5 py-4 border-b border-gray-100 flex items-center justify-between gap-3">
        <h3 class="text-sm font-semibold text-gray-700">Orders in Transit</h3>
        <span class="text-xs text-gray-500">{{ receivableOrders.length }} pending</span>
      </div>
      <div v-if="receivableOrders.length" class="divide-y divide-gray-100">
        <div v-for="order in receivableOrders" :key="order._id" class="px-5 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <p class="text-sm font-medium text-gray-800">{{ order.id }} - {{ order.client }}</p>
            <p class="text-xs text-gray-500">{{ order.serviceType }} · {{ order.pickupDate }}</p>
          </div>
          <button
            type="button"
            @click="selectOrderFromList(order)"
            class="self-start sm:self-auto bg-brand-700 text-white text-xs font-medium px-3 py-2 rounded-lg hover:bg-brand-800 transition"
          >
            Receive
          </button>
        </div>
      </div>
      <p v-else class="px-5 py-4 text-sm text-gray-400">No in-transit orders available.</p>
    </div>

    <!-- Order found -->
    <div v-if="foundOrder" class="space-y-5">
      <div class="bg-white rounded-xl shadow-sm p-5">
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-sm font-semibold text-gray-700">{{ foundOrder.id }} — {{ foundOrder.client }}</h3>
          <StatusBadge :status="foundOrder.status" />
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div><span class="text-gray-400">{{ $t('facility.serviceType') }}</span><p class="font-medium text-gray-800">{{ foundOrder.serviceType }}</p></div>
          <div><span class="text-gray-400">{{ $t('facility.expectedBags') }}</span><p class="font-medium text-gray-800">{{ foundOrder.actualBags ?? foundOrder.estimatedBags }}</p></div>
          <div><span class="text-gray-400">{{ $t('facility.property') }}</span><p class="font-medium text-gray-800">{{ foundOrder.propertyName }}</p></div>
          <div><span class="text-gray-400">{{ $t('facility.contactPerson') }}</span><p class="font-medium text-gray-800">{{ foundOrder.propertyContactPerson }}</p></div>
          <div><span class="text-gray-400">{{ $t('facility.contactPhone') }}</span><p class="font-medium text-gray-800">{{ foundOrder.propertyPhone }}</p></div>
          <div v-if="foundOrder.specialNotes"><span class="text-gray-400">{{ $t('facility.notes') }}</span><p class="font-medium text-gray-800">{{ foundOrder.specialNotes }}</p></div>
        </div>
      </div>

      <!-- Check-in form -->
      <form @submit.prevent="checkIn" class="space-y-5">
        <div class="bg-white rounded-xl shadow-sm p-5 space-y-4">
          <h3 class="text-sm font-semibold text-gray-700 uppercase tracking-wide">{{ $t('facility.itemCheckIn') }}</h3>

          <div class="divide-y divide-gray-100">
            <div v-for="(item, idx) in checkinItems" :key="`${item.code}-${idx}`"
              class="py-3 space-y-2">
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-gray-800">{{ item.name }} <span class="text-xs text-gray-400">({{ item.code }})</span></p>
                <p class="text-xs text-gray-400">
                  {{ $t('facility.expected') }}: {{ expectedQtyMap[item.code] ?? 0 }}
                </p>
                <p class="text-xs text-gray-500">
                  {{ $t('facility.totalReceived') }}: {{ itemTotal(item) }}
                </p>
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <label class="text-xs text-gray-600">
                  {{ $t('facility.goodQty') }}
                  <input
                    v-model.number="item.qtyGood" type="number" min="0"
                    class="mt-1 w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm text-center focus:ring-2 focus:ring-brand-400 focus:border-transparent outline-none" />
                </label>
                <label class="text-xs text-gray-600">
                  {{ $t('facility.badQty') }}
                  <input
                    v-model.number="item.qtyBad" type="number" min="0"
                    class="mt-1 w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm text-center focus:ring-2 focus:ring-brand-400 focus:border-transparent outline-none" />
                </label>
                <label class="text-xs text-gray-600">
                  {{ $t('facility.stainedQty') }}
                  <input
                    v-model.number="item.qtyStained" type="number" min="0"
                    class="mt-1 w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm text-center focus:ring-2 focus:ring-brand-400 focus:border-transparent outline-none" />
                </label>
              </div>
              <div class="flex items-center gap-2">
                <button
                  type="button"
                  @click="removeCheckinItem(idx)"
                  class="text-xs text-red-500 hover:text-red-700 font-medium"
                >{{ $t('facility.remove') }}</button>
                <span v-if="itemTotal(item) !== (expectedQtyMap[item.code] ?? 0)" class="text-xs text-orange-500 font-medium">!</span>
              </div>
            </div>
          </div>

          <p v-if="!checkinItems.length" class="text-xs text-gray-400">{{ $t('facility.noCheckInItems') }}</p>

          <div class="border-t border-gray-100 pt-3 space-y-2">
            <label class="block text-sm font-medium text-gray-600">{{ $t('facility.addItemToCheckIn') }}</label>
            <div class="flex flex-wrap items-center gap-2">
              <select
                v-model="selectedCatalogCode"
                class="min-w-[220px] border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-400 focus:border-transparent outline-none"
              >
                <option value="">{{ $t('facility.selectItem') }}</option>
                <option v-for="catItem in itemCatalog" :key="catItem.code" :value="catItem.code">
                  {{ catItem.name }} ({{ catItem.code }})
                </option>
              </select>
              <button
                type="button"
                @click="addCatalogItem"
                class="bg-gray-100 text-gray-700 text-sm font-medium px-3 py-2 rounded-lg hover:bg-gray-200 transition"
              >
                {{ $t('facility.addItem') }}
              </button>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-600 mb-1">{{ $t('facility.damageNotes') }}</label>
            <textarea v-model="damageNotes" rows="2"
              class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-400 focus:border-transparent outline-none resize-none"
              :placeholder="$t('facility.damageNotesPlaceholder')"></textarea>
          </div>
        </div>

        <div class="flex gap-3">
          <AppButton v-if="canConfirmCheckIn" type="submit" size="lg">
            {{ $t('facility.confirmCheckIn') }}
          </AppButton>
          <button type="button" @click="foundOrder = null"
            class="bg-gray-100 text-gray-600 font-medium py-2.5 px-6 rounded-lg hover:bg-gray-200 transition text-sm">
            {{ $t('common.cancel') }}
          </button>
        </div>
        <p v-if="!canConfirmCheckIn" class="text-sm text-amber-600 font-medium">
          {{ $t('facility.checkInNotAllowed') }}
        </p>
      </form>

      <!-- Success toast -->
      <div v-if="showSuccess" class="fixed bottom-6 right-6 bg-green-600 text-white px-5 py-3 rounded-lg shadow-lg text-sm font-medium z-50">
        {{ $t('facility.checkInSuccess') }}
      </div>
    </div>

    <!-- Recent check-ins -->
    <div class="bg-white rounded-xl shadow-sm overflow-hidden">
      <div class="px-5 py-4 border-b border-gray-100">
        <h3 class="text-sm font-semibold text-gray-700">{{ $t('facility.recentCheckIns') }}</h3>
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
import { useI18n } from 'vue-i18n'
import StatusBadge from '../../ui/StatusBadge.vue'
import AppButton from '../../ui/AppButton.vue'
import LoadingPanel from '../../ui/LoadingPanel.vue'
import { fetchOrderById, fetchOrders, mapOrderForDetail, mapStatus } from '../../../api/orders'
import { receiveAtFacility } from '../../../api/orders'
import { getItems, mapItemForCatalog } from '../../../api/items'
import { useUiStore } from '../../../stores/ui.js'
import { BrowserMultiFormatReader } from '@zxing/browser'

const ui = useUiStore()
const { t } = useI18n()

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

function normalizeStatus(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_')
}

function isReceivableStatus(value) {
  const status = normalizeStatus(value)
  return status === 'transit' || status === 'in_transit'
}

const foundOrderRawStatus = computed(() => {
  if (!foundOrder.value) return ''
  const raw = allOrders.value.find(
    o => o._id === foundOrder.value._id || o.order_number === foundOrder.value.id
  )
  return raw?.status ?? ''
})

const canConfirmCheckIn = computed(() => isReceivableStatus(foundOrderRawStatus.value))

const receivableOrders = computed(() =>
  allOrders.value
    .filter(o => isReceivableStatus(o.status))
    .map((o) => {
      const mapped = mapOrderForDetail(o)
      return {
        _id: o._id ?? o.id,
        id: mapped.id,
        client: mapped.client,
        serviceType: mapped.serviceType,
        pickupDate: mapped.pickupDate,
      }
    })
)

function normalizeQty(value) {
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed < 0) return 0
  return Math.floor(parsed)
}

function itemTotal(item) {
  return normalizeQty(item.qtyGood) + normalizeQty(item.qtyBad) + normalizeQty(item.qtyStained)
}

function seedCheckinItems(mappedOrder) {
  checkinItems.value = (mappedOrder.items ?? []).map((item) => ({
    itemId: item.itemId ?? null,
    code: item.code,
    name: item.name,
    qtyGood: normalizeQty(item.qty),
    qtyBad: 0,
    qtyStained: 0,
    unitPrice: Number(item.unitPrice) || 0,
  }))
}

async function lookupOrder() {
  const term = manualOrderId.value.trim()
  const raw = allOrders.value.find(o => o.order_number === term || o._id === term)
  if (!raw) return

  await openRawOrder(raw)
}

async function openRawOrder(raw) {
  if (!raw) return

  try {
    // Use detail endpoint to guarantee order item identifiers for reception payload.
    const detail = await fetchOrderById(String(raw._id ?? raw.id))
    const mapped = mapOrderForDetail(detail ?? raw)
    foundOrder.value = mapped
    seedCheckinItems(mapped)
  } catch {
    const mapped = mapOrderForDetail(raw)
    foundOrder.value = mapped
    seedCheckinItems(mapped)
  }
}

async function selectOrderFromList(order) {
  if (!order?._id) return
  manualOrderId.value = String(order.id ?? order._id)
  const raw = allOrders.value.find(o => (o._id ?? o.id) === order._id)
  if (!raw) return
  await openRawOrder(raw)
}

function addCatalogItem() {
  if (!selectedCatalogCode.value) return
  const selected = itemCatalog.value.find(i => i.code === selectedCatalogCode.value)
  if (!selected) return

  const existing = checkinItems.value.find(i => i.code === selected.code)
  if (existing) {
    existing.qtyGood = normalizeQty(existing.qtyGood) + 1
  } else {
    checkinItems.value.push({
      itemId: selected.id ?? null,
      code: selected.code,
      name: selected.name,
      qtyGood: 1,
      qtyBad: 0,
      qtyStained: 0,
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
    scanError.value = t('facility.cameraAccessError')
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
  if (!canConfirmCheckIn.value) {
    ui.showError(t('facility.checkInNotEligible'))
    return
  }
  const rawOrder = allOrders.value.find(
    o => o.order_number === foundOrder.value.id || o._id === foundOrder.value._id
  )
  if (!rawOrder) return
  try {
    const items = checkinItems.value
      .map((i) => ({
        qty_good: normalizeQty(i.qtyGood),
        qty_bad: normalizeQty(i.qtyBad),
        qty_stained: normalizeQty(i.qtyStained),
        item_id: i.itemId,
        quantity: normalizeQty(i.qtyGood) + normalizeQty(i.qtyBad) + normalizeQty(i.qtyStained),
      }))
      .filter((i) => i.item_id !== null && i.item_id !== undefined && String(i.item_id).trim() !== '' && i.quantity > 0)

    if (!items.length) {
      ui.showError(t('facility.noValidItemsForReception'))
      return
    }

    const staffConfirmedBags = items.reduce((sum, i) => sum + i.quantity, 0)

    await receiveAtFacility(foundOrder.value._id ?? rawOrder._id, {
      staff_confirmed_bags: staffConfirmedBags,
      items,
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
    ui.showError(err?.message || t('facility.checkInFailed'))
    showSuccess.value = false
  }
}
</script>
