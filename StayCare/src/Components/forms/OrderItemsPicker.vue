<template>
  <div class="bg-white rounded-xl shadow-sm p-5 space-y-4">
    <div class="flex items-center justify-between flex-wrap gap-2">
      <h3 class="text-sm font-semibold text-gray-700 uppercase tracking-wide">{{ t('admin.estimatedItems') }}</h3>
      <div class="flex items-center gap-3">
        <ItemSortSelector v-model="itemSortOrder" />
        <span v-if="!loadingItems && laundryItems.length" class="text-xs text-gray-400 font-medium">
          {{ laundryItems.length }} {{ t('common.items') }}
        </span>
      </div>
    </div>
    <p class="text-xs text-gray-400">{{ t('admin.itemQuantityHint') }}</p>

    <div v-if="loadingItems" class="text-sm text-gray-400 py-2">{{ t('common.loading') }}</div>

    <div v-else-if="!laundryItems.length" class="text-sm text-gray-400 py-2">
      {{ t('common.noData') }}
    </div>

    <div v-else class="divide-y divide-gray-100">
      <div v-for="item in sortedLaundryItems" :key="item.code" class="flex items-center justify-between py-3 gap-4">
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium text-gray-800">
            {{ item.name }} <span class="text-xs text-gray-400">({{ item.code }})</span>
          </p>
          <p class="text-xs text-gray-400">&euro;{{ item.unitPrice.toFixed(2) }} / unit</p>
        </div>
        <input
          :value="modelValue[item.code] || 0"
          @input="onQtyInput(item.code, $event.target.value)"
          type="number"
          min="0"
          class="w-20 border border-gray-200 rounded-lg px-2 py-1.5 text-sm text-center focus:ring-2 focus:ring-brand-400 focus:border-transparent outline-none"
          placeholder="0"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { fetchAllItems, mapItemForCatalog } from '../../api/items'
import ItemSortSelector from '../ui/ItemSortSelector.vue'
import { useItemSorter } from '../../composables/useItemSorter'

const props = defineProps({
  modelValue: {
    type: Object,
    default: () => ({}),
  },
})

const emit = defineEmits(['update:modelValue', 'catalogLoaded'])

const { t } = useI18n()
const laundryItems = ref([])
const loadingItems = ref(false)
const { sortOrder: itemSortOrder, sortedItems: sortedLaundryItems } = useItemSorter(laundryItems)
const itemCatalogByCode = reactive({})

function onQtyInput(code, rawVal) {
  const qty = Math.max(0, parseInt(rawVal, 10) || 0)
  const updated = { ...props.modelValue, [code]: qty }
  emit('update:modelValue', updated)
}

async function loadItems() {
  loadingItems.value = true
  try {
    const rawItems = await fetchAllItems().catch(() => [])
    laundryItems.value = (rawItems ?? []).map(mapItemForCatalog)
    const initialQtys = { ...props.modelValue }
    
    laundryItems.value.forEach((item) => {
      itemCatalogByCode[item.code] = item
      if (initialQtys[item.code] === undefined) {
        initialQtys[item.code] = 0
      }
    })

    emit('update:modelValue', initialQtys)
    emit('catalogLoaded', itemCatalogByCode)
  } finally {
    loadingItems.value = false
  }
}

onMounted(loadItems)
</script>
