<template>
  <header class="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-6 py-3 flex items-center justify-between">
    <div class="flex items-center gap-3">
      <!-- Hamburger for mobile -->
      <button class="lg:hidden text-gray-500 hover:text-gray-700" @click="$emit('toggle-sidebar')">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/></svg>
      </button>
      <div>
        <h2 class="text-base sm:text-lg font-semibold text-brand-700">{{ roleLabel }} {{ $t('common.dashboard') }}</h2>
        <p class="text-xs text-gray-400 hidden sm:block">{{ $t('common.welcomeBack') }}{{ authUser?.name ? `, ${authUser.name}` : '' }}</p>
      </div>
    </div>
    <div class="flex items-center gap-2 sm:gap-4">
      <!-- Profile button — desktop -->
      <button
        v-if="authUser?.email"
        @click="goToProfile"
        class="hidden sm:flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-lg text-xs sm:text-sm text-gray-600 hover:bg-brand-150/60 hover:text-brand-700 transition-colors group"
        :title="$t('profile.title')"
      >
        <span class="inline-flex items-center justify-center w-7 h-7 rounded-full bg-brand-150 text-brand-700 shrink-0">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5.121 17.804A9.963 9.963 0 0112 15c2.53 0 4.84.94 6.879 2.804M15 9a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </span>
        <span class="leading-tight">
          <span class="block font-medium">{{ authUser.name || authUser.email }}</span>
          <span v-if="authUser.name" class="block text-[11px] text-gray-400 group-hover:text-brand-500">{{ authUser.email }}</span>
        </span>
      </button>
      <!-- Profile button — mobile -->
      <button
        @click="goToProfile"
        class="sm:hidden inline-flex items-center justify-center w-8 h-8 rounded-full bg-brand-150 text-brand-700 hover:bg-brand-200 transition-colors"
        :title="$t('profile.title')"
        :aria-label="$t('profile.title')"
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
import { getRoleLabel } from '../../constants/roles'

const props = defineProps({
  role: String,
})
defineEmits(['toggle-sidebar'])

const router = useRouter()
const auth = useAuthStore()
const navStore = useNavStore()
const authUser = computed(() => auth.user)
const roleLabel = computed(() => getRoleLabel(props.role))

function goToProfile() {
  navStore.setPage('profile')
}

async function handleLogout() {
  await auth.logout()
  router.push('/LogorCreate')
}
</script>
