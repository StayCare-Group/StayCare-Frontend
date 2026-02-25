const API = import.meta.env.VITE_API_URL || ''

// All requests use credentials: 'include' so httpOnly cookies are sent/received

export async function loginUser(payload: { email: string; password: string }) {
  const res = await fetch(`${API}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw err
  }
  return res.json() // { user: { id, role, email, name } }
}

export async function refreshAuth() {
  const res = await fetch(`${API}/api/auth/refresh`, {
    method: 'POST',
    credentials: 'include',
  })
  if (!res.ok) throw new Error('refresh failed')
  return res.json() // { user: { id, role, email, name } }
}

export async function logoutUser() {
  const res = await fetch(`${API}/api/auth/logout`, {
    method: 'POST',
    credentials: 'include',
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw err
  }
  return res.json()
}

export async function registerUser(payload: {
  name: string
  email: string
  password: string
  phone?: string
  language?: string
}) {
  const res = await fetch(`${API}/api/users/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw err
  }
  return res.json()
}
