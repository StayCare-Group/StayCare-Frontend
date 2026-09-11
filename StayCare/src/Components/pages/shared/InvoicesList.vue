<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between gap-3">
      <h2 class="text-lg font-semibold text-brand-700">{{ $t('nav.invoices') }}</h2>
      <div class="flex items-center gap-2">
        <AppButton
          variant="secondary"
          size="sm"
          :disabled="exportLoading"
          @click="exportToCsv"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V3"/>
          </svg>
          <span v-if="exportLoading">{{ $t('excel.exportGenerating') }}</span>
          <span v-else>{{ $t('invoices.exportCsv') }}</span>
        </AppButton>
        <AppButton v-if="isAdmin" @click="navStore.setPage('create-invoice')">{{ $t('admin.createInvoice') }}</AppButton>
      </div>
    </div>

    <!-- Status filters -->
    <div class="flex flex-col gap-3">
      <div class="flex flex-wrap gap-2">
        <button
          v-for="f in filters" :key="f.key"
          @click="onFilterChange(f.key)"
          class="px-3 py-1.5 rounded-full text-xs font-medium transition-colors"
          :class="activeFilter === f.key ? 'bg-brand-700 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'"
        >{{ f.label }}</button>
      </div>

      <!-- Date range + Client filters -->
      <div class="flex flex-wrap items-center gap-3">
        <DateRangeFilter
          id-prefix="invoices"
          :from="dateFrom"
          :to="dateTo"
          @update:from="onDateFromChange"
          @update:to="onDateToChange"
          @clear="clearDateFilter"
        />

        <ClientFilterSelect
          v-if="isAdmin"
          v-model="selectedClientId"
          @change="onClientFilterChange"
        />
      </div>
    </div>

    <LoadingPanel v-if="loading" :label="$t('common.loading')" />

    <!-- Invoices table -->
    <DataTable v-else :headers="invoiceHeaders" :items="invoices" min-width="650px">
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
        <StatusBadge :status="value" type="invoice" />
      </template>
      <template #cell-grandTotal="{ value }">
        <span class="font-semibold text-gray-800">{{ formatCurrency(value) }}</span>
      </template>
      <template #cell-actions="{ item }">
        <button
          @click.stop="navStore.goToDetail('invoice-detail', item._id)"
          class="text-brand-700 hover:underline text-sm font-medium"
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
import AppButton from '../../ui/AppButton.vue'
import LoadingPanel from '../../ui/LoadingPanel.vue'
import ClientFilterSelect from '../../ui/ClientFilterSelect.vue'
import DateRangeFilter from '../../ui/DateRangeFilter.vue'
import { useNavStore } from '../../../stores/nav.js'
import { useAuthStore } from '../../../stores/auth.js'
import { useUiStore } from '../../../stores/ui.js'
import { fetchInvoices, downloadInvoicesCsv } from '../../../api/invoices'
import { mapInvoiceForList } from '@/utils/invoiceMappers'
import { formatCurrency } from '@/utils/pricing'
import { getDefaultDateRange } from '@/utils/date'

const { t } = useI18n()
const navStore = useNavStore()
const authStore = useAuthStore()
const uiStore = useUiStore()

const isAdmin = computed(() => authStore.isAdmin)

const LOAD_LIMIT = '200'
const exportLoading = ref(false)

const defaultRange = getDefaultDateRange()
const dateFrom = ref(defaultRange.from)
const dateTo = ref(defaultRange.to)

const invoices = ref([])
const selectedClientId = ref('')
const loading = ref(true)
const activeFilter = ref('all')

async function exportToCsv() {
  exportLoading.value = true
  try {
    const params = {}
    if (activeFilter.value && activeFilter.value !== 'all') {
      params.status = activeFilter.value
    }
    if (selectedClientId.value) {
      params.client_id = selectedClientId.value
    }
    if (dateFrom.value) {
      params.from = dateFrom.value
    }
    if (dateTo.value) {
      params.to = dateTo.value
    }
    await downloadInvoicesCsv(params)
  } catch (err) {
    uiStore.showError(err?.message ?? t('invoices.exportError'))
  } finally {
    exportLoading.value = false
  }
}

const filters = computed(() => [
  { key: 'all',     label: t('invoices.filterAll') },
  { key: 'pending', label: t('invoices.filterPending') },
  { key: 'overdue', label: t('invoices.filterOverdue') },
  { key: 'paid',    label: t('invoices.filterPaid') },
])

async function loadInvoices() {
  loading.value = true
  try {
    const params = { limit: LOAD_LIMIT }
    if (activeFilter.value && activeFilter.value !== 'all') {
      params.status = activeFilter.value
    }
    if (selectedClientId.value) {
      params.client_id = selectedClientId.value
    }
    if (dateFrom.value) {
      params.from = dateFrom.value
    }
    if (dateTo.value) {
      params.to = dateTo.value
    }

    const data = await fetchInvoices(params)
    const rawItems = Array.isArray(data) ? data : []
    invoices.value = rawItems.map(mapInvoiceForList)
  } catch {
    invoices.value = []
  } finally {
    loading.value = false
  }
}

function onFilterChange(filterKey) {
  if (activeFilter.value === filterKey) return
  activeFilter.value = filterKey
  loadInvoices()
}

function onClientFilterChange() {
  loadInvoices()
}

function onDateFromChange(val) {
  dateFrom.value = val
  loadInvoices()
}

function onDateToChange(val) {
  dateTo.value = val
  loadInvoices()
}

function clearDateFilter() {
  const range = getDefaultDateRange()
  dateFrom.value = range.from
  dateTo.value = range.to
  loadInvoices()
}

onMounted(() => {
  loadInvoices()
})

const invoiceHeaders = computed(() => [
  { key: 'id',         label: t('client.invoiceId') },
  { key: 'orderId',    label: t('common.order') },
  { key: 'client',     label: t('common.client') },
  { key: 'issueDate',  label: t('client.issueDate') },
  { key: 'dueDate',    label: t('client.dueDate') },
  { key: 'status',     label: t('common.status') },
  { key: 'grandTotal', label: t('client.total') },
  { key: 'actions',    label: t('admin.actions') },
])
</script>
