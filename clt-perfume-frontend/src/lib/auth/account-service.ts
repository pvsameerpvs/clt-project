import { createClient as createAdminClient, type User } from "@supabase/supabase-js"

export type ExistingAccountInfo = {
  exists: boolean
  providers: string[]
  userId?: string
  isEmailConfirmed?: boolean
}

function getSupabaseAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceRoleKey) {
    return null
  }

  return createAdminClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

function splitFullName(fullName: string) {
  const trimmed = fullName.trim()

  if (!trimmed) {
    return { firstName: "", lastName: "" }
  }

  const [firstName, ...rest] = trimmed.split(/\s+/)

  return {
    firstName,
    lastName: rest.join(" "),
  }
}

export function getUserNameParts(user: Pick<User, "user_metadata"> | null | undefined) {
  const metadata = user?.user_metadata || {}
  const firstName = typeof metadata.first_name === "string" ? metadata.first_name.trim() : ""
  const lastName = typeof metadata.last_name === "string" ? metadata.last_name.trim() : ""

  if (firstName || lastName) {
    return { firstName, lastName }
  }

  const fullName = typeof metadata.full_name === "string" ? metadata.full_name : ""
  return splitFullName(fullName)
}

export async function findExistingAccountByEmail(email: string): Promise<ExistingAccountInfo> {
  const adminClient = getSupabaseAdminClient()

  if (!adminClient || !email) {
    return { exists: false, providers: [] }
  }

  let page = 1
  const perPage = 200
  const normalizedEmail = email.toLowerCase()

  while (true) {
    const { data, error } = await adminClient.auth.admin.listUsers({ page, perPage })

    if (error) {
      console.error("Error checking existing auth users:", error)
      return { exists: false, providers: [] }
    }

    const users = data.users || []
    const matchedUser = users.find(
      (user) => (user.email || "").toLowerCase() === normalizedEmail
    )

    if (matchedUser) {
      const providers = Array.from(
        new Set(
          [
            ...(matchedUser.app_metadata?.providers || []),
            matchedUser.app_metadata?.provider,
            ...(matchedUser.identities?.map((identity) => identity.provider) || []),
          ].filter((provider): provider is string => Boolean(provider))
        )
      )

      return {
        exists: true,
        providers,
        userId: matchedUser.id,
        isEmailConfirmed: Boolean(
          matchedUser.email_confirmed_at || matchedUser.confirmed_at
        ),
      }
    }

    if (users.length < perPage) {
      break
    }

    page += 1
  }

  return { exists: false, providers: [] }
}

export async function ensureProfileExists(params: {
  userId: string
  firstName?: string
  lastName?: string
  avatarUrl?: string
}) {
  const adminClient = getSupabaseAdminClient()

  if (!adminClient || !params.userId) {
    return
  }

  const { error } = await adminClient
    .from("profiles")
    .upsert(
      {
        id: params.userId,
        first_name: params.firstName || "",
        last_name: params.lastName || "",
        avatar_url: params.avatarUrl || "",
      },
      { onConflict: "id" }
    )

  if (error) {
    console.error("Error ensuring profile row exists:", error)
  }
}

export function isLikelyExistingConfirmedUser(user: Pick<User, "identities"> | null | undefined) {
  return Boolean(user && Array.isArray(user.identities) && user.identities.length === 0)
}

export function isLikelyFirstGoogleSession(user: Pick<User, "app_metadata" | "created_at" | "last_sign_in_at"> | null | undefined) {
  if (!user) {
    return false
  }

  const provider = user.app_metadata?.provider

  if (provider !== "google") {
    return false
  }

  const createdAt = Date.parse(user.created_at || "")
  const lastSignInAt = Date.parse(user.last_sign_in_at || "")

  if (!Number.isFinite(createdAt) || !Number.isFinite(lastSignInAt)) {
    return false
  }

  return Math.abs(lastSignInAt - createdAt) < 5 * 60 * 1000
}

export async function sendWelcomeEmail(params: {
  email: string
  firstName?: string
  source: "signup" | "google"
}) {
  const apiBaseUrl =
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.API_URL ||
    "http://localhost:4000"

  try {
    const response = await fetch(`${apiBaseUrl}/api/auth/welcome-email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: params.email,
        firstName: params.firstName || "",
        source: params.source,
      }),
      cache: "no-store",
    })

    if (!response.ok) {
      console.error("Welcome email request failed:", await response.text())
    }
  } catch (error) {
    console.error("Unable to send welcome email:", error)
  }
}
