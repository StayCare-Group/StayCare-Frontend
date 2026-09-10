import { apiFetch } from './client'

export interface CustomPriceItem {
  item_id: string
  item_name: string
  price: number
  updated_at?: string
}

export interface ClientPriceListResponse {
  items: CustomPriceItem[]
}

/**
 * GET /api/clients/:id/price-list
 * Returns the client's custom price list, or null if none is configured.
 */
export async function getClientPriceList(
  clientId: string,
): Promise<ClientPriceListResponse | null> {
  return apiFetch(`/api/clients/${clientId}/price-list`)
}

/**
 * POST /api/clients/:id/price-list/items
 * Upserts (adds or updates) one or more custom prices without touching other existing entries.
 */
export async function upsertClientPriceItems(
  clientId: string,
  items: { item_id: string; price: number }[],
): Promise<ClientPriceListResponse> {
  return apiFetch(`/api/clients/${clientId}/price-list/items`, {
    method: 'POST',
    body: JSON.stringify({ items }),
  })
}

/**
 * DELETE /api/clients/:id/price-list/items
 * Removes specific items from the client's custom price list.
 * Those items will fall back to the standard catalog price.
 */
export async function deleteClientPriceItems(
  clientId: string,
  itemIds: string[],
): Promise<void> {
  await apiFetch(`/api/clients/${clientId}/price-list/items`, {
    method: 'DELETE',
    body: JSON.stringify({ item_ids: itemIds }),
  })
}

/**
 * DELETE /api/clients/:id/price-list
 * Removes ALL custom prices for the client.
 * The client will use standard catalog prices for all items.
 */
export async function clearClientPriceList(clientId: string): Promise<void> {
  await apiFetch(`/api/clients/${clientId}/price-list`, {
    method: 'DELETE',
  })
}
