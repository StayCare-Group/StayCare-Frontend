<template>
  <div class="space-y-6 max-w-2xl">
    <LoadingPanel v-if="loading" />

    <template v-else>
      <!-- Header -->
      <div class="flex items-center gap-3">
        <button
          type="button"
          class="text-brand-700 hover:text-gray-400"
          @click="goBack"
        >
          <svg
            class="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>

        <h2 class="text-lg font-semibold text-brand-700">
          {{ $t('driver.confirmDelivery') }}
        </h2>
      </div>

      <!-- Manual flow information -->
      <div
        v-if="isManualFlow"
        class="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3"
      >
        <p class="text-sm font-medium text-blue-800">
          Delivery without driver
        </p>

        <p class="mt-1 text-xs text-blue-700">
          This delivery will be confirmed without creating a route
          or assigning a driver.
        </p>
      </div>

      <div v-if="stop" class="space-y-6">
        <!-- Stop / Order information -->
        <div class="bg-white rounded-xl shadow-sm p-5">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div>
              <span class="text-gray-400">
                {{ $t('common.client') }}
              </span>

              <p class="font-medium text-gray-800">
                {{ stop.client || stop.company || '-' }}
              </p>
            </div>

            <div>
              <span class="text-gray-400">
                {{ $t('common.order') }}
              </span>

              <p class="font-medium text-gray-800">
                {{ stop.orderId || '-' }}
              </p>
            </div>

            <div>
              <span class="text-gray-400">
                {{ $t('common.address') }}
              </span>

              <p class="font-medium text-gray-800">
                {{ stop.address || '-' }}
              </p>
            </div>

            <div>
              <span class="text-gray-400">
                {{ $t('driver.timeWindow') }}
              </span>

              <p class="font-medium text-gray-800">
                {{ stop.timeWindow || '-' }}
              </p>
            </div>

            <div>
              <span class="text-gray-400">
                {{ $t('driver.packages') }}
              </span>

              <p class="font-medium text-gray-800">
                {{ stop.estimatedBags ?? '-' }}
              </p>
            </div>
          </div>
        </div>

        <!-- Delivery form -->
        <form
          class="space-y-5"
          @submit.prevent="confirmDelivery"
        >
          <div class="bg-white rounded-xl shadow-sm p-5 space-y-4">
            <h3
              class="text-sm font-semibold text-gray-700 uppercase tracking-wide"
            >
              {{ $t('driver.deliveryConfirmation') }}
            </h3>

            <div>
              <label
                class="block text-sm font-medium text-gray-600 mb-1"
              >
                {{ $t('driver.packagesDelivered') }}
              </label>

              <input
                v-model.number="form.packagesDelivered"
                type="number"
                min="1"
                required
                class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-400 focus:border-transparent outline-none"
                :placeholder="$t('driver.packagesDeliveredPlaceholder')"
              />
            </div>

            <div>
              <label
                class="block text-sm font-medium text-gray-600 mb-1"
              >
                {{ $t('driver.receivedBy') }}
              </label>

              <input
                v-model.trim="form.receivedBy"
                type="text"
                required
                class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-400 focus:border-transparent outline-none"
                :placeholder="$t('driver.receivedByPlaceholder')"
              />
            </div>

            <div>
              <label
                class="block text-sm font-medium text-gray-600 mb-1"
              >
                {{ $t('driver.deliveryNotes') }}
              </label>

              <textarea
                v-model.trim="form.notes"
                rows="2"
                class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-400 focus:border-transparent outline-none resize-none"
                :placeholder="$t('driver.notesPlaceholder')"
              />
            </div>
            <!-- TODO: pendiente por desarrollar - confirmation method (photo/signature/pin) -->
          <!-- <div>
            <label class="block text-sm font-medium text-gray-600 mb-1">{{ $t('driver.confirmationMethod') }}</label>
            <select
              v-model="form.confirmationMethod"
              class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-400 focus:border-transparent outline-none"
            >
              <option value="photo">{{ $t('common.photo') }}</option>
              <option value="signature">{{ $t('common.signature') }}</option>
              <option value="pin">{{ $t('driver.pin') }}</option>
            </select>
          </div> -->

          <!-- TODO: pendiente por desarrollar - proof of delivery (photo capture) -->
          <!-- <div>
            <label class="block text-sm font-medium text-gray-600 mb-1">{{ $t('driver.proofOfDeliveryOptional') }}</label>
            <div class="border-2 border-dashed border-gray-200 rounded-lg p-4 text-center space-y-2">
              <input
                type="file"
                accept="image/*"
                capture="environment"
                @change="onPhotoChange"
                class="block w-full text-xs text-gray-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
              />
              <p class="text-xs text-gray-400">{{ $t('driver.deliveryPhotoHint') }}</p>
              <img
                v-if="photoPreview"
                :src="photoPreview"
                alt="Delivery photo preview"
                class="mt-2 mx-auto max-h-32 rounded-md object-cover"
              />
            </div>
          </div> -->

          <!-- TODO: pendiente por desarrollar - recipient digital signature -->
          <!-- <div>
            <label class="block text-sm font-medium text-gray-600 mb-1">{{ $t('driver.recipientSignature') }}</label>
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
                <p class="text-xs text-gray-400">{{ $t('driver.recipientSignHint') }}</p>
                <button
                  type="button"
                  @click="clearSignature"
                  class="text-xs text-gray-500 hover:text-gray-700"
                >
                  {{ $t('common.clear') }}
                </button>
              </div>
            </div>
          </div> -->
          </div>

          <div class="flex gap-3">
            <AppButton
              type="submit"
              size="lg"
              :loading="submitting"
              :disabled="submitting"
            >
              {{ $t('driver.confirmDelivery') }}
            </AppButton>

            <button
              type="button"
              :disabled="submitting"
              class="bg-gray-100 text-gray-600 font-medium py-2.5 px-6 rounded-lg hover:bg-gray-200 transition text-sm disabled:opacity-50"
              @click="goBack"
            >
              {{ $t('common.cancel') }}
            </button>
          </div>
        </form>
      </div>

      <!-- Not found -->
      <div
        v-else
        class="bg-white rounded-xl shadow-sm p-10 text-center"
      >
        <p class="text-gray-400">
          {{ errorMsg || $t('driver.stopNotFound') }}
        </p>

        <button
          type="button"
          class="mt-4 text-sm text-brand-700 hover:underline"
          @click="goBack"
        >
          {{ $t('common.cancel') }}
        </button>
      </div>

      <!-- Error toast -->
      <div
        v-if="errorMsg && stop"
        class="fixed bottom-6 right-6 bg-red-600 text-white px-5 py-3 rounded-lg shadow-lg text-sm font-medium z-50 max-w-sm flex items-start gap-2"
      >
        <div>
          <p class="font-bold">
            {{ $t('common.error') }}:
          </p>

          <p>{{ errorMsg }}</p>
        </div>

        <button
          type="button"
          class="text-white/70 hover:text-white ml-2 shrink-0"
          @click="errorMsg = ''"
        >
          &times;
        </button>
      </div>

      <!-- Success toast -->
      <div
        v-if="showSuccess"
        class="fixed bottom-6 right-6 bg-green-600 text-white px-5 py-3 rounded-lg shadow-lg text-sm font-medium z-50 flex items-center gap-2"
      >
        {{ $t('driver.confirmDelivery') }} ✓

        <button
          type="button"
          class="text-white/70 hover:text-white ml-2"
          @click="showSuccess = false"
        >
          &times;
        </button>
      </div>
    </template>
  </div>
