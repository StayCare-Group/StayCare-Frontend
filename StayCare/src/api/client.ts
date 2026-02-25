const API_BASE_URL = import.meta.env.VITE_API_URL || ''

/**
 * Generic fetch wrapper that always sends credentials (httpOnly cookies).
 * Use this for any protected API call beyond auth endpoints.
 */
export async function apiFetch(path: string, options: RequestInit = {}) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  if (res.status === 401) {
    // Could attempt a refresh here or let the caller handle it
    throw new Error('Unauthorized')
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw err
  }

  return res.json()
}