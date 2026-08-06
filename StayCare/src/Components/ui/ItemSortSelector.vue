<template>
  <div class="flex items-center gap-1.5">
    <label v-if="showLabel" class="text-xs text-gray-400 font-medium">{{ t('common.sortBy') }}:</label>
    <select
      :value="modelValue"
      @change="$emit('update:modelValue', $event.target.value)"
      class="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white text-gray-700 font-medium focus:outline-none focus:ring-1 focus:ring-brand-400"
    >
      <option value="categoryAsc">{{ t('common.categoryAsc') }}</option>
      <option value="categoryDesc">{{ t('common.categoryDesc') }}</option>
      <option value="nameAsc">{{ t('common.nameAsc') }}</option>
      <option value="nameDesc">{{ t('common.nameDesc') }}</option>
    </select>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n'

defineProps({
  modelValue: {
    type: String,
    default: 'categoryAsc',
  },
  showLabel: {
    type: Boolean,
    default: true,
  },
})

defineEmits(['update:modelValue'])

const { t } = useI18n()
</script>
