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
                  <span class="text-xs text-gray-400 ml-2">{{ o.status }} &middot; &euro;{{ getOrderTotal(o).toFixed(2) }}</span>
                </div>
              </label>
            </div>
          </div>
          <p v-else class="text-xs text-gray-400 mt-1">{{ $t('admin.noOrdersForClient') }}</p>
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
                  &euro;{{ ((item.quantity || 0) * (item.unit_price || 0)).toFixed(2) }}
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
      <div class="bg-white rounded-xl shadow-sm p-5">
        <div class="space-y-2 text-sm max-w-xs ml-auto">
          <div class="flex justify-between">
            <span class="text-gray-500">{{ $t('admin.subtotal') }}</span>
            <span class="font-medium">&euro;{{ subtotal.toFixed(2) }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-500">{{ $t('admin.vatPercent') }}</span>
            <span class="font-medium">&euro;{{ vatAmount.toFixed(2) }}</span>
          </div>
          <div class="flex justify-between border-t border-gray-200 pt-2 mt-2 text-base">
            <span class="font-bold text-gray-800">{{ $t('admin.grandTotal') }}</span>
            <span class="font-bold text-gray-800">&euro;{{ grandTotal.toFixed(2) }}</span>
          </div>
        </div>
      </div>

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
import { ref, reactive, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import AppButton from '../../ui/AppButton.vue'
import { useNavStore } from '../../../stores/nav.js'
import { fetchClients } from '../../../api/clients'
import { fetchOrders } from '../../../api/orders'
import { createInvoice, fetchInvoices } from '../../../api/invoices'
import { getClientDisplayName, getClientId } from '../../../utils/client'
import { formatApiErrorMessage } from '../../../utils/errors'

const { t } = useI18n()
const navStore = useNavStore()

const VAT_RATE = 0.18
const _now = new Date()
const today = `${_now.getFullYear()}-${String(_now.getMonth()+1).padStart(2,'0')}-${String(_now.getDate()).padStart(2,'0')}`
const defaultDue = new Date(_now.getTime() + 30 * 86400000)
const defaultDueStr = `${defaultDue.getFullYear()}-${String(defaultDue.getMonth()+1).padStart(2,'0')}-${String(defaultDue.getDate()).padStart(2,'0')}`

const clients = ref([])
const allOrders = ref([])
const invoicedOrderIds = ref(new Set())
const loadingData = ref(true)
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
  return String(client.user_id ?? client._id ?? client.id ?? getClientId(client) ?? '')
}

function getOrderClientId(order) {
  return String(order?.client?._id ?? order?.client?._id ?? order?.client ?? order?.client_id ?? '')
}

function normalizeStatus(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_')
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
    const [clientsData, ordersData, invoicesData] = await Promise.all([
      fetchClients().catch(() => []),
      fetchOrders({ status: 'delivered,collected,ready_to_delivery', is_invoiced: 'false', limit: '200' }).catch(() => []),
      fetchInvoices().catch(() => []),
    ])
    clients.value = clientsData ?? []
    allOrders.value = ordersData ?? []

    const ids = new Set()
    for (const inv of (invoicesData ?? [])) {
      for (const o of (inv.orders ?? [])) {
        const oid = typeof o === 'string' || typeof o === 'number' ? o : (o?._id ?? o?.id ?? o)
        ids.add(String(oid))
      }
    }
    invoicedOrderIds.value = ids
  } catch { /* stays empty */ } finally {
    loadingData.value = false
  }
})

const UNINVOICED_STATUSES = new Set(['delivered', 'ready_to_delivery', 'collected'])

const selectedClientMatchIds = computed(() => {
  const selectedId = String(form.clientId ?? '')
  if (!selectedId) return new Set()

  const selected = clients.value.find(c => String(getClientId(c)) === selectedId)
  const ids = new Set([selectedId])

  if (selected) {
    ids.add(String(selected._id ?? ''))
    ids.add(String(selected.id ?? ''))
    ids.add(String(selected.client_profile_id ?? ''))
    ids.add(String(selected.user_id ?? ''))
  }

  ids.delete('')
  return ids
})

const clientOrders = computed(() => {
  if (!form.clientId) return []
  return allOrders.value.filter(o => {
    const orderClientId = String(getOrderClientId(o))
    if (!orderClientId || !selectedClientMatchIds.value.has(orderClientId)) return false
    if (!UNINVOICED_STATUSES.has(normalizeStatus(o.status))) return false
    if (o.is_invoiced || o.isInvoiced || invoicedOrderIds.value.has(getOrderId(o))) return false
    return true
  })
})

function onClientChange() {
  form.orderIds = []
}

function addLineItem() {
  form.lineItems.push({ description: '', quantity: 1, unit_price: 0 })
}

const selectedOrdersSubtotal = computed(() => {
  const selectedIds = new Set((form.orderIds ?? []).map(id => String(id)))
  const selected = allOrders.value.filter(o => selectedIds.has(getOrderId(o)))
  return selected.reduce((sum, o) => sum + getOrderSubtotal(o), 0)
})

const extraItemsSubtotal = computed(() =>
  form.lineItems.reduce((sum, li) => {
    if (!li.description || !li.description.trim()) return sum
    return sum + (Number(li.quantity) || 0) * (Number(li.unit_price) || 0)
  }, 0)
)

const subtotal = computed(() => selectedOrdersSubtotal.value + extraItemsSubtotal.value)
const vatAmount = computed(() => subtotal.value * VAT_RATE)
const grandTotal = computed(() => subtotal.value + vatAmount.value)

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
      vat_percentage: 18,
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
