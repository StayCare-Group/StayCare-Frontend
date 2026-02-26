<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { registerUser } from '../api/auth'
import { createSelfClient } from '../api/clients'
import { useAuthStore } from '../stores/auth.js'

const router = useRouter()
const auth = useAuthStore()

const step = ref('user')
const loading = ref(false)

const email = ref('')
const password = ref('')
const error = ref('')
const username = ref('')
const phone = ref('')

const companyName = ref('')
const contactPerson = ref('')
const clientEmail = ref('')
const clientPhone = ref('')
const vatNumber = ref('')
const billingAddress = ref('')
const pricingTier = ref('standard')

const handleCreateAccount = async () => {
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  const phonePattern = /^\d{10}$/

  if (!password.value || !username.value) {
    error.value = 'Please fill in username and password.'
    return
  }
  if (!email.value && !phone.value) {
    error.value = 'Please provide either an email address or phone number.'
    return
  }
  if (email.value && !emailPattern.test(email.value)) {
    error.value = 'Please enter a valid email address.'
    return
  }
  if (phone.value && !phonePattern.test(phone.value)) {
    error.value = 'Please enter a valid 10-digit phone number.'
    return
  }

  try {
    loading.value = true
    error.value = ''
    await registerUser({
      name: username.value,
      email: email.value,
      password: password.value,
      phone: phone.value || undefined,
    })
    await auth.login(email.value, password.value)

    clientEmail.value = email.value
    clientPhone.value = phone.value
    contactPerson.value = username.value

    step.value = 'client'
  } catch (err) {
    error.value = err?.message || err?.error || 'Registration failed. Please try again.'
  } finally {
    loading.value = false
  }
}

