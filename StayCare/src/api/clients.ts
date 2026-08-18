import { apiFetch } from './client'
import { normalizeClient, normalizeClients } from '../utils/client'

export async function fetchClients(activeOnly = true) {
  const query = activeOnly ? '?is_active=true&limit=200' : '?limit=200'
  const data = await apiFetch(`/api/clients${query}`)
  return normalizeClients(data)
}

export async function fetchClientById(id: string) {
  const data = await apiFetch(`/api/clients/${id}`)
  return normalizeClient(data)
}
