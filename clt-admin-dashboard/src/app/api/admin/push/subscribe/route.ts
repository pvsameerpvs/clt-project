import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

type PushSubscriptionPayload = {
  endpoint?: string
  keys?: {
    auth?: string
    p256dh?: string
  }
}

type ValidPushSubscriptionPayload = {
  endpoint: string
  keys: {
    auth: string
    p256dh: string
  }
}

function isValidPushSubscription(
  subscription: PushSubscriptionPayload | null | undefined
): subscription is ValidPushSubscriptionPayload {
  return Boolean(subscription?.endpoint && subscription.keys?.auth && subscription.keys?.p256dh)
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle()

    if (profileError || profile?.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const body = (await request.json()) as { subscription?: PushSubscriptionPayload }
    const { subscription } = body

    if (!isValidPushSubscription(subscription)) {
      return NextResponse.json({ error: "Missing or invalid push subscription" }, { status: 400 })
    }

    const userAgent = request.headers.get("user-agent")?.slice(0, 500) || null

    const { error } = await supabase
      .from("admin_push_subscriptions")
      .upsert({
        user_id: user.id,
        endpoint: subscription.endpoint,
        subscription_json: subscription,
        user_agent: userAgent,
        updated_at: new Date().toISOString()
      }, { onConflict: "endpoint" })

    if (error) {
      console.error("[push-subscribe] Database error:", error)
      return NextResponse.json(
        { error: "Failed to save subscription", details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, endpoint: subscription.endpoint })
  } catch (error) {
    console.error("[push-subscribe] Internal error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
