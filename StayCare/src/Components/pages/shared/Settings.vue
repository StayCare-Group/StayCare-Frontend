<template>
  <div class="space-y-6 max-w-2xl">
    <h2 class="text-lg font-semibold text-white">{{ $t('settings.title') }}</h2>

    <!-- Profile -->
    <div class="bg-white rounded-xl shadow-sm p-5 space-y-4">
      <h3 class="text-sm font-semibold text-gray-700 uppercase tracking-wide">{{ $t('settings.profile') }}</h3>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-600 mb-1">{{ $t('settings.fullName') }}</label>
          <input v-model="profile.name" type="text"
            class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#FF56B0] focus:border-transparent outline-none" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-600 mb-1">{{ $t('settings.email') }}</label>
          <input v-model="profile.email" type="email"
            class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#FF56B0] focus:border-transparent outline-none" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-600 mb-1">{{ $t('settings.phone') }}</label>
          <input v-model="profile.phone" type="tel"
            class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#FF56B0] focus:border-transparent outline-none" />
        </div>
      </div>
    </div>

    <!-- Notifications -->
    <div class="bg-white rounded-xl shadow-sm p-5 space-y-4">
      <h3 class="text-sm font-semibold text-gray-700 uppercase tracking-wide">{{ $t('settings.notifications') }}</h3>
      <div class="space-y-3">
        <label v-for="n in notificationSettings" :key="n.key" class="flex items-center justify-between">
          <span class="text-sm text-gray-700">{{ n.label }}</span>
          <button
            @click="n.enabled = !n.enabled"
            class="relative w-10 h-5 rounded-full transition-colors"
            :class="n.enabled ? 'bg-[#FF56B0]' : 'bg-gray-300'"
          >
            <span class="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform"
              :class="{ 'translate-x-5': n.enabled }"></span>
          </button>
        </label>
      </div>
    </div>

    <!-- Security -->
    <div class="bg-white rounded-xl shadow-sm p-5 space-y-4">
      <h3 class="text-sm font-semibold text-gray-700 uppercase tracking-wide">{{ $t('settings.security') }}</h3>
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-600 mb-1">{{ $t('settings.currentPassword') }}</label>
          <input type="password" placeholder="••••••••"
            class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#FF56B0] focus:border-transparent outline-none" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-600 mb-1">{{ $t('settings.newPassword') }}</label>
          <input type="password" placeholder="••••••••"
            class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#FF56B0] focus:border-transparent outline-none" />
        </div>
      </div>
    </div>

    <!-- Language -->
    <div class="bg-white rounded-xl shadow-sm p-5 space-y-4">
      <h3 class="text-sm font-semibold text-gray-700 uppercase tracking-wide">{{ $t('settings.language') }}</h3>
      <div class="flex gap-2">
        <button
          @click="langStore.setLocale('en')"
          class="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border-2 transition-colors"
          :class="langStore.locale === 'en' ? 'border-[#FF56B0] bg-pink-50 text-[#FF56B0]' : 'border-gray-200 text-gray-600 hover:border-gray-300'"
        >
          <span class="text-base">🇬🇧</span> English
        </button>
        <button
          @click="langStore.setLocale('es')"
          class="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border-2 transition-colors"
          :class="langStore.locale === 'es' ? 'border-[#FF56B0] bg-pink-50 text-[#FF56B0]' : 'border-gray-200 text-gray-600 hover:border-gray-300'"
        >
          <span class="text-base">🇪🇸</span> Español
        </button>
      </div>
    </div>

    <!-- Save -->
    <div class="flex gap-3">
      <button @click="save"
        class="bg-[#FF56B0] text-white font-bold py-2.5 px-8 rounded-lg shadow-[0_4px_0_#E63E8A] hover:opacity-90 transition text-sm">
        {{ $t('common.save') }}
      </button>
    </div>

    <!-- Success toast -->
    <div v-if="showSuccess" class="fixed bottom-6 right-6 bg-green-600 text-white px-5 py-3 rounded-lg shadow-lg text-sm font-medium z-50">
      {{ $t('settings.saved') }}
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useLangStore } from '../../../stores/lang.js'
import { useAuthStore } from '../../../stores/auth.js'
import { fetchMe } from '../../../api/users'

const { t } = useI18n()
const langStore = useLangStore()
const authStore = useAuthStore()

const profile = reactive({
  name: '',
  email: '',
  phone: '',
})

onMounted(async () => {
  try {
    const data = await fetchMe()
    const user = data?.user ?? data ?? {}
    profile.name = user.name ?? authStore.user?.name ?? ''
    profile.email = user.email ?? authStore.user?.email ?? ''
    profile.phone = user.phone ?? ''
  } catch {
    profile.name = authStore.user?.name ?? ''
    profile.email = authStore.user?.email ?? ''
  }
})

const notificationSettings = reactive([
  { key: 'orderUpdates', label: t('settings.orderStatusUpdates'), enabled: true },
  { key: 'pickupReminders', label: t('settings.pickupReminders'), enabled: true },
  { key: 'invoiceAlerts', label: t('settings.invoiceAlerts'), enabled: true },
  { key: 'marketingEmails', label: t('settings.marketingEmails'), enabled: false },
])

const showSuccess = ref(false)

function save() {
  showSuccess.value = true
  setTimeout(() => { showSuccess.value = false }, 2000)
}
</script>
