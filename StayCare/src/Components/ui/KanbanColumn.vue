<template>
  <div class="bg-gray-50 rounded-xl p-3 min-w-[240px] w-[240px] shrink-0 lg:flex-1 lg:w-auto lg:min-w-[180px]">
    <h4 class="text-xs sm:text-sm font-semibold text-gray-600 mb-3 px-1">
      {{ title }}
      <span class="ml-1 text-xs text-gray-400">({{ cards.length }})</span>
    </h4>
    <div class="space-y-2">
      <slot :cards="cards">
        <div
          v-for="card in cards"
          :key="card.id"
          class="bg-white rounded-lg p-3 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
        >
          <div class="flex items-center justify-between mb-1">
            <span class="text-xs font-bold text-gray-500">{{ card.id }}</span>
            <StatusBadge :status="card.priority" />
          </div>
          <p class="text-sm font-medium text-gray-800">{{ card.client }}</p>
          <p class="text-xs text-gray-500 mt-1">{{ card.bags }} bags</p>
        </div>
      </slot>
    </div>
  </div>
</template>

<script setup>
import StatusBadge from './StatusBadge.vue'

defineProps({
  title: String,
  cards: { type: Array, default: () => [] },
})
</script>
