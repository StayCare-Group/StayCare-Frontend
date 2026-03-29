<template>
  <header class="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-6 py-3 flex items-center justify-between">
    <div class="flex items-center gap-3">
      <!-- Hamburger for mobile -->
      <button class="lg:hidden text-gray-500 hover:text-gray-700" @click="$emit('toggle-sidebar')">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/></svg>
      </button>
      <div>
        <h2 class="text-base sm:text-lg font-semibold text-brand-700">{{ role }} {{ $t('common.dashboard') }}</h2>
        <p class="text-xs text-gray-400 hidden sm:block">{{ $t('common.welcomeBack') }}{{ authUser?.name ? `, ${authUser.name}` : '' }}</p>
      </div>
    </div>
    <div class="flex items-center gap-2 sm:gap-4">
      <button
        v-if="authUser?.email"
        @click="goToProfile"
        class="text-xs sm:text-sm text-gray-500 hidden sm:block hover:text-brand-700 transition-colors"
      >{{ authUser.email }}</button>
      <button
        @click="goToProfile"
        class="sm:hidden inline-flex items-center justify-center w-8 h-8 rounded-full text-gray-500 hover:text-brand-700 hover:bg-brand-150/60 transition-colors"
        :title="$t('settings.profile')"
        :aria-label="$t('settings.profile')"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5.121 17.804A9.963 9.963 0 0112 15c2.53 0 4.84.94 6.879 2.804M15 9a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </button>
      <button
        @click="handleLogout"
        class="text-sm text-gray-500 hover:text-red-600 font-medium transition-colors"
      >{{ $t('common.logout') }}</button>
    </div>
  </header>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth.js'
import { useNavStore } from '../../stores/nav.js'

defineProps({
  role: String,
})
defineEmits(['toggle-sidebar'])

const router = useRouter()
const auth = useAuthStore()
const navStore = useNavStore()
const authUser = computed(() => auth.user)

function goToProfile() {
  navStore.setPage('profile')
}

async function handleLogout() {
  await auth.logout()
  router.push('/LogorCreate')
}
</script>
