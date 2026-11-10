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

export type DashboardSeriesGranularity = 'day' | 'month'

export interface DashboardOrdersPoint {
  date: string
  orders: number
}

export interface DashboardOrdersSeriesResponse {
  granularity: DashboardSeriesGranularity
  points: DashboardOrdersPoint[]
}

function buildDashboardFilterQuery(params: DashboardOverviewParams): string {
  const query = new URLSearchParams({
    from: params.from,
    to: params.to,
  })
  if (params.clientId) {
    query.set('clientId', params.clientId)
  }
  return query.toString()
}

export async function fetchDashboardStats() {
  return apiFetch('/api/reports/dashboard')
}

export async function fetchDashboardOverview(
  params: DashboardOverviewParams
): Promise<DashboardOverviewResponse> {
  return apiFetch(`/api/reports/dashboard/overview?${buildDashboardFilterQuery(params)}`)
}

export async function fetchDashboardDailyOrders(
  params: DashboardOverviewParams
): Promise<DashboardOrdersSeriesResponse> {
  return apiFetch(`/api/reports/dashboard/daily-orders?${buildDashboardFilterQuery(params)}`)
}

export interface DashboardAlertItem {
  orderId: string
  orderNumber: string
  clientId: string
  clientName: string
  status: string
  hoursDelayed: number
  referenceDate: string
}

export interface DashboardAlertsResponse {
  thresholdHours: number
  totalAlerts: number
  overduePickups: DashboardAlertItem[]
  stalledOrders: DashboardAlertItem[]
}

export async function fetchDashboardAlerts(
  params?: { clientId?: string }
): Promise<DashboardAlertsResponse> {
  const query = params?.clientId ? `?clientId=${encodeURIComponent(params.clientId)}` : ''
  return apiFetch(`/api/reports/dashboard/alerts${query}`)
}
