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

export async function updateMe(data: Record<string, any>) {
  return apiFetch('/api/auth/me', {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

export async function changePassword(currentPassword: string, newPassword: string) {
  return apiFetch('/api/auth/password', {
    method: 'PATCH',
    body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
  })
}
