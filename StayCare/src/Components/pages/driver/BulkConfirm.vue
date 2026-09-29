<template>
  <div class="space-y-6 max-w-2xl">
    <LoadingPanel v-if="loading" />

    <template v-else>
      <!-- Header -->
      <TitleHeader
        :title="pageTitle"
        :on-back="goBack"
      />

      <!-- Order cards -->
      <div class="space-y-4">
        <div
          v-for="(order, idx) in orders"
          :key="order.id"
          class="bg-white rounded-xl shadow-sm p-5 space-y-4"
        >
          <!-- Order summary -->
          <div class="flex items-start justify-between gap-2">
            <div>
              <p class="text-xs text-gray-500 uppercase tracking-wide font-medium">
                {{ $t('driver.orderSummary') }} {{ idx + 1 }}
              </p>
              <h3 class="text-sm font-semibold text-gray-800 mt-0.5">
                {{ order.company || order.client || '-' }}
              </h3>
              <p class="text-xs text-gray-500 mt-0.5">{{ order.address || '-' }}</p>
              <p v-if="order.orderId" class="text-xs text-gray-400 mt-0.5">
                {{ $t('common.order') }}: {{ order.orderId }}
              </p>
            </div>
            <span class="text-xs text-gray-400 shrink-0">
              {{ $t('driver.expectedBags') }}: {{ order.estimatedBags ?? '-' }}
            </span>
          </div>

          <!-- Per-order bags/packages field -->
          <div>
            <label class="block text-sm font-medium text-gray-600 mb-1">
              {{ type === 'pickup' ? $t('driver.bagsForOrder') : $t('driver.packagesForOrder') }}
              <span class="text-red-500">*</span>
            </label>
            <input
              v-model.number="order.bags"
              type="number"
              min="1"
              class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-400 focus:border-transparent outline-none"
              :placeholder="type === 'pickup' ? $t('driver.bagsPickedUpPlaceholder') : $t('driver.packagesDeliveredPlaceholder')"
            />
          </div>
        </div>
      </div>

      <!-- Shared fields -->
      <div class="bg-white rounded-xl shadow-sm p-5 space-y-4">
        <!-- received_by only for delivery -->
        <div v-if="type === 'delivery'">
          <label class="block text-sm font-medium text-gray-600 mb-1">
            {{ $t('driver.receivedBy') }} <span class="text-red-500">*</span>
          </label>
          <input
            v-model.trim="sharedForm.receivedBy"
            type="text"
            class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-400 focus:border-transparent outline-none"
            :placeholder="$t('driver.receivedByPlaceholder')"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-600 mb-1">
            {{ $t('driver.sharedNotes') }}
          </label>
          <textarea
            v-model.trim="sharedForm.notes"
            rows="2"
            class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-400 focus:border-transparent outline-none resize-none"
            :placeholder="$t('driver.notesPlaceholder')"
          />
        </div>
      </div>

      <!-- Actions -->
      <div class="flex gap-3">
        <AppButton
          id="bulk-confirm-submit-btn"
          type="button"
          size="lg"
          :loading="submitting"
          :disabled="submitting"
          @click="submit"
        >
          {{ submitting ? $t('driver.bulkConfirming') : $t('driver.bulkConfirm') }}
        </AppButton>

        <AppButton
          type="button"
          variant="secondary"
          size="lg"
          :disabled="submitting"
          @click="goBack"
        >
          {{ $t('common.cancel') }}
        </AppButton>
      </div>

      <!-- Partial failure report -->
      <div
        v-if="failedOrders.length > 0"
        class="rounded-lg border border-red-200 bg-red-50 px-4 py-3 space-y-1"
      >
        <p class="text-sm font-semibold text-red-700">
          {{ $t('driver.bulkSuccessPartial', { succeeded: succeededCount, failed: failedOrders.length }) }}
        </p>
        <ul class="text-xs text-red-600 list-disc list-inside space-y-0.5">
          <li v-for="f in failedOrders" :key="f.orderId">
            {{ f.orderId }}: {{ f.error }}
          </li>
        </ul>
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import { useNavStore } from '../../../stores/nav.js'
import { useAuthStore } from '../../../stores/auth.js'
import { useUiStore } from '../../../stores/ui.js'
import AppButton from '../../ui/AppButton.vue'
import LoadingPanel from '../../ui/LoadingPanel.vue'
import TitleHeader from '../../ui/TitleHeader.vue'

import { bulkConfirmDriverAction } from '../../../api/orders'
import { fetchRouteById, mapRouteForDriver } from '../../../api/routes'
import { formatApiErrorMessage } from '../../../utils/errors'

const { t } = useI18n()
const navStore = useNavStore()
const authStore = useAuthStore()
const ui = useUiStore()

// ── Context from navStore ──────────────────────────────────────────────────
const type    = computed(() => navStore.selectedType || 'pickup')
const ids     = computed(() => navStore.selectedIds || [])
const routeId = computed(() => navStore.selectedBulkRouteId)

