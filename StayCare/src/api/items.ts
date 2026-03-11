import { apiFetch } from './client'

export async function fetchItems(activeOnly = true) {
  const query = activeOnly ? '?active=true' : ''
  return apiFetch(`/api/items${query}`)
}

export async function createItem(payload: any) {
  return apiFetch('/api/items', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function updateItem(id: string, payload: any) {
  return apiFetch(`/api/items/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export async function deleteItem(id: string) {
  return apiFetch(`/api/items/${id}`, {
    method: 'DELETE',
  })
}

export function mapItemForCatalog(item: any) {
  return {
    code: item.item_code,
    name: item.name,
    unitPrice: item.base_price ?? 0,
  }
}

export function mapItemForManagement(item: any) {
  return {
    _id: item._id ?? item.id,
    code: item.item_code ?? '',
    name: item.name ?? '',
    unitPrice: item.base_price ?? 0,
    active: item.active !== false,
  }
}
