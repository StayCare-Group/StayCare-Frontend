import { apiFetch } from './client'

export async function fetchDashboardStats() {
  return apiFetch('/api/reports/dashboard')
}

export async function fetchSlaMetrics() {
  return apiFetch('/api/reports/sla')
}
