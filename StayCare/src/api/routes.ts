import { apiFetch } from './client'
import { mapStatus } from './orders'

export async function fetchRoutes(params?: Record<string, string>) {
  const query = params ? '?' + new URLSearchParams(params).toString() : ''
  return apiFetch(`/api/routes${query}`)
}

export async function fetchRouteById(id: string) {
  return apiFetch(`/api/routes/${id}`)
}

export async function updateRouteStatus(id: string, status: string) {
  return apiFetch(`/api/routes/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  })
}

function formatDate(dateStr: string): string {
  if (!dateStr) return ''
  return new Date(dateStr).toISOString().split('T')[0]
}

function formatTime(dateStr: string): string {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}

function resolveStopType(orderStatus: string): string {
  const pickupStatuses = ['Pending', 'Assigned', 'Transit']
  return pickupStatuses.includes(orderStatus) ? 'Pickup' : 'Delivery'
}

function resolveStopStatus(orderStatus: string): string {
  if (['Delivered', 'Completed', 'Invoiced'].includes(orderStatus)) return 'Completed'
  if (['Transit', 'Collected'].includes(orderStatus)) return 'In Transit'
  return 'Pending'
}

export function mapRouteForDriver(route: any) {
  const driverObj = typeof route.driver === 'object' ? route.driver : null
  const orders = route.orders ?? []
  const completedCount = orders.filter(
    (o: any) => ['Delivered', 'Completed', 'Invoiced'].includes(o.status)
  ).length

  return {
    _id: route._id,
    driverName: driverObj?.name ?? '',
    date: formatDate(route.route_date),
    vehiclePlate: '',
    totalStops: orders.length,
    completedStops: completedCount,
    status: route.status,
    stops: orders.map((o: any, idx: number) => {
      const clientObj = typeof o.client === 'object' ? o.client : null
      const property = clientObj?.properties?.[0]
      return {
        id: idx + 1,
        orderId: o.order_number ?? o._id,
        _id: o._id,
        client: clientObj?.company_name ?? '',
        address: property?.address ?? '',
        type: resolveStopType(o.status),
        timeWindow: o.pickup_window
          ? `${formatTime(o.pickup_window?.start_time)} - ${formatTime(o.pickup_window?.end_time)}`
          : '',
        estimatedBags: o.estimated_bags ?? 0,
        actualBags: o.actual_bags ?? null,
        status: resolveStopStatus(o.status),
        notes: o.special_notes ?? '',
        photos: [],
        signature: false,
      }
    }),
  }
}
