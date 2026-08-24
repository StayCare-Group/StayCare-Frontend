<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <h2 class="text-lg font-semibold text-brand-700">{{ $t('admin.itemManagement') }}</h2>
      <AppButton @click="openModal(null)">{{ $t('admin.addItem') }}</AppButton>
    </div>

    <LoadingPanel v-if="loading" :label="$t('common.loading')" />

    <!-- Items table -->
    <DataTable v-else :headers="itemHeaders" :items="items" row-key="_id" min-width="600px">
      <template #cell-code="{ value }">
        <span class="font-mono text-xs text-gray-500">{{ value }}</span>
      </template>
      <template #cell-name="{ value }">
        <span class="font-medium text-gray-800">{{ value }}</span>
      </template>
      <template #cell-unitPrice="{ value }">
        <span class="text-gray-700">&euro;{{ value.toFixed(2) }}</span>
      </template>
      <template #cell-active="{ value }">
        <span
          class="inline-flex px-2 py-0.5 rounded-full text-xs font-medium"
          :class="value ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'"
        >{{ value ? $t('admin.active') : $t('admin.inactive') }}</span>
      </template>
      <template #cell-actions="{ item }">
        <AppButton variant="ghost" size="sm" @click="openModal(item)" class="mr-2">{{ $t('admin.edit') }}</AppButton>
        <button @click="handleDelete(item)" class="text-red-400 hover:text-red-600 hover:underline text-sm font-medium">{{ $t('admin.delete') }}</button>
      </template>
    </DataTable>

    <!-- Pagination -->
    <AppPagination
      v-if="!loading"
      :current-page="currentPage"
      :total-pages="totalPages"
      :total-items="totalItems"
      :disabled="loading"
      @page-change="goToPage"
    />

    <!-- Add/Edit Modal -->
    <AppModal
      :show="showModal"
      :title="editingItem ? $t('admin.editItem') : $t('admin.addItem')"
      size="md"
      :close-on-backdrop="false"
      :loading="saving"
      @close="showModal = false"
    >
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-600 mb-1">{{ $t('admin.itemCode') }}</label>
          <input v-model="modalForm.code" type="text" required
            class="w-full border-2 border-gray-300 bg-gray-50 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-400/40"
            placeholder="e.g. SHEET-KING" />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-600 mb-1">{{ $t('admin.itemName') }}</label>
          <input v-model="modalForm.name" type="text" required
            class="w-full border-2 border-gray-300 bg-gray-50 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-400/40"
            placeholder="e.g. King Size Sheet" />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-600 mb-1">{{ $t('admin.unitPrice') }} (&euro;)</label>
          <input v-model.number="modalForm.unitPrice" type="number" step="0.01" min="0" required
            class="w-full border-2 border-gray-300 bg-gray-50 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-400/40"
            placeholder="0.00" />
        </div>

        <div class="flex items-center gap-2">
          <input v-model="modalForm.active" type="checkbox" id="item-active"
            class="w-4 h-4 text-brand-700 border-gray-300 rounded focus:ring-brand-400" />
          <label for="item-active" class="text-sm font-medium text-gray-600">{{ $t('admin.active') }}</label>
        </div>
      </div>

      <p v-if="modalError" class="text-red-500 text-sm mt-3">{{ modalError }}</p>

      <template #footer>
        <button @click="showModal = false" :disabled="saving"
          class="flex-1 py-2 border-2 border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition disabled:opacity-50">
          {{ $t('common.cancel') }}
        </button>
        <AppButton @click="handleSave" class="flex-1" :loading="saving">
          {{ $t('common.save') }}
        </AppButton>
      </template>
    </AppModal>

    <!-- Delete confirmation -->
    <AppModal
      :show="showDeleteConfirm"
      :title="$t('admin.confirmDelete')"
      size="sm"
      :loading="deleting"
      @close="cancelDelete"
    >
      <p class="text-sm text-gray-500">{{ $t('admin.confirmDeleteItem', { name: deletingItem?.name }) }}</p>
      <p v-if="deleteError" class="mt-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
        {{ deleteError }}
      </p>

      <template #footer>
        <button @click="cancelDelete" :disabled="deleting"
          class="flex-1 py-2 border-2 border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition disabled:opacity-50">
          {{ $t('common.cancel') }}
        </button>
        <button @click="confirmDelete" :disabled="deleting"
          class="flex-1 py-2 bg-red-500 text-white rounded-lg text-sm font-semibold hover:bg-red-600 transition disabled:opacity-50">
          {{ deleting ? $t('common.loading') : $t('admin.delete') }}
        </button>
      </template>
    </AppModal>

    <!-- Success toast -->
    <div v-if="toast" class="fixed bottom-6 right-6 bg-green-600 text-white px-5 py-3 rounded-lg shadow-lg text-sm font-medium z-50">
      {{ toast }}
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import DataTable from '../../ui/DataTable.vue'
import AppButton from '../../ui/AppButton.vue'
import LoadingPanel from '../../ui/LoadingPanel.vue'
import AppModal from '../../ui/AppModal.vue'
import AppPagination from '../../ui/AppPagination.vue'
import { getItems, createItem, updateItem, deleteItem, mapItemForManagement } from '../../../api/items'

