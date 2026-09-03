<template>
  <div class="space-y-6 max-w-2xl">
    <LoadingPanel v-if="loading" />

    <template v-else>
      <!-- Header -->
      <div class="flex items-center gap-3">
        <button
          type="button"
          class="text-brand-700 hover:text-gray-400"
          @click="navStore.goBack('route')"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"
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
          {{ $t('driver.confirmPickup') }}
        </h2>
      </div>

      <!-- Manual flow information -->
      <div
        v-if="isManualFlow"
        class="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3"
      >
        <p class="text-sm font-medium text-blue-800">
          {{ $t('driver.pickupWithoutDriver') }}
        </p>

        <p class="mt-1 text-xs text-blue-700">
          {{ $t('driver.pickupWithoutDriverDesc') }}
        </p>
      </div>

      <div v-if="stop" class="space-y-6">
        <!-- Stop / Order information -->
        <InfoGridCard :items="stopInfoItems" />

        <!-- Pickup form -->
        <form class="space-y-5" @submit.prevent="confirmPickup">
          <div class="bg-white rounded-xl shadow-sm p-5 space-y-4">
            <h3
              class="text-sm font-semibold text-gray-700 uppercase tracking-wide"
            >
              {{ $t('driver.pickupConfirmation') }}
            </h3>

            <div>
              <label
                class="block text-sm font-medium text-gray-600 mb-1"
              >
                {{ $t('driver.actualBagCount') }}
              </label>

              <input
                v-model.number="form.actualBags"
                type="number"
                min="1"
                required
                class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-400 focus:border-transparent outline-none"
                :placeholder="$t('driver.bagsPickedUpPlaceholder')"
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
            <!-- Photo capture/upload -->
            <!-- <div>
              <label class="block text-sm font-medium text-gray-600 mb-1">{{ $t('driver.photoOptional') }}</label>
              <div class="border-2 border-dashed border-gray-200 rounded-lg p-4 text-center space-y-2">
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  @change="onPhotoChange"
                  class="block w-full text-xs text-gray-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
                />
                <p class="text-xs text-gray-400">{{ $t('driver.pickupPhotoHint') }}</p>
                <img
                  v-if="photoPreview"
                  :src="photoPreview"
                  alt="Pickup photo preview"
                  class="mt-2 mx-auto max-h-32 rounded-md object-cover"
                />
              </div>
            </div> -->

            <!-- TODO: Digital signature - Commented out for future implementation -->
            <!-- <div>
              <label class="block text-sm font-medium text-gray-600 mb-1">{{ $t('common.signature') }}</label>
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
                  <p class="text-xs text-gray-400">{{ $t('driver.clientSignHint') }}</p>
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
              {{ $t('driver.confirmPickup') }}
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
import { computed, onMounted, reactive, ref } from 'vue'
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
  confirmPickup as apiConfirmPickup,
} from '../../../api/orders'

const { t } = useI18n()
const navStore = useNavStore()
const ui = useUiStore()
const loadError = ref('')
const stop = ref(null)
const loading = ref(true)
const submitting = ref(false)
const photoPreview = ref(null)

const stopInfoItems = computed(() => {
  if (!stop.value) return []
  return [
    {
      label: t('common.client'),
      value: stop.value.company || stop.value.client || '-',
    },
    {
      label: t('common.order'),
      value: stop.value.orderId || '-',
    },
    {
      label: t('common.contactPerson'),
      value: stop.value.contactPerson || '-',
    },
    {
      label: t('common.phone'),
      value: stop.value.clientPhone || '-',
    },
    {
      label: t('common.area'),
      value: stop.value.area || '-',
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
      label: t('driver.expectedBags'),
      value: stop.value.estimatedBags ?? '-',
    },
  ]
})
// TODO: Signature - Commented out for future implementation
// const signatureCanvas = ref(null)
// let signatureCtx = null
// let isDrawing = false

