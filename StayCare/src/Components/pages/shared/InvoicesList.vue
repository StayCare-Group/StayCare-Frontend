<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <h2 class="text-lg font-semibold text-brand-700">{{ $t('nav.invoices') }}</h2>
      <AppButton v-if="isAdmin" @click="navStore.setPage('create-invoice')">{{ $t('admin.createInvoice') }}</AppButton>
    </div>

    <!-- Status filters -->
    <div class="flex flex-wrap gap-2">
      <button
        v-for="f in filters" :key="f.key"
        @click="onFilterChange(f.key)"
        class="px-3 py-1.5 rounded-full text-xs font-medium transition-colors"
        :class="activeFilter === f.key ? 'bg-brand-700 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'"
      >{{ f.label }}</button>
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
import { useNavStore } from '../../../stores/nav.js'
import { useAuthStore } from '../../../stores/auth.js'
import { fetchInvoices, mapInvoiceForList } from '../../../api/invoices'

const { t } = useI18n()
const navStore = useNavStore()
const authStore = useAuthStore()

const isAdmin = computed(() => authStore.user?.role === 'admin')

const PAGE_SIZE = 10

const invoices = ref([])
const loading = ref(true)
const filterLoading = ref(false)
const currentPage = ref(1)
const totalPages = ref(1)
const totalItems = ref(0)

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
