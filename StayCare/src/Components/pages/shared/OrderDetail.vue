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
        :disabled="!canEditOrder"
        :title="cannotEditTooltip"
        @click="openEditModal"
      >
        <svg class="w-3.5 h-3.5 mr-1 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
        {{ $t('admin.editOrder') }}
      </AppButton>
      <!-- Cancel order (admin only) -->
      <AppButton
        v-if="order && isAdmin && isCancelableStatus(order.status)"
        variant="danger"
        size="sm"
        @click="showCancelModal = true"
      >
        <svg class="w-3.5 h-3.5 mr-1 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
        {{ $t('admin.cancelOrder') }}
      </AppButton>
    </div>

    <p v-if="order && isAdminOrStaff && order.isInvoiced" class="text-xs text-amber-600">
      {{ $t('orderDetail.cannotEditInvoicedOrder') }}
    </p>
    <p v-else-if="order && isAdminOrStaff && !isEditableStatus(order.status)" class="text-xs text-amber-600">
      {{ $t('orderDetail.cannotEditReceivedOrder') }}
    </p>

    <div v-if="order" class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Left column: details + items -->
      <div class="lg:col-span-2 space-y-6">
        <!-- Order Info -->
        <InfoGridCard
          :title="$t('orderDetail.orderInformation')"
          :items="orderInfoItems"
        >
          <template v-if="order.specialNotes" #footer>
            <span class="text-xs text-gray-400 block">{{ $t('common.specialNotes') }}</span>
            <p class="text-sm text-gray-700 mt-0.5">{{ order.specialNotes }}</p>
          </template>
        </InfoGridCard>

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
            <template #cell-qtyGood="{ value }">
              <span :class="value != null ? 'text-green-600 font-medium' : 'text-gray-300'">
                {{ value ?? '—' }}
              </span>
            </template>
            <template #cell-qtyBad="{ value }">
              <span :class="value != null && value > 0 ? 'text-red-500 font-medium' : value != null ? 'text-gray-400' : 'text-gray-300'">
                {{ value ?? '—' }}
              </span>
            </template>
            <template #cell-qtyStained="{ value }">
              <span :class="value != null && value > 0 ? 'text-orange-500 font-medium' : value != null ? 'text-gray-400' : 'text-gray-300'">
                {{ value ?? '—' }}
              </span>
            </template>
            <template #cell-unitPrice="{ value }">
              <span class="text-gray-500">{{ formatCurrency(value) }}</span>
            </template>
            <template #cell-lineTotal="{ value }">
              <span class="font-medium text-gray-800">{{ formatCurrency(value) }}</span>
            </template>
          </DataTable>

          <div class="bg-gray-50 rounded-lg px-5 py-3 text-sm space-y-1">
            <div class="flex justify-end gap-4">
              <span class="text-gray-600 font-medium">{{ $t('orderDetail.vatAmount') }}</span>
              <span class="text-gray-800 font-medium">{{ formatCurrency(order.vatAmount) }}</span>
            </div>
            <div class="flex justify-end gap-4 font-semibold">
              <span class="text-gray-600">{{ $t('orderDetail.orderTotal') }}</span>
              <span class="text-gray-800">{{ formatCurrency(order.total) }}</span>
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
  <AppModal
    :show="showEditModal"
    :title="$t('admin.editOrder')"
    size="xl"
    :close-on-backdrop="false"
    :loading="editSubmitting"
    @close="showEditModal = false"
  >
    <form id="editOrderForm" @submit.prevent="submitEdit" novalidate class="space-y-5">
      <!-- Pickup date & time window -->
      <PickupWindowFields
        v-model:pickup-date="editForm.pickupDate"
        v-model:pickup-time-window="editForm.pickupTimeWindow"
        :is-admin-or-staff="isAdminOrStaff"
        :min-date="todayStr"
      />

      <!-- Estimated bags & special notes -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-600 mb-1">{{ $t('admin.estimatedBags') }}</label>
          <input v-model.number="editForm.estimatedBags" type="number" min="1" required
            class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-400 focus:border-transparent outline-none" />
        </div>
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-600 mb-1">{{ $t('common.specialNotes') }}</label>
        <textarea v-model="editForm.specialNotes" rows="3"
          class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-400 focus:border-transparent outline-none resize-none"
          :placeholder="$t('admin.specialNotesPlaceholder')"></textarea>
      </div>

      <!-- Items -->
      <OrderItemsPicker v-model="editItemQtys" @catalog-loaded="onEditCatalogLoaded" />

      <p v-if="editError" class="text-sm text-red-500">{{ editError }}</p>
    </form>

    <template #footer>
      <AppButton form="editOrderForm" type="submit" size="md" :loading="editSubmitting">
        {{ $t('admin.saveChanges') }}
      </AppButton>
      <button type="button" @click="showEditModal = false" :disabled="editSubmitting"
        class="bg-gray-100 text-gray-600 font-medium py-2 px-5 rounded-lg hover:bg-gray-200 transition text-sm disabled:opacity-50">
        {{ $t('common.cancel') }}
      </button>
    </template>
  </AppModal>

  <!-- Cancel Order Modal -->
  <CancelOrderModal
    :show="showCancelModal"
    :order="order"
    @close="showCancelModal = false"
    @success="loadOrder"
  />
