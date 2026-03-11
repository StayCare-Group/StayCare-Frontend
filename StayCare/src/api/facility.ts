import { apiFetch } from './client'

export async function fetchMachineStatus() {
  return apiFetch('/api/facility/machines')
}

export async function assignMachine(machineId: string, orderId: string) {
  return apiFetch(`/api/facility/machines/${machineId}/assign`, {
    method: 'POST',
    body: JSON.stringify({ order_id: orderId }),
  })
}

export async function releaseMachine(machineId: string) {
  return apiFetch(`/api/facility/machines/${machineId}/release`, {
    method: 'POST',
  })
}

export async function seedMachines() {
  return apiFetch('/api/facility/machines/seed', {
    method: 'POST',
  })
}
