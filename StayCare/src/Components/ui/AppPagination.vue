<template>
  <div
    v-if="totalPages > 1 || (totalItems !== null && totalItems > 0)"
    class="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2"
  >
    <p v-if="totalItems !== null" class="text-sm text-gray-500 font-medium">
      {{ $t('common.totalItems', { count: totalItems }) }}
    </p>
    <div v-else></div>

    <div v-if="totalPages > 1" class="flex items-center gap-1.5 flex-wrap justify-center">
      <!-- Previous Button -->
      <button
        type="button"
        :disabled="disabled || currentPage === 1"
        class="px-3 py-1.5 border border-gray-200 rounded-lg text-xs sm:text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        @click="changePage(currentPage - 1)"
      >
        {{ $t('common.previous') }}
      </button>

      <!-- Page Numbers -->
      <template v-for="(p, index) in visiblePages" :key="index">
        <span
          v-if="p === '...'"
          class="px-2 py-1.5 text-xs sm:text-sm text-gray-400 select-none"
        >
          ...
        </span>
        <button
          v-else
          type="button"
          :disabled="disabled"
          class="min-w-8 sm:min-w-9 h-8 sm:h-9 px-2.5 py-1 border rounded-lg text-xs sm:text-sm font-medium transition-colors"
          :class="
            p === currentPage
              ? 'bg-brand-700 border-brand-700 text-white font-semibold shadow-sm'
              : 'border-gray-200 text-gray-600 hover:bg-gray-50'
          "
          @click="changePage(p)"
        >
          {{ p }}
        </button>
      </template>

      <!-- Next Button -->
      <button
        type="button"
        :disabled="disabled || currentPage === totalPages"
        class="px-3 py-1.5 border border-gray-200 rounded-lg text-xs sm:text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        @click="changePage(currentPage + 1)"
      >
        {{ $t('common.next') }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  currentPage: {
    type: Number,
    required: true,
    default: 1,
  },
  totalPages: {
    type: Number,
    required: true,
    default: 1,
  },
  totalItems: {
    type: Number,
    default: null,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['page-change'])

function changePage(page) {
  if (props.disabled || typeof page !== 'number' || page < 1 || page > props.totalPages || page === props.currentPage) {
    return
  }
  emit('page-change', page)
}

const visiblePages = computed(() => {
  const total = props.totalPages
  const current = props.currentPage

  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1)
  }

  if (current <= 4) {
    return [1, 2, 3, 4, 5, '...', total]
  }

  if (current >= total - 3) {
    return [1, '...', total - 4, total - 3, total - 2, total - 1, total]
  }

  return [1, '...', current - 1, current, current + 1, '...', total]
})
</script>
