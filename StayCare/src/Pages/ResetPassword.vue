<script setup>
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { resetPassword } from '../api/auth'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()

const password = ref('')
const confirmPassword = ref('')
const error = ref('')
const success = ref(false)
const loading = ref(false)

async function handleReset() {
  error.value = ''
  if (!password.value || !confirmPassword.value) {
    error.value = t('auth.errorBothFields')
    return
  }
  if (password.value.length < 6) {
    error.value = t('settings.passwordTooShort')
    return
  }
  if (password.value !== confirmPassword.value) {
    error.value = t('settings.passwordMismatch')
    return
  }

  loading.value = true
  try {
    await resetPassword(String(route.params.token), password.value)
    success.value = true
    setTimeout(() => router.push('/login'), 3000)
  } catch (err) {
    error.value = err?.message || t('settings.saveFailed')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="flex flex-col items-center justify-center min-h-screen bg-gray-50 px-4">
    <div class="bg-white px-8 py-10 rounded-lg shadow-lg max-w-md w-full">
      <h1 class="text-2xl font-bold text-center text-[#FF56B0] mb-6">{{ t('auth.resetPassword') }}</h1>

      <template v-if="!success">
        <input
          type="password"
          v-model="password"
          :placeholder="t('auth.newPassword')"
          class="w-full border-2 border-gray-300 bg-[#F5E7EC] rounded-lg px-4 py-2 mb-3 focus:outline-none focus:border-[#FF56B0] focus:ring-2 focus:ring-[#FF56B0]/40"
        />
        <input
          type="password"
          v-model="confirmPassword"
          :placeholder="t('settings.confirmPassword')"
          class="w-full border-2 border-gray-300 bg-[#F5E7EC] rounded-lg px-4 py-2 mb-3 focus:outline-none focus:border-[#FF56B0] focus:ring-2 focus:ring-[#FF56B0]/40"
        />
        <p v-if="error" class="text-red-500 text-sm mb-3">{{ error }}</p>
        <button
          @click="handleReset"
          :disabled="loading"
          class="w-full bg-[#FF56B0] text-white font-bold py-2 rounded-lg shadow-[0_4px_0_#E63E8A] hover:bg-[#00F5F3] hover:shadow-[inset_0_2px_6px_rgba(0,140,140,0.7)] transition duration-300 disabled:opacity-50"
        >
          {{ loading ? t('common.saving') : t('auth.resetPassword') }}
        </button>
      </template>

      <template v-else>
        <p class="text-green-600 text-center mb-4">{{ t('auth.passwordResetSuccess') }}</p>
        <p class="text-gray-500 text-center text-sm">{{ t('auth.redirectingToLogin') }}</p>
      </template>

      <p class="text-center mt-6 text-sm text-gray-500">
        <router-link to="/login" class="text-[#FF56B0] hover:underline">{{ t('auth.backToLogin') }}</router-link>
      </p>
    </div>
  </div>
</template>
