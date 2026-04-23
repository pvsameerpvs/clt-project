import type { AddressRecord, UserAddressRow } from "./profile-types"

export function toDisplayDate(value?: string | null) {
  if (!value) return ""
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ""
  return date.toLocaleDateString("en-GB")
}

export function toDateInputValue(value?: string | null) {
  if (!value) return ""
  if (value.length >= 10 && value.includes("-")) return value.slice(0, 10)
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return ""
  return parsed.toISOString().slice(0, 10)
}

export function normalizeOrderStatus(status?: string | null) {
  const normalized = (status || "").toLowerCase().trim()
  if (normalized === "completed") return "delivered"
  if (normalized === "in_transit") return "shipped"
  if (normalized === "paid") return "confirmed"
  return normalized
}

export function canCancelOrder(status?: string | null) {
  const normalized = normalizeOrderStatus(status)
  return normalized === "pending" || normalized === "confirmed" || normalized === "processing"
}

export function canRequestReturn(status?: string | null) {
  // Returns are disabled for this store per business policy
  return false
}

export function normalizeReturnRequestStatus(status?: string | null) {
  const normalized = (status || "").toLowerCase().trim()
  if (!normalized) return "pending"
  return normalized
}

export function mapAddressRow(row: UserAddressRow): AddressRecord {
  return {
    id: row.id,
    title: row.title,
    type: row.address_type,
    contactName: row.contact_name,
    phone: row.phone,
    line1: row.line1,
    line2: row.line2 || "",
    city: row.city,
    country: row.country,
    isPrimary: Boolean(row.is_primary),
  }
}
