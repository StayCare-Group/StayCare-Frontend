import { apiFetch } from './client'
import { getClientAddress, getClientDisplayName, getClientId } from '../utils/client'

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
  const raw = String(status ?? '').trim().toLowerCase().replace(/[\s-]+/g, '_')
  const normalizedStatus =
    raw === 'qualitycheck' ? 'quality_check' :
    (raw === 'readytodelivery' || raw === 'readytodeliver') ? 'ready_to_delivery' :
    raw

  return apiFetch(`/api/orders/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status: normalizedStatus }),
  })
}

export async function confirmPickup(id: string, payload: any) {
  const body = {
    status: 'transit',
    actual_bags: payload?.actual_bags,
    photos: payload?.photos,
    notes: payload?.notes,
  }

  return apiFetch(`/api/orders/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  })
}

export async function receiveAtFacility(id: string, payload: any) {
  return apiFetch(`/api/orders/${id}/receive`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export async function confirmDelivery(id: string, payload: any) {
  const body = {
    status: 'delivered',
    photos: payload?.photos,
    notes: payload?.notes,
  }

  return apiFetch(`/api/orders/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify(body),
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
  Assigned: 'Assigned',
  Transit: 'In Transit',
  Arrived: 'Received at Facility',
  QualityCheck: 'Quality Control',
  ReadyToDeliver: 'Ready for Delivery',
  Collected: 'Out for Delivery',
  Invoiced: 'Completed',
}

export function mapStatus(backendStatus: string): string {
  if (!backendStatus) return ''
  const normalized = String(backendStatus)
  const key = normalized.charAt(0).toUpperCase() + normalized.slice(1).toLowerCase()
  return STATUS_MAP[normalized] ?? STATUS_MAP[key] ?? normalized
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
  const clientObj = typeof o.client === 'object' && o.client ? o.client : null
  return {
    id: o.order_number ?? o._id ?? o.id,
    _id: o._id ?? o.id,
    client: clientObj ? getClientDisplayName(clientObj) : (o.client_name ?? o.client ?? ''),
    clientId: clientObj ? getClientId(clientObj) : String(o.client_id ?? ''),
    pickupDate: formatDate(o.pickup_date),
    serviceType: o.service_type === 'express' ? 'Express (24h)' : 'Standard (48h)',
    estimatedBags: o.estimated_bags ?? 0,
    actualBags: o.actual_bags ?? null,
    status: mapStatus(o.status),
    total: Number(o.total ?? o.pricing_snapshot?.total ?? 0),
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
  const clientId = clientObj?._id ?? clientObj?.id ?? o.client_id ?? (typeof o.client === 'string' ? o.client : '')
  const driverObj = typeof o.driver === 'object' ? o.driver : (typeof o.assigned_driver === 'object' ? o.assigned_driver : null)

  const property = resolveProperty(clientObj, o.property_id ?? o.property)

  const clientName = clientObj ? getClientDisplayName(clientObj) : (o.client_name ?? '')
  const address = property?.address
    ? `${property.address}, ${property.city ?? ''}`
    : o.property_name || (clientObj ? getClientAddress(clientObj) : '') || o.pickup_address || ''

  const pickupWindowStart = o.pickup_window?.start_time ?? o.pickup_window_start
  const pickupWindowEnd = o.pickup_window?.end_time ?? o.pickup_window_end
  const subtotal = Number(
    o.subtotal ??
    o.pricing_snapshot?.subtotal ??
    0
  )
  const total = Number(o.total ?? o.pricing_snapshot?.total ?? 0)
  const vatAmount = Number(
    o.vat_amount ??
    o.pricing_snapshot?.vat_amount ??
    Math.max(total - subtotal, 0)
  )

  const propertyContactPerson = property?.contact_person ?? property?.contact_name ?? ''
  const propertyPhone = property?.phone ?? property?.contact_phone ?? ''

  return {
    id: o.order_number ?? o._id ?? o.id,
    _id: o._id ?? o.id,
    client: clientName,
    clientId: String(clientId ?? ''),
    propertyName: property?.name ?? o.property_name ?? '',
    propertyContactPerson,
    propertyPhone,
    pickupAddress: address,
    deliveryAddress: address,
    serviceType: o.service_type === 'express' ? 'Express (24h)' : 'Standard (48h)',
    status: mapStatus(o.status),
    createdAt: o.created_at ?? '',
    pickupDate: formatDate(o.pickup_date),
    pickupTimeWindow: pickupWindowStart && pickupWindowEnd
      ? `${formatTime(pickupWindowStart)} - ${formatTime(pickupWindowEnd)}`
      : '',
    estimatedBags: o.estimated_bags ?? 0,
    actualBags: o.actual_bags ?? null,
    specialNotes: o.special_notes ?? '',
    driverPickup: driverObj?.name ?? o.driver_name ?? null,
    driverDelivery: driverObj?.name ?? o.driver_name ?? null,
    items: (o.items ?? []).map((i: any) => ({
      id: i.id ?? i._id ?? null,
      code: i.item_code ?? i.item_code_snapshot ?? '',
      name: i.name ?? i.name_snapshot ?? '',
      qty: i.quantity ?? 0,
      unitPrice: Number(i.unit_price ?? 0),
    })),
    timeline: (o.status_history ?? []).map((h: any) => ({
      status: mapStatus(h.status),
      date: formatDateTime(h.timestamp ?? h.changed_at),
      note: h.note ?? '',
    })),
    subtotal,
    vatAmount,
    total,
  }
}
