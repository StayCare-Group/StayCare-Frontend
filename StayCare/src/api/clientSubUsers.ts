import { apiFetch } from './client'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Permission {
  id: string
  name: string
  description?: string
}

export interface ClientRole {
  id: string
  name: string
  client_id: string | null
  is_system: boolean
  created_at?: string
  permissions: Permission[]
}

export interface ClientSubUser {
  id: string
  name: string
  email: string
  phone: string | null
  language: 'en' | 'es'
  role: string
  role_id: string | null
  is_active: boolean
  parent_client_id: string
  created_at?: string
  updated_at?: string
  permissions?: string[]
}

export interface SubUserListResponse {
  users: ClientSubUser[]
  _pagination?: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

// ─── Permissions ──────────────────────────────────────────────────────────────

/**
 * GET /api/clients/permissions
 * Returns all available permissions in the system.
 */
export async function getAllPermissions(): Promise<Permission[]> {
  return apiFetch('/api/clients/permissions')
}

// ─── Custom Roles ─────────────────────────────────────────────────────────────

/**
 * GET /api/clients/:id/roles
 * Returns custom roles for a client (+ system roles for admin/staff).
 */
export async function getClientRoles(clientId: string): Promise<ClientRole[]> {
  return apiFetch(`/api/clients/${clientId}/roles`)
}

/**
 * POST /api/clients/:id/roles
 * Creates a new custom role for the client.
 */
export async function createClientRole(
  clientId: string,
  data: { name: string; permissions: string[] },
): Promise<ClientRole> {
  return apiFetch(`/api/clients/${clientId}/roles`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

/**
 * PUT /api/clients/:id/roles/:roleId
 * Updates a custom role name and/or permissions.
 */
export async function updateClientRole(
  clientId: string,
  roleId: string,
  data: { name?: string; permissions?: string[] },
): Promise<ClientRole> {
  return apiFetch(`/api/clients/${clientId}/roles/${roleId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

/**
 * DELETE /api/clients/:id/roles/:roleId
 * Deletes a custom role. Fails if users are still assigned to it.
 */
export async function deleteClientRole(
  clientId: string,
  roleId: string,
): Promise<void> {
  await apiFetch(`/api/clients/${clientId}/roles/${roleId}`, {
    method: 'DELETE',
  })
}

// ─── Sub-Users ────────────────────────────────────────────────────────────────

/**
 * GET /api/clients/:id/users
 * Returns paginated list of sub-users for a client.
 */
export async function getClientSubUsers(
  clientId: string,
  params?: { page?: number; limit?: number; search?: string },
): Promise<SubUserListResponse> {
  const qs = new URLSearchParams()
  if (params?.page) qs.set('page', String(params.page))
  if (params?.limit) qs.set('limit', String(params.limit))
  if (params?.search) qs.set('search', params.search)
  const query = qs.toString() ? `?${qs.toString()}` : ''
  return apiFetch(`/api/clients/${clientId}/users${query}`)
}

/**
 * GET /api/clients/:id/users/:subUserId
 * Returns details of a single sub-user.
 */
export async function getClientSubUserById(
  clientId: string,
  subUserId: string,
): Promise<ClientSubUser> {
  return apiFetch(`/api/clients/${clientId}/users/${subUserId}`)
}

/**
 * POST /api/clients/:id/users
 * Creates a new sub-user under the client account.
 */
export async function createClientSubUser(
  clientId: string,
  data: {
    name: string
    email: string
    password: string
    phone?: string | null
    language?: 'en' | 'es'
    role_id: string
  },
): Promise<ClientSubUser> {
  return apiFetch(`/api/clients/${clientId}/users`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

/**
 * PUT /api/clients/:id/users/:subUserId
 * Updates sub-user data.
 */
export async function updateClientSubUser(
  clientId: string,
  subUserId: string,
  data: {
    name?: string
    email?: string
    password?: string
    phone?: string | null
    language?: 'en' | 'es'
    role_id?: string
    is_active?: boolean
  },
): Promise<ClientSubUser> {
  return apiFetch(`/api/clients/${clientId}/users/${subUserId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

/**
 * DELETE /api/clients/:id/users/:subUserId
 * Deletes a sub-user.
 */
export async function deleteClientSubUser(
  clientId: string,
  subUserId: string,
): Promise<void> {
  await apiFetch(`/api/clients/${clientId}/users/${subUserId}`, {
    method: 'DELETE',
  })
}
