import { apiFetch } from './client'

export async function getItems(
  activeOnly = false,
  { page = 1, limit = 10, search = '' } = {}
) {
  const params = new URLSearchParams()

  if (activeOnly) {
    params.set('is_active', 'true')
  }

  params.set('page', String(page))
  params.set('limit', String(limit))

  if (search.trim()) {
    params.set('search', search.trim())
  }

  return apiFetch(`/api/items?${params.toString()}`)
}

export async function fetchAllItems(activeOnly = false, search = '') {
  const allItems: any[] = []
  let page = 1
  const pageSize = 200
  const maxPages = 50

  while (page <= maxPages) {
    const data = await getItems(activeOnly, {
      page,
      limit: pageSize,
      search,
    })

    const items = Array.isArray(data)
      ? data
      : Array.isArray((data as any)?.items)
        ? (data as any).items
        : Array.isArray((data as any)?.data)
          ? (data as any).data
          : []

    if (!items.length) break

    allItems.push(...items)

    const pagination = (data as any)?._pagination
    if (pagination) {
      const totalPages = pagination.totalPages ?? pagination.pages ?? pagination.total_pages ?? pagination.lastPage ?? 0
      if (totalPages && page >= totalPages) break
    }

    if (items.length < pageSize) break
    page++
  }

  return allItems
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
    id: item.id ?? item._id,
    code: item.item_code,
    name: item.name,
    unitPrice: Number(item.base_price ?? 0),
  }
}

export function mapItemForManagement(item: any) {
  return {
    _id: item._id ?? item.id,
    code: item.item_code ?? '',
    name: item.name ?? '',
    unitPrice: Number(item.base_price ?? 0),
    active: item.is_active !== false && item.is_active !== 0,
  }
}
