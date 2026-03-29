<template>
  <div class="space-y-6 max-w-3xl">
    <!-- Header -->
    <div class="flex items-center gap-3">
      <button @click="navStore.goBack('invoices')" class="text-white hover:text-gray-400">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
      </button>
      <h2 class="text-lg font-semibold text-brand-700">{{ invoice?.id }}</h2>
      <StatusBadge v-if="invoice" :status="invoice.status" />
    </div>

    <div v-if="invoice" class="space-y-6">
      <!-- Invoice Meta -->
      <div class="bg-white rounded-xl shadow-sm p-5">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div><span class="text-gray-400">{{ $t('common.client') }}</span><p class="font-medium text-gray-800">{{ invoice.client }}</p></div>
          <div><span class="text-gray-400">{{ $t('common.order') }}</span><p class="font-medium text-gray-800">{{ invoice.orderId }}</p></div>
          <div><span class="text-gray-400">{{ $t('client.issueDate') }}</span><p class="font-medium text-gray-800">{{ invoice.issueDate }}</p></div>
          <div><span class="text-gray-400">{{ $t('client.dueDate') }}</span><p class="font-medium text-gray-800">{{ invoice.dueDate }}</p></div>
          <div v-if="invoice.paymentMethod"><span class="text-gray-400">{{ $t('invoiceDetail.paymentMethod') }}</span><p class="font-medium text-gray-800">{{ invoice.paymentMethod }}</p></div>
        </div>
      </div>

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
              <td class="px-5 py-2 text-right text-gray-500">&euro;{{ item.unitPrice.toFixed(2) }}</td>
              <td class="px-5 py-2 text-right font-medium text-gray-800">&euro;{{ item.total.toFixed(2) }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Totals -->
      <div class="bg-white rounded-xl shadow-sm p-5">
        <div class="space-y-2 text-sm max-w-xs ml-auto">
          <div class="flex justify-between"><span class="text-gray-500">{{ $t('admin.subtotal') }}</span><span class="font-medium">&euro;{{ invoice.subtotal.toFixed(2) }}</span></div>
          <div v-if="invoice.expressCharge > 0" class="flex justify-between"><span class="text-gray-500">{{ $t('admin.expressSurcharge') }}</span><span class="font-medium">&euro;{{ invoice.expressCharge.toFixed(2) }}</span></div>
          <div class="flex justify-between"><span class="text-gray-500">{{ $t('admin.vatPercent') }}</span><span class="font-medium">&euro;{{ invoice.vat.toFixed(2) }}</span></div>
          <div class="flex justify-between border-t border-gray-200 pt-2 mt-2 text-base">
            <span class="font-bold text-gray-800">{{ $t('admin.grandTotal') }}</span>
            <span class="font-bold text-gray-800">&euro;{{ invoice.grandTotal.toFixed(2) }}</span>
          </div>
        </div>
      </div>

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
import { ref, watch, onMounted } from 'vue'
import StatusBadge from '../../ui/StatusBadge.vue'
import AppButton from '../../ui/AppButton.vue'
import { useNavStore } from '../../../stores/nav.js'
import { fetchInvoiceById, mapInvoiceForDetail, recordPayment } from '../../../api/invoices'

const navStore = useNavStore()
const showSuccess = ref(false)

const invoice = ref(null)
const loading = ref(true)

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
