<script setup>
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { resetPassword } from '../api/auth'
import AuthSplitLayout from '../Components/layout/AuthSplitLayout.vue'

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
  <AuthSplitLayout
    :left-title="t('auth.resetPassword')"
    :left-subtitle="t('common.laundryManagement')"
    :form-title="t('auth.resetPassword')"
    left-background="linear-gradient(145deg, #0d365f 0%, #194b8e 45%, #63a3d8 100%)"
  >
    <form class="auth-form" @submit.prevent="handleReset">
      <template v-if="!success">
        <input
          v-model="password"
          type="password"
          :placeholder="t('auth.newPassword')"
          class="auth-input"
        />
        <input
          v-model="confirmPassword"
          type="password"
          :placeholder="t('settings.confirmPassword')"
          class="auth-input"
        />
        <p v-if="error" class="auth-error">{{ error }}</p>
        <button type="submit" :disabled="loading" class="auth-submit">
          {{ loading ? t('common.saving') : t('auth.resetPassword') }}
        </button>
      </template>

      <template v-else>
        <p class="auth-success">{{ t('auth.passwordResetSuccess') }}</p>
        <p class="auth-hint">{{ t('auth.redirectingToLogin') }}</p>
      </template>

      <router-link to="/login" class="auth-link">{{ t('auth.backToLogin') }}</router-link>
    </form>
  </AuthSplitLayout>
</template>

<style scoped>
.auth-form {
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
}

.auth-input {
  width: 100%;
  border: 1.5px solid #b0e9f6;
  border-radius: 0.65rem;
  padding: 0.75rem 0.9rem;
  color: #03112e;
  background: #ffffff;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.auth-input:focus {
  outline: none;
  border-color: #63a3d8;
  box-shadow: 0 0 0 4px rgba(99, 163, 216, 0.18);
}

.auth-error {
  color: #dc2626;
  font-size: 0.9rem;
}

.auth-success {
  color: #16a34a;
  font-size: 0.95rem;
  text-align: center;
}

.auth-hint {
  color: #475569;
  font-size: 0.875rem;
  text-align: center;
}

.auth-submit {
  border: none;
  border-radius: 0.7rem;
  padding: 0.8rem 1rem;
  background: linear-gradient(135deg, #194b8e, #0c1659);
  color: #ffffff;
  font-weight: 700;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.auth-submit:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 10px 20px rgba(12, 22, 89, 0.28);
}

.auth-submit:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.auth-link {
  text-align: center;
  color: #194b8e;
  font-size: 0.92rem;
}

.auth-link:hover {
  text-decoration: underline;
}
</style>
