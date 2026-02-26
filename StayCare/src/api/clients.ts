import { apiFetch } from './client'

export async function fetchClients() {
  return apiFetch('/api/clients')
}

export async function fetchClientById(id: string) {
  return apiFetch(`/api/clients/${id}`)
}