onMounted(async () => {
  // try {
  //   const routeId = navStore.selectedRouteId
  //   if (!routeId) return
  //   const data = await fetchRouteById(String(routeId))
  //   const mapped = mapRouteForDriver(data)
  //   stop.value = mapped.stops.find(s => (s._id ?? s.id) == navStore.selectedId) ?? null
  // } catch { /* stays null */ } finally {
  //   loading.value = false
  // }

  // TODO: Signature canvas initialization - Commented out for future implementation
  // const canvas = signatureCanvas.value
  // if (canvas) {
  //   const dpr = window.devicePixelRatio || 1
  //   const rect = canvas.getBoundingClientRect()
  //   canvas.width = rect.width * dpr
  //   canvas.height = rect.height * dpr
  //   signatureCtx = canvas.getContext('2d')
  //   signatureCtx.scale(dpr, dpr)
  //   signatureCtx.lineWidth = 2
  //   signatureCtx.lineCap = 'round'
  //   signatureCtx.strokeStyle = '#111827'
  // }
})

// TODO: Cleanup signature state - Commented out for future implementation
// onBeforeUnmount(() => {
//   isDrawing = false
// })

const form = reactive({
  actualBags: null,
  specialNotes: '',
})

function onPhotoChange(event) {
  const file = event.target.files?.[0]
  if (!file) {
    photoPreview.value = null
    return
  }
  const reader = new FileReader()
  reader.onload = e => {
    photoPreview.value = e.target?.result || null
  }
  reader.readAsDataURL(file)
}

// TODO: Signature functions - Commented out for future implementation
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
 * Cuando no existe selectedRouteId significa que la vista
 * fue abierta desde administración y no desde una ruta.
 */
const isManualFlow = computed(() => {
  return !navStore.selectedRouteId
})

/**
 * Convierte diferentes formatos del status al formato
 * visual que ya usa este componente.
 */
function normalizeStatus(status) {
  const normalized = String(status ?? '')
    .trim()
    .toLowerCase()
    .replaceAll('-', '_')
    .replaceAll(' ', '_')

  const statusMap = {
    pending: 'Pending',
    assigned: 'Assigned',
    transit: 'In Transit',
    in_transit: 'In Transit',
    arrived: 'Arrived',
    delivered: 'Delivered',
    completed: 'Completed',
    ready_to_delivery: 'Ready To Delivery',
  }

  return statusMap[normalized] ?? status
}

/**
 * Extrae la orden cuando el API responde usando alguno
 * de estos formatos:
 *
 * order
 * { data: order }
 * { data: { order } }
 * { order }
 */
function unwrapOrderResponse(response) {
  return (
    response?.data?.order ??
    response?.data ??
    response?.order ??
    response
  )
}

/**
 * Busca la propiedad asociada a la orden.
 */
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
        String(property?._id) === String(order.property)
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

function resolvePickupTimeWindow(order) {
  if (order?.pickup_time_window) return order.pickup_time_window
  if (order?.pickupTimeWindow) return order.pickupTimeWindow
  if (order?.time_window) return order.time_window
  if (order?.timeWindow) return order.timeWindow
  const start = order?.pickup_window?.start_time ?? order?.pickup_window_start
  const end = order?.pickup_window?.end_time ?? order?.pickup_window_end
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
  if (order?.pickup_address || order?.pickupAddress) {
    return order.pickup_address || order.pickupAddress
  }
  return order?.address || ''
}

/**
 * Convierte una orden normal al formato que el template
 * esperaba anteriormente de un route stop.
 */
function mapOrderToConfirmation(order) {
  const orderDatabaseId =
    order?._id ??
    order?.id ??
    order?.order_id ??
    null

  const client =
    order?.client &&
    typeof order.client === 'object'
      ? order.client
      : {}

  const property = resolveProperty(order, client)

  const propertyAddress = resolveOrderAddress(order, property)

  const propertyArea =
    property?.area ??
    property?.locality ??
    order?.property_area ??
    order?.area ??
    ''

  const contactPerson =
    property?.contact_person ??
    property?.contactPerson ??
    client?.contact_person ??
    client?.contactPerson ??
    order?.client_contact_person ??
    order?.contact_person ??
    order?.contactPerson ??
    order?.propertyContactPerson ??
    ''

  const clientPhone =
    property?.phone ??
    property?.phone_number ??
    property?.phoneNumber ??
    client?.phone ??
    client?.phone_number ??
    client?.phoneNumber ??
    order?.client_phone ??
    order?.clientPhone ??
    order?.phone ??
    order?.propertyPhone ??
    ''

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
      order?.client ??
      '',

    contactPerson,
    clientPhone,
    area: propertyArea,
    address: propertyAddress,
    timeWindow: resolvePickupTimeWindow(order),

    estimatedBags:
      order?.estimated_bags ??
      order?.estimatedBags ??
      order?.expected_bags ??
      order?.expectedBags ??
      order?.bags ??
      null,

    status: normalizeStatus(order?.status),
    originalStatus: order?.status,
    specialNotes: order?.special_notes ?? order?.specialNotes ?? '',
  }
}

