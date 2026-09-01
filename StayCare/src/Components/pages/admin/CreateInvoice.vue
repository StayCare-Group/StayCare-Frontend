<template>
  <div class="space-y-6 max-w-3xl">
    <!-- Header -->
    <div class="flex items-center gap-3">
      <button @click="navStore.goBack('invoices')" class="text-brand-700 hover:text-gray-400">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
      </button>
      <h2 class="text-lg font-semibold text-brand-700">{{ $t('admin.newInvoice') }}</h2>
    </div>

    <form @submit.prevent="submitInvoice" class="space-y-6">
      <!-- Client & Orders -->
      <div class="bg-white rounded-xl shadow-sm p-5 space-y-4">
        <h3 class="text-sm font-semibold text-gray-700 uppercase tracking-wide">{{ $t('common.client') }} &amp; {{ $t('common.orders') }}</h3>

        <div>
          <label class="block text-sm font-medium text-gray-600 mb-1">{{ $t('common.client') }}</label>
          <select v-model="form.clientId" required @change="onClientChange"
            class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-400 focus:border-transparent outline-none">
            <option value="">{{ $t('admin.selectClient') }}</option>
            <option v-for="c in clients" :key="getClientUserId(c)" :value="getClientUserId(c)">
              {{ getClientDisplayName(c) }}
            </option>
          </select>
          <p v-if="!clients.length && !loadingData" class="text-xs text-amber-500 mt-1">{{ $t('admin.noClients') }}</p>
        </div>

        <div v-if="form.clientId">
          <div v-if="loadingOrders" class="flex items-center gap-2 text-sm text-gray-400 py-2">
            <svg class="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
            {{ $t('createInvoice.loadingOrders') }}
          </div>
          <template v-else>
            <div v-if="clientOrders.length" class="space-y-3">
              <div class="flex items-center gap-2 bg-brand-150 border border-brand-300 rounded-lg px-3 py-2">
                <svg class="w-4 h-4 text-brand-700 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                <span class="text-sm text-brand-700 font-medium">{{ $t('createInvoice.uninvoicedFound', { count: clientOrders.length }) }}</span>
              </div>
              <div class="space-y-2 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-3">
                <label v-for="o in clientOrders" :key="getOrderId(o)"
                  class="flex items-center gap-3 cursor-pointer hover:bg-gray-50 rounded px-2 py-1.5 transition-colors">
                  <input type="checkbox" :value="getOrderId(o)" v-model="form.orderIds"
                    class="rounded border-gray-300 text-brand-700 focus:ring-brand-400" />
                  <div class="flex-1 min-w-0">
                    <span class="text-sm font-medium text-gray-800">{{ o.order_number }}</span>
                    <span class="text-xs text-gray-400 ml-2">{{ o.status }} &middot; {{ formatCurrency(getOrderTotal(o)) }}</span>
                  </div>
                </label>
              </div>
            </div>
            <p v-else class="text-xs text-gray-400 mt-1">{{ $t('admin.noOrdersForClient') }}</p>
          </template>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-600 mb-1">{{ $t('admin.dueDate') }}</label>
          <input v-model="form.dueDate" type="date" required :min="today"
            class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-400 focus:border-transparent outline-none" />
        </div>
      </div>

      <!-- Line Items -->
      <div class="bg-white rounded-xl shadow-sm p-5 space-y-4">
        <div class="flex items-center justify-between">
          <h3 class="text-sm font-semibold text-gray-700 uppercase tracking-wide">{{ $t('admin.lineItems') }}</h3>
          <span class="text-xs text-gray-400 font-normal">({{ $t('common.optional') }})</span>
        </div>

        <div v-if="form.lineItems.length" class="overflow-x-auto">
          <table class="w-full text-sm min-w-[500px]">
            <thead class="bg-gray-50 text-gray-500 text-xs uppercase">
              <tr>
                <th class="px-3 py-2 text-left font-medium">{{ $t('admin.description') }}</th>
                <th class="px-3 py-2 text-right font-medium w-20">{{ $t('admin.quantity') }}</th>
                <th class="px-3 py-2 text-right font-medium w-28">{{ $t('admin.unitPrice') }}</th>
                <th class="px-3 py-2 text-right font-medium w-28">{{ $t('admin.lineTotal') }}</th>
                <th class="px-3 py-2 w-16"></th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr v-for="(item, idx) in form.lineItems" :key="idx">
                <td class="px-3 py-2">
                  <input v-model="item.description" :placeholder="$t('createInvoice.serviceDescription')"
                    class="w-full border border-gray-200 rounded px-2 py-1.5 text-sm focus:ring-2 focus:ring-brand-400 focus:border-transparent outline-none" />
                </td>
                <td class="px-3 py-2">
                  <input v-model.number="item.quantity" type="number" min="1"
                    class="w-full border border-gray-200 rounded px-2 py-1.5 text-sm text-right focus:ring-2 focus:ring-brand-400 focus:border-transparent outline-none" />
                </td>
                <td class="px-3 py-2">
                  <input v-model.number="item.unit_price" type="number" min="0" step="0.01"
                    class="w-full border border-gray-200 rounded px-2 py-1.5 text-sm text-right focus:ring-2 focus:ring-brand-400 focus:border-transparent outline-none" />
                </td>
                <td class="px-3 py-2 text-right font-medium text-gray-800">
                  {{ formatCurrency((item.quantity || 0) * (item.unit_price || 0)) }}
                </td>
                <td class="px-3 py-2 text-center">
                  <button type="button" @click="form.lineItems.splice(idx, 1)"
                    class="text-red-400 hover:text-red-600 text-xs font-medium">{{ $t('admin.removeItem') }}</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <AppButton variant="ghost" size="sm" type="button" @click="addLineItem">{{ $t('admin.addLineItem') }}</AppButton>
      </div>

      <!-- Totals -->
      <PricingSummaryCard
        :subtotal="subtotal"
        :vatAmount="vatAmount"
        :total="grandTotal"
        :alignRight="true"
      />

      <!-- Submit -->
      <div class="flex gap-3">
        <AppButton type="submit" size="lg" :loading="submitting">
          {{ $t('admin.placeInvoice') }}
        </AppButton>
        <AppButton type="button" variant="secondary" size="lg" @click="navStore.goBack('invoices')">
          {{ $t('common.cancel') }}
        </AppButton>
      </div>
      <p v-if="errorMessage" class="text-sm text-red-500 mt-2">{{ errorMessage }}</p>
    </form>

    <!-- Success toast -->
    <div v-if="showSuccess" class="fixed bottom-6 right-6 bg-green-600 text-white px-5 py-3 rounded-lg shadow-lg text-sm font-medium z-50">
      {{ $t('admin.invoiceCreated') }}
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import AppButton from '../../ui/AppButton.vue'
import PricingSummaryCard from '../../ui/PricingSummaryCard.vue'
import { useNavStore } from '../../../stores/nav.js'
import { fetchClients } from '../../../api/clients'
import { fetchOrders } from '../../../api/orders'
import { createInvoice } from '../../../api/invoices'
import { getClientDisplayName } from '../../../utils/client'
import { getTodayDateString, getFutureDateString } from '../../../utils/date'
import { DEFAULT_VAT_RATE, DEFAULT_VAT_PERCENTAGE, calculateVatBreakdown, formatCurrency } from '../../../utils/pricing'
import { formatApiErrorMessage } from '../../../utils/errors'