</template>

<script setup>
import {
  computed,
  onMounted,
  reactive,
  ref,
} from 'vue'

import { useNavStore } from '../../../stores/nav.js'
import AppButton from '../../ui/AppButton.vue'
import LoadingPanel from '../../ui/LoadingPanel.vue'

import {
  fetchRouteById,
  mapRouteForDriver,
} from '../../../api/routes'

import {
  fetchOrderById,
  confirmDelivery as apiConfirmDelivery,
} from '../../../api/orders'

const navStore = useNavStore()

const stop = ref(null)
const loading = ref(true)
const submitting = ref(false)
const showSuccess = ref(false)
const errorMsg = ref('')
// const photoPreview = ref(null)
// const signatureCanvas = ref(null)
// let signatureCtx = null
// let isDrawing = false

// onMounted(async () => {
//   try {
//     const routeId = navStore.selectedRouteId
//     if (!routeId) return
//     const data = await fetchRouteById(String(routeId))
//     const mapped = mapRouteForDriver(data)
//     stop.value = mapped.stops.find(s => (s._id ?? s.id) == navStore.selectedId) ?? null
//   } catch { /* stays null */ } finally {
//     loading.value = false
//   }

//   const canvas = signatureCanvas.value
//   if (canvas) {
//     const dpr = window.devicePixelRatio || 1
//     const rect = canvas.getBoundingClientRect()
//     canvas.width = rect.width * dpr
//     canvas.height = rect.height * dpr
//     signatureCtx = canvas.getContext('2d')
//     signatureCtx.scale(dpr, dpr)
//     signatureCtx.lineWidth = 2
//     signatureCtx.lineCap = 'round'
//     signatureCtx.strokeStyle = '#111827'
//   }
// })

