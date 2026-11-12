import { apiFetch } from './client'

export interface DashboardOverviewParams {
  from: string
  to: string
  clientId?: string
}

export interface DashboardItemsInProcess {
  washing: number
  drying: number
  ironing: number
  qualityCheck: number
}

export interface DashboardItemConditions {
  good: number
  bad: number
  stained: number
  total: number
}

export interface DashboardOverviewResponse {
  ordersReceived: number
  itemsTotal: number
  itemsPending: number
  itemsProcessed: number
  itemsDelivered: number
  ordersToPickup: number
  ordersToDeliver: number
  itemsInProcess: DashboardItemsInProcess
  itemConditions: DashboardItemConditions
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

export type DashboardComparisonIndicatorKey =
  | 'totalItems'
  | 'totalOrders'
  | 'totalStained'
  | 'totalInvoiced'

export interface DashboardMonthlyComparisonRow {
  key: DashboardComparisonIndicatorKey
  monthA: number
  monthB: number
  difference: number
  variationPercent: number | null
}

export interface DashboardMonthlyComparisonResponse {
  monthA: string
  monthB: string
  rows: DashboardMonthlyComparisonRow[]
}

export interface FetchDashboardComparisonParams {
  monthA: string
  monthB: string
  clientId?: string
}

export async function fetchDashboardComparison(
  params: FetchDashboardComparisonParams
): Promise<DashboardMonthlyComparisonResponse> {
  const query = new URLSearchParams()
  query.set('monthA', params.monthA)
  query.set('monthB', params.monthB)
  if (params.clientId) {
    query.set('clientId', params.clientId)
  }
  return apiFetch(`/api/reports/dashboard/comparison?${query.toString()}`)
}

