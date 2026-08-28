import { getClientAddress, getClientDisplayName, getClientId } from './client'
import { normalizeStatus } from './orderFlow'

/**
 * English display labels for order statuses.
 * Used exclusively for non-i18n contexts such as PDF generation.
 * All UI components must use StatusBadge + i18n for display.
 */
export const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending Pickup',
  assigned: 'Assigned',
  transit: 'In Transit',
  arrived: 'Received at Facility',
  sorting: 'Sorting',
  washing: 'Washing',
  drying: 'Drying',
  ironing: 'Ironing',
  quality_check: 'Quality Control',
  ready_to_delivery: 'Ready for Delivery',
  collected: 'Out for Delivery',
  delivered: 'Delivered',
  completed: 'Completed',
  invoiced: 'Completed',
  cancelled: 'Cancelled',
  rescheduled: 'Rescheduled',
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return ''
  const s = String(dateStr).trim()
  const match = s.match(/^(\d{4}-\d{2}-\d{2})/)
  if (match) return match[1]
  const d = new Date(s)
  if (isNaN(d.getTime())) return ''
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function formatTimelineNote(note: string, fallbackDriverName?: string): string {
  if (!note) return ''
  const reassignedPrefix = 'Reassigned to driver '
  if (!note.startsWith(reassignedPrefix)) return note

  const value = note.slice(reassignedPrefix.length).trim()
  const uuidLike = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
  if (!uuidLike) return note

  return fallbackDriverName
    ? `${reassignedPrefix}${fallbackDriverName}`
    : `${reassignedPrefix}${value.slice(0, 8)}...`
}

export function formatTime(dateStr: string): string {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}

export function formatDateTime(dateStr: string): string {
  if (!dateStr) return ''
  return `${formatDate(dateStr)} ${formatTime(dateStr)}`
}

export function resolveProperty(clientObj: any, propertyId: any): any {
  if (!clientObj?.properties?.length) return null
  if (propertyId) {
    const match = clientObj.properties.find(
      (p: any) => p._id?.toString() === propertyId?.toString()
    )
    if (match) return match
  }
  return clientObj.properties[0]
}

export function mapOrderForList(o: any) {
  const clientObj = typeof o.client === 'object' && o.client ? o.client : null
  const canonicalStatus = normalizeStatus(o.status)
  return {
    id: o.order_number ?? o._id ?? o.id,
    _id: o._id ?? o.id,
    client: clientObj ? getClientDisplayName(clientObj) : (o.client_name ?? o.client ?? ''),
    clientId: clientObj ? getClientId(clientObj) : String(o.client_id ?? ''),
    createdAt: formatDate(o.created_at),
    pickupDate: formatDate(o.pickup_date),
    serviceType: o.service_type === 'express' ? 'Express (24h)' : 'Standard (48h)',
    estimatedBags: o.estimated_bags ?? 0,
    actualBags: o.actual_bags ?? null,
    status: canonicalStatus,
    total: Number(o.total ?? o.pricing_snapshot?.total ?? 0),
    specialNotes: o.special_notes ?? '',
    propertyName: o.property_name ?? '',
  }
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

  const canonicalStatus = normalizeStatus(o.status)

  return {
    id: o.order_number ?? o._id ?? o.id,
    _id: o._id ?? o.id,
    client: clientName,
    clientId: String(clientId ?? ''),
    isInvoiced: Boolean(o.is_invoiced),
    propertyName: property?.name ?? o.property_name ?? '',
    propertyContactPerson,
    propertyPhone,
    pickupAddress: address,
    deliveryAddress: address,
    serviceType: o.service_type === 'express' ? 'Express (24h)' : 'Standard (48h)',
    status: canonicalStatus,
    statusLabel: STATUS_LABELS[canonicalStatus] ?? canonicalStatus,
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
      itemId: i.item_id ?? i.itemId ?? null,
      code: i.item_code ?? i.item_code_snapshot ?? '',
      name: i.name ?? i.name_snapshot ?? '',
      qty: i.quantity ?? 0,
      unitPrice: Number(i.unit_price ?? 0),
      qtyGood: i.qty_good ?? null,
      qtyBad: i.qty_bad ?? null,
      qtyStained: i.qty_stained ?? null,
    })),
    timeline: (o.status_history ?? []).map((h: any) => ({
      status: STATUS_LABELS[h.status] ?? h.status,
      date: formatDateTime(h.timestamp ?? h.changed_at),
      note: formatTimelineNote(h.note ?? '', driverObj?.name ?? o.driver_name ?? ''),
      changedByName: h.changed_by_user_name ?? null,
      changedByRole: h.changed_by_user_role ?? null,
      isSystem: Boolean(h.is_system),
    })),
    subtotal,
    vatAmount,
    total,
  }
}
