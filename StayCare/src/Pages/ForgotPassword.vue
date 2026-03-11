<script setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { forgotPassword } from '../api/auth'

const { t } = useI18n()
const router = useRouter()
const email = ref('')
const sent = ref(false)
const error = ref('')
const loading = ref(false)

const bubbles = ref(
  Array.from({ length: 15 }, (_, i) => ({
    id: i,
    left: Math.random() * 96 + 2,
    size: Math.random() * 30 + 15,
    delay: Math.random() * 5,
    duration: Math.random() * 4 + 4,
  }))
)

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
  <div class="template">
    <div
      v-for="b in bubbles"
      :key="b.id"
      class="bubble"
      :style="{
        left: b.left + '%',
        width: b.size + 'px',
        height: b.size + 'px',
        animationDelay: b.delay + 's',
        animationDuration: b.duration + 's',
      }"
    />
    <div class="bg-white px-8 py-10 rounded-lg shadow-lg max-w-md w-full" style="position: relative; z-index: 1;">
      <h1 class="text-2xl font-bold text-center text-[#FF56B0] mb-2">{{ t('auth.forgotPassword') }}</h1>

      <template v-if="!sent">
        <p class="text-gray-500 text-sm text-center mb-6">{{ t('auth.forgotPasswordDesc') }}</p>
        <input
          type="email"
          required
          v-model="email"
          :placeholder="t('auth.emailOrPhone')"
          class="w-full border-2 border-gray-300 bg-[#F5E7EC] rounded-lg px-4 py-2 mb-3 focus:outline-none focus:border-[#FF56B0] focus:ring-2 focus:ring-[#FF56B0]/40"
        />
        <p v-if="error" class="text-red-500 text-sm mb-3">{{ error }}</p>
        <button
          @click="handleSubmit"
          :disabled="loading"
          class="w-full bg-[#FF56B0] text-white font-bold py-2 rounded-lg shadow-[0_4px_0_#E63E8A] hover:bg-[#00F5F3] hover:shadow-[inset_0_2px_6px_rgba(0,140,140,0.7)] transition duration-300 disabled:opacity-50"
        >
          {{ loading ? t('common.saving') : t('auth.sendResetLink') }}
        </button>
      </template>

      <template v-else>
        <p class="text-green-600 text-center mb-6">{{ t('auth.resetLinkSent') }}</p>
      </template>

      <p class="text-center mt-6 text-sm text-gray-500">
        <router-link to="/login" class="text-[#FF56B0] hover:underline">{{ t('auth.backToLogin') }}</router-link>
      </p>
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
  border-radius: 50%;
  background: radial-gradient(circle at 30% 30%, rgba(255, 237, 247, 0.5), rgba(215, 255, 255, 0.15));
  border: 1px solid rgba(255, 207, 233, 0.3);
  animation: float 6s infinite ease-in;
  pointer-events: none;
}

@keyframes float {
  0% { bottom: -20px; opacity: 0; }
  10% { opacity: 1; }
  90% { opacity: 1; }
  100% { bottom: 100vh; opacity: 0; }
}
</style>