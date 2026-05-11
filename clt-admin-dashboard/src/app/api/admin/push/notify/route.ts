import { NextResponse } from "next/server"
import { getAdminPushSubscriptions, sendAdminPushNotifications, getSupabaseAdmin } from "@/lib/admin-push"

export const runtime = "nodejs"

type OrderRecord = {
  id?: string
  order_number?: string | null
  status?: string | null
  total?: number | string | null
  payment_method?: string | null
}

type ReturnRequestRecord = {
  id?: string
  order_id?: string | null
  reason?: string | null
  status?: string | null
}

type NotifyPayload = {
  type?: string
  table?: string
  record?: OrderRecord | ReturnRequestRecord
  old_record?: {
    status?: string | null
  } | null
}

function formatOrderTotal(total: number | string | null | undefined) {
  const value = Number(total || 0)
  return Number.isFinite(value) ? `AED ${value.toLocaleString("en-AE")}` : "AED 0"
}

function normalizeStatus(status: string | null | undefined) {
  return String(status || "").toLowerCase().trim()
}

function isOnlinePaymentMethod(paymentMethod: string | null | undefined) {
  const method = String(paymentMethod || "").toLowerCase()
  return method.includes("card") || method.includes("bank") || method.includes("ziina")
}

function getOrderEvent(
  type: string | undefined,
  status: string | null | undefined,
  paymentMethod: string | null | undefined
) {
  const normalizedStatus = normalizeStatus(status)

  if (type === "INSERT") {
    // For card/bank payments, the order is only "placed" after payment is confirmed.
    // Skip INSERT notification for pending online payments — notify on UPDATE to "paid" instead.
    if (isOnlinePaymentMethod(paymentMethod) && normalizedStatus === "pending") {
      return null
    }
    return { kind: "new", label: "New Order", verb: "placed" }
  }

  if (type === "UPDATE") {
    const statusLabels: Record<string, { label: string; verb: string }> = {
      paid: { label: "Order Paid", verb: "paid" },
      confirmed: { label: "Order Confirmed", verb: "confirmed" },
      processing: { label: "Order Processing", verb: "moved to processing" },
      shipped: { label: "Order Shipped", verb: "shipped" },
      delivered: { label: "Order Delivered", verb: "delivered" },
      completed: { label: "Order Completed", verb: "completed" },
      cancelled: { label: "Order Cancelled", verb: "cancelled" },
      canceled: { label: "Order Cancelled", verb: "cancelled" },
      refunded: { label: "Order Refunded", verb: "refunded" },
    }

    const mapped = statusLabels[normalizedStatus]
    if (mapped) {
      return { kind: normalizedStatus, label: mapped.label, verb: mapped.verb }
    }
  }

  return null
}

function getReturnRequestEvent(type: string | undefined, status: string | null | undefined) {
  const normalizedStatus = normalizeStatus(status)

  if (type === "INSERT") {
    return { kind: "return-new", label: "New Return Request", verb: "requested" }
  }

  if (type === "UPDATE") {
    const statusLabels: Record<string, { label: string; verb: string }> = {
      pending: { label: "Return Request Pending", verb: "marked as pending" },
      approved: { label: "Return Request Approved", verb: "approved" },
      rejected: { label: "Return Request Rejected", verb: "rejected" },
      completed: { label: "Return Request Completed", verb: "completed" },
    }

    const mapped = statusLabels[normalizedStatus]
    if (mapped) {
      return { kind: `return-${normalizedStatus}`, label: mapped.label, verb: mapped.verb }
    }
  }

  return null
}

async function buildOrderNotificationPayload(
  event: { kind: string; label: string; verb: string },
  record: OrderRecord
) {
  const orderReference = record.order_number || (record.id ? record.id.slice(0, 8) : "")
  const orderUrl = `/dashboard/orders/${encodeURIComponent(record.id || "")}`

  if (event.kind === "new") {
    return {
      title: `${event.label} #${orderReference}`,
      body: `A new order for ${formatOrderTotal(record.total)} has been ${event.verb}.`,
      tag: `cle-admin-order-new-${record.id}`,
      url: orderUrl,
    }
  }

  return {
    title: `${event.label} #${orderReference}`,
    body: `Order #${orderReference} for ${formatOrderTotal(record.total)} was ${event.verb}.`,
    tag: `cle-admin-order-${event.kind}-${record.id}`,
    url: orderUrl,
  }
}

async function buildReturnRequestNotificationPayload(
  event: { kind: string; label: string; verb: string },
  record: ReturnRequestRecord
) {
  const supabaseAdmin = getSupabaseAdmin()
  let orderNumber = ""
  let orderTotal = ""

  if (record.order_id) {
    const { data: order } = await supabaseAdmin
      .from("orders")
      .select("order_number, total")
      .eq("id", record.order_id)
      .maybeSingle()
      .returns<{ order_number: string | null; total: number | string | null } | null>()

    if (order) {
      orderNumber = order.order_number || ""
      orderTotal = formatOrderTotal(order.total)
    }
  }

  const reference = orderNumber || record.order_id?.slice(0, 8) || ""
  const orderUrl = record.order_id
    ? `/dashboard/orders/${encodeURIComponent(record.order_id)}`
    : "/dashboard/orders"

  return {
    title: `${event.label} #${reference}`,
    body: orderTotal
      ? `Return for order #${reference} (${orderTotal}) was ${event.verb}.`
      : `Return request #${record.id?.slice(0, 8)} was ${event.verb}.`,
    tag: `cle-admin-${event.kind}-${record.id}`,
    url: orderUrl,
  }
}

export async function POST(request: Request) {
  try {
    const expectedWebhookSecret = process.env.WEBHOOK_SECRET
    const webhookSecret = request.headers.get("x-webhook-secret")
    if (expectedWebhookSecret && webhookSecret !== expectedWebhookSecret) {
      return NextResponse.json({ error: "Unauthorized webhook" }, { status: 401 })
    }

    const payload = (await request.json()) as NotifyPayload
    const { old_record, record, type, table } = payload

    if (!record?.id) {
      return NextResponse.json({ error: "Missing record id" }, { status: 400 })
    }

    let notificationPayload: Record<string, unknown> | null = null

    if (table === "orders" || !table) {
      const orderRecord = record as OrderRecord
      const orderEvent = getOrderEvent(type, orderRecord.status, orderRecord.payment_method)

      if (orderEvent) {
        notificationPayload = await buildOrderNotificationPayload(
          orderEvent,
          orderRecord
        )
      }
    }

    if (table === "order_return_requests") {
      const returnEvent = getReturnRequestEvent(type, (record as ReturnRequestRecord).status)

      if (returnEvent) {
        notificationPayload = await buildReturnRequestNotificationPayload(
          returnEvent,
          record as ReturnRequestRecord
        )
      }
    }

    if (!notificationPayload) {
      return NextResponse.json({ success: true, message: "Ignored non-actionable event" })
    }

    const subscriptions = await getAdminPushSubscriptions()

    if (subscriptions.length === 0) {
      return NextResponse.json({ success: true, message: "No active subscriptions" })
    }

    const result = await sendAdminPushNotifications(subscriptions, notificationPayload)

    return NextResponse.json({
      success: true,
      ...result,
    })
  } catch (error) {
    console.error("[push-notify] Webhook error:", error)
    const message = error instanceof Error ? error.message : "Internal server error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