const pageTitle = computed(() => {
  const count = orders.value.length || ids.value.length || 0
  return type.value === 'pickup'
    ? t('driver.bulkPickupTitle', { count })
    : t('driver.bulkDeliveryTitle', { count })
})

// ── Data loading ────────────────────────────────────────────────────────────
const loading    = ref(true)
const orders     = ref([])
const sharedForm = reactive({ receivedBy: '', notes: '' })

function normalizeStatus(status) {
  return String(status ?? '').trim().toLowerCase().replaceAll('-', '_').replaceAll(' ', '_')
}

async function loadFromRoute(stopId) {
  const routeResponse = await fetchRouteById(String(routeId.value))
  const mapped = mapRouteForDriver(routeResponse)
  const stop = mapped?.stops?.find((s) => String(s._id ?? s.id) === String(stopId)) ?? null
  if (!stop) throw new Error(`Stop ${stopId} not found in route`)
  return {
    id: stop.confirmationOrderId ?? stop.orderDbId ?? stop._id ?? stop.id,
    orderId: stop.orderId ?? '',
    company: stop.company ?? stop.client ?? '',
    client: stop.client ?? '',
    address: stop.address ?? '',
    estimatedBags: stop.estimatedBags ?? null,
    status: normalizeStatus(stop.status),
  }
}

async function loadAll() {
  loading.value = true
  try {
    // 1. Direct in-memory transfer from RouteView
    if (Array.isArray(navStore.selectedStops) && navStore.selectedStops.length > 0) {
      orders.value = navStore.selectedStops.map((stop) => ({
        id: stop.confirmationOrderId ?? stop.orderDbId ?? stop._id ?? stop.id,
        orderId: stop.orderId ?? '',
        company: stop.company ?? stop.client ?? '',
        client: stop.client ?? '',
        address: stop.address ?? '',
        estimatedBags: stop.estimatedBags ?? null,
        status: normalizeStatus(stop.status),
        bags: stop.estimatedBags ?? null,
      }))
      return
    }

    // 2. Fallback if accessed with routeId
    if (routeId.value) {
      const list = Array.isArray(ids.value) ? ids.value : []
      const results = await Promise.all(
        list.map((id) => loadFromRoute(id).catch(() => null))
      )
      orders.value = results.filter(Boolean).map((o) => ({
        ...o,
        bags: o.estimatedBags ?? null,
      }))
    }
  } catch (err) {
    console.error('Failed to load bulk confirmation orders:', err)
    ui.showError(formatApiErrorMessage(err, t('driver.errorLoadPickup'), t))
  } finally {
    loading.value = false
  }
}

onMounted(loadAll)

// ── Submit ─────────────────────────────────────────────────────────────────
const submitting     = ref(false)
const failedOrders   = ref([])
const succeededCount = ref(0)

async function submit() {
  if (submitting.value) return

  // Validate per-order quantities
  for (let i = 0; i < orders.value.length; i++) {
    const bags = orders.value[i].bags
    if (!Number.isFinite(Number(bags)) || Number(bags) < 1) {
      ui.showError(type.value === 'pickup' ? t('driver.errorInvalidBags') : t('driver.errorInvalidPackages'))
      return
    }
  }

  if (type.value === 'delivery' && !sharedForm.receivedBy.trim()) {
    ui.showError(t('driver.errorRecipientRequired'))
    return
  }

  submitting.value = true
  failedOrders.value = []
  succeededCount.value = 0

  try {
    const ordersPayload = orders.value.map((order) => ({
      id: order.id,
      ...(type.value === 'pickup'
        ? { actual_bags: Number(order.bags) }
        : { packages_delivered: Number(order.bags) }),
    }))

    const shared = {
      special_notes: sharedForm.notes.trim() || undefined,
      ...(type.value === 'delivery' ? { received_by: sharedForm.receivedBy.trim() } : {}),
    }

    const response = await bulkConfirmDriverAction(type.value, ordersPayload, shared)
    const data = response?.data ?? response

    succeededCount.value = data?.succeeded?.length ?? 0
    failedOrders.value   = data?.failed ?? []

    if (failedOrders.value.length === 0) {
      ui.showSuccess(t('driver.bulkSuccessAll'))
      window.setTimeout(() => goBack(), 1500)
    } else if (succeededCount.value > 0) {
      ui.showWarning(
        t('driver.bulkSuccessPartial', {
          succeeded: succeededCount.value,
          failed: failedOrders.value.length,
        })
      )
    } else {
      ui.showError(t('driver.bulkErrorAll'))
    }
  } catch (err) {
    ui.showError(formatApiErrorMessage(err, t('driver.bulkErrorAll'), t))
  } finally {
    submitting.value = false
  }
}

// ── Navigation ─────────────────────────────────────────────────────────────
const targetPage = computed(() => (authStore.isDriver ? 'route' : 'routes'))

function goBack() {
  navStore.clearBulkSelection()
  navStore.goBack(targetPage.value)
}
</script>
