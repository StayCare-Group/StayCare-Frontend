<template>
  <div class="space-y-6 max-w-3xl">
    <div class="flex items-center gap-3">
      <button @click="navStore.goBack('orders')" class="text-brand-700 hover:text-gray-400">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <h2 class="text-lg font-semibold text-brand-700">{{ title }}</h2>
    </div>

    <form @submit.prevent="submitOrder" novalidate class="space-y-6">
      <div class="bg-white rounded-xl shadow-sm p-5 space-y-4">
        <h3 v-if="isAdmin" class="text-sm font-semibold text-gray-700 uppercase tracking-wide">{{
          t('admin.selectClient') }}</h3>
        <h3 v-else class="text-sm font-semibold text-gray-700 uppercase tracking-wide">{{ t('admin.pickupDetails') }}
        </h3>

        <div v-if="isAdmin">
          <label class="block text-sm font-medium text-gray-600 mb-1">{{ t('common.client') }}</label>
          <select v-if="!noClientsAvailable" v-model="form.clientId" required
            class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-400 focus:border-transparent outline-none">
            <option value="">{{ t('admin.selectClientPlaceholder') }}</option>
            <option v-for="c in clients" :key="c.id" :value="c.id">
              {{ c.name }}
            </option>
          </select>
          <div v-else class="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
            <p class="text-xs text-amber-700">
              {{ t('admin.noClients') }} {{ t('admin.noClientsCreateHint') }}
            </p>
            <AppButton type="button" variant="ghost" size="sm" class="mt-1" @click="navStore.setPage('users')">
              {{ t('nav.users') }}
            </AppButton>
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-600 mb-1">{{ t('admin.selectProperty') }}</label>
          <select v-model="form.propertyId" required
            class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-400 focus:border-transparent outline-none">
            <option value="">{{ t('admin.selectPropertyPlaceholder') }}</option>
            <option v-for="p in properties" :key="p.id ?? p._id" :value="p.id ?? p._id">
              {{ p.property_name }} - {{ p.address }}, {{ p.city }}
            </option>
          </select>
          <p v-if="selectedProperty" class="text-xs text-gray-400 mt-1">
            {{ selectedProperty.address }}, {{ selectedProperty.city }} {{ selectedProperty.area ? '(' +
              selectedProperty.area + ')' : '' }}
            <span v-if="selectedProperty.access_notes"> &middot; {{ selectedProperty.access_notes }}</span>
          </p>
          <p v-if="isAdmin && form.clientId && !loadingClient && !properties.length"
            class="text-xs text-amber-500 mt-1">
            {{ t('admin.noPropertiesFound') }}
          </p>
          <p v-if="!isAdmin && !properties.length && !loading" class="text-xs text-amber-500 mt-1">
            {{ t('admin.noPropertiesFound') }}
          </p>
          <p v-if="loadingClient" class="text-xs text-gray-400 mt-1">{{ t('common.loading') }}</p>
        </div>

        <PickupWindowFields
          v-model:pickup-date="form.pickupDate"
          v-model:pickup-time-window="form.pickupTimeWindow"
          :is-admin-or-staff="isAdminOrStaff"
          :min-date="todayStr"
        />

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-600 mb-1">{{ t('admin.serviceType') }}</label>
            <div
              class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-700 font-medium">
              Standard (48h)
            </div>
            <!-- service type is currently fixed to standard for all orders, but this may change in the future.
                <select
              v-model="form.serviceType"
              required
              class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-400 focus:border-transparent outline-none"
            >
              <option v-for="s in SERVICE_TYPES" :key="s" :value="s">{{ s }}</option>
            </select> -->
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-600 mb-1">{{ t('admin.estimatedBags') }}</label>
            <input v-model.number="form.estimatedBags" type="number" min="1" required
              class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-400 focus:border-transparent outline-none"
              placeholder="e.g. 5" />
          </div>
        </div>
      </div>

      <OrderItemsPicker v-model="itemQtys" @catalog-loaded="onCatalogLoaded" />

      <div class="bg-white rounded-xl shadow-sm p-5 space-y-3">
        <h3 class="text-sm font-semibold text-gray-700 uppercase tracking-wide">{{ t('common.specialNotes') }}</h3>
        <textarea v-model="form.specialNotes" rows="3"
          class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-400 focus:border-transparent outline-none resize-none"
          :placeholder="t('admin.specialNotesPlaceholder')"></textarea>
      </div>

      <div v-if="estimatedTotal > 0" class="bg-white rounded-xl shadow-sm p-5">
        <h3 class="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">{{ t('admin.priceEstimate') }}</h3>
        <div class="space-y-1 text-sm">
          <div class="flex justify-between"><span class="text-gray-500">{{ t('admin.subtotal') }}</span><span
              class="font-medium">&euro;{{ subtotal.toFixed(2) }}</span></div>
          <div class="flex justify-between"><span class="text-gray-500">{{ t('admin.vat') }}</span><span
              class="font-medium">&euro;{{ vat.toFixed(2) }}</span></div>
          <div class="flex justify-between border-t border-gray-100 pt-2 mt-2"><span
              class="font-semibold text-gray-800">{{ t('admin.estimatedTotal') }}</span><span
              class="font-bold text-gray-800">&euro;{{ estimatedTotal.toFixed(2) }}</span></div>
        </div>
      </div>

      <div class="flex gap-3">
        <AppButton type="submit" size="lg" :loading="submitting" :disabled="noClientsAvailable">
          {{ t('admin.placeOrder') }}
        </AppButton>
        <button type="button" @click="navStore.goBack('orders')"
          class="bg-gray-100 text-gray-600 font-medium py-2.5 px-6 rounded-lg hover:bg-gray-200 transition text-sm">
          {{ t('common.cancel') }}
        </button>
      </div>
      <p v-if="errorMessage" class="text-sm text-red-500 mt-2">{{ errorMessage }}</p>
    </form>

    <div v-if="showSuccess"
      class="fixed bottom-6 right-6 bg-green-600 text-white px-5 py-3 rounded-lg shadow-lg text-sm font-medium z-50">
      {{ t('admin.orderCreatedSuccess') }}
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import AppButton from '../../ui/AppButton.vue'
import { useNavStore } from '../../../stores/nav.js'
import { useAuthStore } from '../../../stores/auth.js'
import { createOrder } from '../../../api/orders'
import { getUsers, fetchMe } from '../../../api/users'
import { getPropertiesByUserId } from '../../../api/properties'

