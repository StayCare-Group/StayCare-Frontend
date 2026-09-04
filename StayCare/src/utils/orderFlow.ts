export type RouteType = 'Pickup' | 'Delivery'
export type RouteStopStatus = 'Pending' | 'In Transit' | 'Completed'

/**
 * Normalizes any status string to the canonical snake_case format used
 * by the OrderStatus enum and the backend API.
 *
 * The backend already returns canonical values (e.g. "pending", "quality_check")
 * after the repository-level normalization. This function is kept as a safety
 * net for any legacy or edge-case values that may appear from other sources
 * (e.g. mock data, route-stop statuses, local state).
 */
export function normalizeStatus(status?: string): string {
  if (!status) return ''
  const lower = String(status).trim().toLowerCase().replace(/[\s-]+/g, '_')
  // Handle legacy display-label or PascalCase variants that may still appear
  // from mock data, route stops, or other non-order sources.
  if (lower === 'pending_pickup') return 'pending'
  if (lower === 'in_transit') return 'transit'
  if (lower === 'received_at_facility') return 'arrived'
  if (lower === 'qualitycheck' || lower === 'quality_control') return 'quality_check'
  if (lower === 'readytodeliver' || lower === 'ready_to_deliver' || lower === 'ready_for_delivery') return 'ready_to_delivery'
  if (lower === 'out_for_delivery') return 'collected'
  if (lower === 'cancelado') return 'cancelled'
  return lower
}

export function isCancelableStatus(status?: string): boolean {
  const norm = normalizeStatus(status)
  return norm === 'pending' || norm === 'assigned'
}

export function isEditableStatus(status?: string): boolean {
  const norm = normalizeStatus(status)
  return norm === 'pending' || norm === 'assigned' || norm === 'rescheduled' || norm === 'transit'
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
  if (norm === 'delivered' || norm === 'completed' || norm === 'invoiced') {
    return 'Delivery'
  }
  return 'Pickup'
}

export function getRouteStopProgressStatus(status: string): RouteStopStatus {
  const norm = normalizeStatus(status)
  if (norm === 'delivered' || norm === 'completed' || norm === 'invoiced') {
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
