import { CheckoutAddress, CheckoutAddressFormState, UserAddressRow } from "./checkout-types"

export function mapUserAddressRow(address: UserAddressRow): CheckoutAddress {
  return {
    id: address.id,
    title: address.title,
    type: address.address_type,
    contactName: address.contact_name,
    phone: address.phone,
    line1: address.line1,
    line2: address.line2 || "",
    city: address.city,
    state: address.state || "",
    postalCode: address.postal_code || "",
    country: address.country,
    landmark: address.landmark || "",
    isPrimary: Boolean(address.is_primary),
  }
}

export function createAddressFormState(contactName: string, phone: string): CheckoutAddressFormState {
  return {
    title: "",
    type: "other",
    contactName,
    phone,
    line1: "",
    line2: "",
    city: "Dubai",
    state: "Dubai",
    postalCode: "",
    country: "United Arab Emirates",
    landmark: "",
  }
}

export function createAddressId() {
  return `addr-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export function formatPrice(value: number) {
  return `AED ${Math.round(Number(value) || 0)}`
}
