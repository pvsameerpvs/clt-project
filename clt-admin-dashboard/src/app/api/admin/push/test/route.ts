import { NextResponse } from "next/server"
import { getAdminPushSubscriptions, sendAdminPushNotifications } from "@/lib/admin-push"
import { createClient } from "@/lib/supabase/server"

export const runtime = "nodejs"

export async function POST() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

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

    const subscriptions = await getAdminPushSubscriptions(user.id)

    if (subscriptions.length === 0) {
      return NextResponse.json(
        { error: "No saved push subscription for this admin. Tap Enable Order Alerts first." },
        { status: 409 }
      )
    }

    const result = await sendAdminPushNotifications(subscriptions, {
      title: "CLE Admin push test",
      body: "This is a real background push test for the order desk.",
      tag: `cle-admin-push-test-${Date.now()}`,
      url: "/dashboard/mobile-order-app",
    })

    return NextResponse.json({
      success: true,
      ...result,
    })
  } catch (error) {
    console.error("[push-test] Test push error:", error)
    const message = error instanceof Error ? error.message : "Unable to send test push."
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
