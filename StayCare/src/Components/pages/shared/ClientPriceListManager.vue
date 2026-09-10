<template>
  <div class="bg-white rounded-xl shadow-sm p-5 space-y-4">
    <!-- Header -->
    <div class="flex items-center justify-between gap-3 flex-wrap">
      <h3 class="text-sm font-semibold text-gray-700 uppercase tracking-wide">
        {{ $t('priceList.title', { count: customPrices.length }) }}
      </h3>
      <button
        v-if="!readonly"
        @click="toggleAddForm"
        class="text-xs font-semibold text-brand-700 hover:underline"
      >
        {{ showAddForm ? $t('common.cancel') : $t('priceList.addCta') }}
      </button>
    </div>

    <!-- Loading state -->
    <LoadingPanel v-if="loading" :label="$t('common.loading')" />

    <template v-if="!loading">
      <!-- Add form -->
      <div
        v-if="showAddForm && !readonly"
        class="border border-gray-200 rounded-lg p-4 space-y-3"
      >
        <!-- Item selector -->
        <div>
          <label class="block text-xs text-gray-500 mb-1">{{ $t('priceList.item') }}</label>
          <div class="relative">
            <input
              v-model="itemSearch"
              type="text"
              :placeholder="$t('priceList.searchItem')"
              class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-400 focus:border-transparent outline-none"
              @focus="dropdownOpen = true"
              @blur="handleBlur"
            />
            <ul
              v-if="dropdownOpen && filteredCatalogItems.length > 0"
              class="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto"
            >
              <li
                v-for="item in filteredCatalogItems"
                :key="item.id"
                @mousedown.prevent="selectItem(item)"
                class="px-3 py-2 text-sm cursor-pointer hover:bg-brand-50 flex items-center justify-between"
              >
                <span>{{ item.name }}</span>
                <span class="text-xs text-gray-400">{{ item.item_code }} — €{{ Number(item.base_price).toFixed(2) }}</span>
              </li>
            </ul>
            <p
              v-else-if="dropdownOpen && itemSearch.length > 0 && filteredCatalogItems.length === 0"
              class="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg px-3 py-2 text-sm text-gray-400"
            >
              {{ $t('priceList.noItemsAvailable') }}
            </p>
          </div>
          <p v-if="selectedItem" class="mt-1 text-xs text-gray-500">
            {{ $t('priceList.basePrice') }}: <span class="font-medium">€{{ Number(selectedItem.base_price).toFixed(2) }}</span>
          </p>
        </div>

        <!-- Price input -->
        <div>
          <label class="block text-xs text-gray-500 mb-1">{{ $t('priceList.priceLabel') }}</label>
          <input
            v-model.number="newPrice"
            type="number"
            min="0"
            step="0.01"
            class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-400 focus:border-transparent outline-none"
          />
        </div>

        <!-- Error -->
        <p v-if="formError" class="text-xs text-red-500">{{ formError }}</p>

        <!-- Actions -->
        <div class="flex gap-2">
          <AppButton type="button" size="sm" :loading="saving" @click="saveNewPrice">
            {{ saving ? $t('priceList.saving') : $t('priceList.save') }}
          </AppButton>
          <AppButton type="button" size="sm" variant="secondary" @click="cancelAddForm">
            {{ $t('common.cancel') }}
          </AppButton>
        </div>
      </div>

      <!-- Prices table -->
      <div v-if="customPrices.length" class="overflow-x-auto">
        <table class="w-full text-sm text-left">
          <thead class="bg-gray-50 text-gray-500 uppercase text-xs">
            <tr>
              <th class="px-4 py-2 font-medium">{{ $t('priceList.item') }}</th>
              <th class="px-4 py-2 font-medium text-right">{{ $t('priceList.customPrice') }}</th>
              <th v-if="!readonly" class="px-4 py-2 font-medium text-right">{{ $t('priceList.actions') }}</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-for="entry in customPrices" :key="entry.item_id" class="hover:bg-gray-50">
              <td class="px-4 py-2 font-medium text-gray-800">{{ entry.item_name }}</td>
              <td class="px-4 py-2 text-right">
                <!-- Inline edit mode -->
                <template v-if="editingItemId === entry.item_id">
                  <input
                    v-model.number="editPrice"
                    type="number"
                    min="0"
                    step="0.01"
                    class="w-24 border border-gray-300 rounded px-2 py-1 text-sm text-right focus:ring-2 focus:ring-brand-400 focus:border-transparent outline-none"
                    @keyup.enter="saveEditPrice(entry.item_id)"
                    @keyup.escape="cancelEdit"
                  />
                </template>
                <template v-else>
                  <span class="font-semibold text-brand-700">€{{ Number(entry.price).toFixed(2) }}</span>
                </template>
              </td>
              <td v-if="!readonly" class="px-4 py-2 text-right">
                <template v-if="editingItemId === entry.item_id">
                  <button
                    class="text-xs text-brand-700 hover:underline mr-2"
                    :disabled="saving"
                    @click="saveEditPrice(entry.item_id)"
                  >
                    {{ saving ? $t('priceList.saving') : $t('priceList.save') }}
                  </button>
                  <button class="text-xs text-gray-500 hover:underline" @click="cancelEdit">
                    {{ $t('common.cancel') }}
                  </button>
                </template>
                <template v-else>
                  <button
                    class="text-xs text-brand-700 hover:underline mr-2"
                    @click="startEdit(entry)"
                  >
                    {{ $t('priceList.edit') }}
                  </button>
                  <button
                    class="text-xs text-red-500 hover:text-red-700"
                    @click="removePrice(entry.item_id)"
                  >
                    {{ $t('admin.delete') }}
                  </button>
                </template>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Empty state -->
      <p v-else-if="!showAddForm" class="text-xs text-gray-400">
        {{ $t('priceList.empty') }}
      </p>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useUiStore } from '../../../stores/ui.js'
