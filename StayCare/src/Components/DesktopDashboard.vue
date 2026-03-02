<script setup>
import { computed } from 'vue'
import DesktopSidebar from './layout/DesktopSidebar.vue'
import DesktopTopHeader from './layout/DesktopTopHeader.vue'
import ClientDashboard from './dashboard/ClientDashboard.vue'
import DriverDashboard from './dashboard/DriverDashboard.vue'
import FacilityDashboard from './dashboard/FacilityDashboard.vue'
import AdminDashboard from './dashboard/AdminDashboard.vue'

defineProps({
  role: String,
})

const bubbles = computed(() =>
  Array.from({ length: 15 }, (_, i) => ({
    id: i,
    left: Math.random() * 96 + 2,
    size: Math.random() * 30 + 15,
    delay: Math.random() * 5,
    duration: Math.random() * 4 + 4,
  }))
)
</script>

<template>
  <div class="flex h-screen overflow-hidden relative">
    <!-- Floating bubbles -->
    <div
      v-for="b in bubbles"
      :key="b.id"
      class="bubble"
      :style="{
        left: b.left + '%',
        width: b.size + 'px',
        height: b.size + 'px',
        animationDelay: b.delay + 's',
        animationDuration: b.duration + 's',
      }"
    />

    <!-- Fixed Sidebar (always visible) -->
    <DesktopSidebar :role="role" class="relative z-[1]" />

    <!-- Main Content -->
    <div class="flex-1 flex flex-col min-w-0 h-screen relative z-[1]">
      <DesktopTopHeader :role="role" />

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
.bubble {
  position: absolute;
  bottom: -20px;
  border-radius: 50%;
  background: radial-gradient(circle at 30% 30%, rgba(255, 237, 247, 0.5), rgba(215, 255, 255, 0.15));
  border: 1px solid rgba(255, 207, 233, 0.3);
  animation: float 6s infinite ease-in;
  pointer-events: none;
  z-index: 0;
}

@keyframes float {
  0%   { bottom: -20px; opacity: 0; }
  10%  { opacity: 1; }
  90%  { opacity: 1; }
  100% { bottom: 100vh; opacity: 0; }
}
</style>
