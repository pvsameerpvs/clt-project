export function isOfferActiveFlag(value: unknown) {
  if (typeof value === "boolean") return value
  if (typeof value === "number") return value !== 0
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase()
    return !["false", "0", "inactive", "off", "no"].includes(normalized)
  }
  return true
}

export function isOfferActive(offer: { is_active?: unknown }) {
  return isOfferActiveFlag(offer.is_active)
}
