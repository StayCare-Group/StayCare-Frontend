import { apiFetch } from './client'

export async function fetchOrders(params?: Record<string, string>) {
  const query = params ? '?' + new URLSearchParams(params).toString() : ''
  return apiFetch(`/api/orders${query}`)
}

/**
 * Fetches ALL orders by requesting a large limit and iterating pages.
 */
export async function fetchAllOrders(params?: Record<string, string>) {
  const allOrders: any[] = []
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
    const data = await apiFetch(`/api/orders${query}`)
    const items = Array.isArray(data) ? data : []

    if (items.length === 0) break

    // Detect duplicate pages (backend ignores page param)
    if (page > 1) {
      const firstId = items[0]?._id ?? items[0]?.id
      if (allOrders.some(o => (o._id ?? o.id) === firstId)) break
    }

    allOrders.push(...items)

    const pagination = (data as any)?._pagination
    if (pagination) {
      const totalPages = pagination.totalPages ?? pagination.pages ?? pagination.total_pages ?? pagination.lastPage ?? 0
      if (totalPages && page >= totalPages) break
    }

    if (items.length < 200) break
    page++
  }

  return allOrders
}

export async function fetchOrderById(id: string) {
  return apiFetch(`/api/orders/${id}`)
}

export async function createOrder(payload: any) {
  return apiFetch('/api/orders', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function updateOrderStatus(id: string, status: string) {
  return apiFetch(`/api/orders/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  })
}

export async function confirmPickup(id: string, payload: any) {
  return apiFetch(`/api/orders/${id}/pickup`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export async function receiveAtFacility(id: string, payload: any) {
  return apiFetch(`/api/orders/${id}/receive`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export async function confirmDelivery(id: string, payload: any) {
  return apiFetch(`/api/orders/${id}/deliver`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export async function reassignOrder(orderId: string, driverId: string) {
  return apiFetch(`/api/orders/${orderId}/reassign`, {
    method: 'PATCH',
    body: JSON.stringify({ driver_id: driverId }),
  })
}

export async function rescheduleOrder(id: string, payload: { pickup_date: string; pickup_window?: any }) {
  return apiFetch(`/api/orders/${id}/reschedule`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

const STATUS_MAP: Record<string, string> = {
  Pending: 'Pending Pickup',
  Assigned: 'Pending Pickup',
  Transit: 'In Transit',
  Arrived: 'Received at Facility',
  QualityCheck: 'Quality Control',
  ReadyToDeliver: 'Ready for Delivery',
  Collected: 'Out for Delivery',
  Invoiced: 'Completed',
}

export function mapStatus(backendStatus: string): string {
  return STATUS_MAP[backendStatus] ?? backendStatus
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
  const d = new Date(dateStr)
  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}

function formatDateTime(dateStr: string): string {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return `${formatDate(dateStr)} ${formatTime(dateStr)}`
}

export function mapOrderForList(o: any) {
  return {
    id: o.order_number ?? o._id ?? o.id,
    _id: o._id ?? o.id,
    client: o.client?.company_name ?? o.client ?? '',
    clientId: o.client?._id ?? '',
    pickupDate: formatDate(o.pickup_date),
    serviceType: o.service_type === 'express' ? 'Express (24h)' : 'Standard (48h)',
    estimatedBags: o.estimated_bags ?? 0,
    actualBags: o.actual_bags ?? null,
    status: mapStatus(o.status),
    total: o.pricing_snapshot?.total ?? 0,
    specialNotes: o.special_notes ?? '',
  }
}

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

export function mapOrderForDetail(o: any) {
  const clientObj = typeof o.client === 'object' && o.client ? o.client : null
  const clientId = clientObj?._id ?? clientObj?.id ?? (typeof o.client === 'string' ? o.client : '')
  const driverObj = typeof o.driver === 'object' ? o.driver : (typeof o.assigned_driver === 'object' ? o.assigned_driver : null)

  const property = resolveProperty(clientObj, o.property)

  const clientName = clientObj?.company_name ?? clientObj?.name ?? o.client_name ?? ''
  const address = property?.address
    ? `${property.address}, ${property.city ?? ''}`
    : clientObj?.billing_address ?? clientObj?.address ?? o.pickup_address ?? ''

  return {
    id: o.order_number ?? o._id ?? o.id,
    _id: o._id ?? o.id,
    client: clientName,
    clientId,
    pickupAddress: address,
    deliveryAddress: address,
    serviceType: o.service_type === 'express' ? 'Express (24h)' : 'Standard (48h)',
    status: mapStatus(o.status),
    createdAt: o.created_at ?? '',
    pickupDate: formatDate(o.pickup_date),
    pickupTimeWindow: o.pickup_window
      ? `${formatTime(o.pickup_window.start_time)} - ${formatTime(o.pickup_window.end_time)}`
      : '',
    estimatedBags: o.estimated_bags ?? 0,
    actualBags: o.actual_bags ?? null,
    specialNotes: o.special_notes ?? '',
    driverPickup: driverObj?.name ?? null,
    driverDelivery: driverObj?.name ?? null,
    items: (o.items ?? []).map((i: any) => ({
      code: i.item_code,
      name: i.name,
      qty: i.quantity ?? 0,
      unitPrice: i.unit_price ?? 0,
    })),
    timeline: (o.status_history ?? []).map((h: any) => ({
      status: mapStatus(h.status),
      date: formatDateTime(h.timestamp),
      note: '',
    })),
    total: o.pricing_snapshot?.total ?? 0,
  }
}