const handleCreateClient = async () => {
  if (!companyName.value || !contactPerson.value || !clientEmail.value || !clientPhone.value || !vatNumber.value || !billingAddress.value) {
    error.value = 'Please fill in all company details.'
    return
  }

  try {
    loading.value = true
    error.value = ''
    await createSelfClient({
      company_name: companyName.value,
      contact_person: contactPerson.value,
      email: clientEmail.value,
      phone: clientPhone.value,
      vat_number: vatNumber.value,
      billing_address: billingAddress.value,
      pricing_tier: pricingTier.value,
    })
    router.push('/Dashboard')
  } catch (err) {
    error.value = err?.message || err?.error || 'Client creation failed. Please try again.'
  } finally {
    loading.value = false
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

    <div
      v-if="step === 'user'"
      class="flex flex-col items-center justify-center bg-white px-8 py-12 rounded-lg shadow-lg max-w-md w-full"
      style="position: relative; z-index: 1;"
    >
      <h1 class="text-3xl font-bold text-center text-[#FF56B0]">
        Create account for <span class="text-[#00F5F3]">StayFresh</span> laundry management
      </h1>
      <input
        type="text"
        placeholder="Username"
        v-model="username"
        class="flex justify-center items-center mt-9 border-2 border-[#B8B8B8] bg-[#F5E7EC] rounded-lg px-4 py-1 w-half focus:outline-none focus:border-[#FF56B0] focus:ring-2 focus:ring-[#FF56B0]/40"
      />
      <input
        type="email"
        required
        placeholder="Email"
        v-model="email"
        class="flex justify-center items-center mt-3 border-2 border-[#B8B8B8] bg-[#F5E7EC] rounded-lg px-4 py-1 w-half focus:outline-none focus:border-[#FF56B0] focus:ring-2 focus:ring-[#FF56B0]/40"
      />
      <input
        type="tel"
        placeholder="Phone Number (optional)"
        v-model="phone"
        class="flex justify-center items-center mt-3 border-2 border-[#B8B8B8] bg-[#F5E7EC] rounded-lg px-4 py-1 w-half focus:outline-none focus:border-[#FF56B0] focus:ring-2 focus:ring-[#FF56B0]/40"
      />
      <input
        type="password"
        placeholder="Password"
        v-model="password"
        class="flex justify-center items-center mt-3 border-2 border-[#B8B8B8] bg-[#F5E7EC] rounded-lg px-4 py-1 w-half focus:outline-none focus:border-[#FF56B0] focus:ring-2 focus:ring-[#FF56B0]/40"
      />
      <p v-if="error" class="text-red-500 text-sm mt-2">{{ error }}</p>
      <button
        @click="handleCreateAccount"
        :disabled="loading"
        class="mt-6 bg-[#FF56B0] text-white font-bold py-2 px-4 rounded-lg w-half shadow-[0_4px_0_#E63E8A] hover:bg-[#00F5F3] hover:shadow-[inset_0_2px_6px_rgba(0,140,140,0.7)] transition duration-300 disabled:opacity-60"
      >
        {{ loading ? 'Creating account...' : 'Create Account' }}
      </button>
    </div>

    <div
      v-else
      class="flex flex-col items-center justify-center bg-white px-8 py-12 rounded-lg shadow-lg max-w-md w-full"
      style="position: relative; z-index: 1;"
    >
      <h1 class="text-3xl font-bold text-center text-[#FF56B0]">
        Tell us about your <span class="text-[#00F5F3]">company</span>
      </h1>
      <input
        type="text"
        placeholder="Company name"
        v-model="companyName"
        class="flex justify-center items-center mt-9 border-2 border-[#B8B8B8] bg-[#F5E7EC] rounded-lg px-4 py-1 w-half focus:outline-none focus:border-[#FF56B0] focus:ring-2 focus:ring-[#FF56B0]/40"
      />
      <input
        type="text"
        placeholder="Contact person"
        v-model="contactPerson"
        class="flex justify-center items-center mt-3 border-2 border-[#B8B8B8] bg-[#F5E7EC] rounded-lg px-4 py-1 w-half focus:outline-none focus:border-[#FF56B0] focus:ring-2 focus:ring-[#FF56B0]/40"
      />
      <input
        type="email"
        placeholder="Company email"
        v-model="clientEmail"
        class="flex justify-center items-center mt-3 border-2 border-[#B8B8B8] bg-[#F5E7EC] rounded-lg px-4 py-1 w-half focus:outline-none focus:border-[#FF56B0] focus:ring-2 focus:ring-[#FF56B0]/40"
      />
      <input
        type="tel"
        placeholder="Company phone"
        v-model="clientPhone"
        class="flex justify-center items-center mt-3 border-2 border-[#B8B8B8] bg-[#F5E7EC] rounded-lg px-4 py-1 w-half focus:outline-none focus:border-[#FF56B0] focus:ring-2 focus:ring-[#FF56B0]/40"
      />
      <input
        type="text"
        placeholder="VAT number"
        v-model="vatNumber"
        class="flex justify-center items-center mt-3 border-2 border-[#B8B8B8] bg-[#F5E7EC] rounded-lg px-4 py-1 w-half focus:outline-none focus:border-[#FF56B0] focus:ring-2 focus:ring-[#FF56B0]/40"
      />
      <input
        type="text"
        placeholder="Billing address"
        v-model="billingAddress"
        class="flex justify-center items-center mt-3 border-2 border-[#B8B8B8] bg-[#F5E7EC] rounded-lg px-4 py-1 w-half focus:outline-none focus:border-[#FF56B0] focus:ring-2 focus:ring-[#FF56B0]/40"
      />
      <select
        v-model="pricingTier"
        class="flex justify-center items-center mt-3 border-2 border-[#B8B8B8] bg-[#F5E7EC] rounded-lg px-4 py-1 w-half focus:outline-none focus:border-[#FF56B0] focus:ring-2 focus:ring-[#FF56B0]/40"
      >
        <option value="standard">Standard</option>
        <option value="premium">Premium</option>
        <option value="enterprise">Enterprise</option>
      </select>
      <p v-if="error" class="text-red-500 text-sm mt-2">{{ error }}</p>
      <button
        @click="handleCreateClient"
        :disabled="loading"
        class="mt-6 bg-[#FF56B0] text-white font-bold py-2 px-4 rounded-lg w-half shadow-[0_4px_0_#E63E8A] hover:bg-[#00F5F3] hover:shadow-[inset_0_2px_6px_rgba(0,140,140,0.7)] transition duration-300 disabled:opacity-60"
      >
        {{ loading ? 'Saving...' : 'Finish setup' }}
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