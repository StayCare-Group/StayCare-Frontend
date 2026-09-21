<template>
  <button
    v-bind="$attrs"
    :type="type"
    :disabled="disabled || loading"
    :class="[baseClasses, variantClasses, sizeClasses, 'disabled:opacity-50 disabled:cursor-not-allowed']"
  >
    <span v-if="loading" class="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2 align-middle"></span>
    <slot />
  </button>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  /** button | submit | reset */
  type: { type: String, default: 'button' },

  /**
   * primary   → brand-700→brand-800 gradient (default)
   * secondary → light outline brand
   * danger    → red
   * ghost     → transparent, brand-700 text
   */
  variant: { type: String, default: 'primary' },

  /** sm | md | lg */
  size: { type: String, default: 'md' },

  disabled: { type: Boolean, default: false },
  loading:  { type: Boolean, default: false },
})

const baseClasses = 'inline-flex items-center justify-center font-semibold rounded-lg border transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-1 select-none'

const variantClasses = computed(() => ({
  primary:   'border-transparent bg-gradient-to-br from-brand-700 to-brand-800 text-white shadow-sm hover:shadow-md hover:from-brand-800 hover:to-brand-900 active:scale-[0.98]',
  secondary: 'border-brand-700 text-brand-700 bg-white hover:bg-brand-150 shadow-sm active:scale-[0.98]',
  danger:    'border-transparent bg-red-600 text-white shadow-sm hover:bg-red-700 active:scale-[0.98]',
  ghost:     'border-transparent text-brand-700 hover:bg-brand-150 active:scale-[0.98]',
}[props.variant]))

const sizeClasses = computed(() => ({
  sm: 'text-xs px-3 py-1.5 leading-5 min-h-[32px]',
  md: 'text-sm px-4 py-2 leading-5 min-h-[38px]',
  lg: 'text-sm px-6 py-2.5 leading-6 min-h-[44px]',
}[props.size]))
</script>

