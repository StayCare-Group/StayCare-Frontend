<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <h2 class="text-lg font-semibold text-white">{{ $t('admin.itemManagement') }}</h2>
      <button
        @click="openModal(null)"
        class="px-4 py-2 bg-[#FF56B0] text-white text-sm font-semibold rounded-lg shadow-[0_3px_0_#E63E8A] hover:bg-[#00F5F3] hover:shadow-[inset_0_2px_6px_rgba(0,140,140,0.7)] transition duration-300"
      >{{ $t('admin.addItem') }}</button>
    </div>

    <!-- Items table -->
    <div class="bg-white rounded-xl shadow-sm overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-sm text-left min-w-[600px]">
          <thead class="bg-gray-50 text-gray-500 uppercase text-xs">
            <tr>
              <th class="px-5 py-3 font-medium">{{ $t('admin.itemCode') }}</th>
              <th class="px-5 py-3 font-medium">{{ $t('admin.itemName') }}</th>
              <th class="px-5 py-3 font-medium text-right">{{ $t('admin.unitPrice') }}</th>
              <th class="px-5 py-3 font-medium text-center">{{ $t('common.status') }}</th>
              <th class="px-5 py-3 font-medium text-right">{{ $t('admin.actions') }}</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-for="item in items" :key="item._id" class="hover:bg-gray-50 transition-colors">
              <td class="px-5 py-3 font-mono text-xs text-gray-500">{{ item.code }}</td>
              <td class="px-5 py-3 font-medium text-gray-800">{{ item.name }}</td>
              <td class="px-5 py-3 text-right text-gray-700">&euro;{{ item.unitPrice.toFixed(2) }}</td>
              <td class="px-5 py-3 text-center">
                <span
                  class="inline-flex px-2 py-0.5 rounded-full text-xs font-medium"
                  :class="item.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'"
                >{{ item.active ? $t('admin.active') : $t('admin.inactive') }}</span>
              </td>
              <td class="px-5 py-3 text-right">
                <button @click="openModal(item)" class="text-[#FF56B0] hover:underline text-sm font-medium mr-3">{{ $t('admin.edit') }}</button>
                <button @click="handleDelete(item)" class="text-red-400 hover:text-red-600 hover:underline text-sm font-medium">{{ $t('admin.delete') }}</button>
              </td>
            </tr>
            <tr v-if="!items.length && !loading">
              <td colspan="5" class="px-5 py-8 text-center text-gray-400">{{ $t('common.noData') }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Add/Edit Modal -->
    <div v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40" @click.self="showModal = false">
      <div class="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
        <h3 class="text-lg font-semibold text-gray-800 mb-4">
          {{ editingItem ? $t('admin.editItem') : $t('admin.addItem') }}
        </h3>

        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-600 mb-1">{{ $t('admin.itemCode') }}</label>
            <input v-model="modalForm.code" type="text" required
              class="w-full border-2 border-gray-300 bg-gray-50 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-[#FF56B0] focus:ring-2 focus:ring-[#FF56B0]/40"
              placeholder="e.g. SHEET-KING" />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-600 mb-1">{{ $t('admin.itemName') }}</label>
            <input v-model="modalForm.name" type="text" required
              class="w-full border-2 border-gray-300 bg-gray-50 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-[#FF56B0] focus:ring-2 focus:ring-[#FF56B0]/40"
              placeholder="e.g. King Size Sheet" />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-600 mb-1">{{ $t('admin.unitPrice') }} (&euro;)</label>
            <input v-model.number="modalForm.unitPrice" type="number" step="0.01" min="0" required
              class="w-full border-2 border-gray-300 bg-gray-50 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-[#FF56B0] focus:ring-2 focus:ring-[#FF56B0]/40"
              placeholder="0.00" />
          </div>

          <div class="flex items-center gap-2">
            <input v-model="modalForm.active" type="checkbox" id="item-active"
              class="w-4 h-4 text-[#FF56B0] border-gray-300 rounded focus:ring-[#FF56B0]" />
            <label for="item-active" class="text-sm font-medium text-gray-600">{{ $t('admin.active') }}</label>
          </div>
        </div>

        <p v-if="modalError" class="text-red-500 text-sm mt-3">{{ modalError }}</p>

        <div class="flex gap-3 mt-6">
          <button @click="showModal = false"
            class="flex-1 py-2 border-2 border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition">
            {{ $t('common.cancel') }}
          </button>
          <button @click="handleSave" :disabled="saving"
            class="flex-1 py-2 bg-[#FF56B0] text-white rounded-lg text-sm font-semibold shadow-[0_3px_0_#E63E8A] hover:bg-[#00F5F3] hover:shadow-[inset_0_2px_6px_rgba(0,140,140,0.7)] transition duration-300 disabled:opacity-50">
            {{ saving ? $t('common.saving') : $t('common.save') }}
          </button>
        </div>
      </div>
    </div>

    <!-- Delete confirmation -->
    <div v-if="showDeleteConfirm" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40" @click.self="showDeleteConfirm = false">
      <div class="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm mx-4">
        <h3 class="text-lg font-semibold text-gray-800 mb-2">{{ $t('admin.confirmDelete') }}</h3>
        <p class="text-sm text-gray-500 mb-5">{{ $t('admin.confirmDeleteItem', { name: deletingItem?.name }) }}</p>
        <div class="flex gap-3">
          <button @click="showDeleteConfirm = false"
            class="flex-1 py-2 border-2 border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition">
            {{ $t('common.cancel') }}
          </button>
          <button @click="confirmDelete" :disabled="deleting"
            class="flex-1 py-2 bg-red-500 text-white rounded-lg text-sm font-semibold hover:bg-red-600 transition disabled:opacity-50">
            {{ deleting ? $t('common.loading') : $t('admin.delete') }}
          </button>
        </div>
      </div>
    </div>

    <!-- Success toast -->
    <div v-if="toast" class="fixed bottom-6 right-6 bg-green-600 text-white px-5 py-3 rounded-lg shadow-lg text-sm font-medium z-50">
      {{ toast }}
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { fetchItems, createItem, updateItem, deleteItem, mapItemForManagement } from '../../../api/items'

const { t } = useI18n()

const items = ref([])
const loading = ref(true)

async function loadItems() {
  loading.value = true
  try {
    const data = await fetchItems(false) // include inactive
    items.value = (data ?? []).map(mapItemForManagement)
  } catch { items.value = [] } finally {
    loading.value = false
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
      active: modalForm.value.active,
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
    modalError.value = err?.message || 'Failed to save item.'
  } finally {
    saving.value = false
  }
}

// Delete state
const showDeleteConfirm = ref(false)
const deletingItem = ref(null)
const deleting = ref(false)

function handleDelete(item) {
  deletingItem.value = item
  showDeleteConfirm.value = true
}

async function confirmDelete() {
  if (!deletingItem.value) return
  deleting.value = true
  try {
    await deleteItem(deletingItem.value._id)
    showDeleteConfirm.value = false
    showToast(t('admin.itemDeleted'))
    await loadItems()
  } catch { /* silent */ } finally {
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
