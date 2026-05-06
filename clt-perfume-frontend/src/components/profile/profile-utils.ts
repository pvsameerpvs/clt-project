import type { AddressRecord, OrderRecord, UserAddressRow } from "./profile-types"

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

export type OrderPaymentTone = "paid" | "unpaid" | "cod" | "refunded"

export type OrderPaymentDisplay = {
  label: string
  description: string
  tone: OrderPaymentTone
}

const PAID_ONLINE_STATUSES = new Set(["confirmed", "processing", "shipped", "delivered"])

export function isCashOnDeliveryPayment(paymentMethod?: string | null) {
  const method = String(paymentMethod || "").toLowerCase().trim()
  return method === "" || method.includes("cash") || method.includes("cod")
}

export function getOrderPaymentDisplay(order: {
  status?: string | null
  payment_method?: string | null
}): OrderPaymentDisplay {
  const status = normalizeOrderStatus(order.status)

  if (status === "refunded") {
    return {
      label: "Refunded",
      description: "The payment for this order has been refunded.",
      tone: "refunded",
    }
  }

  if (isCashOnDeliveryPayment(order.payment_method)) {
    if (status === "delivered" || status === "paid") {
      return {
        label: "Paid on Delivery",
        description: "Payment collected upon delivery.",
        tone: "paid",
      }
    }

    return {
      label: "Cash on Delivery",
      description: "Payment will be collected by the courier.",
      tone: "cod",
    }
  }

  if (PAID_ONLINE_STATUSES.has(status)) {
    return {
      label: "Paid via Card",
      description: "Secure online payment has been confirmed.",
      tone: "paid",
    }
  }

  return {
    label: "Awaiting payment",
    description: "Online payment session was not completed.",
    tone: "unpaid",
  }
}

export function canCancelOrder(status?: string | null) {
  const normalized = normalizeOrderStatus(status)
  return normalized === "pending" || normalized === "confirmed" || normalized === "processing"
}

export function canRequestReturn(status?: string | null, deliveredAt?: string | null) {
  const normalized = normalizeOrderStatus(status)
  
  // 1. Must be delivered
  if (normalized !== "delivered") return false

  // 2. Must be within 24 hours of delivery
  if (!deliveredAt) return false // Should not happen if delivered

  const deliveryTime = new Date(deliveredAt).getTime()
  const currentTime = new Date().getTime()
  const hoursSinceDelivery = (currentTime - deliveryTime) / (1000 * 60 * 60)

  return hoursSinceDelivery <= 24
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

export function toReturnRequestOrderSnapshot(order: OrderRecord) {
  return {
    order_number: order.order_number,
    total: order.total,
    status: order.status,
    payment_method: order.payment_method,
    created_at: order.created_at,
  }
}
