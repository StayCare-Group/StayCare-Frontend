<template>
  <AppModal
    :show="show && Boolean(order)"
    :title="$t('facilityProcessing.qualityCheckModalTitle')"
    size="xl"
    :close-on-backdrop="false"
    :loading="submitting"
    @close="handleClose"
  >
    <!-- Instructions -->
    <p class="text-sm text-gray-500">{{ $t('facilityProcessing.qualityCheckInstructions') }}</p>

    <!-- Loading state -->
    <div v-if="loadingItems" class="py-8 text-center text-sm text-gray-400">
      {{ $t('common.loading') }}
    </div>

    <!-- Items condition review -->
    <div v-else-if="qualityItems.length" class="divide-y divide-gray-100">
      <div
        v-for="(item, idx) in qualityItems"
        :key="`${item.itemId}-${idx}`"
        class="py-4 space-y-2"
      >
        <!-- Item name & code -->
        <div>
          <p class="text-sm font-medium text-gray-800">
            {{ item.name }}
            <span class="text-xs text-gray-400">({{ item.code }})</span>
          </p>
          <p class="text-xs text-gray-500">
            {{ $t('facility.totalReceived') }}: {{ item.qty }}
          </p>
        </div>

        <!-- Condition inputs (same pattern as Reception.vue) -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <label class="text-xs text-gray-600">
            {{ $t('facility.goodQty') }}
            <input
              v-model.number="item.qtyGood"
              type="number"
              min="0"
              :max="item.qty"
              class="mt-1 w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm text-center focus:ring-2 focus:ring-brand-400 focus:border-transparent outline-none"
            />
          </label>
          <label class="text-xs text-gray-600">
            {{ $t('facility.badQty') }}
            <input
              v-model.number="item.qtyBad"
              type="number"
              min="0"
              :max="item.qty"
              class="mt-1 w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm text-center focus:ring-2 focus:ring-brand-400 focus:border-transparent outline-none"
            />
          </label>
          <label class="text-xs text-gray-600">
            {{ $t('facility.stainedQty') }}
            <input
              v-model.number="item.qtyStained"
              type="number"
              min="0"
              :max="item.qty"
              class="mt-1 w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm text-center focus:ring-2 focus:ring-brand-400 focus:border-transparent outline-none"
            />
          </label>
        </div>

        <!-- Inline status indicators -->
        <div class="flex items-center gap-3 min-h-[1.25rem]">
          <span
            v-if="itemTotal(item) !== item.qty"
            class="text-xs text-orange-500 font-medium"
          >
            {{ $t('facilityProcessing.qualityCheckQuantityMismatch') }}
            ({{ itemTotal(item) }}/{{ item.qty }})
          </span>
          <span
            v-else-if="hasChanged(item)"
            class="text-xs text-green-600 font-medium"
          >
            ✓ {{ $t('facilityProcessing.qualityCheckConditionChanged') }}
          </span>
        </div>
      </div>
    </div>

    <p v-else class="text-sm text-gray-400">{{ $t('facility.noCheckInItems') }}</p>

    <!-- Optional internal note -->
    <div>
      <label class="block text-sm font-medium text-gray-600 mb-1">
        {{ $t('facilityProcessing.qualityCheckNoteLabel') }}
      </label>
      <textarea
        v-model="internalNote"
        rows="2"
        class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-400 focus:border-transparent outline-none resize-none"
        :placeholder="$t('facilityProcessing.qualityCheckNotePlaceholder')"
      />
    </div>

    <!-- Error message -->
    <p v-if="error" class="text-sm text-red-500">{{ error }}</p>

    <template #footer>
      <AppButton
        variant="secondary"
        size="sm"
        :disabled="submitting || loadingItems"
        @click="handleClose"
      >
        {{ $t('common.cancel') }}
      </AppButton>
      <AppButton
        variant="secondary"
        size="sm"
        :loading="submittingNoChanges"
        :disabled="submitting || loadingItems"
        @click="confirmWithoutChanges"
      >
        {{ $t('facilityProcessing.qualityCheckContinueWithoutChanges') }}
      </AppButton>
      <AppButton
        size="sm"
        :loading="submittingWithChanges"
        :disabled="!isValid || submitting || loadingItems"
        @click="confirmWithChanges"
      >
        {{ $t('facilityProcessing.qualityCheckSaveAndContinue') }}
      </AppButton>
    </template>
  </AppModal>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import AppModal from './AppModal.vue'
