<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { registerUser } from '../api/auth'
import { useAuthStore } from '../stores/auth.js'

const { t } = useI18n()
const router = useRouter()
const auth = useAuthStore()
const email = ref('')
const password = ref('')
const error = ref('')
const username = ref('')
const phone = ref('')

const handleLogin = async () => {
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  const phonePattern = /^\d{10}$/

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
    })
    await auth.login(email.value, password.value)
    router.push('/Dashboard')
  } catch (err) {
    error.value = err?.message || err?.error || t('auth.errorRegistration')
  }
}
</script>

<template>
  <div class="template">
    <div class="bubble" style="left: 10%; animation-delay: 0s;"></div>
    <div class="bubble" style="left: 20%; animation-delay: 1s;"></div>
    <div class="bubble" style="left: 30%; animation-delay: 2s;"></div>
    <div class="bubble" style="left: 40%; animation-delay: 0.5s;"></div>
    <div class="bubble" style="left: 50%; animation-delay: 1.5s;"></div>
    <div class="bubble" style="left: 60%; animation-delay: 0.8s;"></div>
    <div class="bubble" style="left: 70%; animation-delay: 2.2s;"></div>
    <div class="bubble" style="left: 80%; animation-delay: 1.2s;"></div>
    <div class="bubble" style="left: 90%; animation-delay: 1.8s;"></div>
    <div class="flex flex-col items-center justify-center bg-white px-8 py-12 rounded-lg shadow-lg max-w-md w-full" style="position: relative; z-index: 1;">
      <i18n-t keypath="auth.loginHeading" tag="h1" class="text-3xl font-bold text-center text-[#FF56B0]"><template #brand><span class="text-[#00F5F3]">StayFresh</span></template></i18n-t>
      <input type="text" :placeholder="$t('auth.username')" v-model="username" class="flex justify-center items-center mt-9 border-2 border-[#B8B8B8] bg-[#F5E7EC] rounded-lg px-4 py-1 w-half focus:outline-none focus:border-[#FF56B0] focus:ring-2 focus:ring-[#FF56B0]/40"/>
      <input type="email" required :placeholder="$t('auth.email')" v-model="email" class="flex justify-center items-center mt-3 border-2 border-[#B8B8B8] bg-[#F5E7EC] rounded-lg px-4 py-1 w-half focus:outline-none focus:border-[#FF56B0] focus:ring-2 focus:ring-[#FF56B0]/40"/>
      <input type="tel" :placeholder="$t('auth.phone')" v-model="phone" class="flex justify-center items-center mt-3 border-2 border-[#B8B8B8] bg-[#F5E7EC] rounded-lg px-4 py-1 w-half focus:outline-none focus:border-[#FF56B0] focus:ring-2 focus:ring-[#FF56B0]/40"/>
      <input type="password" :placeholder="$t('auth.password')" v-model="password" class="flex justify-center items-center mt-3 border-2 border-[#B8B8B8] bg-[#F5E7EC] rounded-lg px-4 py-1 w-half focus:outline-none focus:border-[#FF56B0] focus:ring-2 focus:ring-[#FF56B0]/40"/>
      <p v-if="error" class="text-red-500 text-sm mt-2">{{ error }}</p>
      <button @click="handleLogin" class="mt-6 bg-[#FF56B0] text-white font-bold py-2 px-4 rounded-lg w-half shadow-[0_4px_0_#E63E8A] hover:bg-[#00F5F3] hover:shadow-[inset_0_2px_6px_rgba(0,140,140,0.7)] transition duration-300">{{ $t('auth.createAccount') }}</button>
     </div>
  </div>
</template>

<style scoped>
.template {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  position: relative;
  overflow: hidden;
}

.bubble {
  position: absolute;
  bottom: -20px;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: radial-gradient(circle at 30% 30%, rgba(255, 237, 247, 0.4), rgba(215, 255, 255, 0.1));
  border: 1px solid rgba(255, 207, 233, 0.3);
  animation: float 6s infinite ease-in;
}

@keyframes float {
  0% {
    bottom: -20px;
    opacity: 0;
  }
  10% {
    opacity: 1;
  }
  90% {
    opacity: 1;
  }
  100% {
    bottom: 100vh;
    opacity: 0;
  }
}
</style>