function hasText(value) {
  return typeof value === 'string' && value.trim().length > 0
}

export function isClientProfileCompleteForOrder(meData, clientProfileOverride) {
  const user = meData?.user ?? meData ?? {}
  const profile = clientProfileOverride ?? meData?.client_profile ?? {}

  const hasPhone = hasText(user.phone) || Boolean(user.parentClientId || user.parent_client_id)
  return (
    hasPhone &&
    hasText(profile.contact_person) &&
    hasText(profile.billing_address)
  )
}
