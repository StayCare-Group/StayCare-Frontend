import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { loginUser, refreshAuth, logoutUser } from '../api/auth'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)       // { id, role, email, name } | null
  const loading = ref(true)    // true while checking session on boot

  const isLoggedIn = computed(() => !!user.value)
  const userRole = computed(() => user.value?.role ?? null)

  async function login(email, password) {
    const data = await loginUser({ email, password })
    user.value = data.user
    return data.user
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
      const data = await refreshAuth()
      user.value = data.user
    } catch {
      user.value = null
    } finally {
      loading.value = false
    }
  }

  return { user, loading, isLoggedIn, userRole, login, logout, tryRefresh }
})