/**
 * Carga un stop cuando la vista viene del dashboard
 * del driver y existe una ruta.
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
      'The selected pickup stop was not found in the route.'
    )
  }

  /**
   * Mantiene el comportamiento anterior.
   *
   * Si mapRouteForDriver ya entrega un orderId real,
   * se utiliza. De lo contrario conserva _id como fallback.
   */
  matchedStop.confirmationOrderId =
    matchedStop.orderDbId ??
    matchedStop.order?._id ??
    matchedStop.order_id ??
    matchedStop.orderId?._id ??
    matchedStop._id ??
    matchedStop.id

  matchedStop.status = normalizeStatus(
    matchedStop.status
  )

  return matchedStop
}

/**
 * Carga directamente una orden cuando la acción
 * se realiza sin ruta ni driver.
 */
async function loadFromOrder(orderId) {
  console.log(orderId, 'orderId')
  const response = await fetchOrderById(
    String(orderId)
  )
    console.log(response, 'response')


  const order = unwrapOrderResponse(response)
    console.log(order, 'order')

  if (!order?.id) {
    throw new Error(
      'The selected order could not be loaded.'
    )
  }

  return mapOrderToConfirmation(order)
}

async function loadConfirmationData() {
  const selectedId = navStore.selectedId
  const routeId = navStore.selectedRouteId
  console.log(selectedId,'test')

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
      !form.actualBags
    ) {
      form.actualBags = stop.value.estimatedBags
    }
  } catch (error) {
    console.error(
      'Unable to load pickup confirmation:',
      error
    )

    stop.value = null

    loadError.value =
      error?.message ??
      t('driver.errorLoadPickup')
  } finally {
    loading.value = false
  }
})

function isPendingStatus(status) {
  const normalized = String(status ?? '')
    .trim()
    .toLowerCase()
    .replaceAll('-', '_')
    .replaceAll(' ', '_')

  return normalized === 'pending'
}

async function confirmPickup() {
  if (!stop.value || submitting.value) {
    return
  }

  if (!isPendingStatus(stop.value.status)) {
    ui.showError(t('driver.errorAlreadyConfirmed'))
    return
  }

  if (
    !Number.isFinite(Number(form.actualBags)) ||
    Number(form.actualBags) < 1
  ) {
    ui.showError(t('driver.errorInvalidBags'))
    return
  }

  const orderId =
    stop.value.confirmationOrderId ??
    stop.value.orderDbId ??
    stop.value._id

  if (!orderId) {
    ui.showError(t('driver.errorInvalidOrderId'))
    return
  }

  submitting.value = true

  try {
    const payload = {
      actual_bags: Number(form.actualBags),
      special_notes: form.specialNotes || undefined,
    }

    await apiConfirmPickup(
      String(orderId),
      payload
    )

    ui.showSuccess(`${t('driver.confirmPickup')} ✓`)

    window.setTimeout(() => {
      goBack()
    }, 1500)
  } catch (error) {
    console.error(
      'Unable to confirm pickup:',
      error
    )

    ui.showError(
      error?.message ??
      error?.error ??
      t('driver.errorConfirmPickup')
    )
  } finally {
    submitting.value = false
  }
}

function goBack() {
  /**
   * Conserva la navegación que ya utilizaba el componente.
   * Si la pantalla administrativa tiene otro nombre,
   * cambia "route" por ese nombre.
   */
  navStore.goBack('route')
}
</script>