import PickupWindowFields from '../../forms/PickupWindowFields.vue'
import OrderItemsPicker from '../../forms/OrderItemsPicker.vue'
import { getTodayDateString, isPastDate } from '../../../utils/date'
import { formatApiErrorMessage } from '../../../utils/errors'

const props = defineProps({
  mode: {
    type: String,
    default: 'client',
    validator: (value) => ['admin', 'client'].includes(value),
  },
})

const { t } = useI18n()
const navStore = useNavStore()
const authStore = useAuthStore()

const isAdmin = computed(() => props.mode === 'admin')
const isAdminOrStaff = computed(() => isAdmin.value || authStore.user?.role === 'staff' || authStore.user?.role === 'admin')
const title = computed(() => isAdmin.value ? t('admin.createOrderTitle') : t('client.createOrderTitle'))

const VAT_RATE = 0.18
const SERVICE_TYPES = ['Standard (48h)']
const todayStr = computed(() => getTodayDateString())

const form = reactive({
  clientId: '',
  propertyId: '',
  pickupDate: '',
  pickupTimeWindow: '',
  serviceType: 'Standard (48h)',
  estimatedBags: 1,
  specialNotes: '',
})

const clients = ref([])
const properties = ref([])
const itemQtys = ref({})
const itemCatalogByCode = ref({})
const loading = ref(true)
const loadingClient = ref(false)

function onCatalogLoaded(catalog) {
  itemCatalogByCode.value = catalog
}

const noClientsAvailable = computed(() =>
  isAdmin.value && !loading.value && clients.value.length === 0
)

onMounted(async () => {
  try {
    if (isAdmin.value) {
      const users = await getUsers({ role: 'client', is_active: 'true', limit: '200' }).catch(() => [])
      clients.value = (users ?? []).map(u => ({
        ...u,
        _id: u._id ?? u.id,
        id: u._id ?? u.id,
        name: u.name,
      }))
    } else {
      const meData = await fetchMe().catch(() => null)
      const userId = meData?.user?.id ?? meData?.user?._id ?? authStore.user?.id ?? ''
      form.clientId = userId
      if (userId) {
        const props = await getPropertiesByUserId(userId).catch(() => [])
        properties.value = props ?? []
      }
    }
  } catch {
    // keep empty state
  } finally {
    loading.value = false
  }
})

