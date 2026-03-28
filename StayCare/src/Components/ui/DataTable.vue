<template>
  <div class="bg-white rounded-xl shadow-sm overflow-hidden">
    <!-- Optional title -->
    <div v-if="title" class="px-4 sm:px-5 py-3 sm:py-4 border-b border-gray-100">
      <h3 class="text-sm sm:text-base font-semibold text-gray-800">{{ title }}</h3>
    </div>

    <!-- Empty state -->
    <div v-if="!resolvedRows.length" class="px-5 py-10 text-center">
      <p class="text-gray-400 text-sm">{{ emptyText || $t('common.noData') }}</p>
    </div>

    <!-- Table -->
    <div v-else class="overflow-x-auto">
      <table
        class="w-full text-xs sm:text-sm text-left"
        :style="minWidth ? `min-width: ${minWidth}` : 'min-width: 480px'"
      >
        <thead class="bg-gray-50 text-gray-500 uppercase text-xs">
          <tr>
            <th
              v-for="col in resolvedColumns"
              :key="col.key"
              class="px-3 sm:px-5 py-2.5 sm:py-3 font-medium whitespace-nowrap"
              :class="col.thClass"
            >
              {{ col.label }}
            </th>
            <!-- Actions column header (empty, only when clickable) -->
            <th v-if="clickable" class="px-3 sm:px-5 py-2.5 sm:py-3 w-px"></th>
          </tr>
        </thead>

        <tbody class="divide-y divide-gray-100">
          <tr
            v-for="row in resolvedRows"
            :key="rowKey ? row[rowKey] : undefined"
            class="hover:bg-gray-50 transition-colors"
            :class="clickable ? 'cursor-pointer group' : ''"
            :title="clickable ? (clickTitle || $t('common.viewDetailsTitle')) : undefined"
            @click="clickable ? $emit('row-click', row) : undefined"
          >
            <td
              v-for="col in resolvedColumns"
              :key="col.key"
              class="px-3 sm:px-5 py-2.5 sm:py-3"
              :class="col.tdClass"
            >
              <!-- Named slot #cell-{key} receives { item, value } -->
              <slot :name="`cell-${col.key}`" :item="row" :value="row[col.key]">
                <!-- Fallback: StatusBadge for badge columns, plain text otherwise -->
                <StatusBadge v-if="col.badge" :status="row[col.key]" />
                <span v-else>{{ row[col.key] ?? '—' }}</span>
              </slot>
            </td>

            <!-- Actions cell -->
            <td v-if="clickable" class="px-3 sm:px-5 py-2.5 sm:py-3 text-right">
              <span class="inline-flex items-center gap-1 text-xs text-gray-400 group-hover:text-gray-600 transition-colors font-medium whitespace-nowrap">
                {{ actionLabel || $t('common.viewDetails') }}
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                </svg>
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import StatusBadge from './StatusBadge.vue'

const props = defineProps({
  /** Optional card title rendered above the table */
  title: { type: String, default: '' },

  /**
   * Column definitions.
   * Each entry: { key, label, badge?, thClass?, tdClass? }
   * Alias: `headers` (either prop name works)
   */
  columns: { type: Array, default: null },
  headers: { type: Array, default: null },

  /**
   * Array of data objects.
   * Alias: `items` (either prop name works)
   */
  rows: { type: Array, default: null },
  items: { type: Array, default: null },

  /** Field used as :key per row (e.g. 'id', '_id') */
  rowKey: { type: String, default: 'id' },

  /**
   * When true: rows get hover/cursor style and a "View details →" action column.
   * Emits 'row-click' with the row object on click.
   */
  clickable: { type: Boolean, default: false },

  /** Native tooltip shown on the row when clickable */
  clickTitle: { type: String, default: '' },

  /** Override the action label text (defaults to i18n 'common.viewDetails') */
  actionLabel: { type: String, default: '' },

  /** Text shown when the list is empty (defaults to i18n 'common.noData') */
  emptyText: { type: String, default: '' },

  /** Sets a CSS min-width on the inner <table> for horizontal scroll (e.g. '800px') */
  minWidth: { type: String, default: '' },
})

defineEmits(['row-click'])

// Support both prop name aliases
const resolvedColumns = computed(() => props.headers ?? props.columns ?? [])
const resolvedRows = computed(() => props.items ?? props.rows ?? [])
</script>
