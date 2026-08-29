<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between gap-3">
      <h2 class="text-lg font-semibold text-brand-700">{{ $t('nav.invoices') }}</h2>
      <div class="flex items-center gap-2">
        <AppButton
          variant="secondary"
          size="sm"
          @click="exportSelectedToExcel"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V3"/>
          </svg>
          {{ selectedInvoiceIds.length ? $t('invoices.exportExcel', { count: selectedInvoiceIds.length }) : $t('invoices.exportExcelAll') }}
        </AppButton>
        <AppButton v-if="isAdmin" @click="navStore.setPage('create-invoice')">{{ $t('admin.createInvoice') }}</AppButton>
      </div>
    </div>

    <!-- Status & Client filters -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div class="flex flex-wrap gap-2">
        <button
          v-for="f in filters" :key="f.key"
          @click="onFilterChange(f.key)"
          class="px-3 py-1.5 rounded-full text-xs font-medium transition-colors"
          :class="activeFilter === f.key ? 'bg-brand-700 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'"
        >{{ f.label }}</button>
      </div>

      <!-- Client filter dropdown for admin -->
      <ClientFilterSelect
        v-if="isAdmin"
        v-model="selectedClientId"
        @change="onClientFilterChange"
      />
    </div>

    <LoadingPanel v-if="loading" :label="$t('common.loading')" />

    <!-- Invoices table -->
    <DataTable v-else :headers="invoiceHeaders" :items="invoices" min-width="650px">
      <template #header-select>
        <input
          type="checkbox"
          :checked="isAllSelected"
          @change="toggleSelectAll"
          class="rounded border-gray-300 text-brand-700 focus:ring-brand-500 cursor-pointer"
          :title="$t('invoices.selectAll')"
        />
      </template>
      <template #cell-select="{ item }">
        <input
          type="checkbox"
          :value="item._id"
          v-model="selectedInvoiceIds"
          @click.stop
          class="rounded border-gray-300 text-brand-700 focus:ring-brand-500 cursor-pointer"
        />
      </template>
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
        <span class="font-semibold text-gray-800">&euro;{{ value.toFixed(2) }}</span>
      </template>
      <template #cell-actions="{ item }">
        <button
          @click.stop="navStore.goToDetail('invoice-detail', item._id)"
          class="text-brand-700 hover:underline text-sm font-medium"
        >{{ $t('common.viewDetails') }}</button>
      </template>
    </DataTable>

    <!-- Pagination -->
    <AppPagination
      v-if="!loading"
      :current-page="currentPage"
      :total-pages="totalPages"
      :total-items="totalItems"
      :disabled="filterLoading"
      @page-change="onPageChange"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import StatusBadge from '../../ui/StatusBadge.vue'
import DataTable from '../../ui/DataTable.vue'
import AppButton from '../../ui/AppButton.vue'
import LoadingPanel from '../../ui/LoadingPanel.vue'
import AppPagination from '../../ui/AppPagination.vue'
import ClientFilterSelect from '../../ui/ClientFilterSelect.vue'
import { useNavStore } from '../../../stores/nav.js'
import { useAuthStore } from '../../../stores/auth.js'
import { fetchInvoices, mapInvoiceForList } from '../../../api/invoices'
import { useExcelExporter } from '../../../composables/useExcelExporter.js'

const { t } = useI18n()
const navStore = useNavStore()
const authStore = useAuthStore()
const { exportInvoicesDetailed } = useExcelExporter()

const isAdmin = computed(() => authStore.isAdmin)

const PAGE_SIZE = 10

const invoices = ref([])
const selectedClientId = ref('')
const selectedInvoiceIds = ref([])
const loading = ref(true)
const filterLoading = ref(false)
const currentPage = ref(1)
const totalPages = ref(1)
const totalItems = ref(0)

const isAllSelected = computed(() => {
  if (!invoices.value.length) return false
  return invoices.value.every(inv => selectedInvoiceIds.value.includes(inv._id))
})

function toggleSelectAll(e) {
  if (e.target.checked) {
    const visibleIds = invoices.value.map(inv => inv._id)
    const set = new Set([...selectedInvoiceIds.value, ...visibleIds])
    selectedInvoiceIds.value = Array.from(set)
  } else {
    const visibleSet = new Set(invoices.value.map(inv => inv._id))
    selectedInvoiceIds.value = selectedInvoiceIds.value.filter(id => !visibleSet.has(id))
  }
}

async function exportSelectedToExcel() {
  const selectedSet = new Set(selectedInvoiceIds.value)
  const itemsToExport = selectedSet.size
    ? invoices.value.filter(inv => selectedSet.has(inv._id))
    : invoices.value

  if (!itemsToExport.length) return
  await exportInvoicesDetailed(itemsToExport)
}

function getClientUserId(client) {
  if (!client || typeof client !== 'object') return ''
  return String(client.user_id ?? client._id ?? client.id ?? getClientId(client) ?? '')
}

// Filter keys match backend status values (lowercase)
const activeFilter = ref('all')

const filters = computed(() => [
  { key: 'all',     label: t('invoices.filterAll') },
  { key: 'pending', label: t('invoices.filterPending') },
  { key: 'overdue', label: t('invoices.filterOverdue') },
  { key: 'paid',    label: t('invoices.filterPaid') },
])

async function loadInvoices(status, page) {
  filterLoading.value = true
  try {
    const params = { page: String(page), limit: String(PAGE_SIZE) }
    if (status && status !== 'all') {
      params.status = status
    }
    if (selectedClientId.value) {
      params.client_id = selectedClientId.value
    }

    const data = await fetchInvoices(params)
    const rawItems = Array.isArray(data) ? data : []
    const pagination = data?._pagination ?? {}

    invoices.value = rawItems.map(mapInvoiceForList)
    totalItems.value = pagination.total ?? rawItems.length
    totalPages.value = pagination.pages ?? Math.max(1, Math.ceil(totalItems.value / PAGE_SIZE))
  } catch {
    invoices.value = []
    totalItems.value = 0
    totalPages.value = 1
  } finally {
    filterLoading.value = false
  }
}

function onFilterChange(filterKey) {
  if (activeFilter.value === filterKey) return
  activeFilter.value = filterKey
  currentPage.value = 1
  loadInvoices(filterKey, 1)
}

function onClientFilterChange() {
  currentPage.value = 1
  loadInvoices(activeFilter.value, 1)
}

function onPageChange(newPage) {
  currentPage.value = newPage
  loadInvoices(activeFilter.value, newPage)
}

onMounted(async () => {
  try {
    await loadInvoices('all', 1)
  } finally {
    loading.value = false
  }
})

const invoiceHeaders = computed(() => [
  { key: 'select',     label: '', thClass: 'w-10 text-center', tdClass: 'text-center' },
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
