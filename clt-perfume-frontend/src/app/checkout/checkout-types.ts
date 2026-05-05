export type CheckoutAddressType = "home" | "office" | "other"

export type CheckoutAddress = {
  id: string
  title: string
  type: CheckoutAddressType
  contactName: string
  phone: string
  line1: string
  line2?: string
  city: string
  state?: string
  postalCode?: string
  country: string
  landmark?: string
  isPrimary?: boolean
}

export type UserAddressRow = {
  id: string
  title: string
  address_type: CheckoutAddressType
  contact_name: string
  phone: string
  line1: string
  line2?: string | null
  city: string
  state?: string | null
  postal_code?: string | null
  country: string
  landmark?: string | null
  is_primary?: boolean | null
}

export type CheckoutAddressFormState = {
  title: string
  type: CheckoutAddressType
  contactName: string
  phone: string
  line1: string
  line2: string
  city: string
  state: string
  postalCode: string
  country: string
  landmark: string
}

export type PaymentMethod = "cod" | "card" | "bank"