watch(() => form.clientId, async (newId) => {
  if (!isAdmin.value) return
  form.propertyId = ''
  properties.value = []
  if (!newId) return

  loadingClient.value = true
  try {
    const props = await getPropertiesByUserId(newId)
    properties.value = props ?? []
    if (properties.value.length === 1) {
      form.propertyId = properties.value[0].id ?? properties.value[0]._id
    }
  } catch {
    // keep empty state
  } finally {
    loadingClient.value = false
  }
})

const selectedProperty = computed(() =>
  properties.value.find(p => (p.id ?? p._id) === form.propertyId) ?? null
)

const subtotal = computed(() =>
  Object.keys(itemQtys.value).reduce((sum, code) => {
    const qty = Number(itemQtys.value[code] || 0)
    if (qty <= 0) return sum
    const unitPrice = Number(itemCatalogByCode.value[code]?.unitPrice ?? 0)
    return sum + qty * unitPrice
  }, 0)
)

const expressCharge = computed(() =>
  form.serviceType === 'Express (24h)' ? 25 : 0
)

const vat = computed(() => (subtotal.value + expressCharge.value) * VAT_RATE)

const estimatedTotal = computed(() => subtotal.value + expressCharge.value + vat.value)

const showSuccess = ref(false)
const submitting = ref(false)
const errorMessage = ref('')

function parseTimeWindow(tw) {
  const [start, end] = tw.split(' - ')
  const date = form.pickupDate || today
  return {
    start_time: new Date(`${date}T${start}:00`).toISOString(),
    end_time: new Date(`${date}T${end}:00`).toISOString(),
  }
}

function resolveClientId() {
  if (isAdmin.value) return form.clientId
  return form.clientId || authStore.user?.clientId || authStore.user?.client?._id || authStore.user?.id
}

async function submitOrder() {
  if (submitting.value) return
  if (noClientsAvailable.value) {
    errorMessage.value = `${t('admin.noClients')} ${t('admin.noClientsCreateHint')}`
    return
  }
  if (isAdmin.value && !form.clientId) {
    errorMessage.value = t('validation.selectClientRequired')
    return
  }
  if (!form.propertyId) {
    errorMessage.value = t('validation.selectPropertyRequired')
    return
  }
  if (!form.pickupDate) {
    errorMessage.value = t('validation.selectPickupDateRequired')
    return
  }
  if (!form.pickupTimeWindow) {
    errorMessage.value = t('validation.selectPickupTimeWindowRequired')
    return
  }
  if (!form.estimatedBags || form.estimatedBags < 1) {
    errorMessage.value = t('validation.estimatedBagsRequired')
    return
  }
  if (isPastDate(form.pickupDate)) {
    errorMessage.value = t('admin.pickupDateInPast')
    return
  }

  submitting.value = true

  try {
    errorMessage.value = ''
    const items = Object.keys(itemQtys.value)
      .map((code) => {
        const qty = Number(itemQtys.value[code] || 0)
        const item = itemCatalogByCode.value[code]
        if (qty <= 0 || !item) return null
        return {
          item_id: item._id ?? item.id,
          quantity: qty,
        }
      })
      .filter(Boolean)

    const payload = {
      client_id: String(resolveClientId()),
      property_id: form.propertyId ? String(form.propertyId) : undefined,
      service_type: 'standard',
      pickup_date: form.pickupDate,
      pickup_window: form.pickupTimeWindow ? parseTimeWindow(form.pickupTimeWindow) : undefined,
      estimated_bags: form.estimatedBags,
      special_notes: form.specialNotes,
      items,
    }

    await createOrder(payload)
    showSuccess.value = true
    setTimeout(() => {
      showSuccess.value = false
      navStore.goBack('orders')
    }, 1500)
  } catch (err) {
    showSuccess.value = false
    errorMessage.value = formatApiErrorMessage(
      err,
      t('admin.errorCreateOrder'),
      t
    )
  } finally {
    submitting.value = false
  }
}
</script>
