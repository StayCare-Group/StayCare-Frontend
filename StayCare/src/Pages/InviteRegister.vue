<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth.js'
import { validateInvitation, registerViaInvitation } from '../api/invitations'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const token = route.params.token
const inviteEmail = ref('')
const inviteRole = ref('')
const expiresAt = ref('')

const name = ref('')
const password = ref('')
const confirmPassword = ref('')
const phone = ref('')

const error = ref('')
const loading = ref(true)
const submitting = ref(false)
const expired = ref(false)
const invalid = ref(false)

onMounted(async () => {
  try {
    const data = await validateInvitation(token)
    inviteEmail.value = data.invitation.email
    inviteRole.value = data.invitation.role
    expiresAt.value = data.invitation.expires_at
  } catch (err) {
    if (err?.message?.includes('expired') || err?.status === 410) {
      expired.value = true
    } else {
      invalid.value = true
    }
  } finally {
    loading.value = false
  }
})

const roleLabel = (role) => {
  const map = { admin: 'Admin', driver: 'Driver', staff: 'Staff' }
  return map[role] || role
}

const handleRegister = async () => {
  if (!name.value || !password.value) {
    error.value = 'Please fill in your name and password.'
    return
  }
  if (password.value.length < 6) {
    error.value = 'Password must be at least 6 characters.'
    return
  }
  if (password.value !== confirmPassword.value) {
    error.value = 'Passwords do not match.'
    return
  }

  try {
    error.value = ''
    submitting.value = true
    await registerViaInvitation(token, {
      name: name.value,
      password: password.value,
      phone: phone.value || undefined,
    })
    await auth.loadCurrentUser()
    router.push('/dashboard')
  } catch (err) {
    error.value = err?.message || 'Registration failed. The link may have expired.'
  } finally {
    submitting.value = false
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

    <!-- Loading -->
    <div v-if="loading" class="flex flex-col items-center justify-center bg-white px-8 py-12 rounded-lg shadow-lg max-w-md w-full" style="position: relative; z-index: 1;">
      <div class="w-8 h-8 border-4 border-[#FF56B0] border-t-transparent rounded-full animate-spin"></div>
      <p class="mt-4 text-gray-500">Validating invitation...</p>
    </div>

    <!-- Invalid / Not Found -->
    <div v-else-if="invalid" class="flex flex-col items-center justify-center bg-white px-8 py-12 rounded-lg shadow-lg max-w-md w-full" style="position: relative; z-index: 1;">
      <h1 class="text-2xl font-bold text-red-500">Invalid Invitation</h1>
      <p class="mt-4 text-gray-600 text-center">This invitation link is invalid or has already been used.</p>
      <button @click="router.push('/logorcreate')" class="mt-6 bg-[#FF56B0] text-white font-bold py-2 px-6 rounded-lg shadow-[0_4px_0_#E63E8A] hover:bg-[#00F5F3] hover:shadow-[inset_0_2px_6px_rgba(0,140,140,0.7)] transition duration-300">
        Go to Login
      </button>
    </div>

    <!-- Expired -->
    <div v-else-if="expired" class="flex flex-col items-center justify-center bg-white px-8 py-12 rounded-lg shadow-lg max-w-md w-full" style="position: relative; z-index: 1;">
      <h1 class="text-2xl font-bold text-amber-500">Invitation Expired</h1>
      <p class="mt-4 text-gray-600 text-center">This invitation link has expired. Please ask your administrator to send a new one.</p>
      <button @click="router.push('/logorcreate')" class="mt-6 bg-[#FF56B0] text-white font-bold py-2 px-6 rounded-lg shadow-[0_4px_0_#E63E8A] hover:bg-[#00F5F3] hover:shadow-[inset_0_2px_6px_rgba(0,140,140,0.7)] transition duration-300">
        Go to Login
      </button>
    </div>

    <!-- Registration Form -->
    <div v-else class="flex flex-col items-center justify-center bg-white px-8 py-10 rounded-lg shadow-lg max-w-md w-full" style="position: relative; z-index: 1;">
      <h1 class="text-3xl font-bold text-center text-[#FF56B0]">Join StayFresh</h1>

      <div class="mt-4 bg-[#F5E7EC] rounded-lg px-4 py-3 w-full text-center">
        <p class="text-sm text-gray-600">You're joining as</p>
        <p class="text-lg font-bold text-[#FF56B0]">{{ roleLabel(inviteRole) }}</p>
        <p class="text-xs text-gray-500 mt-1">{{ inviteEmail }}</p>
      </div>

      <input
        type="text"
        placeholder="Full name"
        v-model="name"
        class="mt-6 border-2 border-[#B8B8B8] bg-[#F5E7EC] rounded-lg px-4 py-2 w-full focus:outline-none focus:border-[#FF56B0] focus:ring-2 focus:ring-[#FF56B0]/40"
      />

      <input
        type="tel"
        placeholder="Phone"
        v-model="phone"
        class="mt-3 border-2 border-[#B8B8B8] bg-[#F5E7EC] rounded-lg px-4 py-2 w-full focus:outline-none focus:border-[#FF56B0] focus:ring-2 focus:ring-[#FF56B0]/40"
      />

      <input
        type="password"
        placeholder="Password"
        v-model="password"
        class="mt-3 border-2 border-[#B8B8B8] bg-[#F5E7EC] rounded-lg px-4 py-2 w-full focus:outline-none focus:border-[#FF56B0] focus:ring-2 focus:ring-[#FF56B0]/40"
      />

      <input
        type="password"
        placeholder="Confirm password"
        v-model="confirmPassword"
        class="mt-3 border-2 border-[#B8B8B8] bg-[#F5E7EC] rounded-lg px-4 py-2 w-full focus:outline-none focus:border-[#FF56B0] focus:ring-2 focus:ring-[#FF56B0]/40"
      />

      <p v-if="error" class="text-red-500 text-sm mt-3 text-center">{{ error }}</p>

      <button
        @click="handleRegister"
        :disabled="submitting"
        class="mt-6 bg-[#FF56B0] text-white font-bold py-2 px-4 rounded-lg w-full shadow-[0_4px_0_#E63E8A] hover:bg-[#00F5F3] hover:shadow-[inset_0_2px_6px_rgba(0,140,140,0.7)] transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {{ submitting ? 'Creating account...' : 'Create Account' }}
      </button>
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
