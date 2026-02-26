import { apiFetch } from './client'

export async function fetchOrders(params?: Record<string, string>) {
  const query = params ? '?' + new URLSearchParams(params).toString() : ''
  return apiFetch(`/api/orders${query}`)
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
  return new Date(dateStr).toISOString().split('T')[0]
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

export function mapOrderForDetail(o: any) {
  const clientObj = typeof o.client === 'object' && o.client ? o.client : null
  const clientId = clientObj?._id ?? clientObj?.id ?? (typeof o.client === 'string' ? o.client : '')
  const driverObj = typeof o.deliver_id === 'object' ? o.deliver_id : null

  const property = clientObj?.properties?.[0]

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
