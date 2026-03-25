import type { UserOrderRecord } from "@/lib/api"

export type ProfileSection =
  | "account"
  | "orders"
  | "addresses"
  | "returns"
  | "reviews"
  | "wishlist"
  | "payment"
  | "password"

export type ProfileRecord = {
  first_name?: string | null
  last_name?: string | null
  phone?: string | null
  date_of_birth?: string | null
  gender?: string | null
  email?: string | null
}

export type OrderRecord = UserOrderRecord

export type AddressType = "home" | "office" | "other"

export type AddressRecord = {
  id: string
  title: string
  type: AddressType
  contactName: string
  phone: string
  line1: string
  line2: string
  city: string
  country: string
  isPrimary?: boolean
}

export type UserAddressRow = {
  id: string
  title: string
  address_type: AddressType
  contact_name: string
  phone: string
  line1: string
  line2: string | null
  city: string
  country: string
  is_primary: boolean | null
}

export type ProfileGender = "male" | "female" | "other" | ""

export type ProfileFormState = {
  firstName: string
  lastName: string
  phone: string
  dateOfBirth: string
  gender: ProfileGender
}

export type AddressFormState = {
  title: string
  type: AddressType
  contactName: string
  phone: string
  line1: string
  line2: string
  city: string
  country: string
}

export const ORDER_STEPS = ["pending", "confirmed", "processing", "shipped", "delivered"] as const
