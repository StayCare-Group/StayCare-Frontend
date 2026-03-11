<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const bubbles = ref(
  Array.from({ length: 15 }, (_, i) => ({
    id: i,
    left: Math.random() * 96 + 2,
    size: Math.random() * 30 + 15,
    delay: Math.random() * 5,
    duration: Math.random() * 4 + 4,
  }))
)

const router = useRouter()

const goToLogin = () => {
  router.push('/login')
}

const goToCreateAccount = () => {
  router.push('/createaccount')
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
    <div class="flex flex-col items-center justify-center bg-white px-8 py-12 rounded-lg shadow-lg max-w-md w-full" style="position: relative; z-index: 1;">
      <i18n-t keypath="auth.loginHeading" tag="h1" class="text-3xl font-bold text-center text-[#FF56B0]"><template #brand><span class="text-[#00F5F3]">StayFresh</span></template></i18n-t>
      <button @click="goToLogin" class="mt-6 bg-[#FF56B0] text-white font-bold py-2 px-4 rounded-lg w-xs shadow-[0_4px_0_#E63E8A] hover:bg-[#00F5F3] hover:shadow-[inset_0_2px_6px_rgba(0,140,140,0.7)] transition duration-300">{{ $t('common.signIn') }}</button>
      <button @click="goToCreateAccount" class="mt-6 bg-[#FF56B0] text-white font-bold py-2 px-4 rounded-lg w-xs shadow-[0_4px_0_#E63E8A] hover:bg-[#00F5F3] hover:shadow-[inset_0_2px_6px_rgba(0,140,140,0.7)] transition duration-300">{{ $t('common.signUp') }}</button>
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