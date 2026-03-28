<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <h2 class="text-lg font-semibold text-white">{{ $t('nav.invoices') }}</h2>
      <button v-if="isAdmin" @click="navStore.setPage('create-invoice')"
        class="bg-[#FF56B0] text-white font-bold py-2 px-5 rounded-lg shadow-[0_4px_0_#E63E8A] hover:opacity-90 transition text-sm">
        {{ $t('admin.createInvoice') }}
      </button>
    </div>

    <!-- Filters -->
    <div class="flex flex-wrap gap-2">
      <button
        v-for="f in filters" :key="f"
        @click="activeFilter = f"
        class="px-3 py-1.5 rounded-full text-xs font-medium transition-colors"
        :class="activeFilter === f ? 'bg-[#FF56B0] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'"
      >{{ f }}</button>
    </div>

    <!-- Invoices table -->
    <DataTable :headers="invoiceHeaders" :items="filteredInvoices" min-width="650px">
      <template #cell-id="{ value }">
        <span class="font-medium text-gray-800">{{ value }}</span>
      </template>
      <template #cell-orderId="{ value }">
        <span class="text-gray-500">{{ value }}</span>
      </template>
      <template #cell-client="{ value }">
        <span class="text-gray-700">{{ value }}</span>
      </template>
      <template #cell-issueDate="{ value }">
        <span class="text-gray-500">{{ value }}</span>
      </template>
      <template #cell-dueDate="{ value }">
        <span class="text-gray-500">{{ value }}</span>
      </template>
      <template #cell-status="{ value }">
        <StatusBadge :status="value" />
      </template>
      <template #cell-grandTotal="{ value }">
        <span class="font-semibold text-gray-800">&euro;{{ value.toFixed(2) }}</span>
      </template>
      <template #cell-actions="{ item }">
        <button
          @click.stop="navStore.goToDetail('invoice-detail', item._id)"
          class="text-[#FF56B0] hover:underline text-sm font-medium"
        >{{ $t('common.viewDetails') }}</button>
      </template>
    </DataTable>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import StatusBadge from '../../ui/StatusBadge.vue'
import DataTable from '../../ui/DataTable.vue'
import { useNavStore } from '../../../stores/nav.js'
import { useAuthStore } from '../../../stores/auth.js'
import { fetchInvoices, mapInvoiceForList } from '../../../api/invoices'

const { t } = useI18n()
const navStore = useNavStore()
const authStore = useAuthStore()

const isAdmin = computed(() => authStore.user?.role === 'admin')

const invoices = ref([])
const loading = ref(true)

onMounted(async () => {
  try {
    const data = await fetchInvoices()
    invoices.value = (data ?? []).map(mapInvoiceForList)
  } catch { /* stays empty */ } finally {
    loading.value = false
  }
})

const filters = ['All', 'Pending', 'Overdue', 'Paid']
const activeFilter = ref('All')

const filteredInvoices = computed(() => {
  if (activeFilter.value === 'All') return invoices.value
  return invoices.value.filter(i => i.status === activeFilter.value)
})

const invoiceHeaders = computed(() => [
  { key: 'id', label: t('client.invoiceId') },
  { key: 'orderId', label: t('common.order') },
  { key: 'client', label: t('common.client') },
  { key: 'issueDate', label: t('client.issueDate') },
  { key: 'dueDate', label: t('client.dueDate') },
  { key: 'status', label: t('common.status') },
  { key: 'grandTotal', label: t('client.total') },
  { key: 'actions', label: t('admin.actions') },
])
</script>
