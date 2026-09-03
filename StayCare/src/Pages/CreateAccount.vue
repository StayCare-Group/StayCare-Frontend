<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { registerUser } from '../api/auth'
import { useAuthStore } from '../stores/auth.js'
import AuthSplitLayout from '../Components/layout/AuthSplitLayout.vue'

const { t, locale } = useI18n()
const router = useRouter()

onMounted(() => {
  router.replace('/LogorCreate')
})

const auth = useAuthStore()
const email = ref('')
const password = ref('')
const error = ref('')
const username = ref('')
const phone = ref('')

const handleRegister = async () => {
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  const phonePattern = /^\d{8}$/

  if (!password.value || !username.value) {
    error.value = t('auth.errorUsernamePassword')
    return
  }
  if (!email.value && !phone.value) {
    error.value = t('auth.errorEmailOrPhone')
    return
  }
  if (email.value && !emailPattern.test(email.value)) {
    error.value = t('auth.errorInvalidEmail')
    return
  }
  if (phone.value && !phonePattern.test(phone.value)) {
    error.value = t('auth.errorInvalidPhone')
    return
  }

  try {
    error.value = ''
    await registerUser({
      name: username.value,
      email: email.value,
      password: password.value,
      phone: phone.value || undefined,
      language: locale.value || 'en',
    })
    await auth.loadCurrentUser()
    router.push('/dashboard')
  } catch (err) {
    error.value = err?.message || err?.error || t('auth.errorRegistration')
  }
}
</script>

<template>
  <AuthSplitLayout
    :left-title="t('common.signUp')"
    :left-subtitle="t('common.laundryManagement')"
    :form-title="t('auth.createAccount')"
    :form-subtitle="t('auth.loginHeading', { brand: 'StayFresh' })"
    left-background="linear-gradient(145deg, #0c1659 0%, #194b8e 45%, #63a3d8 100%)"
  >
    <form class="auth-form" @submit.prevent="handleRegister">
      <input
        v-model="username"
        type="text"
        :placeholder="t('auth.username')"
        class="auth-input"
      />
      <input
        v-model="email"
        type="email"
        required
        :placeholder="t('auth.email')"
        class="auth-input"
      />
      <input
        v-model="phone"
        type="tel"
        :placeholder="t('auth.phone')"
        class="auth-input"
      />
      <input
        v-model="password"
        type="password"
        :placeholder="t('auth.password')"
        class="auth-input"
      />
      <p v-if="error" class="auth-error">{{ error }}</p>
      <button type="submit" class="auth-submit">{{ t('auth.createAccount') }}</button>
      <router-link to="/logorcreate" class="auth-link">{{ t('common.cancel') }}</router-link>
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