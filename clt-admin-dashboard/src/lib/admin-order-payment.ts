import type { AdminOrder } from "@/lib/admin-api"

export type AdminOrderPaymentBadgeTone = "paid" | "unpaid" | "cod" | "refunded"

export type AdminOrderPaymentBadge = {
  label: string
  tone: AdminOrderPaymentBadgeTone
  title: string
}

const PAID_ONLINE_STATUSES = new Set(["paid", "confirmed", "processing", "shipped", "delivered"])

function isCashOnDelivery(paymentMethod?: string | null) {
  const method = String(paymentMethod || "").toLowerCase().trim()
  return method === "" || method.includes("cash") || method.includes("cod")
}

function isPaidOnlineStatus(status?: string | null) {
  const normalized = String(status || "").toLowerCase().trim()
  return PAID_ONLINE_STATUSES.has(normalized)
}

export function getAdminOrderPaymentBadge(order: Pick<AdminOrder, "status" | "payment_method">): AdminOrderPaymentBadge {
  const status = String(order.status || "").toLowerCase().trim()

  if (isCashOnDelivery(order.payment_method)) {
    return {
      label: "Cash on Delivery",
      tone: "cod",
      title: "Customer will pay by cash on delivery.",
    }
  }

  if (status === "refunded") {
    return {
      label: "Refunded",
      tone: "refunded",
      title: "Online payment was refunded.",
    }
  }

  if (isPaidOnlineStatus(status)) {
    return {
      label: "Paid",
      tone: "paid",
      title: "Online payment has been confirmed.",
    }
  }

  return {
    label: "Unpaid",
    tone: "unpaid",
    title: "Online payment is not completed.",
  }
}
