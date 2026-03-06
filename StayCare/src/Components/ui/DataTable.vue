<template>
  <div class="bg-white rounded-xl shadow-sm overflow-hidden">
    <div v-if="title" class="px-4 sm:px-5 py-3 sm:py-4 border-b border-gray-100">
      <h3 class="text-sm sm:text-base font-semibold text-gray-800">{{ title }}</h3>
    </div>
    <div v-if="!rows || rows.length === 0" class="px-5 py-10 text-center">
      <p class="text-gray-400 text-sm">{{ emptyText || $t('common.noData') }}</p>
    </div>
    <div v-else class="overflow-x-auto">
      <table class="w-full text-xs sm:text-sm text-left min-w-[480px]">
        <thead class="bg-gray-50 text-gray-500 uppercase text-xs">
          <tr>
            <th v-for="col in columns" :key="col.key" class="px-3 sm:px-5 py-2.5 sm:py-3 font-medium whitespace-nowrap">
              {{ col.label }}
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100">
          <tr
            v-for="(row, i) in rows"
            :key="i"
            class="hover:bg-gray-50 transition-colors"
            :class="{ 'cursor-pointer': clickable }"
            @click="clickable ? $emit('row-click', row) : null"
          >
            <td v-for="col in columns" :key="col.key" class="px-3 sm:px-5 py-2.5 sm:py-3 text-gray-700 whitespace-nowrap">
              <StatusBadge v-if="col.badge" :status="row[col.key]" />
              <span v-else>{{ row[col.key] }}</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import StatusBadge from './StatusBadge.vue'

defineProps({
  title: String,
  columns: Array,   // [{ key: 'id', label: 'Order ID', badge?: true }]
  rows: Array,
  clickable: { type: Boolean, default: false },
  emptyText: String,
})

defineEmits(['row-click'])
</script>
