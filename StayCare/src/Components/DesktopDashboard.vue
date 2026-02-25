<script setup>
import DesktopSidebar from './layout/DesktopSidebar.vue'
import DesktopTopHeader from './layout/DesktopTopHeader.vue'
import ClientDashboard from './dashboard/ClientDashboard.vue'
import DriverDashboard from './dashboard/DriverDashboard.vue'
import FacilityDashboard from './dashboard/FacilityDashboard.vue'
import AdminDashboard from './dashboard/AdminDashboard.vue'

const props = defineProps({
  role: String,
})
const emit = defineEmits(['update:role'])
</script>

<template>
  <div class="flex min-h-screen bg-gray-100">
    <!-- Fixed Sidebar (always visible) -->
    <DesktopSidebar :role="role" />

    <!-- Main Content -->
    <div class="flex-1 flex flex-col">
      <DesktopTopHeader :role="role" @update:role="emit('update:role', $event)" />

      <main class="flex-1 p-6 overflow-y-auto">
        <ClientDashboard v-if="role === 'Client'" />
        <DriverDashboard v-else-if="role === 'Driver'" />
        <FacilityDashboard v-else-if="role === 'Facility Staff'" />
        <AdminDashboard v-else-if="role === 'Admin'" />
      </main>
    </div>
  </div>
</template>

<style scoped>
</style>
