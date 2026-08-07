import { apiFetch } from './client'
import {
  normalizeStatus,
  getRouteStopProgressStatus,
  getRouteTypeFromOrderStatus,
} from '../utils/orderFlow'
import { getClientAddress, getClientDisplayName } from '../utils/client'

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

export async function fetchAllRoutes(params?: Record<string, string>) {
  const allRoutes: any[] = []
  let page = 1
  const maxPages = 50

  while (page <= maxPages) {
    const merged: Record<string, string> = {
      ...params,
      page: String(page),
      limit: '200',
      per_page: '200',
      pageSize: '200',
    }
    const query = '?' + new URLSearchParams(merged).toString()
    const data = await apiFetch(`/api/routes${query}`)
    const items = Array.isArray(data) ? data : []

    if (items.length === 0) break

    if (page > 1) {
      const firstId = items[0]?._id ?? items[0]?.id
      if (allRoutes.some(r => (r._id ?? r.id) === firstId)) break
    }

    allRoutes.push(...items)

    const pagination = (data as any)?._pagination
    if (pagination) {
      const totalPages = pagination.totalPages ?? pagination.pages ?? pagination.total_pages ?? pagination.lastPage ?? 0
      if (totalPages && page >= totalPages) break
    }

    if (items.length < 200) break
    page++
  }

  return allRoutes
}

export async function fetchRoutesByDriver(driverId: string | number) {
  return fetchAllRoutes({ driver: String(driverId) })
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
  // For ISO datetimes returned from DATE-like backend fields, keep the literal date part
  // to avoid timezone shifts in the route calendar.
  if (/^\d{4}-\d{2}-\d{2}T/.test(s)) return s.slice(0, 10)

  // Fallback for any other date string.
  const d = new Date(s)
  if (isNaN(d.getTime())) return ''
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

function formatTime(dateStr: string): string {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}

export function mapRouteForDriver(route: any) {
  const driverObj = typeof route.driver === 'object' ? route.driver : null
  const routeId = route._id ?? route.id
  const orders = Array.isArray(route.orders) ? route.orders : []
  const completedCount = orders.filter(
    (o: any) => {
      const s = normalizeStatus(o.status)
      return s === 'delivered' || s === 'completed' || s === 'invoiced'
    }
  ).length
  const pickupCount = orders.filter((o: any) => getRouteTypeFromOrderStatus(o.status) === 'Pickup').length
  const deliveryCount = orders.length - pickupCount

  return {
    _id: routeId,
    id: routeId,
    driverId: route.driver_id ?? driverObj?._id ?? driverObj?.id ?? null,
    driverName: route.driver_name ?? driverObj?.name ?? '',
    driverEmail: route.driver_email ?? driverObj?.email ?? '',
    driverPhone: route.driver_phone ?? driverObj?.phone ?? '',
    date: formatDate(route.route_date ?? route.date),
    vehiclePlate: '',
    totalStops: orders.length,
    completedStops: completedCount,
    pickupStops: pickupCount,
    deliveryStops: deliveryCount,
    status: route.status ?? 'planned',
    stops: orders.map((o: any, idx: number) => {
      const clientObj = typeof o.client === 'object' ? o.client : null
      const property = resolveProperty(clientObj, o.property)
      const addr = property?.address
        ? `${property.address}${property.city ? ', ' + property.city : ''}`
        : (o.property_address
            ? `${o.property_address}${o.property_city ? ', ' + o.property_city : ''}`
            : '') ||
          (clientObj ? getClientAddress(clientObj) : '') ||
          o.pickup_address ||
          o.delivery_address ||
          ''
      const fallbackClient = o.client_name ?? o.client_company ?? o.client_contact ?? ''
      const company = clientObj?.company_name ?? clientObj?.company ?? o.client_company ?? o.client_name ?? ''
      const contactPerson = clientObj?.contact_name ?? clientObj?.contact_person ?? o.client_contact ?? o.client_name ?? ''
      const clientPhone = clientObj?.phone ?? clientObj?.contact_phone ?? o.client_phone ?? ''
      const area = property?.area ?? o.property_area ?? o.area ?? ''
      const startWindow = o.pickup_window?.start_time ?? o.pickup_window_start
      const endWindow = o.pickup_window?.end_time ?? o.pickup_window_end
      return {
        id: idx + 1,
        orderId: o.order_number ?? o.order_id ?? o._id ?? o.id,
        _id: o._id ?? o.id ?? o.order_id ?? `${routeId}-stop-${idx + 1}`,
        routeId,
        client: clientObj ? getClientDisplayName(clientObj) : fallbackClient,
        company,
        contactPerson,
        clientPhone,
        area,
        address: addr,
        type: getRouteTypeFromOrderStatus(o.status),
        timeWindow: startWindow && endWindow
          ? `${formatTime(startWindow)} - ${formatTime(endWindow)}`
          : '',
        estimatedBags: o.estimated_bags ?? 0,
        actualBags: o.actual_bags ?? null,
        status: getRouteStopProgressStatus(o.status),
        originalStatus: normalizeStatus(o.status),
        notes: o.special_notes ?? '',
        photos: [],
        signature: false,
      }
    }),
  }
}
