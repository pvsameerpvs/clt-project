import webpush from "web-push"
import { createClient } from "@supabase/supabase-js"

export type PushSubscriptionRow = {
  id: string
  endpoint: string | null
  subscription_json: webpush.PushSubscription
}

export type PushSendResult = {
  subscriptions: number
  delivered: number
  deleted: number
  failed: number
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

export function getSupabaseAdmin() {
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

export async function getAdminPushSubscriptions(userId?: string) {
  const supabaseAdmin = getSupabaseAdmin()
  let query = supabaseAdmin
    .from("admin_push_subscriptions")
    .select("id, endpoint, subscription_json")

  if (userId) {
    query = query.eq("user_id", userId)
  }

  const { data, error } = await query.returns<PushSubscriptionRow[]>()

  if (error) {
    throw new Error(error.message)
  }

  return data || []
}

export async function sendAdminPushNotifications(
  subscriptions: PushSubscriptionRow[],
  notificationPayload: Record<string, unknown>
): Promise<PushSendResult> {
  configureWebPush()

  const supabaseAdmin = getSupabaseAdmin()
  const payload = JSON.stringify(notificationPayload)
  let delivered = 0
  let deleted = 0
  let failed = 0

  await Promise.all(subscriptions.map(async (sub) => {
    try {
      await webpush.sendNotification(sub.subscription_json, payload)
      delivered += 1
    } catch (err: unknown) {
      const error = err as { statusCode?: number }
      if (error.statusCode === 410 || error.statusCode === 404) {
        await supabaseAdmin.from("admin_push_subscriptions").delete().eq("id", sub.id)
        deleted += 1
      } else {
        failed += 1
        console.error("[admin-push] Push error:", err)
      }
    }
  }))

  return {
    subscriptions: subscriptions.length,
    delivered,
    deleted,
    failed,
  }
}
