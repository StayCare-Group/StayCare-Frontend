import { apiFetch } from './client'
import { normalizeClient, normalizeClients } from '../utils/client'

export async function fetchClients() {
  const data = await apiFetch('/api/clients')
  return normalizeClients(data)
}

export async function fetchClientById(id: string) {
  const data = await apiFetch(`/api/clients/${id}`)
  return normalizeClient(data)
}
