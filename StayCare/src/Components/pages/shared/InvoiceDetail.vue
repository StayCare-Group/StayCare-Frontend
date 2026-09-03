<template>
  <div class="space-y-6 max-w-3xl">
    <!-- Header -->
    <div class="flex items-center gap-3">
      <button @click="navStore.goBack('invoices')" class="text-brand-700 hover:text-gray-400">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
      </button>
      <h2 class="text-lg font-semibold text-brand-700">{{ invoice?.id }}</h2>
      <StatusBadge v-if="invoice" :status="invoice.status" type="invoice" />
    </div>

    <div v-if="invoice" class="space-y-6">
      <!-- Invoice Meta -->
      <InfoGridCard :items="invoiceMetaItems" />

      <!-- Line Items -->
      <div class="bg-white rounded-xl shadow-sm overflow-hidden">
        <div class="px-5 py-4 border-b border-gray-100">
          <h3 class="text-sm font-semibold text-gray-700 uppercase tracking-wide">{{ $t('invoiceDetail.lineItems') }}</h3>
        </div>
        <table class="w-full text-sm">
          <thead class="bg-gray-50 text-gray-500 text-xs uppercase">
            <tr>
              <th class="px-5 py-2 text-left font-medium">{{ $t('orderDetail.itemCode') }}</th>
              <th class="px-5 py-2 text-left font-medium">{{ $t('orderDetail.itemName') }}</th>
              <th class="px-5 py-2 text-right font-medium">{{ $t('orderDetail.quantity') }}</th>
              <th class="px-5 py-2 text-right font-medium">{{ $t('orderDetail.unitPrice') }}</th>
              <th class="px-5 py-2 text-right font-medium">{{ $t('client.total') }}</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-for="item in invoice.items" :key="item.code">
              <td class="px-5 py-2 text-gray-500 font-mono text-xs">{{ item.code }}</td>
              <td class="px-5 py-2 text-gray-800">{{ item.name }}</td>
              <td class="px-5 py-2 text-right text-gray-700">{{ item.qty }}</td>
              <td class="px-5 py-2 text-right text-gray-500">{{ formatCurrency(item.unitPrice) }}</td>
              <td class="px-5 py-2 text-right font-medium text-gray-800">{{ formatCurrency(item.total) }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Totals -->
      <PricingSummaryCard
        :subtotal="invoice.subtotal"
        :surcharge="invoice.expressCharge"
        :vatAmount="invoice.vat"
        :total="invoice.grandTotal"
        :alignRight="true"
      />

      <!-- Pay button (if not already paid) -->
      <div v-if="invoice.status !== 'Paid'" class="flex gap-3">
        <AppButton @click="markPaid" size="lg">
          {{ $t('client.markAsPaid') }}
        </AppButton>
      </div>

      <!-- Success toast -->
      <div v-if="showSuccess" class="fixed bottom-6 right-6 bg-green-600 text-white px-5 py-3 rounded-lg shadow-lg text-sm font-medium z-50">
        {{ $t('invoiceDetail.markedPaid') }}
      </div>
    </div>

    <div v-else class="bg-white rounded-xl shadow-sm p-10 text-center">
      <p class="text-gray-400">{{ $t('invoiceDetail.notFound') }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import StatusBadge from '../../ui/StatusBadge.vue'
import AppButton from '../../ui/AppButton.vue'
import PricingSummaryCard from '../../ui/PricingSummaryCard.vue'
import InfoGridCard from '../../ui/InfoGridCard.vue'
import { useNavStore } from '../../../stores/nav.js'
import { fetchInvoiceById, recordPayment } from '../../../api/invoices'
import { mapInvoiceForDetail } from '@/utils/invoiceMappers'
import { formatCurrency } from '@/utils/pricing'

const { t } = useI18n()
const navStore = useNavStore()
const showSuccess = ref(false)

const invoice = ref(null)
const loading = ref(true)

const invoiceMetaItems = computed(() => {
  if (!invoice.value) return []
  return [
    { label: t('common.client'), value: invoice.value.client },
    { label: t('common.order'), value: invoice.value.orderId },
    { label: t('client.issueDate'), value: invoice.value.issueDate },
    { label: t('client.dueDate'), value: invoice.value.dueDate },
    {
      label: t('invoiceDetail.paymentMethod'),
      value: invoice.value.paymentMethod,
      show: Boolean(invoice.value.paymentMethod),
    },
  ]
})

async function loadInvoice() {
  const id = navStore.selectedId
  if (!id) return
  loading.value = true
  try {
    const data = await fetchInvoiceById(id)
    invoice.value = mapInvoiceForDetail(data)
  } catch {
    invoice.value = null
  } finally {
    loading.value = false
  }
}

onMounted(loadInvoice)
watch(() => navStore.selectedId, loadInvoice)

async function markPaid() {
  if (!invoice.value) return
  try {
    await recordPayment(navStore.selectedId, {
      amount: invoice.value.grandTotal,
      method: 'card',
      transaction_reference: `PAY-${Date.now()}`,
    })
    showSuccess.value = true
    await loadInvoice()
    setTimeout(() => { showSuccess.value = false }, 2000)
  } catch {
    showSuccess.value = false
  }
}
</script>
