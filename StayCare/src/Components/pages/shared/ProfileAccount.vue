<template>
  <div class="space-y-6 max-w-3xl">
    <div>
      <h2 class="text-lg font-semibold text-white">{{ $t('profile.title') }}</h2>
      <p class="text-sm text-brand-150 mt-1">{{ $t('profile.subtitle') }}</p>
    </div>

    <div class="bg-white rounded-xl shadow-sm p-5 space-y-4">
      <div class="flex items-start justify-between gap-3 flex-wrap">
        <h3 class="text-sm font-semibold text-gray-700 uppercase tracking-wide">{{ $t('profile.infoTitle') }}</h3>
        <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-brand-150 text-brand-800">
          {{ roleLabel }}
        </span>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-600 mb-1">{{ $t('settings.fullName') }}</label>
          <input
            v-model="profile.name"
            type="text"
            class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-400 focus:border-transparent outline-none"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-600 mb-1">{{ $t('settings.phone') }}</label>
          <input
            v-model="profile.phone"
            type="tel"
            class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-400 focus:border-transparent outline-none"
          />
        </div>

        <div class="sm:col-span-2">
          <label class="block text-sm font-medium text-gray-600 mb-1">{{ $t('settings.email') }}</label>
          <input
            :value="profile.email"
            type="email"
            readonly
            class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-500 cursor-not-allowed"
          />
        </div>
      </div>

      <div class="flex justify-start">
        <AppButton @click="saveProfile" :loading="savingProfile" size="lg">
          {{ savingProfile ? $t('common.saving') : $t('profile.updateProfile') }}
        </AppButton>
      </div>
    </div>

    <div class="bg-white rounded-xl shadow-sm p-5 space-y-4">
      <h3 class="text-sm font-semibold text-gray-700 uppercase tracking-wide">{{ $t('profile.securityTitle') }}</h3>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div class="sm:col-span-2">
          <label class="block text-sm font-medium text-gray-600 mb-1">{{ $t('settings.currentPassword') }}</label>
          <input
            v-model="passwords.current"
            type="password"
            placeholder="••••••••"
            class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-400 focus:border-transparent outline-none"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-600 mb-1">{{ $t('settings.newPassword') }}</label>
          <input
            v-model="passwords.newPass"
            type="password"
            placeholder="••••••••"
            class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-400 focus:border-transparent outline-none"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-600 mb-1">{{ $t('settings.confirmPassword') }}</label>
          <input
            v-model="passwords.confirm"
            type="password"
            placeholder="••••••••"
            class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-400 focus:border-transparent outline-none"
          />
        </div>
      </div>

      <p v-if="passwordError" class="text-xs text-red-500">{{ passwordError }}</p>

      <div class="flex justify-start">
        <AppButton @click="savePassword" :loading="savingPassword" size="lg" variant="secondary">
          {{ savingPassword ? $t('common.saving') : $t('profile.changePassword') }}
        </AppButton>
      </div>
    </div>

    <!-- Properties section: visible to client-role users who have a linked client record -->
    <ClientPropertiesManager
      v-if="(isClientRole || ownClientId) && ownClientId"
      :client-id="ownClientId"
    />

    <!-- Debug hint (only during dev): shown when role is client but no clientId is linked -->
    <div
      v-if="isClientRole && !ownClientId"
      class="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-700"
    >
      {{ $t('profile.noClientLinked') }}
    </div>

    <div v-if="showSuccess" class="fixed bottom-6 right-6 bg-green-600 text-white px-5 py-3 rounded-lg shadow-lg text-sm font-medium z-50">
      {{ showSuccess }}
    </div>
    <div v-if="showError" class="fixed bottom-6 right-6 bg-red-600 text-white px-5 py-3 rounded-lg shadow-lg text-sm font-medium z-50">
      {{ showError }}
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '../../../stores/auth.js'
import { changePassword, fetchMe, updateMe } from '../../../api/users'
import AppButton from '../../ui/AppButton.vue'
import ClientPropertiesManager from './ClientPropertiesManager.vue'

const { t } = useI18n()
const authStore = useAuthStore()

const profile = reactive({
  name: '',
  email: '',
  phone: '',
  role: '',
})

const passwords = reactive({
  current: '',
  newPass: '',
  confirm: '',
})

const passwordError = ref('')
const savingProfile = ref(false)
const savingPassword = ref(false)
const showSuccess = ref('')
const showError = ref('')
const ownClientId = ref('')

// 'user' is the legacy backend role for clients
const isClientRole = computed(() => {
  const r = String(profile.role || authStore.user?.role || '').toLowerCase()
  return r === 'client' || r === 'user'
})

const roleLabel = computed(() => {
  const role = String(profile.role || authStore.user?.role || '').toLowerCase()
  if (role === 'admin') return t('profile.roleAdmin')
  if (role === 'driver') return t('profile.roleDriver')
  if (role === 'staff') return t('profile.roleFacility')
  return t('profile.roleClient')
})

function showToast(type, message) {
  if (type === 'success') {
    showSuccess.value = message
    setTimeout(() => {
      showSuccess.value = ''
    }, 2200)
    return
  }
  showError.value = message
  setTimeout(() => {
    showError.value = ''
  }, 2600)
}

async function loadProfile() {
  try {
    const data = await fetchMe()
    const user = data?.user ?? data ?? {}
    profile.name = user.name ?? authStore.user?.name ?? ''
    profile.email = user.email ?? authStore.user?.email ?? ''
    profile.phone = user.phone ?? ''
    profile.role = user.role ?? authStore.user?.role ?? ''
    ownClientId.value =
      (typeof user.client === 'object' ? user.client?._id : user.client) ||
      authStore.user?.clientId ||
      ''
  } catch {
    profile.name = authStore.user?.name ?? ''
    profile.email = authStore.user?.email ?? ''
    profile.phone = authStore.user?.phone ?? ''
    profile.role = authStore.user?.role ?? ''
    ownClientId.value = authStore.user?.clientId ?? ''
  }
}

async function saveProfile() {
  if (savingProfile.value) return
  savingProfile.value = true
  showError.value = ''

  try {
    await updateMe({
      name: profile.name,
      phone: profile.phone,
    })
    await authStore.loadCurrentUser()
    showToast('success', t('profile.profileUpdated'))
  } catch (err) {
    showToast('error', err?.message || err?.error || t('profile.saveFailed'))
  } finally {
    savingProfile.value = false
  }
}

async function savePassword() {
  if (savingPassword.value) return
  passwordError.value = ''

  if (!passwords.current || !passwords.newPass || !passwords.confirm) {
    passwordError.value = t('profile.passwordRequired')
    return
  }
  if (passwords.newPass !== passwords.confirm) {
    passwordError.value = t('settings.passwordMismatch')
    return
  }
  if (passwords.newPass.length < 6) {
    passwordError.value = t('settings.passwordTooShort')
    return
  }

  savingPassword.value = true
  showError.value = ''

  try {
    await changePassword(passwords.current, passwords.newPass)
    passwords.current = ''
    passwords.newPass = ''
    passwords.confirm = ''
    showToast('success', t('profile.passwordUpdated'))
  } catch (err) {
    passwordError.value = err?.message || err?.error || t('profile.passwordFailed')
  } finally {
    savingPassword.value = false
  }
}

onMounted(loadProfile)
</script>
