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
 * Statuses in which an order can be invoiced (after being received in plant).
 * Must stay aligned with backend INVOICEABLE_ORDER_STATUSES.
 */
export const INVOICEABLE_STATUSES: readonly OrderStatus[] = [
  'arrived',
  'washing',
  'drying',
  'ironing',
  'quality_check',
  'ready_to_delivery',
  'collected',
  'delivered',
  'completed',
]

/**
 * Statuses grouped under the "In progress" chip of the orders list
 * (everything that is neither pending, ready/collected/delivered/completed nor cancelled).
 */
export const IN_PROGRESS_STATUSES: readonly OrderStatus[] = [
  'assigned',
  'rescheduled',
  'transit',
  'arrived',
  'washing',
  'drying',
  'ironing',
  'quality_check',
]

/**
 * Maps an orders-list filter chip key to the statuses sent to the backend.
 * Returns undefined for 'all' (no status restriction).
 */
export function getStatusesForListFilter(filterKey: string): string[] | undefined {
  if (!filterKey || filterKey === 'all') return undefined
  if (filterKey === 'in_progress') return [...IN_PROGRESS_STATUSES]
  return [filterKey]
}

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

export function isPreReceiveStatus(status?: string): boolean {
  const norm = normalizeStatus(status)
  return norm === 'pending' || norm === 'assigned' || norm === 'rescheduled' || norm === 'transit'
}

export function isEditableStatus(status?: string, isAdminOrStaff: boolean = true): boolean {
  const norm = normalizeStatus(status)
  if (!norm) return false
  if (NON_EDITABLE_STATUSES.has(norm)) return false
  if (!isAdminOrStaff) {
    return isPreReceiveStatus(norm)
  }
  return true
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
