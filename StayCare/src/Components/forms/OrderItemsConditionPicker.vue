<template>
  <div class="bg-white rounded-xl shadow-sm p-5 space-y-4">
    <!-- Header & Summary counters -->
    <div class="flex items-center justify-between flex-wrap gap-2">
      <div>
        <h3 class="text-sm font-semibold text-gray-700 uppercase tracking-wide">
          {{ title || t('facility.itemCheckIn') }}
        </h3>
        <p v-if="subtitle" class="text-xs text-gray-400 mt-0.5">
          {{ subtitle }}
        </p>
      </div>

      <div class="flex items-center gap-2 flex-wrap text-xs font-medium">
        <span class="px-2.5 py-1 rounded-full bg-gray-100 text-gray-700">
          {{ totalItemsCount }} {{ t('common.items') }}
        </span>
        <span class="px-2.5 py-1 rounded-full bg-green-50 text-green-700 border border-green-200">
          {{ totalGoodCount }} {{ t('orderDetail.qtyGood') }}
        </span>
        <span v-if="totalBadCount > 0" class="px-2.5 py-1 rounded-full bg-red-50 text-red-700 border border-red-200">
          {{ totalBadCount }} {{ t('orderDetail.qtyBad') }}
        </span>
        <span v-if="totalStainedCount > 0" class="px-2.5 py-1 rounded-full bg-orange-50 text-orange-700 border border-orange-200">
          {{ totalStainedCount }} {{ t('orderDetail.qtyStained') }}
        </span>
      </div>
    </div>

    <!-- Items list -->
    <div v-if="!itemsList.length" class="text-sm text-gray-400 py-4 text-center border border-dashed border-gray-200 rounded-lg">
      {{ t('facility.noCheckInItems') }}
    </div>

    <div v-else class="divide-y divide-gray-100">
      <div
        v-for="(item, idx) in itemsList"
        :key="`${item.itemId || item.code}-${idx}`"
        class="py-3.5 space-y-2.5"
      >
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0">
            <p class="text-sm font-medium text-gray-800">
              {{ item.name }}
              <span class="text-xs text-gray-400 font-mono">({{ item.code }})</span>
            </p>
            <p class="text-xs text-gray-500 mt-0.5">
              <span v-if="hasExpectedQty(item)" class="text-gray-400 mr-2">
                {{ t('facility.expected') }}: {{ expectedQtyMap[item.code] }} &middot;
              </span>
              <span class="font-medium text-gray-700">{{ t('facility.totalReceived') }}: {{ getItemTotal(item) }}</span>
              <span v-if="showPrices && item.unitPrice" class="text-gray-400 ml-2">
                &middot; {{ formatCurrency(item.unitPrice) }} / ud
              </span>
            </p>
          </div>

          <button
            v-if="allowRemove"
            type="button"
            class="text-gray-400 hover:text-red-500 transition p-1 rounded hover:bg-red-50"
            :title="t('facility.remove')"
            @click="removeItem(idx)"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>

        <div class="grid grid-cols-3 gap-2">
          <div>
            <label class="block text-[11px] font-medium text-gray-600 mb-1 text-center">
              {{ t('orderDetail.qtyGood') }}
            </label>
            <input
              :value="item.qtyGood"
              @input="updateItemCondition(idx, 'qtyGood', $event.target.value)"
              type="number"
              min="0"
              class="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm text-center focus:ring-2 focus:ring-brand-400 focus:border-transparent outline-none"
            />
          </div>
          <div>
            <label class="block text-[11px] font-medium text-gray-600 mb-1 text-center">
              {{ t('orderDetail.qtyBad') }}
            </label>
            <input
              :value="item.qtyBad"
              @input="updateItemCondition(idx, 'qtyBad', $event.target.value)"
              type="number"
              min="0"
              class="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm text-center focus:ring-2 focus:ring-brand-400 focus:border-transparent outline-none"
            />
          </div>
          <div>
            <label class="block text-[11px] font-medium text-gray-600 mb-1 text-center">
              {{ t('orderDetail.qtyStained') }}
            </label>
            <input
              :value="item.qtyStained"
              @input="updateItemCondition(idx, 'qtyStained', $event.target.value)"
              type="number"
              min="0"
              class="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm text-center focus:ring-2 focus:ring-brand-400 focus:border-transparent outline-none"
            />
          </div>
        </div>

        <!-- Discrepancy indicator if expectedQtyMap is provided -->
        <div v-if="hasExpectedQty(item) && getItemTotal(item) !== expectedQtyMap[item.code]" class="flex items-center gap-2">
          <span class="text-xs text-orange-500 font-medium">
            {{ t('facilityProcessing.qualityCheckQuantityMismatch') }} ({{ getItemTotal(item) }}/{{ expectedQtyMap[item.code] }})
          </span>
        </div>
      </div>
    </div>

    <!-- Add Item from Catalog Section -->
    <div v-if="allowAdd" class="pt-3 border-t border-gray-100 flex items-center gap-2 flex-wrap">
      <div class="flex-1 min-w-[200px]">
        <select
          v-model="selectedCatalogCode"
          class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-400 focus:border-transparent outline-none bg-white"
        >
          <option value="">-- {{ t('facility.selectItem') }} --</option>
          <option
            v-for="catItem in availableCatalogItems"
            :key="catItem.code"
            :value="catItem.code"
          >
            {{ catItem.name }} ({{ catItem.code }})<template v-if="showPrices"> — {{ formatCurrency(catItem.unitPrice) }}</template>
          </option>
        </select>
      </div>

      <AppButton
        type="button"
        variant="secondary"
        size="sm"
        :disabled="!selectedCatalogCode"
        @click="addItemFromCatalog"
      >
        <svg class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        {{ t('facility.addItem') }}
      </AppButton>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import AppButton from '../ui/AppButton.vue'