const { t } = useI18n()
const navStore = useNavStore()

const today = getTodayDateString()
const defaultDueStr = getFutureDateString(30)

const clients = ref([])
const clientOrders = ref([])
const loadingData = ref(true)
const loadingOrders = ref(false)
const submitting = ref(false)
const showSuccess = ref(false)
const errorMessage = ref('')

const form = reactive({
  clientId: '',
  orderIds: [],
  dueDate: defaultDueStr,
  lineItems: [],
})

function getOrderId(order) {
  return String(order?._id ?? order?.id ?? '')
}

function getClientUserId(client) {
  if (!client || typeof client !== 'object') return ''
  return String(client.user_id ?? client.id ?? '')
}

function getOrderTotal(order) {
  const value = order?.pricing_snapshot?.total ?? order?.total ?? 0
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function getOrderSubtotal(order) {
  const value = order?.subtotal ?? order?.pricing_snapshot?.subtotal ?? order?.total ?? 0
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

onMounted(async () => {
  try {
    clients.value = await fetchClients().catch(() => [])
  } finally {
    loadingData.value = false
  }
})

async function loadOrdersForClient(clientId) {
  if (!clientId) {
    clientOrders.value = []
    return
  }
  loadingOrders.value = true
  try {
    const orders = await fetchOrders({
      client_id: clientId,
      status: 'delivered,collected,ready_to_delivery',
      is_invoiced: 'false',
    }).catch(() => [])
    clientOrders.value = orders ?? []
  } finally {
    loadingOrders.value = false
  }
}

watch(() => form.clientId, (clientId) => {
  loadOrdersForClient(clientId)
})

function onClientChange() {
  form.orderIds = []
  // La carga de órdenes se dispara via watch sobre form.clientId
}

function addLineItem() {
  form.lineItems.push({ description: '', quantity: 1, unit_price: 0 })
}

const selectedOrdersSubtotal = computed(() => {
  const selectedIds = new Set((form.orderIds ?? []).map(id => String(id)))
  const selected = clientOrders.value.filter(o => selectedIds.has(getOrderId(o)))
  return selected.reduce((sum, o) => sum + getOrderSubtotal(o), 0)
})

const extraItemsSubtotal = computed(() =>
  form.lineItems.reduce((sum, li) => {
    if (!li.description || !li.description.trim()) return sum
    return sum + (Number(li.quantity) || 0) * (Number(li.unit_price) || 0)
  }, 0)
)

const subtotal = computed(() => selectedOrdersSubtotal.value + extraItemsSubtotal.value)
const vatAmount = computed(() => calculateVatBreakdown(subtotal.value).vatAmount)
const grandTotal = computed(() => calculateVatBreakdown(subtotal.value).total)

async function submitInvoice() {
  if (submitting.value) return
  if (!form.clientId) {
    errorMessage.value = t('validation.selectClientRequired')
    return
  }
  if (!form.dueDate) {
    errorMessage.value = t('validation.fillRequiredFields')
    return
  }

  const validLineItems = form.lineItems
    .filter(li => li.description && li.description.trim())
    .map(li => ({
      description: li.description.trim(),
      quantity: Number(li.quantity) || 1,
      unit_price: Number(li.unit_price) || 0,
      total_price: (Number(li.quantity) || 1) * (Number(li.unit_price) || 0),
    }))

  if (!form.orderIds || form.orderIds.length === 0) {
    errorMessage.value = t('createInvoice.selectOrdersRequired')
    return
  }

  submitting.value = true
  errorMessage.value = ''
  try {
    const payload = {
      client: form.clientId,
      orders: (form.orderIds ?? []).map(id => String(id)),
      due_date: new Date(form.dueDate).toISOString(),
      line_items: validLineItems,
      subtotal: subtotal.value,
      vat_percentage: DEFAULT_VAT_PERCENTAGE,
      vat_amount: vatAmount.value,
      total: grandTotal.value,
    }

    await createInvoice(payload)
    showSuccess.value = true
    setTimeout(() => {
      showSuccess.value = false
      navStore.goBack('invoices')
    }, 1500)
  } catch (err) {
    errorMessage.value = formatApiErrorMessage(
      err,
      t('createInvoice.createFailed'),
      t
    )
  } finally {
    submitting.value = false
  }
}
</script>
