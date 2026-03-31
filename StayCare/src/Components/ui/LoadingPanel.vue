<template>
  <div class="bg-white rounded-xl shadow-sm p-6 text-center text-gray-500">
    {{ message || $t('common.loading') }}
  </div>
</template>

<script setup>
defineProps({
  message: {
    type: String,
    default: '',
  },
})
</script>
