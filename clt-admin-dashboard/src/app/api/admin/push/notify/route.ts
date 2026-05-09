import { NextResponse } from "next/server"
import { getAdminPushSubscriptions, sendAdminPushNotifications } from "@/lib/admin-push"

export const runtime = "nodejs"

type NotifyPayload = {
  type?: string
  record?: {
    id?: string
    order_number?: string | null
    status?: string | null
    total?: number | string | null
  }
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

function getOrderEvent(type: string | undefined, status: string | null | undefined, previousStatus: string | null | undefined) {
  const normalizedStatus = normalizeStatus(status)
  const normalizedPreviousStatus = normalizeStatus(previousStatus)
  const isCancellation = ["cancelled", "canceled", "refunded"].includes(normalizedStatus)

  if (type === "INSERT") {
    return { kind: "new", label: "New Order" }
  }

  if (type === "UPDATE" && isCancellation && normalizedStatus !== normalizedPreviousStatus) {
    return {
      kind: normalizedStatus === "refunded" ? "refunded" : "cancelled",
      label: normalizedStatus === "refunded" ? "Order Refunded" : "Order Cancelled",
    }
  }

  return null
}

export async function POST(request: Request) {
  try {
    const expectedWebhookSecret = process.env.WEBHOOK_SECRET
    const webhookSecret = request.headers.get("x-webhook-secret")
    if (expectedWebhookSecret && webhookSecret !== expectedWebhookSecret) {
      return NextResponse.json({ error: "Unauthorized webhook" }, { status: 401 })
    }

    const payload = (await request.json()) as NotifyPayload
    const { old_record, record, type } = payload

    const orderEvent = getOrderEvent(type, record?.status, old_record?.status)

    if (!orderEvent) {
      return NextResponse.json({ success: true, message: "Ignored non-actionable order event" })
    }

    if (!record?.id) {
      return NextResponse.json({ error: "Missing order record" }, { status: 400 })
    }

    const subscriptions = await getAdminPushSubscriptions()

    if (subscriptions.length === 0) {
      return NextResponse.json({ success: true, message: "No active subscriptions" })
    }

    const orderReference = record.order_number || record.id.slice(0, 8)
    const orderUrl = `/dashboard/orders/${encodeURIComponent(record.id)}`
    const notificationPayload = orderEvent.kind === "new"
      ? {
          title: `New Order #${orderReference}`,
          body: `A new order for ${formatOrderTotal(record.total)} has been placed.`,
          tag: `cle-admin-order-new-${record.id}`,
          url: orderUrl,
        }
      : {
          title: `${orderEvent.label} #${orderReference}`,
          body: `Order #${orderReference} for ${formatOrderTotal(record.total)} was ${orderEvent.kind}.`,
          tag: `cle-admin-order-${orderEvent.kind}-${record.id}`,
          url: orderUrl,
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
