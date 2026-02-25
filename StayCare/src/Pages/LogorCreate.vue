<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

const goToLogin = () => {
  router.push('/Login')
}

const goToCreateAccount = () => {
  router.push('/CreateAccount')
}
</script>

<template>
  <div class="template">
    <div class="flex flex-col items-center justify-center bg-white px-8 py-12 rounded-lg shadow-lg max-w-md w-full">
      <h1 class="text-3xl font-bold text-center text-[#FF56B0]">Login for <span class="text-[#00F5F3]">StayFresh</span> laundry management</h1>
      <button @click="goToLogin" class="mt-6 bg-[#FF56B0] text-white font-bold py-2 px-4 rounded-lg w-xs shadow-[0_4px_0_#E63E8A] hover:bg-[#00F5F3] hover:shadow-[inset_0_2px_6px_rgba(0,140,140,0.7)] transition duration-300">Sign In</button>
      <button @click="goToCreateAccount" class="mt-6 bg-[#FF56B0] text-white font-bold py-2 px-4 rounded-lg w-xs shadow-[0_4px_0_#E63E8A] hover:bg-[#00F5F3] hover:shadow-[inset_0_2px_6px_rgba(0,140,140,0.7)] transition duration-300">Sign Up</button>
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
}
</style>