</template>

<script setup>
import { ref, computed, reactive, watch, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import AppModal from '../../ui/AppModal.vue'
import StatusBadge from '../../ui/StatusBadge.vue'
import OrderTimeline from '../../ui/OrderTimeline.vue'
import AppButton from '../../ui/AppButton.vue'
import DataTable from '../../ui/DataTable.vue'
import CancelOrderModal from '../../ui/CancelOrderModal.vue'
import InfoGridCard from '../../ui/InfoGridCard.vue'
import { useNavStore } from '../../../stores/nav.js'
import { useAuthStore } from '../../../stores/auth.js'
import { useUiStore } from '../../../stores/ui.js'
import { fetchOrderById, updateOrder } from '../../../api/orders'
import { mapOrderForDetail } from '@/utils/orderMappers'
import { fetchClientById } from '../../../api/clients'
import { generateOrderPdf } from '../../../utils/generateOrderPdf.js'
import { isCancelableStatus, isEditableStatus } from '../../../utils/orderFlow'
import PickupWindowFields from '../../forms/PickupWindowFields.vue'
import OrderItemsPicker from '../../forms/OrderItemsPicker.vue'
import { getTodayDateString, normalizeDateString, isPastDate } from '../../../utils/date'
import { formatCurrency } from '@/utils/pricing'

const { t } = useI18n()
const navStore = useNavStore()
const authStore = useAuthStore()
const uiStore = useUiStore()

const order = ref(null)
const loading = ref(true)
const generatingPdf = ref(false)

const showCancelModal = ref(false)

const isAdmin = computed(() => authStore.isAdmin)
const isAdminOrStaff = computed(() => authStore.isInternal)

const canEditOrder = computed(() => {
  if (!order.value) return false
  if (order.value.isInvoiced) return false
  return isEditableStatus(order.value.status)
})

const cannotEditTooltip = computed(() => {
  if (order.value?.isInvoiced) return t('orderDetail.cannotEditInvoicedOrder')
  if (!isEditableStatus(order.value?.status)) return t('orderDetail.cannotEditReceivedOrder')
  return ''
})

const orderInfoItems = computed(() => {
  if (!order.value) return []
  return [
    { label: t('common.client'), value: order.value.client },
    { label: t('orderDetail.serviceType'), value: order.value.serviceType },
    { label: t('orderDetail.pickupAddress'), value: order.value.pickupAddress },
    {
      label: t('orderDetail.pickupDate'),
      value: `${order.value.pickupDate} · ${order.value.pickupTimeWindow}`,
    },
    { label: t('orderDetail.estimatedBags'), value: order.value.estimatedBags },
    { label: t('orderDetail.actualBags'), value: order.value.actualBags ?? '—' },
    {
      label: t('orderDetail.pickupDriver'),
      value: order.value.driverPickup,
      show: Boolean(order.value.driverPickup),
    },
    {
      label: t('orderDetail.deliveryDriver'),
      value: order.value.driverDelivery,
      show: Boolean(order.value.driverDelivery),
    },
  ]
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
const editItemQtys = ref({})
const editItemCatalogByCode = ref({})

const editForm = reactive({
  pickupDate: '',
  pickupTimeWindow: '',
  estimatedBags: 1,
  specialNotes: '',
})

function syncOrderItemsToEditQtys() {
  if (!order.value?.items) return
  const currentQtys = { ...editItemQtys.value }
  order.value.items.forEach(oi => {
    if (oi.code !== undefined) {
      currentQtys[oi.code] = oi.qty ?? 0
    }
  })
  editItemQtys.value = currentQtys
}

function onEditCatalogLoaded(catalog) {
  editItemCatalogByCode.value = catalog
  syncOrderItemsToEditQtys()
}

function parseTimeWindow(tw, date) {
  const [start, end] = tw.split(' - ')
  return {
    start_time: new Date(`${date}T${start}:00`).toISOString(),
    end_time: new Date(`${date}T${end}:00`).toISOString(),
  }
}

function openEditModal() {
  if (!order.value) return
  if (order.value.isInvoiced) {
    editError.value = t('orderDetail.cannotEditInvoicedOrder')
    showEditModal.value = false
    return
  }
  if (!isEditableStatus(order.value.status)) {
    editError.value = t('orderDetail.cannotEditReceivedOrder')
    showEditModal.value = false
    return
  }
  editError.value = ''

  // Pre-populate form from current order
  editForm.pickupDate = order.value.pickupDate ?? ''
  editForm.pickupTimeWindow = order.value.pickupTimeWindow ?? ''
  editForm.estimatedBags = order.value.estimatedBags ?? 1
  editForm.specialNotes = order.value.specialNotes ?? ''

  syncOrderItemsToEditQtys()
  showEditModal.value = true
}

const todayStr = computed(() => getTodayDateString())

async function submitEdit() {
  if (editSubmitting.value) return
  if (order.value?.isInvoiced) {
    editError.value = t('orderDetail.cannotEditInvoicedOrder')
    return
  }
  if (!isEditableStatus(order.value?.status)) {
    editError.value = t('orderDetail.cannotEditReceivedOrder')
    return
  }

  const origDate = normalizeDateString(order.value?.pickupDate)
  const newDate = normalizeDateString(editForm.pickupDate)
  if (newDate !== origDate && isPastDate(newDate)) {
    editError.value = t('admin.pickupDateInPast')
    return
  }

  editSubmitting.value = true
  editError.value = ''
  try {
    const catalogList = Object.values(editItemCatalogByCode.value || {})
    const items = catalogList
      .filter(i => (editItemQtys.value[i.code] || 0) > 0)
      .map(i => ({
        item_id: i._id ?? i.id,
        quantity: editItemQtys.value[i.code],
        qty_good: editItemQtys.value[i.code],
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

const itemHeaders = computed(() => {
  const base = [
    { key: 'code', label: t('orderDetail.itemCode') },
    { key: 'name', label: t('orderDetail.itemName') },
    { key: 'qty', label: t('orderDetail.quantity'), tdClass: 'text-right', thClass: 'text-right' },
    { key: 'unitPrice', label: t('orderDetail.unitPrice'), tdClass: 'text-right', thClass: 'text-right' },
    { key: 'lineTotal', label: t('orderDetail.lineTotal'), tdClass: 'text-right', thClass: 'text-right' },
  ]
  // Condition breakdown only for internal roles (staff, admin, operator)
  if (isAdminOrStaff.value) {
    base.splice(3, 0,
      { key: 'qtyGood',    label: t('orderDetail.qtyGood'),    tdClass: 'text-center', thClass: 'text-center' },
      { key: 'qtyBad',     label: t('orderDetail.qtyBad'),     tdClass: 'text-center', thClass: 'text-center' },
      { key: 'qtyStained', label: t('orderDetail.qtyStained'), tdClass: 'text-center', thClass: 'text-center' },
    )
  }
  return base
})

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
  } catch (err) {
    order.value = null
    uiStore.showError(err?.message || t('orderDetail.orderNotFound'))
  } finally {
    loading.value = false
  }
}

onMounted(loadOrder)
watch(() => navStore.selectedId, loadOrder)
</script>
