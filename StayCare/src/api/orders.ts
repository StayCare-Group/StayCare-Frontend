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

export async function updateOrder(id: string, payload: any) {
  return apiFetch(`/api/orders/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export async function updateOrderStatus(
  id: string,
  status: string,
  payload?: {
    items?: { item_id: string; qty_good: number; qty_bad: number; qty_stained: number }[];
    note?: string;
  }
) {
  const raw = String(status ?? '').trim().toLowerCase().replace(/[\s-]+/g, '_')
  const normalizedStatus =
    raw === 'qualitycheck' ? 'quality_check' :
    (raw === 'readytodelivery' || raw === 'readytodeliver') ? 'ready_to_delivery' :
    raw

  return apiFetch(`/api/orders/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status: normalizedStatus, ...payload }),
  })
}

export async function confirmPickup(id: string, payload: any) {
  const body = {
    status: 'transit',
    actual_bags: payload?.actual_bags,
    photos: payload?.photos,
    special_notes: payload?.special_notes || payload?.notes,
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
    special_notes: payload?.special_notes || payload?.notes,
    packages_delivered: payload?.packages_delivered,
    received_by: payload?.received_by,
  }

  return apiFetch(`/api/orders/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  })
}

export async function reassignOrder(
  orderId: string,
  driverId: string,
  options?: { route_date?: string; area?: string }
) {
  return apiFetch(`/api/orders/${orderId}/reassign`, {
    method: 'PATCH',
    body: JSON.stringify({
      driver_id: driverId,
      route_date: options?.route_date,
      area: options?.area,
    }),
  })
}

export async function rescheduleOrder(id: string, payload: { pickup_date: string; pickup_window?: any }) {
  return apiFetch(`/api/orders/${id}/reschedule`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export async function deleteOrder(id: string) {
  return apiFetch(`/api/orders/${id}`, {
    method: 'DELETE',
  })
}


