import { NextResponse } from "next/server"
import webpush from "web-push"
import { createClient } from "@supabase/supabase-js"

// We use the service role key here because this is a webhook called by Supabase, 
// and we need to read from the subscriptions table.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY! || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! // fallback for local testing if needed

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_KEY!
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY!
const VAPID_SUBJECT = "mailto:admin@example.com"

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)
}

export async function POST(request: Request) {
  try {
    // Basic webhook secret verification
    const webhookSecret = request.headers.get("x-webhook-secret")
    if (process.env.WEBHOOK_SECRET && webhookSecret !== process.env.WEBHOOK_SECRET) {
      return NextResponse.json({ error: "Unauthorized webhook" }, { status: 401 })
    }

    const payload = await request.json()
    const { record, type } = payload // 'record' is the new order

    // We only want to notify on INSERT
    if (type !== "INSERT" && type !== "UPDATE") {
      return NextResponse.json({ success: true, message: "Ignored non-insert/update" })
    }

    // Connect to supabase with service role to bypass RLS and get all admin subscriptions
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)
    const { data: subscriptions, error } = await supabaseAdmin
      .from("admin_push_subscriptions")
      .select("subscription_json, id")

    if (error || !subscriptions) {
      console.error("[push-notify] Failed to fetch subscriptions:", error)
      return NextResponse.json({ error: "Failed to fetch subscriptions" }, { status: 500 })
    }

    if (subscriptions.length === 0) {
      return NextResponse.json({ success: true, message: "No active subscriptions" })
    }

    const notificationPayload = JSON.stringify({
      title: `New Order #${record.order_number || record.id.slice(0, 8)}`,
      body: `A new order for AED ${record.total || 0} has been placed.`,
      tag: `cle-admin-order-${record.id}`,
      url: `/dashboard/orders/${record.id}`,
    })

    const pushPromises = subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(sub.subscription_json, notificationPayload)
      } catch (err: unknown) {
        const error = err as { statusCode?: number }
        if (error.statusCode === 410 || error.statusCode === 404) {
          // Subscription has expired or is no longer valid, delete it
          await supabaseAdmin.from("admin_push_subscriptions").delete().eq("id", sub.id)
        } else {
          console.error("[push-notify] Push error:", err)
        }
      }
    })

    await Promise.all(pushPromises)

    return NextResponse.json({ success: true, notified: subscriptions.length })
  } catch (error) {
    console.error("[push-notify] Webhook error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