import { fetchAllItems, mapItemForCatalog } from '../../api/items'
import { formatCurrency } from '@/utils/pricing'

const props = defineProps({
  modelValue: {
    type: Array,
    default: () => [],
  },
  title: {
    type: String,
    default: '',
  },
  subtitle: {
    type: String,
    default: '',
  },
  allowAdd: {
    type: Boolean,
    default: true,
  },
  allowRemove: {
    type: Boolean,
    default: true,
  },
  showPrices: {
    type: Boolean,
    default: true,
  },
  expectedQtyMap: {
    type: Object,
    default: () => ({}),
  },
})

const emit = defineEmits(['update:modelValue'])

const { t } = useI18n()

const catalog = ref([])
const loadingCatalog = ref(false)
const selectedCatalogCode = ref('')

const itemsList = computed(() => props.modelValue || [])

const availableCatalogItems = computed(() => {
  return catalog.value.filter(catItem => catItem.active !== false)
})

function hasExpectedQty(item) {
  return props.expectedQtyMap && item?.code && props.expectedQtyMap[item.code] !== undefined
}

function getItemTotal(item) {
  const good = Number(item.qtyGood) || 0
  const bad = Number(item.qtyBad) || 0
  const stained = Number(item.qtyStained) || 0
  return good + bad + stained
}

const totalGoodCount = computed(() => {
  return itemsList.value.reduce((sum, item) => sum + (Number(item.qtyGood) || 0), 0)
})

const totalBadCount = computed(() => {
  return itemsList.value.reduce((sum, item) => sum + (Number(item.qtyBad) || 0), 0)
})

const totalStainedCount = computed(() => {
  return itemsList.value.reduce((sum, item) => sum + (Number(item.qtyStained) || 0), 0)
})

const totalItemsCount = computed(() => {
  return totalGoodCount.value + totalBadCount.value + totalStainedCount.value
})

function updateItemCondition(index, field, value) {
  const parsed = Math.max(0, parseInt(value, 10) || 0)
  const nextList = itemsList.value.map((item, idx) => {
    if (idx === index) {
      return { ...item, [field]: parsed }
    }
    return item
  })
  emit('update:modelValue', nextList)
}

function removeItem(index) {
  const nextList = itemsList.value.filter((_, idx) => idx !== index)
  emit('update:modelValue', nextList)
}

function addItemFromCatalog() {
  if (!selectedCatalogCode.value) return
  const catItem = catalog.value.find(i => i.code === selectedCatalogCode.value)
  if (!catItem) return

  const existingIdx = itemsList.value.findIndex(i => i.code === catItem.code)
  if (existingIdx >= 0) {
    const nextList = itemsList.value.map((item, idx) => {
      if (idx === existingIdx) {
        return { ...item, qtyGood: (Number(item.qtyGood) || 0) + 1 }
      }
      return item
    })
    emit('update:modelValue', nextList)
  } else {
    const newItem = {
      itemId: catItem.id ?? catItem._id,
      code: catItem.code,
      name: catItem.name,
      unitPrice: Number(catItem.unitPrice) || 0,
      qtyGood: 1,
      qtyBad: 0,
      qtyStained: 0,
    }
    emit('update:modelValue', [...itemsList.value, newItem])
  }

  selectedCatalogCode.value = ''
}

async function loadCatalog() {
  if (!props.allowAdd) return
  loadingCatalog.value = true
  try {
    const raw = await fetchAllItems(true).catch(() => [])
    catalog.value = (raw ?? []).map(mapItemForCatalog)
  } finally {
    loadingCatalog.value = false
  }
}

onMounted(loadCatalog)
</script>
