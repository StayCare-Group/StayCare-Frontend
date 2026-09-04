import { apiFetch } from './client'

export async function fetchMachineStatus() {
  return apiFetch('/api/machines', { cache: 'no-store' })
}

export async function assignMachine(machineId: string, orderId: string) {
  return apiFetch(`/api/machines/${machineId}/assign`, {
    method: 'POST',
    body: JSON.stringify({ order_id: orderId }),
  })
}

export async function releaseMachine(machineId: string, orderId?: string) {
  return apiFetch(`/api/machines/${machineId}/release`, {
    method: 'POST',
    ...(orderId ? { body: JSON.stringify({ order_id: orderId }) } : {}),
  })
}
