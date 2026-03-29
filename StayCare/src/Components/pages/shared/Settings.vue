<template>
  <div class="space-y-6 max-w-2xl">
    <h2 class="text-lg font-semibold text-brand-700">{{ $t('settings.title') }}</h2>

    <!-- Notifications -->
    <div class="bg-white rounded-xl shadow-sm p-5 space-y-4">
      <h3 class="text-sm font-semibold text-gray-700 uppercase tracking-wide">{{ $t('settings.notifications') }}</h3>
      <div class="space-y-3">
        <label v-for="n in notificationSettings" :key="n.key" class="flex items-center justify-between">
          <span class="text-sm text-gray-700">{{ $t('settings.' + n.key) }}</span>
          <button
            @click="n.enabled = !n.enabled"
            class="relative w-10 h-5 rounded-full transition-colors"
            :class="n.enabled ? 'bg-brand-700' : 'bg-gray-300'"
          >
            <span class="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform"
              :class="{ 'translate-x-5': n.enabled }"></span>
          </button>
        </label>
      </div>
    </div>


    <!-- Language -->
    <div class="bg-white rounded-xl shadow-sm p-5 space-y-4">
      <h3 class="text-sm font-semibold text-gray-700 uppercase tracking-wide">{{ $t('settings.language') }}</h3>
      <div class="flex flex-col sm:flex-row gap-2">
        <button
          @click="langStore.setLocale('en')"
          class="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border-2 transition-colors"
          :class="langStore.locale === 'en' ? 'border-brand-700 bg-brand-150 text-brand-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'"
        >
          <span class="text-base">🇬🇧</span> English
        </button>
        <button
          @click="langStore.setLocale('es')"
          class="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border-2 transition-colors"
          :class="langStore.locale === 'es' ? 'border-brand-700 bg-brand-150 text-brand-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'"
        >
          <span class="text-base">🇪🇸</span> Español
        </button>
      </div>
    </div>

    <!-- Save -->
    <div class="flex gap-3">
      <AppButton @click="save" size="lg" :loading="saving">
        {{ saving ? $t('common.saving') : $t('common.save') }}
      </AppButton>
    </div>

    <!-- Success toast -->
    <div v-if="showSuccess" class="fixed bottom-6 right-6 bg-green-600 text-white px-5 py-3 rounded-lg shadow-lg text-sm font-medium z-50">
      {{ $t('settings.saved') }}
    </div>
    <!-- Error toast -->
    <div v-if="showError" class="fixed bottom-6 right-6 bg-red-600 text-white px-5 py-3 rounded-lg shadow-lg text-sm font-medium z-50">
      {{ showError }}
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useLangStore } from '../../../stores/lang.js'
import AppButton from '../../ui/AppButton.vue'

const { t } = useI18n()
const langStore = useLangStore()
const saving = ref(false)

const notificationSettings = reactive([
  { key: 'orderStatusUpdates', enabled: true },
  { key: 'pickupReminders', enabled: true },
  { key: 'invoiceAlerts', enabled: true },
  { key: 'marketingEmails', enabled: false },
])

const showSuccess = ref(false)
const showError = ref('')

onMounted(() => {
  try {
    const raw = localStorage.getItem('staycare_notification_settings')
    if (!raw) return
    const parsed = JSON.parse(raw)
    for (const setting of notificationSettings) {
      if (Object.prototype.hasOwnProperty.call(parsed, setting.key)) {
        setting.enabled = Boolean(parsed[setting.key])
      }
    }
  } catch {
    // ignore invalid persisted settings
  }
})

async function save() {
  if (saving.value) return
  saving.value = true
  showError.value = ''

  try {
    const payload = notificationSettings.reduce((acc, setting) => {
      acc[setting.key] = setting.enabled
      return acc
    }, {})
    localStorage.setItem('staycare_notification_settings', JSON.stringify(payload))
    showSuccess.value = true
    setTimeout(() => { showSuccess.value = false }, 2000)
  } catch (err) {
    showError.value = err?.message || err?.error || t('settings.saveFailed')
  } finally {
    saving.value = false
  }
}
</script>
