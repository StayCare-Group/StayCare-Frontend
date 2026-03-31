<script setup>
import { ref } from 'vue'
import Sidebar from './layout/Sidebar.vue'
import TopHeader from './layout/TopHeader.vue'
import ClientDashboard from './dashboard/ClientDashboard.vue'
import DriverDashboard from './dashboard/DriverDashboard.vue'
import FacilityDashboard from './dashboard/FacilityDashboard.vue'
import AdminDashboard from './dashboard/AdminDashboard.vue'

defineProps({
  role: String,
})

const sidebarOpen = ref(false)

</script>

<template>
  <div class="flex min-h-screen lg:h-screen overflow-hidden relative">

    <!-- Unified responsive Sidebar -->
    <Sidebar :role="role" v-model:open="sidebarOpen" class="relative z-[1]" />

    <!-- Main Content -->
    <div class="flex-1 flex flex-col min-w-0 min-h-screen lg:h-screen relative z-[1]">
      <TopHeader :role="role" @toggle-sidebar="sidebarOpen = !sidebarOpen" />

      <main class="flex-1 p-4 lg:p-6 overflow-y-auto overflow-x-hidden">
        <ClientDashboard v-if="role === 'client'" />
        <DriverDashboard v-else-if="role === 'driver'" />
        <FacilityDashboard v-else-if="role === 'staff'" />
        <AdminDashboard v-else-if="role === 'admin'" />
      </main>
    </div>
  </div>
</template>

<style scoped>

@keyframes float {
  0%   { bottom: -20px; opacity: 0; }
  10%  { opacity: 1; }
  90%  { opacity: 1; }
  100% { bottom: 100vh; opacity: 0; }
}
</style>
