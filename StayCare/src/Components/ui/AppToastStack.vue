<template>
  <div class="fixed right-4 bottom-4 z-[120] flex flex-col gap-2 pointer-events-none">
    <div
      v-for="toast in ui.toasts"
      :key="toast.id"
      class="pointer-events-auto min-w-[240px] max-w-[320px] rounded-lg px-4 py-3 text-sm shadow-lg border"
      :class="toast.type === 'success'
        ? 'bg-green-600 text-white border-green-700'
        : 'bg-red-600 text-white border-red-700'"
    >
      <div class="flex items-start justify-between gap-3">
        <p class="leading-5">{{ toast.message }}</p>
        <button
          type="button"
          class="text-white/80 hover:text-white text-base leading-none"
          @click="ui.dismissToast(toast.id)"
        >
          &times;
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useUiStore } from '../../stores/ui.js'

const ui = useUiStore()
</script>
