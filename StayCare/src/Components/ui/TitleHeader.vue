<template>
  <div class="flex items-center gap-3">
    <button
      v-if="onBack"
      type="button"
      class="text-brand-700 hover:text-gray-400"
      @click="onBack"
    >
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
      </svg>
    </button>
    <h2 class="text-lg font-semibold text-brand-700">{{ title }}</h2>
    <!-- Slot para extras: StatusBadge, botones adicionales, etc. -->
    <slot />
  </div>
</template>

<script setup>
defineProps({
  /** Texto del título de la página */
  title: { type: String, required: true },
  /** Función a ejecutar al pulsar el botón de volver. Si no se pasa, el botón no se renderiza. */
  onBack: { type: Function, default: null },
})
</script>
