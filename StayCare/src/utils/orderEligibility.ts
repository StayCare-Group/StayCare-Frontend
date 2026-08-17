function hasText(value) {
  return typeof value === 'string' && value.trim().length > 0
}

export function isClientProfileCompleteForOrder(meData, clientProfileOverride) {
  const user = meData?.user ?? meData ?? {}
  const profile = clientProfileOverride ?? meData?.client_profile ?? {}

  return (
    hasText(user.phone) &&
    hasText(profile.contact_person) &&
    hasText(profile.billing_address)
  )
}
