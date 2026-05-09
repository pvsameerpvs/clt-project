import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { subscription } = body

    if (!subscription) {
      return NextResponse.json({ error: "Missing subscription" }, { status: 400 })
    }

    // Upsert the subscription
    const { error } = await supabase
      .from("admin_push_subscriptions")
      .upsert({
        user_id: user.id,
        subscription_json: subscription,
        updated_at: new Date().toISOString()
      }, { onConflict: "user_id" })

    if (error) {
      console.error("[push-subscribe] Database error:", error)
      return NextResponse.json({ error: "Failed to save subscription" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[push-subscribe] Internal error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
