import { apiFetch } from './client'

export async function fetchItems(activeOnly = true) {
  const query = activeOnly ? '?active=true' : ''
  return apiFetch(`/api/items${query}`)
}

export function mapItemForCatalog(item: any) {
  return {
    code: item.item_code,
    name: item.name,
    unitPrice: item.base_price ?? 0,
  }
}