// onBeforeUnmount(() => {
//   isDrawing = false
// })

const form = reactive({
  packagesDelivered: null,
  receivedBy: '',
  notes: '',
  confirmationMethod: 'manual',
})

// function onPhotoChange(event) {
//   const file = event.target.files?.[0]
//   if (!file) {
//     photoPreview.value = null
//     return
//   }
//   const reader = new FileReader()
//   reader.onload = e => {
//     photoPreview.value = e.target?.result || null
//   }
//   reader.readAsDataURL(file)
// }

// function getCanvasPos(evt) {
//   const canvas = signatureCanvas.value
//   const rect = canvas.getBoundingClientRect()
//   const isTouch = evt.touches && evt.touches.length > 0
//   const point = isTouch ? evt.touches[0] : evt
//   return {
//     x: point.clientX - rect.left,
//     y: point.clientY - rect.top,
//   }
// }

// function startSignature(evt) {
//   if (!signatureCtx) return
//   isDrawing = true
//   const { x, y } = getCanvasPos(evt)
//   signatureCtx.beginPath()
//   signatureCtx.moveTo(x, y)
// }

// function moveSignature(evt) {
//   if (!isDrawing || !signatureCtx) return
//   const { x, y } = getCanvasPos(evt)
//   signatureCtx.lineTo(x, y)
//   signatureCtx.stroke()
// }

// function endSignature() {
//   if (!signatureCtx) return
//   isDrawing = false
// }

// function clearSignature() {
//   const canvas = signatureCanvas.value
//   if (!canvas || !signatureCtx) return
//   signatureCtx.clearRect(0, 0, canvas.width, canvas.height)
// }

/**
 * Sin selectedRouteId significa que la pantalla se abrió
 * desde administración y no desde una ruta del driver.
 */
const isManualFlow = computed(() => {
  return !navStore.selectedRouteId
})

function normalizeStatus(status) {
  return String(status ?? '')
    .trim()
    .toLowerCase()
    .replaceAll('-', '_')
    .replaceAll(' ', '_')
}

/**
 * Soporta distintas estructuras posibles de respuesta:
 *
 * order
 * { order }
 * { data: order }
 * { data: { order } }
 */
function unwrapOrderResponse(response) {
  return (
    response?.data?.order ??
    response?.data ??
    response?.order ??
    response
  )
}

function resolveOrderId(order) {
  return (
    order?._id ??
    order?.id ??
    order?.order_id ??
    null
  )
}

function resolveProperty(order, client) {
  if (
    order?.property &&
    typeof order.property === 'object'
  ) {
    return order.property
  }

  if (!Array.isArray(client?.properties)) {
    return null
  }

  if (order?.property) {
    const matchedProperty = client.properties.find(
      property =>
        String(property?._id ?? property?.id) ===
        String(order.property)
    )

    if (matchedProperty) {
      return matchedProperty
    }
  }

  return client.properties[0] ?? null
}

/**
 * Convierte una orden normal al mismo formato que el
 * template utilizaba cuando recibía un stop.
 */
function mapOrderToConfirmation(order) {
  const orderDatabaseId = resolveOrderId(order)

  const client =
    order?.client &&
    typeof order.client === 'object'
      ? order.client
      : {}

  const property = resolveProperty(order, client)

  return {
    _id: orderDatabaseId,
    orderDbId: orderDatabaseId,
    confirmationOrderId: orderDatabaseId,

    orderId:
      order?.order_number ??
      order?.orderNumber ??
      orderDatabaseId ??
      '',

    company:
      client?.company_name ??
      client?.companyName ??
      client?.name ??
      order?.company_name ??
      order?.companyName ??
      '',

    client:
      client?.name ??
      order?.client_name ??
      order?.clientName ??
      order?.company_name ??
      order?.companyName ??
      '',

    address:
      property?.address ??
      property?.full_address ??
      property?.fullAddress ??
      order?.address ??
      '',

    timeWindow:
      order?.delivery_time_window ??
      order?.deliveryTimeWindow ??
      order?.time_window ??
      order?.timeWindow ??
      '',

    estimatedBags:
      order?.actual_bags ??
      order?.actualBags ??
      order?.estimated_bags ??
      order?.estimatedBags ??
      order?.expected_bags ??
      order?.expectedBags ??
      order?.bags ??
      null,

    status: normalizeStatus(order?.status),
    originalStatus: order?.status,
    notes: order?.notes ?? '',
  }
}

