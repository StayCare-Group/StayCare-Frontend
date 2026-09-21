<template>
  <AppModal
    :show="show && Boolean(order)"
    :title="$t('admin.editOrder')"
    size="xl"
    :close-on-backdrop="false"
    :loading="submitting"
    @close="handleClose"
  >
    <form id="editOrderForm" @submit.prevent="submitEdit" novalidate class="space-y-5">
      <!-- Pickup date & time window -->
      <PickupWindowFields
        v-model:pickup-date="form.pickupDate"
        v-model:pickup-time-window="form.pickupTimeWindow"
        :is-admin-or-staff="isAdminOrStaff"
        :min-date="isPreReceive ? todayStr : undefined"
        :disabled="!isPreReceive"
      />

      <!-- Estimated bags -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-600 mb-1">
            {{ $t('admin.estimatedBags') }}
          </label>
          <input
            v-model.number="form.estimatedBags"
            type="number"
            min="1"
            required
            class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-400 focus:border-transparent outline-none"
          />
        </div>
      </div>

      <!-- Special notes -->
      <div>
        <label class="block text-sm font-medium text-gray-600 mb-1">
          {{ $t('common.specialNotes') }}
        </label>
        <textarea
          v-model="form.specialNotes"
          rows="3"
          class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-400 focus:border-transparent outline-none resize-none"
          :placeholder="$t('admin.specialNotesPlaceholder')"
        />
      </div>

      <!-- Items: Pre-receive (quantities) vs Post-receive (condition breakdown) -->
      <OrderItemsPicker
        v-if="isPreReceive"
        v-model="itemQtys"
        @catalog-loaded="onCatalogLoaded"
      />
      <OrderItemsConditionPicker
        v-else
        v-model="conditionItems"
      />

      <p v-if="error" class="text-sm text-red-500">{{ error }}</p>
    </form>

    <template #footer>
      <AppButton
        form="editOrderForm"
        type="submit"
        size="md"
        :loading="submitting"
      >
        {{ $t('admin.saveChanges') }}
      </AppButton>
      <button
        type="button"
        @click="handleClose"
        :disabled="submitting"
        class="bg-gray-100 text-gray-600 font-medium py-2 px-5 rounded-lg hover:bg-gray-200 transition text-sm disabled:opacity-50"
      >
        {{ $t('common.cancel') }}
      </button>
    </template>
  </AppModal>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import AppModal from './AppModal.vue'
import AppButton from './AppButton.vue'
import PickupWindowFields from '../forms/PickupWindowFields.vue'
import OrderItemsPicker from '../forms/OrderItemsPicker.vue'
import OrderItemsConditionPicker from '../forms/OrderItemsConditionPicker.vue'
import { updateOrder } from '../../api/orders'
import { useUiStore } from '../../stores/ui.js'
import { normalizeStatus, isEditableStatus } from '../../utils/orderFlow'
import { getTodayDateString, normalizeDateString, isPastDate } from '../../utils/date'
import { formatApiErrorMessage } from '@/utils/errors'

const props = defineProps({
  show: {
    type: Boolean,
    default: false,
  },
  order: {
    type: Object,
    default: null,
  },
  isAdminOrStaff: {
    type: Boolean,
    default: true,
  },
})

const emit = defineEmits(['close', 'success'])

const { t } = useI18n()
const uiStore = useUiStore()

const submitting = ref(false)
const error = ref('')
const itemQtys = ref({})
const conditionItems = ref([])
const itemCatalogByCode = ref({})

const form = reactive({
  pickupDate: '',
  pickupTimeWindow: '',
  estimatedBags: 1,
  specialNotes: '',
})

const todayStr = computed(() => getTodayDateString())

const isPreReceive = computed(() => {
  if (!props.order) return true
  const norm = normalizeStatus(props.order.status)
  return norm === 'pending' || norm === 'assigned' || norm === 'rescheduled' || norm === 'transit'
})

