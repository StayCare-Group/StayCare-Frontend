<script setup>
import {ref} from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const email = ref('')
const password = ref('')
const error = ref('')

const handleLogin = () => {
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  if (!email.value || !password.value) {
    error.value = 'Please enter both email and password.'
  } 
  else if (!emailPattern.test(email.value)) {
    error.value = 'Please enter a valid email address.'
  } 
  else {
    error.value = ''
    console.log('Logging in with:', email.value, password.value)
    router.push('/App')
}}
</script>

<template>
  <div class="template">
    <div class="flex flex-col items-center justify-center bg-white px-8 py-12 rounded-lg shadow-lg max-w-md w-full">
      <h1 class="text-3xl font-bold text-center text-[#FF56B0]">Login for <span class="text-[#00F5F3]">StayFresh</span> laundry management</h1>
      <input type="email" required placeholder="Email" v-model="email" class="flex justify-center items-center mt-9 border-2 border-[#B8B8B8] bg-[#F5E7EC] rounded-lg px-4 py-1 w-half focus:outline-none focus:border-[#FF56B0] focus:ring-2 focus:ring-[#FF56B0]/40"/>
      <input type="password" placeholder="Password" v-model="password" class="flex justify-center items-center mt-3 border-2 border-[#B8B8B8] bg-[#F5E7EC] rounded-lg px-4 py-1 w-half focus:outline-none focus:border-[#FF56B0] focus:ring-2 focus:ring-[#FF56B0]/40"/>
      <p v-if="error" class="text-red-500 text-sm mt-2">{{ error }}</p>
      <button @click="handleLogin" class="mt-6 bg-[#FF56B0] text-white font-bold py-2 px-4 rounded-lg w-half shadow-[0_4px_0_#E63E8A] hover:bg-[#00F5F3] hover:shadow-[inset_0_2px_6px_rgba(0,140,140,0.7)] transition duration-300">Login</button>
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
  background: linear-gradient(to right, #ff56b0, #00f5f3);
}
</style>