<script setup>
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import DesktopDashboard from '../Components/DesktopDashboard.vue'
import { useAuthStore } from '../stores/auth.js'
import { toSystemRole } from '../constants/roles'

const auth = useAuthStore()
const { user } = storeToRefs(auth)

const role = computed(() => {
  return toSystemRole(user.value?.role)
})
</script>

<template>
  <DesktopDashboard :role="role" />
</template>

<style scoped>
</style>