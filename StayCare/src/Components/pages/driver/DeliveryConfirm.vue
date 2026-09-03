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
          {{ $t('driver.deliveryWithoutDriver') }}
        </p>

        <p class="mt-1 text-xs text-blue-700">
          {{ $t('driver.deliveryWithoutDriverDesc') }}
        </p>
      </div>

      <div v-if="stop" class="space-y-6">
        <!-- Stop / Order information -->
        <InfoGridCard :items="stopInfoItems" />

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
                {{ $t('common.specialNotes') }}
              </label>

              <textarea
                v-model.trim="form.specialNotes"
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
          {{ loadError || $t('driver.stopNotFound') }}
        </p>

        <button
          type="button"
          class="mt-4 text-sm text-brand-700 hover:underline"
          @click="goBack"
        >
          {{ $t('common.cancel') }}
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
import { useI18n } from 'vue-i18n'

import { useNavStore } from '../../../stores/nav.js'
import { useUiStore } from '../../../stores/ui.js'
import AppButton from '../../ui/AppButton.vue'
import LoadingPanel from '../../ui/LoadingPanel.vue'
import InfoGridCard from '../../ui/InfoGridCard.vue'

import {
  fetchRouteById,
  mapRouteForDriver,
} from '../../../api/routes'

import {
  fetchOrderById,
  confirmDelivery as apiConfirmDelivery,
} from '../../../api/orders'

const { t } = useI18n()
const navStore = useNavStore()
const ui = useUiStore()

const stop = ref(null)
const loading = ref(true)
const submitting = ref(false)
const loadError = ref('')

const stopInfoItems = computed(() => {
  if (!stop.value) return []
  return [
    {
      label: t('common.client'),
      value: stop.value.client || stop.value.company || '-',
    },
    {
      label: t('common.order'),
      value: stop.value.orderId || '-',
    },
    {
      label: t('common.address'),
      value: stop.value.address || '-',
    },
    {
      label: t('driver.timeWindow'),
      value: stop.value.timeWindow || '-',
    },
    {
      label: t('driver.packages'),
      value: stop.value.estimatedBags ?? '-',
    },
  ]
})
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
  specialNotes: '',
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

function formatTimeFromDate(dateValue) {
  if (!dateValue) return ''
  const d = new Date(dateValue)
  if (isNaN(d.getTime())) return String(dateValue)
  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}

function resolveDeliveryTimeWindow(order) {
  if (order?.delivery_time_window) return order.delivery_time_window
  if (order?.deliveryTimeWindow) return order.deliveryTimeWindow
  if (order?.time_window) return order.time_window
  if (order?.timeWindow) return order.timeWindow
  const start = order?.delivery_window?.start_time ?? order?.delivery_window_start ?? order?.pickup_window?.start_time ?? order?.pickup_window_start
  const end = order?.delivery_window?.end_time ?? order?.delivery_window_end ?? order?.pickup_window?.end_time ?? order?.pickup_window_end
  if (start && end) {
    return `${formatTimeFromDate(start)} - ${formatTimeFromDate(end)}`
  }
  return ''
}

function resolveOrderAddress(order, property) {
  if (property?.address) {
    return `${property.address}${property.city ? ', ' + property.city : ''}`
  }
  if (property?.full_address || property?.fullAddress) {
    return property.full_address || property.fullAddress
  }
  if (order?.property_address) {
    return `${order.property_address}${order.property_city ? ', ' + order.property_city : ''}`
  }
  if (order?.delivery_address || order?.deliveryAddress) {
    return order.delivery_address || order.deliveryAddress
  }
  if (order?.pickup_address || order?.pickupAddress) {
    return order.pickup_address || order.pickupAddress
  }
  return order?.address || ''
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

  const propertyAddress = resolveOrderAddress(order, property)

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
      order?.client_name ??
      order?.clientName ??
      '',

    client:
      client?.name ??
      order?.client_name ??
      order?.clientName ??
      order?.company_name ??
      order?.companyName ??
      order?.client ??
      '',

    address: propertyAddress,
    timeWindow: resolveDeliveryTimeWindow(order),

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
  loadError.value = ''

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

    loadError.value =
      error?.message ??
      t('driver.errorLoadDelivery')
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
    ui.showError(t('driver.errorInvalidPackages'))
    return
  }

  if (!form.receivedBy.trim()) {
    ui.showError(t('driver.errorRecipientRequired'))
    return
  }

  const orderId =
    stop.value.confirmationOrderId ??
    stop.value.orderDbId ??
    stop.value._id ??
    stop.value.id

  if (!orderId) {
    ui.showError(t('driver.errorInvalidOrderId'))
    return
  }

  submitting.value = true

  try {
    const payload = {
      packages_delivered:
        Number(form.packagesDelivered),

      received_by:
        form.receivedBy.trim(),

      special_notes:
        form.specialNotes.trim() || undefined,

      confirmation_method:
        isManualFlow.value
          ? 'manual'
          : form.confirmationMethod,
    }

    await apiConfirmDelivery(
      String(orderId),
      payload
    )

    ui.showSuccess(`${t('driver.confirmDelivery')} ✓`)

    window.setTimeout(() => {
      goBack()
    }, 1500)
  } catch (error) {
    console.error(
      'Unable to confirm delivery:',
      error
    )

    ui.showError(
      error?.message ??
      error?.error ??
      t('driver.errorConfirmDelivery')
    )
  } finally {
    submitting.value = false
  }
}

function goBack() {
  navStore.goBack('route')
}
</script>