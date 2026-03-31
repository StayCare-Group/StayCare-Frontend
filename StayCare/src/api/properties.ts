import { apiFetch } from './client'

// Keep this name to match requested contract usage.
export async function getPropertiesByUserId(userId: string) {
  return apiFetch(`/api/properties/user/${userId}`)
}

// Admin can add a property to a specific user in admin panel.
export async function createPropertyForUser(userId: string, payload: Record<string, any>) {
  return apiFetch(`/api/properties/user/${userId}`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

// Authenticated user can add their own property.
export async function createProperty(payload: Record<string, any>) {
  return apiFetch('/api/properties', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

// update property details, e.g. address or access notes. Admin can update any property, users can update their own properties.
export async function updateProperty(id: string, payload: Record<string, any>) {
  return apiFetch(`/api/properties/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

// Authenticated user can delete their own property.
export async function deleteProperty(id: string) {
  return apiFetch(`/api/properties/${id}`, {
    method: 'DELETE',
  })
}