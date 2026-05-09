import { NextResponse } from "next/server"
import { getAdminPushSubscriptions, sendAdminPushNotifications } from "@/lib/admin-push"

export const runtime = "nodejs"

type NotifyPayload = {
  type?: string
  record?: {
    id?: string
    order_number?: string | null
    total?: number | string | null
  }
}

function formatOrderTotal(total: number | string | null | undefined) {
  const value = Number(total || 0)
  return Number.isFinite(value) ? `AED ${value.toLocaleString("en-AE")}` : "AED 0"
}

export async function POST(request: Request) {
  try {
    const expectedWebhookSecret = process.env.WEBHOOK_SECRET
    const webhookSecret = request.headers.get("x-webhook-secret")
    if (expectedWebhookSecret && webhookSecret !== expectedWebhookSecret) {
      return NextResponse.json({ error: "Unauthorized webhook" }, { status: 401 })
    }

    const payload = (await request.json()) as NotifyPayload
    const { record, type } = payload

    if (type !== "INSERT") {
      return NextResponse.json({ success: true, message: "Ignored non-insert" })
    }

    if (!record?.id) {
      return NextResponse.json({ error: "Missing order record" }, { status: 400 })
    }

    const subscriptions = await getAdminPushSubscriptions()

    if (subscriptions.length === 0) {
      return NextResponse.json({ success: true, message: "No active subscriptions" })
    }

    const notificationPayload = {
      title: `New Order #${record.order_number || record.id.slice(0, 8)}`,
      body: `A new order for ${formatOrderTotal(record.total)} has been placed.`,
      tag: `cle-admin-order-${record.id}`,
      url: `/dashboard/orders/${encodeURIComponent(record.id)}`,
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
