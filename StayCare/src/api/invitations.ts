import { apiFetch } from './client'

export async function createInvitation(payload: { email: string; role: string }) {
  return apiFetch('/api/invitations', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function fetchInvitations() {
  return apiFetch('/api/invitations')
}

export async function validateInvitation(token: string) {
  return apiFetch(`/api/invitations/${token}/validate`)
}

export async function registerViaInvitation(
  token: string,
  payload: { name: string; password: string; phone?: string; language?: string },
) {
  return apiFetch(`/api/invitations/${token}/register`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}