/**
 * Flujo normal: buscar el stop dentro de la ruta.
 */
async function loadFromRoute(routeId, selectedId) {
  const routeResponse = await fetchRouteById(
    String(routeId)
  )

  const mappedRoute = mapRouteForDriver(routeResponse)

  const matchedStop =
    mappedRoute?.stops?.find(item => {
      const stopId = item?._id ?? item?.id

      return String(stopId) === String(selectedId)
    }) ?? null

  if (!matchedStop) {
    throw new Error(
      'The selected delivery stop was not found in the route.'
    )
  }

  /**
   * Intentar identificar el ID real de la orden.
   */
  matchedStop.confirmationOrderId =
    matchedStop.orderDbId ??
    matchedStop.order?._id ??
    matchedStop.order?.id ??
    matchedStop.order_id ??
    (
      typeof matchedStop.orderId === 'object'
        ? matchedStop.orderId?._id ??
          matchedStop.orderId?.id
        : null
    ) ??
    matchedStop._id ??
    matchedStop.id

  matchedStop.status = normalizeStatus(
    matchedStop.status
  )

  return matchedStop
}

/**
 * Flujo manual: cargar directamente la orden.
 */
async function loadFromOrder(orderId) {
  const response = await fetchOrderById(
    String(orderId)
  )

  const order = unwrapOrderResponse(response)
  const orderDatabaseId = resolveOrderId(order)

  if (!orderDatabaseId) {
    console.error(
      'Delivery order response without an ID:',
      order
    )

    throw new Error(
      'The selected order could not be loaded because it has no ID.'
    )
  }

  return mapOrderToConfirmation(order)
}

async function loadConfirmationData() {
  const selectedId = navStore.selectedId
  const routeId = navStore.selectedRouteId

  if (!selectedId) {
    throw new Error('No order was selected.')
  }

  if (routeId) {
    return loadFromRoute(routeId, selectedId)
  }

  return loadFromOrder(selectedId)
}

onMounted(async () => {
  loading.value = true
  errorMsg.value = ''

  try {
    stop.value = await loadConfirmationData()

    if (
      stop.value?.estimatedBags &&
      !form.packagesDelivered
    ) {
      form.packagesDelivered =
        Number(stop.value.estimatedBags)
    }
  } catch (error) {
    console.error(
      'Unable to load delivery confirmation:',
      error
    )

    stop.value = null

    errorMsg.value =
      error?.message ??
      'The delivery information could not be loaded.'
  } finally {
    loading.value = false
  }
})

async function confirmDelivery() {
  if (!stop.value || submitting.value) {
    return
  }

  if (
    !Number.isFinite(Number(form.packagesDelivered)) ||
    Number(form.packagesDelivered) < 1
  ) {
    errorMsg.value =
      'Enter a valid number of packages delivered.'

    return
  }

  if (!form.receivedBy.trim()) {
    errorMsg.value =
      'Enter the name of the person who received the delivery.'

    return
  }

  const orderId =
    stop.value.confirmationOrderId ??
    stop.value.orderDbId ??
    stop.value._id ??
    stop.value.id

  if (!orderId) {
    errorMsg.value =
      'The order ID could not be identified.'

    return
  }

  submitting.value = true
  errorMsg.value = ''
  showSuccess.value = false

  try {
    const payload = {
      packages_delivered:
        Number(form.packagesDelivered),

      received_by:
        form.receivedBy.trim(),

      notes:
        form.notes.trim() || undefined,

      confirmation_method:
        isManualFlow.value
          ? 'manual'
          : form.confirmationMethod,
    }

    await apiConfirmDelivery(
      String(orderId),
      payload
    )

    showSuccess.value = true

    window.setTimeout(() => {
      showSuccess.value = false
      goBack()
    }, 1500)
  } catch (error) {
    console.error(
      'Unable to confirm delivery:',
      error
    )

    errorMsg.value =
      error?.message ??
      error?.error ??
      'The delivery could not be confirmed.'

    showSuccess.value = false
  } finally {
    submitting.value = false
  }
}

function goBack() {
  navStore.goBack('route')
}
</script>