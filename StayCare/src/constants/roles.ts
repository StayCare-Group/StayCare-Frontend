export const SYSTEM_ROLES = ['client', 'driver', 'staff', 'operator', 'admin'] as const

export type SystemRole = (typeof SYSTEM_ROLES)[number]

export const ROLE_LABELS: Record<SystemRole, string> = {
  admin: 'Admin',
  client: 'Client',
  driver: 'Driver',
  staff: 'Facility Staff',
  operator: 'Operator',
}

export function toSystemRole(raw: unknown): SystemRole {
  if (raw == null || raw === '') return 'client'
  const role = String(raw).toLowerCase() as SystemRole
  return SYSTEM_ROLES.includes(role) ? role : 'client'
}

export function getRoleLabel(raw: unknown): string {
  return ROLE_LABELS[toSystemRole(raw)]
}

export function toInviteRoleLabel(raw: unknown): string {
  return getRoleLabel(raw)
}

export function getInviteRoleOptions(t: (key: string) => string) {
  return [
    { value: 'client', label: t('common.client') },
    { value: 'driver', label: t('admin.driver') },
    { value: 'staff', label: t('admin.staff') },
    { value: 'operator', label: t('admin.operator') },
    { value: 'admin', label: t('admin.admin') },
  ] as const
}
