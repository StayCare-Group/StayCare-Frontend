<template>
  <div class="bg-white rounded-xl shadow-sm p-5">
    <h3 v-if="title" class="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
      {{ title }}
    </h3>
    <div :class="['space-y-2 text-sm', alignRight ? 'max-w-xs ml-auto' : '']">
      <div class="flex justify-between">
        <span class="text-gray-500">{{ subtotalLabel || $t('admin.subtotal') }}</span>
        <span class="font-medium text-gray-800">{{ formatCurrency(subtotal) }}</span>
      </div>

      <div v-if="surcharge && surcharge > 0" class="flex justify-between">
        <span class="text-gray-500">{{ surchargeLabel || $t('admin.expressSurcharge') }}</span>
        <span class="font-medium text-gray-800">{{ formatCurrency(surcharge) }}</span>
      </div>

      <div class="flex justify-between">
        <span class="text-gray-500">{{ vatLabel || $t('admin.vatPercent') }}</span>
        <span class="font-medium text-gray-800">{{ formatCurrency(vatAmount) }}</span>
      </div>

      <div class="flex justify-between border-t border-gray-200 pt-2 mt-2 text-base">
        <span class="font-bold text-gray-800">{{ totalLabel || $t('admin.grandTotal') }}</span>
        <span class="font-bold text-gray-800">{{ formatCurrency(total) }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { formatCurrency } from '@/utils/pricing'

defineProps({
  title: {
    type: String,
    default: '',
  },
  subtotal: {
    type: Number,
    default: 0,
  },
  surcharge: {
    type: Number,
    default: 0,
  },
  surchargeLabel: {
    type: String,
    default: '',
  },
  vatAmount: {
    type: Number,
    default: 0,
  },
  total: {
    type: Number,
    default: 0,
  },
  subtotalLabel: {
    type: String,
    default: '',
  },
  vatLabel: {
    type: String,
    default: '',
  },
  totalLabel: {
    type: String,
    default: '',
  },
  alignRight: {
    type: Boolean,
    default: false,
  },
})
</script>
