import { isMockEnabled, mockApiFetch } from './mock'
import router from '../router'
import { useAuthStore } from '../stores/auth.js'

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || ''

/**
 * Generic fetch wrapper that always sends credentials (httpOnly cookies).
 * Automatically unwraps the { success, message, data } envelope the backend returns.
 */
export async function apiFetch(path: string, options: RequestInit = {}) {
  if (isMockEnabled) {
    return mockApiFetch(path, options)
  }

  const headers: Record<string, string> = { ...options.headers as any }
  // Only set Content-Type on requests that have a body (POST, PATCH, PUT)
  if (options.body) {
    headers['Content-Type'] = headers['Content-Type'] ?? 'application/json'
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    credentials: 'include',
    headers,
  })

  if (res.status === 401) {
    // Session expired: clear local auth state and navigate without full page reload.
    try {
      const auth = useAuthStore()
      auth.user = null
      if (router.currentRoute.value.name !== 'LogorCreate') {
        router.push({ name: 'LogorCreate' })
      }
    } catch {
      // If store/router is not ready yet, fallback to a hard navigation.
      window.location.href = '/LogorCreate'
    }
    throw new Error('Unauthorized')
  }

  const json = await res.json().catch(() => ({}))

  if (!res.ok) {
    throw json
  }

  const data = json.data ?? json
  if (json.pagination && Array.isArray(data)) {
    ;(data as any)._pagination = json.pagination
  }
  return data
}