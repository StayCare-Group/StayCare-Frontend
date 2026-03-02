import { apiFetch } from './client'

export async function fetchMachineStatus() {
  return apiFetch('/api/facility/machines')
}

