<script setup>
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import DesktopDashboard from '../Components/DesktopDashboard.vue'
import { useAuthStore } from '../stores/auth.js'

const auth = useAuthStore()
const { user } = storeToRefs(auth)

const BACKEND_ROLE_TO_DISPLAY = {
  admin: 'Admin',
  client: 'Client',
  driver: 'Driver',
  staff: 'Facility Staff',
  // legacy: backend used to return JWT payload role
  user: 'Client',
}

const displayRole = computed(() => {
  const raw = user.value?.role
  if (raw == null || raw === '') return 'Client'
  const role = String(raw).toLowerCase()
  return BACKEND_ROLE_TO_DISPLAY[role] ?? 'Client'
})
</script>

<template>
  <DesktopDashboard :role="displayRole" />
</template>

<style scoped>
</style>