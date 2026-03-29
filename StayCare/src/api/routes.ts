import { apiFetch } from './client'
import { mapStatus } from './orders'

function resolveProperty(clientObj: any, propertyId: any): any {
  if (!clientObj?.properties?.length) return null
  if (propertyId) {
    const match = clientObj.properties.find(
      (p: any) => p._id?.toString() === propertyId?.toString()
    )
    if (match) return match
  }
  return clientObj.properties[0]
}

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

export async function deleteRoute(id: string) {
  return apiFetch(`/api/routes/${id}`, { method: 'DELETE' })
}

function formatDate(dateStr: string): string {
  if (!dateStr) return ''
  const s = String(dateStr)
  // Plain YYYY-MM-DD with no time component – return as-is
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s
  // ISO datetime (e.g. "2026-03-09T23:00:00.000Z") – parse and use LOCAL date parts
  // so the browser's timezone (Malta UTC+1) resolves to the correct calendar day
  const d = new Date(s)
  if (isNaN(d.getTime())) return ''
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
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
  const pickupCount = orders.filter((o: any) => resolveStopType(o.status) === 'Pickup').length
  const deliveryCount = orders.length - pickupCount

  return {
    _id: route._id,
    driverName: driverObj?.name ?? '',
    date: formatDate(route.route_date),
    vehiclePlate: '',
    totalStops: orders.length,
    completedStops: completedCount,
    pickupStops: pickupCount,
    deliveryStops: deliveryCount,
    status: route.status,
    stops: orders.map((o: any, idx: number) => {
      const clientObj = typeof o.client === 'object' ? o.client : null
      const property = resolveProperty(clientObj, o.property)
      const addr = property?.address
        ? `${property.address}${property.city ? ', ' + property.city : ''}`
        : clientObj?.billing_address ?? clientObj?.address ?? o.pickup_address ?? o.delivery_address ?? ''
      return {
        id: idx + 1,
        orderId: o.order_number ?? o._id,
        _id: o._id,
        client: clientObj?.company_name ?? clientObj?.name ?? '',
        address: addr,
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