import {
  getClientPriceList,
  upsertClientPriceItems,
  deleteClientPriceItems,
} from '../../../api/priceList'
import { fetchAllItems } from '../../../api/items'
import { formatApiErrorMessage } from '../../../utils/errors'
import AppButton from '../../ui/AppButton.vue'
import LoadingPanel from '../../ui/LoadingPanel.vue'

const { t } = useI18n()
const ui = useUiStore()

const props = defineProps({
  clientId: {
    type: String,
    required: true,
  },
  readonly: {
    type: Boolean,
    default: false,
  },
})

// State
const loading = ref(true)
const saving = ref(false)
const customPrices = ref([])
const catalogItems = ref([])

// Add form
const showAddForm = ref(false)
const itemSearch = ref('')
const selectedItem = ref(null)
const newPrice = ref(0)
const formError = ref('')
const dropdownOpen = ref(false)

// Inline edit
const editingItemId = ref(null)
const editPrice = ref(0)

// Computed: catalog items not yet in the custom price list, filtered by search
const filteredCatalogItems = computed(() => {
  const alreadyAdded = new Set(customPrices.value.map((p) => p.item_id))
  const query = itemSearch.value.trim().toLowerCase()
  return catalogItems.value.filter((item) => {
    if (alreadyAdded.has(item.id)) return false
    if (!query) return true
    return (
      item.name.toLowerCase().includes(query) ||
      item.item_code.toLowerCase().includes(query)
    )
  })
})

// Load data
async function loadPriceList() {
  if (!props.clientId) {
    customPrices.value = []
    return
  }
  try {
    const data = await getClientPriceList(props.clientId)
    customPrices.value = data?.items ?? []
  } catch {
    customPrices.value = []
  }
}

async function loadCatalog() {
  try {
    const items = await fetchAllItems(true) // activeOnly = true
    catalogItems.value = items
  } catch {
    catalogItems.value = []
  }
}

// Form handlers
function toggleAddForm() {
  if (showAddForm.value) {
    cancelAddForm()
    return
  }
  showAddForm.value = true
}

function cancelAddForm() {
  showAddForm.value = false
  formError.value = ''
  itemSearch.value = ''
  selectedItem.value = null
  newPrice.value = 0
  dropdownOpen.value = false
}

function selectItem(item) {
  selectedItem.value = item
  itemSearch.value = item.name
  newPrice.value = Number(item.base_price)
  dropdownOpen.value = false
}

function handleBlur() {
  // Small delay so mousedown on dropdown items fires first
  setTimeout(() => {
    dropdownOpen.value = false
  }, 150)
}

async function saveNewPrice() {
  formError.value = ''

  if (!selectedItem.value) {
    formError.value = t('priceList.itemRequired')
    return
  }
  if (newPrice.value === null || newPrice.value === undefined || newPrice.value < 0) {
    formError.value = t('priceList.priceInvalid')
    return
  }

  saving.value = true
  try {
    await upsertClientPriceItems(props.clientId, [
      { item_id: selectedItem.value.id, price: newPrice.value },
    ])
    await loadPriceList()
    cancelAddForm()
  } catch (err) {
    formError.value = formatApiErrorMessage(err, t('priceList.addFailed'), t)
  } finally {
    saving.value = false
  }
}

// Inline edit handlers
function startEdit(entry) {
  editingItemId.value = entry.item_id
  editPrice.value = Number(entry.price)
}

function cancelEdit() {
  editingItemId.value = null
  editPrice.value = 0
}

async function saveEditPrice(itemId) {
  if (editPrice.value < 0) {
    ui.showError(t('priceList.priceInvalid'))
    return
  }
  saving.value = true
  try {
    await upsertClientPriceItems(props.clientId, [
      { item_id: itemId, price: editPrice.value },
    ])
    await loadPriceList()
    cancelEdit()
  } catch (err) {
    ui.showError(formatApiErrorMessage(err, t('priceList.saveFailed'), t))
  } finally {
    saving.value = false
  }
}

async function removePrice(itemId) {
  if (!confirm(t('priceList.deleteConfirm'))) return
  try {
    await deleteClientPriceItems(props.clientId, [itemId])
    await loadPriceList()
  } catch (err) {
    ui.showError(formatApiErrorMessage(err, t('priceList.deleteFailed'), t))
  }
}

watch(() => props.clientId, async () => {
  loading.value = true
  await loadPriceList()
  loading.value = false
})

onMounted(async () => {
  await Promise.all([loadPriceList(), loadCatalog()])
  loading.value = false
})
</script>
