import { apiFetch } from './client'

export async function fetchClients() {
  return apiFetch('/api/clients')
}

export async function fetchClientById(id: string) {
  return apiFetch(`/api/clients/${id}`)
}

export async function createSelfClient(payload: any) {
  return apiFetch('/api/clients/self', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}
