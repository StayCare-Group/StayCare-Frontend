export const PICKUP_ASSIGNABLE_STATUSES = ['Pending', 'Assigned', 'Transit'] as const
export const DELIVERY_ASSIGNABLE_STATUSES = ['ReadyToDeliver', 'Collected'] as const
export const COMPLETED_ORDER_STATUSES = ['Delivered', 'Completed', 'Invoiced'] as const

export type RouteType = 'Pickup' | 'Delivery'
export type RouteStopStatus = 'Pending' | 'In Transit' | 'Completed'

export function isPickupAssignableStatus(status: string): boolean {
  return PICKUP_ASSIGNABLE_STATUSES.includes(status as (typeof PICKUP_ASSIGNABLE_STATUSES)[number])
}

export function isDeliveryAssignableStatus(status: string): boolean {
  return DELIVERY_ASSIGNABLE_STATUSES.includes(status as (typeof DELIVERY_ASSIGNABLE_STATUSES)[number])
}

export function getRouteTypeFromOrderStatus(status: string): RouteType {
  if (isDeliveryAssignableStatus(status)) return 'Delivery'
  if (COMPLETED_ORDER_STATUSES.includes(status as (typeof COMPLETED_ORDER_STATUSES)[number])) {
    return 'Delivery'
  }
  return 'Pickup'
}

export function getRouteStopProgressStatus(status: string): RouteStopStatus {
  if (COMPLETED_ORDER_STATUSES.includes(status as (typeof COMPLETED_ORDER_STATUSES)[number])) {
    return 'Completed'
  }
  if (status === 'Transit' || status === 'Collected') {
    return 'In Transit'
  }
  return 'Pending'
}

export function canConfirmPickup(stopType: string, originalStatus: string): boolean {
  return stopType === 'Pickup' && originalStatus === 'Assigned'
}

export function canConfirmDelivery(stopType: string, stopStatus: RouteStopStatus): boolean {
  return stopType === 'Delivery' && stopStatus !== 'Completed'
}
