<template>
  <div class="bg-white rounded-xl shadow-sm p-5 space-y-3">
    <!-- Header slot or Title -->
    <div
      v-if="$slots.header || title || $slots['header-extra']"
      class="flex items-center justify-between gap-2"
    >
      <slot name="header">
        <h3
          v-if="title"
          class="text-sm font-semibold text-gray-700 uppercase tracking-wide"
        >
          {{ title }}
        </h3>
      </slot>
      <slot name="header-extra" />
    </div>

    <!-- Items Grid -->
    <div v-if="visibleItems.length" :class="gridClasses">
      <div
        v-for="(item, index) in visibleItems"
        :key="item.key || index"
        :class="[item.fullWidth ? 'col-span-full' : '', item.class || '']"
      >
        <span class="text-gray-400 block text-xs sm:text-sm">
          {{ item.label }}
        </span>
        <slot
          :name="`item-${item.key}`"
          :item="item"
          :value="item.value"
        >
          <slot
            name="item"
            :item="item"
            :value="item.value"
          >
            <p class="font-medium text-gray-800 text-sm break-words">
              {{ formatValue(item.value, item.fallback) }}
            </p>
          </slot>
        </slot>
      </div>
    </div>

    <!-- Footer slot (for notes, actions, etc.) -->
    <div
      v-if="$slots.footer"
      class="pt-2 border-t border-gray-100"
    >
      <slot name="footer" />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  title: {
    type: String,
    default: '',
  },
  items: {
    type: Array,
    default: () => [],
  },
  columns: {
    type: [Number, String],
    default: 2,
  },
  fallbackValue: {
    type: String,
    default: '—',
  },
})

const visibleItems = computed(() => {
  return props.items.filter(
    (item) => item && (item.show === undefined || item.show === true)
  )
})

const gridClasses = computed(() => {
  const cols = Number(props.columns)
  if (cols === 1) return 'grid grid-cols-1 gap-3 text-sm'
  if (cols === 3) return 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm'
  if (cols === 4) return 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm'
  return 'grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm'
})

function formatValue(value, itemFallback) {
  if (value === null || value === undefined || value === '') {
    return itemFallback ?? props.fallbackValue
  }
  return value
}
</script>
