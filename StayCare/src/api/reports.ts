import { apiFetch } from './client'

export interface DashboardOverviewParams {
  from: string
  to: string
  clientId?: string
}

export interface DashboardOverviewResponse {
  ordersReceived: number
  itemsTotal: number
  itemsPending: number
  itemsProcessed: number
  itemsDelivered: number
}

export async function fetchDashboardStats() {
  return apiFetch('/api/reports/dashboard')
}

export async function fetchDashboardOverview(
  params: DashboardOverviewParams
): Promise<DashboardOverviewResponse> {
  const query = new URLSearchParams({
    from: params.from,
    to: params.to,
  })
  if (params.clientId) {
    query.set('clientId', params.clientId)
  }
  return apiFetch(`/api/reports/dashboard/overview?${query.toString()}`)
}
