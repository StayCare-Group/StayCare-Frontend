<template>
  <header class="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
    <div>
      <h2 class="text-lg font-semibold text-gray-800">{{ role }} {{ $t('common.dashboard') }}</h2>
      <p class="text-xs text-gray-400">{{ $t('common.welcomeBack') }}</p>
    </div>
    <div class="flex items-center gap-4">
      <span v-if="authUser" class="text-sm text-gray-600">{{ authUser.name || authUser.email }}</span>
      <button
        @click="handleLogout"
        class="text-sm text-gray-500 hover:text-red-600 font-medium transition-colors"
      >{{ $t('common.logout') }}</button>
    </div>
  </header>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth.js'
import { computed } from 'vue'

defineProps({
  role: String,
})

const router = useRouter()
const auth = useAuthStore()
const authUser = computed(() => auth.user)

async function handleLogout() {
  await auth.logout()
  router.push('/LogorCreate')
}
</script>
