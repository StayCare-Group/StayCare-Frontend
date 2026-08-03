<template>
  <div>
    <Settings v-if="navStore.currentPage === 'settings'" />
    <ProfileAccount v-else-if="navStore.currentPage === 'profile'" />
    <Processing v-else />
  </div>
</template>

<script setup>
import { onMounted, watch } from 'vue'
import Processing from '../pages/facility/Processing.vue'
import Settings from '../pages/shared/Settings.vue'
import ProfileAccount from '../pages/shared/ProfileAccount.vue'
import { useNavStore } from '../../stores/nav.js'

const navStore = useNavStore()

function ensureOperatorDefaultPage() {
  if (navStore.currentPage === 'dashboard') {
    navStore.setPage('processing')
  }
}

onMounted(ensureOperatorDefaultPage)

watch(() => navStore.currentPage, (page) => {
  if (page === 'dashboard') {
    navStore.setPage('processing')
  }
})
</script>

