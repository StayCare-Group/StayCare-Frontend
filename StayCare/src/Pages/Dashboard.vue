<script setup>
import { ref } from 'vue'
import DesktopDashboard from '../Components/DesktopDashboard.vue'
import MobileDashboard from '../Components/MobileDashboard.vue'

const currentRole = ref('Client')
</script>

<template>
  <!-- Desktop: lg and above (>=1024px) -->
  <div class="hidden lg:block">
    <DesktopDashboard v-model:role="currentRole" />
  </div>

  <!-- Mobile / Tablet: below lg -->
  <div class="block lg:hidden">
    <MobileDashboard v-model:role="currentRole" />
  </div>
</template>

<style scoped>
</style>