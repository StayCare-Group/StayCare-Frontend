const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || ''

/**
 * Generic fetch wrapper that always sends credentials (httpOnly cookies).
 * Automatically unwraps the { success, message, data } envelope the backend returns.
 */
export async function apiFetch(path: string, options: RequestInit = {}) {
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
    throw new Error('Unauthorized')
  }

  const json = await res.json().catch(() => ({}))

  if (!res.ok) {
    throw json
  }

  return json.data ?? json
}