const { t } = useI18n()

const items = ref([])
const loading = ref(true)
const currentPage = ref(1)
const pageSize = 10
const totalItems = ref(0)
const totalPages = ref(1)

const itemHeaders = computed(() => [
  { key: 'code', label: t('admin.itemCode') },
  { key: 'name', label: t('admin.itemName') },
  { key: 'unitPrice', label: t('admin.unitPrice'), thClass: 'text-right', tdClass: 'text-right' },
  { key: 'active', label: t('common.status'), thClass: 'text-center', tdClass: 'text-center' },
  { key: 'actions', label: t('admin.actions'), thClass: 'text-right', tdClass: 'text-right' },
])

async function loadItems(page = currentPage.value) {
  loading.value = true
  try {
    const response = await getItems(false, {
      page,
      limit: pageSize,
    })

    const pagination = response?._pagination
    const rawItems = Array.isArray(response)
      ? response
      : Array.isArray(response?.data)
        ? response.data
        : []

    if (pagination) {
      items.value = rawItems.map(mapItemForManagement)
      currentPage.value = pagination.page ?? page
      totalItems.value = pagination.total ?? rawItems.length
      totalPages.value = pagination.pages ?? 1
      return
    }

    items.value = rawItems.map(mapItemForManagement)
    currentPage.value = Math.max(1, page)
    totalItems.value = rawItems.length
    totalPages.value = Math.max(1, Math.ceil(rawItems.length / pageSize))
  } catch (error) {
    console.error('Failed to load items:', error)

    items.value = []
    totalItems.value = 0
    totalPages.value = 1
  } finally {
    loading.value = false
  }
}

async function goToPage(page) {
  if (loading.value) return
  await loadItems(page)
  if (items.value.length === 0 && currentPage.value > 1) {
    await loadItems(currentPage.value - 1)
  }
}

onMounted(loadItems)

// Modal state
const showModal = ref(false)
const editingItem = ref(null)
const modalForm = ref({ code: '', name: '', unitPrice: 0, active: true })
const modalError = ref('')
const saving = ref(false)

function openModal(item) {
  editingItem.value = item
  if (item) {
    modalForm.value = { code: item.code, name: item.name, unitPrice: item.unitPrice, active: item.active }
  } else {
    modalForm.value = { code: '', name: '', unitPrice: 0, active: true }
  }
  modalError.value = ''
  showModal.value = true
}

async function handleSave() {
  if (!modalForm.value.code || !modalForm.value.name) {
    modalError.value = t('admin.itemFieldsRequired')
    return
  }
  saving.value = true
  modalError.value = ''
  try {
    const payload = {
      item_code: modalForm.value.code,
      name: modalForm.value.name,
      base_price: modalForm.value.unitPrice,
      is_active: modalForm.value.active,
    }
    if (editingItem.value) {
      await updateItem(editingItem.value._id, payload)
      showToast(t('admin.itemUpdated'))
    } else {
      await createItem(payload)
      showToast(t('admin.itemCreated'))
    }
    showModal.value = false
    await loadItems()
  } catch (err) {
    modalError.value = err?.message || t('admin.errorSaveItem')
  } finally {
    saving.value = false
  }
}

// Delete state
const showDeleteConfirm = ref(false)
const deletingItem = ref(null)
const deleting = ref(false)
const deleteError = ref('')

function handleDelete(item) {
  deletingItem.value = item
  deleteError.value = ''
  showDeleteConfirm.value = true
}

function cancelDelete() {
  showDeleteConfirm.value = false
  deleteError.value = ''
}

async function confirmDelete() {
  if (!deletingItem.value) return
  deleting.value = true
  deleteError.value = ''
  try {
    await deleteItem(deletingItem.value._id)
    showDeleteConfirm.value = false
    showToast(t('admin.itemDeleted'))
    await loadItems()
  } catch (err) {
    deleteError.value = err?.response?.data?.message || t('admin.errorDeleteItem')
  } finally {
    deleting.value = false
  }
}

// Toast
const toast = ref('')
function showToast(msg) {
  toast.value = msg
  setTimeout(() => { toast.value = '' }, 2000)
}
</script>
