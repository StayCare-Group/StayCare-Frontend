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
  <div class="flex min-h-screen">
    <!-- Sidebar (drawer style) -->
    <Sidebar :role="role" v-model:open="sidebarOpen" />

    <!-- Main Content -->
    <div class="flex-1 flex flex-col min-w-0">
      <TopHeader :role="role" @toggle-sidebar="sidebarOpen = !sidebarOpen" />

      <main class="flex-1 p-4 overflow-y-auto overflow-x-hidden">
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
