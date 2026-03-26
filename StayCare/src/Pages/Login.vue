<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '../stores/auth.js'
import AuthSplitLayout from '../Components/layout/AuthSplitLayout.vue'

const { t } = useI18n()

const router = useRouter()
const auth = useAuthStore()
const email = ref('')
const password = ref('')
const error = ref('')

const handleLogin = async () => {
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  const phonePattern = /^\d{10}$/

  if (!email.value || !password.value) {
    error.value = t('auth.errorBothFields')
    return
  }
  if (!emailPattern.test(email.value) && !phonePattern.test(email.value)) {
    error.value = t('auth.errorInvalidEmailPhone')
    return
  }

  try {
    error.value = ''
    await auth.login(email.value, password.value)
    router.push('/dashboard')
  } catch (err) {
    error.value = err?.message || err?.error || t('auth.errorInvalidCredentials')
  }
}
</script>

<template>
  <AuthSplitLayout
    :left-title="t('common.welcomeBack')"
    :left-subtitle="t('common.laundryManagement')"
    :form-title="t('common.login')"
    :form-subtitle="t('auth.loginHeading', { brand: 'StayFresh' })"
    left-background="linear-gradient(145deg, #0d365f 0%, #194b8e 45%, #63a3d8 100%)"
  >
    <form class="auth-form" @submit.prevent="handleLogin">
      <input
        v-model="email"
        type="text"
        required
        :placeholder="t('auth.emailOrPhone')"
        class="auth-input"
      />
      <input
        v-model="password"
        type="password"
        :placeholder="t('auth.password')"
        class="auth-input"
      />
      <p v-if="error" class="auth-error">{{ error }}</p>
      <button type="submit" class="auth-submit">{{ t('common.login') }}</button>
      <router-link to="/forgot-password" class="auth-link">{{ t('auth.forgotPassword') }}</router-link>
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

.auth-submit:hover {
  transform: translateY(-1px);
  box-shadow: 0 10px 20px rgba(12, 22, 89, 0.28);
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