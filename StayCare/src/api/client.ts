import { isMockEnabled, mockApiFetch } from './mock'
import router from '../router'
import { useAuthStore } from '../stores/auth.js'

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || ''
let apiRequestsBlocked = false
const activeControllers = new Set<AbortController>()

export function setApiRequestsBlocked(blocked: boolean) {
  apiRequestsBlocked = blocked
}

export function areApiRequestsBlocked() {
  return apiRequestsBlocked
}

export function abortActiveApiRequests() {
  for (const controller of activeControllers) {
    controller.abort()
  }
  activeControllers.clear()
}

/**
 * Generic fetch wrapper that always sends credentials (httpOnly cookies).
 * Automatically unwraps the { success, message, data } envelope the backend returns.
 */
export async function apiFetch(path: string, options: RequestInit = {}) {
  if (isMockEnabled) {
    return mockApiFetch(path, options)
  }

  if (apiRequestsBlocked) {
    throw new Error('ApiRequestsBlocked')
  }

  const headers: Record<string, string> = { ...options.headers as any }
  // Only set Content-Type on requests that have a body (POST, PATCH, PUT)
  if (options.body) {
    headers['Content-Type'] = headers['Content-Type'] ?? 'application/json'
  }

  const controller = new AbortController()
  activeControllers.add(controller)
  if (options.signal) {
    if (options.signal.aborted) {
      controller.abort()
    } else {
      options.signal.addEventListener('abort', () => controller.abort(), { once: true })
    }
  }

  let res: Response
  try {
    res = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      credentials: 'include',
      headers,
      signal: controller.signal,
    })
  } finally {
    activeControllers.delete(controller)
  }

  if (res.status === 401) {
    if (apiRequestsBlocked) {
      throw new Error('ApiRequestsBlocked')
    }
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