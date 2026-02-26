import { apiFetch } from './client'

export async function fetchUsers(params?: Record<string, string>) {
  const query = params ? '?' + new URLSearchParams(params).toString() : ''
  return apiFetch(`/api/users${query}`)
}

export async function fetchUserById(id: string) {
  return apiFetch(`/api/users/${id}`)
}

export async function fetchMe() {
  return apiFetch('/api/auth/me')
}
