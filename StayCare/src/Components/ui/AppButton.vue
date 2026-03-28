<template>
  <button
    v-bind="$attrs"
    :type="type"
    :disabled="disabled || loading"
    :class="[baseClasses, variantClasses, sizeClasses, 'disabled:opacity-50 disabled:cursor-not-allowed transition']"
  >
    <span v-if="loading" class="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2 align-middle"></span>
    <slot />
  </button>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  /** button | submit | reset */
  type: { type: String, default: 'button' },

  /**
   * primary  → brand-700→brand-800 gradient (default, matches auth button)
   * secondary → light outline brand
   * danger   → red
   * ghost    → transparent, brand-700 text
   */
  variant: { type: String, default: 'primary' },

  /** sm | md | lg */
  size: { type: String, default: 'md' },

  disabled: { type: Boolean, default: false },
  loading:  { type: Boolean, default: false },
})

const baseClasses = 'inline-flex items-center justify-center font-bold rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-1'

const variantClasses = computed(() => ({
  primary:   'bg-gradient-to-br from-brand-700 to-brand-800 text-white shadow-[0_4px_0_theme(colors.brand.950)] hover:-translate-y-px hover:shadow-[0_6px_16px_rgba(12,22,89,0.30)] active:translate-y-0 active:shadow-none',
  secondary: 'border-2 border-brand-700 text-brand-700 bg-white hover:bg-brand-150',
  danger:    'bg-red-500 text-white shadow-[0_3px_0_#b91c1c] hover:bg-red-600 active:translate-y-0',
  ghost:     'text-brand-700 hover:bg-brand-150',
}[props.variant]))

const sizeClasses = computed(() => ({
  sm: 'text-xs px-3 py-1.5',
  md: 'text-sm px-5 py-2',
  lg: 'text-sm px-8 py-2.5',
}[props.size]))
</script>
