import { NextResponse } from "next/server"
import webpush from "web-push"
import { createClient } from "@supabase/supabase-js"

export const runtime = "nodejs"

type NotifyPayload = {
  type?: string
  record?: {
    id?: string
    order_number?: string | null
    total?: number | string | null
  }
}

type PushSubscriptionRow = {
  id: string
  endpoint: string | null
  subscription_json: webpush.PushSubscription
}

let supabaseAdmin: ReturnType<typeof createClient> | null = null
let configuredVapidKey: string | null = null

function getRequiredEnv(name: string) {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing ${name}`)
  }
  return value
}

function getSupabaseAdmin() {
  if (!supabaseAdmin) {
    supabaseAdmin = createClient(
      getRequiredEnv("NEXT_PUBLIC_SUPABASE_URL"),
      getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY"),
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )
  }

  return supabaseAdmin
}

function configureWebPush() {
  const publicKey = getRequiredEnv("NEXT_PUBLIC_VAPID_KEY")
  const privateKey = getRequiredEnv("VAPID_PRIVATE_KEY")
  const subject = process.env.VAPID_SUBJECT || "mailto:admin@cleparfum.com"
  const cacheKey = `${subject}:${publicKey}:${privateKey}`

  if (configuredVapidKey !== cacheKey) {
    webpush.setVapidDetails(subject, publicKey, privateKey)
    configuredVapidKey = cacheKey
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

    configureWebPush()

    const payload = (await request.json()) as NotifyPayload
    const { record, type } = payload

    if (type !== "INSERT") {
      return NextResponse.json({ success: true, message: "Ignored non-insert" })
    }

    if (!record?.id) {
      return NextResponse.json({ error: "Missing order record" }, { status: 400 })
    }

    const supabaseAdmin = getSupabaseAdmin()
    const { data: subscriptions, error } = await supabaseAdmin
      .from("admin_push_subscriptions")
      .select("id, endpoint, subscription_json")
      .returns<PushSubscriptionRow[]>()

    if (error || !subscriptions) {
      console.error("[push-notify] Failed to fetch subscriptions:", error)
      return NextResponse.json({ error: "Failed to fetch subscriptions" }, { status: 500 })
    }

    if (subscriptions.length === 0) {
      return NextResponse.json({ success: true, message: "No active subscriptions" })
    }

    const notificationPayload = JSON.stringify({
      title: `New Order #${record.order_number || record.id.slice(0, 8)}`,
      body: `A new order for ${formatOrderTotal(record.total)} has been placed.`,
      tag: `cle-admin-order-${record.id}`,
      url: `/dashboard/orders/${encodeURIComponent(record.id)}`,
    })

    let delivered = 0
    let deleted = 0
    let failed = 0

    await Promise.all(subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(sub.subscription_json, notificationPayload)
        delivered += 1
      } catch (err: unknown) {
        const error = err as { statusCode?: number }
        if (error.statusCode === 410 || error.statusCode === 404) {
          await supabaseAdmin.from("admin_push_subscriptions").delete().eq("id", sub.id)
          deleted += 1
        } else {
          failed += 1
          console.error("[push-notify] Push error:", err)
        }
      }
    }))

    return NextResponse.json({
      success: true,
      subscriptions: subscriptions.length,
      delivered,
      deleted,
      failed,
    })
  } catch (error) {
    console.error("[push-notify] Webhook error:", error)
    const message = error instanceof Error ? error.message : "Internal server error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