import AppButton from './AppButton.vue'
import { useUiStore } from '../../stores/ui.js'
import { fetchOrderById, mapOrderForDetail, updateOrder, updateOrderStatus } from '../../api/orders'

const props = defineProps({
  show: {
    type: Boolean,
    default: false,
  },
  order: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits(['close', 'success'])

const { t } = useI18n()
const uiStore = useUiStore()

const qualityItems = ref([])
const internalNote = ref('')
const loadingItems = ref(false)
const submittingNoChanges = ref(false)
const submittingWithChanges = ref(false)
const submitting = computed(() => submittingNoChanges.value || submittingWithChanges.value)
const error = ref('')

// --- Helpers ---

function itemTotal(item) {
  return (item.qtyGood || 0) + (item.qtyBad || 0) + (item.qtyStained || 0)
}

function hasChanged(item) {
  return (
    item.qtyGood !== item._origGood ||
    item.qtyBad !== item._origBad ||
    item.qtyStained !== item._origStained
  )
}

// All items must have correct sums to be valid
const isValid = computed(() =>
  !loadingItems.value &&
  qualityItems.value.length > 0 &&
  qualityItems.value.every(item => itemTotal(item) === item.qty)
)

// --- Lifecycle ---

// When modal opens (show becomes true and order is set), pre-load items
watch(
  () => props.show,
  (visible) => {
    if (!visible) {
      // Reset on close
      qualityItems.value = []
      internalNote.value = ''
      error.value = ''
      loadingItems.value = false
      submittingNoChanges.value = false
      submittingWithChanges.value = false
      return
    }
    if (!props.order) return
    initItems()
  },
  { immediate: true }
)

watch(
  () => props.order,
  (newOrder) => {
    if (props.show && newOrder) initItems()
  }
)

async function initItems() {
  if (!props.order) return
  const orderId = props.order._id ?? props.order.id
  if (!orderId) return

  loadingItems.value = true
  error.value = ''

  try {
    const rawData = await fetchOrderById(orderId)
    const detail = mapOrderForDetail(rawData)

    qualityItems.value = (detail.items ?? []).map(i => {
      // Preload with reception values; if never validated, default all-good
      const good    = i.qtyGood    ?? i.qty ?? 0
      const bad     = i.qtyBad     ?? 0
      const stained = i.qtyStained ?? 0
      return {
        itemId:      i.itemId,
        code:        i.code,
        name:        i.name,
        qty:         i.qty ?? 0,
        qtyGood:     good,
        qtyBad:      bad,
        qtyStained:  stained,
        // Original values to detect changes
        _origGood:    good,
        _origBad:     bad,
        _origStained: stained,
      }
    })
  } catch (err) {
    error.value = err?.message || t('common.error')
  } finally {
    loadingItems.value = false
  }
}

// --- Actions ---

function handleClose() {
  if (submitting.value) return
  emit('close')
}

async function confirmWithoutChanges() {
  if (!props.order || submitting.value) return

  error.value = ''
  submittingNoChanges.value = true

  try {
    const orderId = props.order._id ?? props.order.id
    await updateOrderStatus(orderId, 'ready_to_delivery', {
      note: internalNote.value || undefined,
    })

    uiStore.showSuccess(t('facilityProcessing.qualityCheckSuccess'))
    emit('success')
    emit('close')
  } catch (err) {
    error.value = err?.message || t('common.error')
  } finally {
    submittingNoChanges.value = false
  }
}

async function confirmWithChanges() {
  if (!props.order || submitting.value || !isValid.value) return

  error.value = ''
  submittingWithChanges.value = true

  try {
    const orderId = props.order._id ?? props.order.id

    const items = qualityItems.value.map(item => ({
      item_id:    item.itemId,
      quantity:   item.qty,
      qty_good:   item.qtyGood   || 0,
      qty_bad:    item.qtyBad    || 0,
      qty_stained: item.qtyStained || 0,
    }))

    // 1. Update items via PUT /api/orders/:id
    await updateOrder(orderId, { items })

    // 2. Advance status via PATCH /api/orders/:id/status
    await updateOrderStatus(orderId, 'ready_to_delivery', {
      note: internalNote.value || undefined,
    })

    uiStore.showSuccess(t('facilityProcessing.qualityCheckSuccess'))
    emit('success')
    emit('close')
  } catch (err) {
    error.value = err?.message || t('common.error')
  } finally {
    submittingWithChanges.value = false
  }
}
</script>


