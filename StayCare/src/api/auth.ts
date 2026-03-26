import { isMockEnabled, mockAuthCall } from './mock'

const API = import.meta.env.VITE_BACKEND_URL || ''

async function unwrap(res: Response) {
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw json
  return json.data ?? json
}

export async function loginUser(payload: { email: string; password: string }) {
  if (isMockEnabled) {
    return mockAuthCall('login', payload)
  }

  const res = await fetch(`${API}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  })
  return unwrap(res)
}

export async function refreshAuth() {
  if (isMockEnabled) {
    return mockAuthCall('refresh')
  }

  const res = await fetch(`${API}/api/auth/refresh`, {
    method: 'POST',
    credentials: 'include',
  })
  if (!res.ok) throw new Error('refresh failed')
  const json = await res.json()
  return json.data ?? json
}

export async function logoutUser() {
  if (isMockEnabled) {
    return mockAuthCall('logout')
  }

  const res = await fetch(`${API}/api/auth/logout`, {
    method: 'POST',
    credentials: 'include',
  })
  return unwrap(res)
}

export async function registerUser(payload: {
  name: string
  email: string
  password: string
  phone?: string
  language?: string
}) {
  if (isMockEnabled) {
    return mockAuthCall('register', payload)
  }

  const res = await fetch(`${API}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  })
  return unwrap(res)
}

export async function forgotPassword(email: string) {
  if (isMockEnabled) {
    return mockAuthCall('forgotPassword', { email })
  }

  const res = await fetch(`${API}/api/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  })
  return unwrap(res)
}

export async function resetPassword(token: string, password: string) {
  if (isMockEnabled) {
    return mockAuthCall('resetPassword', { token, password })
  }

  const res = await fetch(`${API}/api/auth/reset-password/${token}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  })
  return unwrap(res)
}
