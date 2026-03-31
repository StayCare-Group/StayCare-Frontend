export function getClientId(client: any): string {
  if (!client || typeof client !== 'object') return ''
  return String(
    client._id
      ?? client.id
      ?? client.client_profile_id
      ?? client.user_id
      ?? ''
  )
}

export function getClientDisplayName(client: any): string {
  if (!client || typeof client !== 'object') return ''
  return String(
    client.name
      ?? client.user_name
      ?? client.contact_person
      ?? client.email
      ?? ''
  )
}

export function getClientAddress(client: any): string {
  if (!client || typeof client !== 'object') return ''
  return String(client.billing_address ?? client.address ?? '')
}

export function normalizeClient(client: any): any {
  if (!client || typeof client !== 'object') return client

  const normalizedId = getClientId(client)
  const normalizedName = getClientDisplayName(client)

  return {
    ...client,
    _id: normalizedId,
    id: normalizedId,
    name: client.name ?? normalizedName,
    address: client.address ?? client.billing_address ?? '',
  }
}

export function normalizeClients(list: any): any[] {
  if (!Array.isArray(list)) return []
  return list.map(normalizeClient)
}