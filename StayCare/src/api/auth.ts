const API = import.meta.env.VITE_BACKEND_URL || ''

async function unwrap(res: Response) {
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw json
  return json.data ?? json
}

export async function loginUser(payload: { email: string; password: string }) {
  const res = await fetch(`${API}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  })
  return unwrap(res)
}

export async function refreshAuth() {
  const res = await fetch(`${API}/api/auth/refresh`, {
    method: 'POST',
    credentials: 'include',
  })
  if (!res.ok) throw new Error('refresh failed')
  const json = await res.json()
  return json.data ?? json
}

export async function logoutUser() {
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
  const res = await fetch(`${API}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  })
  return unwrap(res)
}

export async function forgotPassword(email: string) {
  const res = await fetch(`${API}/api/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  })
  return unwrap(res)
}

export async function resetPassword(token: string, password: string) {
  const res = await fetch(`${API}/api/auth/reset-password/${token}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  })
  return unwrap(res)
}
