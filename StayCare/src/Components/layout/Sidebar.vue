<template>
  <!-- Overlay – mobile only -->
  <div v-if="open" class="fixed inset-0 bg-brand-950/40 z-40 lg:hidden" @click="emit('update:open', false)" />

  <!-- Sidebar: drawer on mobile, static fixed column on lg+ -->
  <aside class="fixed lg:static inset-y-0 left-0 z-50 w-64 bg-[#F8FAFC] border-r border-gray-100
           flex flex-col transform transition-transform duration-300 ease-out lg:translate-x-0"
    :class="open ? 'translate-x-0' : '-translate-x-full'">
    <!-- Logo area -->
    <div class="px-4 py-3 border-b border-gray-100 flex items-center justify-between gap-2 min-h-[60px]">
      <div>
        <img src="/brand/logo.png" alt="StayCare" class="h-8 w-auto object-contain max-w-[9rem]"
          onerror="this.style.display='none';this.nextElementSibling.style.display='flex'" />
        <!-- Text fallback shown only when logo fails to load -->
        <span class="hidden items-center text-lg font-bold text-brand-900">StayCare</span>
        <p class="text-xs text-gray-400 mt-0.5">{{ $t('common.laundryManagement') }}</p>
      </div>


      <!-- Close button – hidden on desktop -->
      <button class="lg:hidden ml-auto shrink-0 text-brand-700 hover:text-brand-950 transition-colors"
        @click="emit('update:open', false)">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>

    <!-- Navigation -->
    <nav class="flex-1 p-3 space-y-1 overflow-y-auto">
      <button v-for="item in navItems" :key="item.label" @click="navigate(item.page)"
        class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left"
        :class="navStore.currentPage === item.page
          ? 'bg-[#CCEBF6]/70 text-[#0D365F] font-semibold shadow-sm'
          : 'text-[#194B8E] hover:bg-brand-100/40 hover:text-brand-900'">
        <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="item.icon" />
        </svg>
        {{ item.label }}
      </button>
    </nav>

    <!-- Footer -->
    <div class="p-4 border-t border-gray-100 text-xs text-gray-400">
      &copy; 2026 StayFresh
    </div>
  </aside>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useNavStore } from '../../stores/nav.js'
import { useAuthStore } from '../../stores/auth.js'

const props = defineProps({
  role: String,
  open: { type: Boolean, default: false },
})

const emit = defineEmits(['update:open'])

const { t } = useI18n()
const navStore = useNavStore()
const auth = useAuthStore()

const navigate = (page) => {
  navStore.setPage(page)
  emit('update:open', false)
}

const settingsIcon = 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z'

const navItems = computed(() => {
  const base = [{ label: t('nav.dashboard'), page: 'dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0h4' }]

  const roleNav = {
    client: [
      { label: t('nav.orders'), page: 'orders', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
      { label: t('nav.invoices'), page: 'invoices', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
      { label: t('nav.settings'), page: 'settings', icon: settingsIcon },
    ],
    driver: [
      { label: t('nav.myRoute'), page: 'route', icon: 'M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7' },
      { label: t('nav.history'), page: 'history', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
      { label: t('nav.settings'), page: 'settings', icon: settingsIcon },
    ],
    staff: [
      { label: t('nav.orders'), page: 'orders', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
      { label: t('nav.reception'), page: 'reception', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01' },
      { label: t('nav.processing'), page: 'processing', icon: 'M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z' },
      { label: t('nav.routes'), page: 'routes', icon: 'M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7' },
      { label: t('nav.settings'), page: 'settings', icon: settingsIcon },
    ],
    admin: [
      { label: t('nav.orders'), page: 'orders', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
      { label: t('nav.items'), page: 'items', icon: 'M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z' },
      { label: t('nav.invoices'), page: 'invoices', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
      { label: t('nav.processing'), page: 'processing', icon: 'M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z' },
      { label: t('nav.routes'), page: 'routes', icon: 'M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7' },
      { label: t('nav.users'), page: 'users', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
      { label: t('nav.reports'), page: 'reports', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
      { label: t('nav.settings'), page: 'settings', icon: settingsIcon },
    ],
  }

  return [...base, ...(roleNav[props.role] || [])]
})
</script>
