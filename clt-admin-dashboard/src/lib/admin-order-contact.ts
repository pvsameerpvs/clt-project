import type { AdminOrder } from "@/lib/admin-api"

type ShippingAddressValue = AdminOrder["shipping_address"]

function toText(value: unknown) {
  return typeof value === "string" ? value.trim() : ""
}

export function readOrderShippingAddress(value: ShippingAddressValue) {
  if (!value) return {}

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value)
      return parsed && typeof parsed === "object" && !Array.isArray(parsed)
        ? (parsed as Record<string, unknown>)
        : {}
    } catch {
      return {}
    }
  }

  if (typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>
  }

  return {}
}

export function getAdminOrderProfile(order: AdminOrder) {
  if (!order.profile) {
    return { first_name: null, last_name: null, email: null, phone: null }
  }

  return Array.isArray(order.profile) ? order.profile[0] || {} : order.profile
}

export function getAdminOrderCustomer(order: AdminOrder | null) {
  if (!order) return { name: "Guest", email: "", phone: "" }

  const profile = getAdminOrderProfile(order)
  const address = readOrderShippingAddress(order.shipping_address)
  const profileName = [profile.first_name, profile.last_name].filter(Boolean).join(" ").trim()
  const guestName = toText(address.contact_name)

  return {
    name: profileName || guestName || "Guest",
    email: toText(profile.email) || toText(address.contact_email),
    phone: toText(profile.phone) || toText(address.contact_whatsapp) || toText(address.phone),
  }
}

export function getAdminOrderShippingAddress(order: AdminOrder | null) {
  const address = readOrderShippingAddress(order?.shipping_address)

  return {
    title: toText(address.title),
    contactName: toText(address.contact_name),
    phone: toText(address.phone),
    line1: toText(address.line1),
    line2: toText(address.line2),
    city: toText(address.city),
    state: toText(address.state),
    postalCode: toText(address.postal_code),
    country: toText(address.country),
  }
}