function syncOrderItemsToEditQtys() {
  if (!props.order?.items) return
  const currentQtys = { ...itemQtys.value }
  props.order.items.forEach(oi => {
    if (oi.code !== undefined) {
      currentQtys[oi.code] = oi.qty ?? 0
    }
  })
  itemQtys.value = currentQtys
}

function onCatalogLoaded(catalog) {
  itemCatalogByCode.value = catalog
  syncOrderItemsToEditQtys()
}

function parseTimeWindow(tw, date) {
  const [start, end] = tw.split(' - ')
  return {
    start_time: new Date(`${date}T${start}:00`).toISOString(),
    end_time: new Date(`${date}T${end}:00`).toISOString(),
  }
}

function populateForm() {
  if (!props.order) return
  error.value = ''
  form.pickupDate = props.order.pickupDate ?? ''
  form.pickupTimeWindow = props.order.pickupTimeWindow ?? ''
  form.estimatedBags = props.order.estimatedBags ?? 1
  form.specialNotes = props.order.specialNotes ?? ''

  if (isPreReceive.value) {
    syncOrderItemsToEditQtys()
  } else {
    conditionItems.value = (props.order.items ?? []).map(oi => ({
      itemId: oi.itemId,
      code: oi.code,
      name: oi.name,
      unitPrice: oi.unitPrice,
      qtyGood: Number(oi.qtyGood ?? 0),
      qtyBad: Number(oi.qtyBad ?? 0),
      qtyStained: Number(oi.qtyStained ?? 0),
    }))
  }
}

watch(
  () => [props.show, props.order],
  ([newShow, newOrder]) => {
    if (newShow && newOrder) {
      populateForm()
    }
  },
  { immediate: true }
)

function handleClose() {
  if (submitting.value) return
  emit('close')
}

async function submitEdit() {
  if (!props.order || submitting.value) return

  if (props.order.isInvoiced) {
    error.value = t('orderDetail.cannotEditInvoicedOrder')
    return
  }
  if (!isEditableStatus(props.order.status)) {
    error.value = t('orderDetail.cannotEditReceivedOrder')
    return
  }

  if (isPreReceive.value) {
    const origDate = normalizeDateString(props.order.pickupDate)
    const newDate = normalizeDateString(form.pickupDate)
    if (newDate !== origDate && isPastDate(newDate)) {
      error.value = t('admin.pickupDateInPast')
      return
    }
  }

  submitting.value = true
  error.value = ''

  try {
    let items
    if (isPreReceive.value) {
      const catalogList = Object.values(itemCatalogByCode.value || {})
      items = catalogList
        .filter(i => (itemQtys.value[i.code] || 0) > 0)
        .map(i => ({
          item_id: i._id ?? i.id,
          quantity: itemQtys.value[i.code],
          qty_good: itemQtys.value[i.code],
          qty_bad: 0,
          qty_stained: 0,
        }))
    } else {
      items = conditionItems.value
        .map(i => {
          const good = Number(i.qtyGood) || 0
          const bad = Number(i.qtyBad) || 0
          const stained = Number(i.qtyStained) || 0
          const totalQty = good + bad + stained
          return {
            item_id: i.itemId,
            quantity: totalQty,
            qty_good: good,
            qty_bad: bad,
            qty_stained: stained,
          }
        })
        .filter(i => i.quantity > 0)
    }

    const payload = {
      pickup_date: isPreReceive.value ? form.pickupDate : undefined,
      pickup_window: isPreReceive.value && form.pickupTimeWindow
        ? parseTimeWindow(form.pickupTimeWindow, form.pickupDate)
        : undefined,
      estimated_bags: form.estimatedBags,
      special_notes: form.specialNotes || undefined,
      items: items && items.length > 0 ? items : undefined,
    }

    const orderId = String(props.order._id ?? props.order.id)
    const updated = await updateOrder(orderId, payload)
    uiStore.showSuccess(t('common.success'))
    emit('success', updated)
    emit('close')
  } catch (err) {
    error.value = formatApiErrorMessage(err, t('common.error'), t)
  } finally {
    submitting.value = false
  }
}
</script>
