import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { loginUser, refreshAuth, logoutUser } from '../api/auth'
import { fetchMe } from '../api/users'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)       // normalized user with client/clientId when available
  const loading = ref(true)    // true while checking session on boot

  const isLoggedIn = computed(() => !!user.value)
  const userRole = computed(() => user.value?.role ?? null)

  async function loadCurrentUser() {
    const data = await fetchMe()
    const raw = data?.user ?? data ?? null
    if (!raw) {
      user.value = null
      return null
    }

    const clientObj = raw.client && typeof raw.client === 'object' ? raw.client : null

    user.value = {
      id: raw._id ?? raw.id,
      name: raw.name,
      email: raw.email,
      role: raw.role,
      phone: raw.phone,
      clientId: clientObj?._id ?? (typeof raw.client === 'string' ? raw.client : null),
      client: clientObj ?? null,
    }

    return user.value
  }

  async function login(email, password) {
    await loginUser({ email, password })
    return loadCurrentUser()
  }

  async function logout() {
    try {
      await logoutUser()
    } catch {
      // server may already have cleared the cookie
    }
    user.value = null
  }

  async function tryRefresh() {
    loading.value = true
    try {
      await refreshAuth()
      await loadCurrentUser()
    } catch {
      user.value = null
    } finally {
      loading.value = false
    }
  }

  return { user, loading, isLoggedIn, userRole, login, logout, tryRefresh }
})
