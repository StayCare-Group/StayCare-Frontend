import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { loginUser, refreshAuth, logoutUser } from '../api/auth'
import { fetchMe } from '../api/users'
import { useLangStore } from './lang.js'
import { useNavStore } from './nav.js'
import { setApiRequestsBlocked, abortActiveApiRequests } from '../api/client'
import {
  isAdminRole,
  isStaffRole,
  isClientRole,
  isDriverRole,
  isOperatorRole,
  isAdminOrStaffRole,
  isInternalRole,
} from '../constants/roles'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const clientProfile = ref(null)
  const loading = ref(true)

  const isLoggedIn = computed(() => !!user.value)
  const userRole = computed(() => user.value?.role ?? null)

  const isAdmin = computed(() => isAdminRole(user.value?.role))
  const isStaff = computed(() => isStaffRole(user.value?.role))
  const isClient = computed(() => isClientRole(user.value?.role))
  const isDriver = computed(() => isDriverRole(user.value?.role))
  const isOperator = computed(() => isOperatorRole(user.value?.role))
  const isAdminOrStaff = computed(() => isAdminOrStaffRole(user.value?.role))
  const isInternal = computed(() => isInternalRole(user.value?.role))

  function applyLanguage(lang) {
    if (lang && ['en', 'es'].includes(lang)) {
      const langStore = useLangStore()
      langStore.setLocale(lang, { persist: false })
    }
  }

  async function loadCurrentUser() {
    setApiRequestsBlocked(false)
    const data = await fetchMe()
    const raw = data?.user ?? data ?? null
    if (!raw) {
      user.value = null
      clientProfile.value = null
      return null
    }

    const clientObj = raw.client && typeof raw.client === 'object' ? raw.client : null

    user.value = {
      id: raw._id ?? raw.id,
      name: raw.name,
      email: raw.email,
      role: raw.role,
      phone: raw.phone,
      language: raw.language ?? 'en',
      clientId: clientObj?._id ?? (typeof raw.client === 'string' ? raw.client : null),
      client: clientObj ?? null,
    }
    clientProfile.value = data?.client_profile ?? null

    applyLanguage(user.value.language)
    return user.value
  }

  async function login(email, password) {
    await loginUser({ email, password })
    setApiRequestsBlocked(false)
    const me = await loadCurrentUser()
    useNavStore().resetToDashboard()
    return me
  }

  async function logout() {
    setApiRequestsBlocked(true)
    abortActiveApiRequests()
    try {
      await logoutUser()
    } catch {
      // server may already have cleared the cookie
    }
    user.value = null
    clientProfile.value = null
    useNavStore().resetToDashboard()
  }

  async function tryRefresh() {
    loading.value = true
    try {
      setApiRequestsBlocked(false)
      await refreshAuth()
      await loadCurrentUser()
    } catch {
      user.value = null
      clientProfile.value = null
    } finally {
      loading.value = false
    }
  }

  return {
    user,
    clientProfile,
    loading,
    isLoggedIn,
    userRole,
    isAdmin,
    isStaff,
    isClient,
    isDriver,
    isOperator,
    isAdminOrStaff,
    isInternal,
    login,
    logout,
    tryRefresh,
    loadCurrentUser,
    applyLanguage,
  }
})
