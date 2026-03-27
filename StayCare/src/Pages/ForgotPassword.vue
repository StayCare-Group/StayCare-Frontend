<script setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { forgotPassword } from '../api/auth'
import AuthSplitLayout from '../Components/layout/AuthSplitLayout.vue'

const { t } = useI18n()
const router = useRouter()
const email = ref('')
const sent = ref(false)
const error = ref('')
const loading = ref(false)

async function handleSubmit() {
  if (!email.value) {
    error.value = t('auth.errorBothFields')
    return
  }
  loading.value = true
  error.value = ''
  try {
    await forgotPassword(email.value)
    sent.value = true
  } catch (err) {
    error.value = err?.message || t('settings.saveFailed')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <AuthSplitLayout
    :left-title="t('auth.forgotPassword')"
    :left-subtitle="t('common.laundryManagement')"
    :form-title="t('auth.forgotPassword')"
    :form-subtitle="t('auth.forgotPasswordDesc')"
    left-background="linear-gradient(145deg, #0d365f 0%, #194b8e 45%, #63a3d8 100%)"
  >
    <form class="auth-form" @submit.prevent="handleSubmit">
      <template v-if="!sent">
        <input
          v-model="email"
          type="email"
          required
          :placeholder="t('auth.emailOrPhone')"
          class="auth-input"
        />
        <p v-if="error" class="auth-error">{{ error }}</p>
        <button type="submit" :disabled="loading" class="auth-submit">
          {{ loading ? t('common.sending') : t('auth.sendResetLink') }}
        </button>
      </template>

      <template v-else>
        <p class="auth-success">{{ t('auth.resetLinkSent') }}</p>
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