export type RouteType = 'Pickup' | 'Delivery'
export type RouteStopStatus = 'Pending' | 'In Transit' | 'Completed'

export type OrderStatus =
  | 'pending'
  | 'assigned'
  | 'rescheduled'
  | 'transit'
  | 'arrived'
  | 'washing'
  | 'drying'
  | 'ironing'
  | 'quality_check'
  | 'ready_to_delivery'
  | 'collected'
  | 'delivered'
  | 'completed'
  | 'cancelled'

export const NON_EDITABLE_STATUSES = new Set<string>([
  'ready_to_delivery',
  'collected',
  'delivered',
  'completed',
  'cancelled',
])

/**
 * Normalizes any status string to canonical snake_case.
 * Handles casing (e.g. MySQL PascalCase "QualityCheck", "ReadyToDeliver") and spaces/hyphens.
 */
export function normalizeStatus(status?: string): string {
  if (!status) return ''
  const lower = String(status).trim().toLowerCase().replace(/[\s-]+/g, '_')
  if (lower === 'in_transit') return 'transit'
  if (lower === 'qualitycheck') return 'quality_check'
  if (lower === 'readytodeliver') return 'ready_to_delivery'
  return lower
}

export function isCancelableStatus(status?: string): boolean {
  const norm = normalizeStatus(status)
  return norm === 'pending' || norm === 'assigned'
}

export function isEditableStatus(status?: string): boolean {
  const norm = normalizeStatus(status)
  if (!norm) return false
  return !NON_EDITABLE_STATUSES.has(norm)
}

export function isPickupAssignableStatus(status: string): boolean {
  const norm = normalizeStatus(status)
  return norm === 'pending' || norm === 'assigned' || norm === 'transit'
}

export function isDeliveryAssignableStatus(status: string): boolean {
  const norm = normalizeStatus(status)
  return norm === 'ready_to_delivery' || norm === 'collected'
}

export function getRouteTypeFromOrderStatus(status: string): RouteType {
  if (isDeliveryAssignableStatus(status)) return 'Delivery'
  const norm = normalizeStatus(status)
  if (norm === 'delivered' || norm === 'completed') {
    return 'Delivery'
  }
  return 'Pickup'
}

export function getRouteStopProgressStatus(status: string): RouteStopStatus {
  const norm = normalizeStatus(status)
  if (norm === 'delivered' || norm === 'completed') {
    return 'Completed'
  }
  if (norm === 'transit' || norm === 'collected') {
    return 'In Transit'
  }
  return 'Pending'
}

export function canConfirmPickup(stopType: string, originalStatus: string): boolean {
  return stopType === 'Pickup' && normalizeStatus(originalStatus) === 'assigned'
}

export function canConfirmDelivery(stopType: string, stopStatus: RouteStopStatus): boolean {
  return stopType === 'Delivery' && stopStatus !== 'Completed'
}
