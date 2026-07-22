<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center gap-3">
      <button @click="navStore.goBack('orders')" class="text-brand-700 hover:text-gray-400">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
      </button>
      <h2 class="text-lg font-semibold text-brand-700">{{ order?.id }}</h2>
      <StatusBadge v-if="order" :status="order.status" />
      <!-- PDF download -->
      <AppButton
        v-if="order"
        variant="secondary"
        size="sm"
        :loading="generatingPdf"
        @click="downloadPdf"
        class="ml-auto"
      >
        <svg class="w-3.5 h-3.5 mr-1 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        {{ generatingPdf ? $t('orderPdf.generating') : $t('orderPdf.download') }}
      </AppButton>
      <!-- Edit order (admin / staff only) -->
      <AppButton
        v-if="order && isAdminOrStaff"
        variant="secondary"
        size="sm"
        :disabled="order.isInvoiced"
        :title="order.isInvoiced ? 'No se puede editar una orden facturada.' : ''"
        @click="openEditModal"
      >
        <svg class="w-3.5 h-3.5 mr-1 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
        {{ $t('admin.editOrder') }}
      </AppButton>
    </div>

    <p v-if="order && isAdminOrStaff && order.isInvoiced" class="text-xs text-amber-600">
      No se puede editar una orden facturada.
    </p>

    <div v-if="order" class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Left column: details + items -->
      <div class="lg:col-span-2 space-y-6">
        <!-- Order Info -->
        <div class="bg-white rounded-xl shadow-sm p-5 space-y-3">
          <h3 class="text-sm font-semibold text-gray-700 uppercase tracking-wide">{{ $t('orderDetail.orderInformation') }}</h3>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div><span class="text-gray-400">{{ $t('common.client') }}</span><p class="font-medium text-gray-800">{{ order.client }}</p></div>
            <div><span class="text-gray-400">{{ $t('orderDetail.serviceType') }}</span><p class="font-medium text-gray-800">{{ order.serviceType }}</p></div>
            <div><span class="text-gray-400">{{ $t('orderDetail.pickupAddress') }}</span><p class="font-medium text-gray-800">{{ order.pickupAddress }}</p></div>
            <div><span class="text-gray-400">{{ $t('orderDetail.pickupDate') }}</span><p class="font-medium text-gray-800">{{ order.pickupDate }} &middot; {{ order.pickupTimeWindow }}</p></div>
            <div><span class="text-gray-400">{{ $t('orderDetail.estimatedBags') }}</span><p class="font-medium text-gray-800">{{ order.estimatedBags }}</p></div>
            <div><span class="text-gray-400">{{ $t('orderDetail.actualBags') }}</span><p class="font-medium text-gray-800">{{ order.actualBags ?? '—' }}</p></div>
            <div v-if="order.driverPickup"><span class="text-gray-400">{{ $t('orderDetail.pickupDriver') }}</span><p class="font-medium text-gray-800">{{ order.driverPickup }}</p></div>
            <div v-if="order.driverDelivery"><span class="text-gray-400">{{ $t('orderDetail.deliveryDriver') }}</span><p class="font-medium text-gray-800">{{ order.driverDelivery }}</p></div>
          </div>
          <div v-if="order.specialNotes" class="pt-2 border-t border-gray-100">
            <span class="text-xs text-gray-400">{{ $t('client.specialNotes') }}</span>
            <p class="text-sm text-gray-700 mt-0.5">{{ order.specialNotes }}</p>
          </div>
        </div>

        <!-- Items -->
        <div class="space-y-2">
          <DataTable :title="$t('client.items')" :headers="itemHeaders" :items="orderItemRows" row-key="code" min-width="700px">
            <template #cell-code="{ value }">
              <span class="text-gray-500 font-mono text-xs">{{ value }}</span>
            </template>
            <template #cell-name="{ value }">
              <span class="text-gray-800">{{ value }}</span>
            </template>
            <template #cell-qty="{ value }">
              <span class="text-gray-700">{{ value }}</span>
            </template>
            <template #cell-unitPrice="{ value }">
              <span class="text-gray-500">&euro;{{ value.toFixed(2) }}</span>
            </template>
            <template #cell-lineTotal="{ value }">
              <span class="font-medium text-gray-800">&euro;{{ value.toFixed(2) }}</span>
            </template>
          </DataTable>

          <div class="bg-gray-50 rounded-lg px-5 py-3 text-sm space-y-1">
            <div class="flex justify-end gap-4">
              <span class="text-gray-600 font-medium">{{ $t('orderDetail.vatAmount') }}</span>
              <span class="text-gray-800 font-medium">&euro;{{ (order.vatAmount ?? 0).toFixed(2) }}</span>
            </div>
            <div class="flex justify-end gap-4 font-semibold">
              <span class="text-gray-600">{{ $t('orderDetail.orderTotal') }}</span>
              <span class="text-gray-800">&euro;{{ order.total.toFixed(2) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Right column: timeline -->
      <div class="space-y-6">
        <div class="bg-white rounded-xl shadow-sm p-5">
          <h3 class="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">{{ $t('orderDetail.statusTimeline') }}</h3>
          <OrderTimeline :steps="order.timeline" :currentStatus="order.status" />
        </div>
      </div>
    </div>

    <div v-else-if="loading" class="bg-white rounded-xl shadow-sm p-10 text-center">
      <p class="text-gray-400">{{ $t('orderDetail.loadingOrder') }}</p>
    </div>
    <div v-else class="bg-white rounded-xl shadow-sm p-10 text-center">
      <p class="text-gray-400">{{ $t('orderDetail.orderNotFound') }}</p>
    </div>
  </div>

  <!-- Edit Order Modal -->
  <Teleport to="body">
    <div v-if="showEditModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div class="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 class="text-base font-semibold text-brand-700">{{ $t('admin.editOrder') }}</h3>
          <button @click="showEditModal = false" class="text-gray-400 hover:text-gray-600">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        <form @submit.prevent="submitEdit" class="px-6 py-5 space-y-5">
          <!-- Pickup date & time window -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-600 mb-1">{{ $t('admin.pickupDate') }}</label>
              <input v-model="editForm.pickupDate" type="date" required
                class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-400 focus:border-transparent outline-none" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-600 mb-1">{{ $t('admin.timeWindow') }}</label>
              <select v-model="editForm.pickupTimeWindow" required
                class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-400 focus:border-transparent outline-none">
                <option value="">{{ $t('admin.selectTimeWindow') }}</option>
                <option v-for="tw in ALL_TIME_WINDOWS" :key="tw" :value="tw">{{ tw }}</option>
              </select>
            </div>
          </div>

          <!-- Estimated bags & special notes -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-600 mb-1">{{ $t('admin.estimatedBags') }}</label>
              <input v-model.number="editForm.estimatedBags" type="number" min="1" required
                class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-400 focus:border-transparent outline-none" />
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-600 mb-1">{{ $t('admin.specialNotes') }}</label>
            <textarea v-model="editForm.specialNotes" rows="3"
              class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-400 focus:border-transparent outline-none resize-none"
              :placeholder="$t('admin.specialNotesPlaceholder')"></textarea>
          </div>

          <!-- Items -->
          <div>
            <h4 class="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">{{ $t('admin.estimatedItems') }}</h4>
            <div v-if="editLoadingItems" class="text-sm text-gray-400">{{ $t('common.loading') }}</div>
            <div v-else class="divide-y divide-gray-100">
              <div v-for="item in editItems" :key="item.code" class="flex items-center justify-between py-3 gap-4">
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium text-gray-800">{{ item.name }} <span class="text-xs text-gray-400">({{ item.code }})</span></p>
                  <p class="text-xs text-gray-400">&euro;{{ item.unitPrice.toFixed(2) }} / unit</p>
                </div>
                <input v-model.number="editItemQtys[item.code]" type="number" min="0"
                  class="w-20 border border-gray-200 rounded-lg px-2 py-1.5 text-sm text-center focus:ring-2 focus:ring-brand-400 focus:border-transparent outline-none"
                  placeholder="0" />
              </div>
            </div>
          </div>

          <p v-if="editError" class="text-sm text-red-500">{{ editError }}</p>

          <div class="flex gap-3 pt-2">
            <AppButton type="submit" size="md" :loading="editSubmitting">
              {{ $t('admin.saveChanges') }}
            </AppButton>
            <button type="button" @click="showEditModal = false"
              class="bg-gray-100 text-gray-600 font-medium py-2 px-5 rounded-lg hover:bg-gray-200 transition text-sm">
              {{ $t('common.cancel') }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed, reactive, watch, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import StatusBadge from '../../ui/StatusBadge.vue'
import OrderTimeline from '../../ui/OrderTimeline.vue'
import AppButton from '../../ui/AppButton.vue'
import DataTable from '../../ui/DataTable.vue'
import { useNavStore } from '../../../stores/nav.js'
import { useAuthStore } from '../../../stores/auth.js'
import { fetchOrderById, mapOrderForDetail, updateOrder } from '../../../api/orders'
import { fetchClientById } from '../../../api/clients'
import { fetchAllItems, mapItemForCatalog } from '../../../api/items'
import { generateOrderPdf } from '../../../utils/generateOrderPdf.js'

const { t } = useI18n()
const navStore = useNavStore()
const authStore = useAuthStore()

const order = ref(null)
const loading = ref(true)
const generatingPdf = ref(false)

const isAdminOrStaff = computed(() => {
  const role = authStore.user?.role ?? ''
  return role === 'admin' || role === 'staff'
})

async function downloadPdf() {
  if (!order.value || generatingPdf.value) return
  generatingPdf.value = true
  try {
    generateOrderPdf(order.value, t)
  } finally {
    generatingPdf.value = false
  }
}

// ── Edit modal ──────────────────────────────────────────────────────────────
const ALL_TIME_WINDOWS = ['08:00 - 10:00', '09:00 - 11:00', '10:00 - 12:00', '13:00 - 15:00', '14:00 - 16:00', '15:00 - 17:00']

const showEditModal = ref(false)
const editSubmitting = ref(false)
const editError = ref('')
const editLoadingItems = ref(false)
const editItems = ref([])
const editItemQtys = reactive({})

const editForm = reactive({
  pickupDate: '',
  pickupTimeWindow: '',
  estimatedBags: 1,
  specialNotes: '',
})

function parseTimeWindow(tw, date) {
  const [start, end] = tw.split(' - ')
  return {
    start_time: new Date(`${date}T${start}:00`).toISOString(),
    end_time: new Date(`${date}T${end}:00`).toISOString(),
  }
}

async function openEditModal() {
  if (!order.value) return
  if (order.value.isInvoiced) {
    editError.value = 'No se puede editar una orden facturada.'
    showEditModal.value = false
    return
  }
  editError.value = ''

  // Pre-populate form from current order
  editForm.pickupDate = order.value.pickupDate ?? ''
  editForm.pickupTimeWindow = order.value.pickupTimeWindow ?? ''
  editForm.estimatedBags = order.value.estimatedBags ?? 1
  editForm.specialNotes = order.value.specialNotes ?? ''

  // Load full item catalog
  editLoadingItems.value = true
  showEditModal.value = true
  try {
    const rawItems = await fetchAllItems().catch(() => [])
    editItems.value = (rawItems ?? []).map(mapItemForCatalog)

    // Reset quantities, then pre-fill from current order items
    editItems.value.forEach(item => { editItemQtys[item.code] = 0 })
    ;(order.value.items ?? []).forEach(oi => {
      if (editItemQtys[oi.code] !== undefined) {
        editItemQtys[oi.code] = oi.qty
      }
    })
  } finally {
    editLoadingItems.value = false
  }
}

async function submitEdit() {
  if (editSubmitting.value) return
  if (order.value?.isInvoiced) {
    editError.value = 'No se puede editar una orden facturada.'
    return
  }
  editSubmitting.value = true
  editError.value = ''
  try {
    const items = editItems.value
      .filter(i => (editItemQtys[i.code] || 0) > 0)
      .map(i => ({
        item_id: i._id ?? i.id,
        quantity: editItemQtys[i.code],
        qty_good: editItemQtys[i.code],
        qty_bad: 0,
        qty_stained: 0,
      }))

    const payload = {
      pickup_date: editForm.pickupDate,
      pickup_window: editForm.pickupTimeWindow
        ? parseTimeWindow(editForm.pickupTimeWindow, editForm.pickupDate)
        : undefined,
      estimated_bags: editForm.estimatedBags,
      special_notes: editForm.specialNotes || undefined,
      items: items.length > 0 ? items : undefined,
    }

    const updated = await updateOrder(String(order.value._id), payload)
    order.value = mapOrderForDetail(updated)
    showEditModal.value = false
  } catch (err) {
    editError.value = err?.message ?? t('common.error')
  } finally {
    editSubmitting.value = false
  }
}

const itemHeaders = computed(() => [
  { key: 'code', label: t('orderDetail.itemCode') },
  { key: 'name', label: t('orderDetail.itemName') },
  { key: 'qty', label: t('orderDetail.quantity'), tdClass: 'text-right', thClass: 'text-right' },
  { key: 'unitPrice', label: t('orderDetail.unitPrice'), tdClass: 'text-right', thClass: 'text-right' },
  { key: 'lineTotal', label: t('orderDetail.lineTotal'), tdClass: 'text-right', thClass: 'text-right' },
])

const orderItemRows = computed(() =>
  (order.value?.items ?? []).map(item => ({
    ...item,
    lineTotal: (item.qty || 0) * (item.unitPrice || 0),
  }))
)

async function loadOrder() {
  const id = navStore.selectedId
  if (!id) return
  loading.value = true
  try {
    const data = await fetchOrderById(id)
    const mapped = mapOrderForDetail(data)

    // If client name is missing but we have a clientId, fetch client info
    if (!mapped.client && mapped.clientId) {
      try {
        const clientData = await fetchClientById(mapped.clientId)
        mapped.client = clientData.name ?? ''
        if (!mapped.pickupAddress) {
          const prop = clientData.properties?.[0]
          mapped.pickupAddress = prop?.address
            ? `${prop.address}, ${prop.city ?? ''}`
            : clientData.billing_address ?? clientData.address ?? ''
          mapped.deliveryAddress = mapped.pickupAddress
        }
      } catch { /* client fetch failed, leave empty */ }
    }

    order.value = mapped
  } catch {
    order.value = null
  } finally {
    loading.value = false
  }
}

onMounted(loadOrder)
watch(() => navStore.selectedId, loadOrder)
</script>
