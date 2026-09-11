<template>
  <div>
    <span class="text-gray-500">{{ label }}</span>
    <slot v-if="isEditing" name="input">
      <input
        :type="type"
        :value="modelValue"
        :min="min"
        autocomplete="off"
        class="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-400 focus:border-transparent outline-none"
        @input="$emit('update:modelValue', $event.target.value)"
      />
    </slot>
    <p v-else class="font-medium text-gray-800">{{ displayValue ?? '—' }}</p>
  </div>
</template>

<script setup>
defineProps({
  label: { type: String, required: true },
  modelValue: { type: [String, Number], default: '' },
  displayValue: { type: [String, Number], default: null },
  isEditing: { type: Boolean, default: false },
  type: { type: String, default: 'text' },
  min: { type: [String, Number], default: undefined },
})

defineEmits(['update:modelValue'])
</script>
