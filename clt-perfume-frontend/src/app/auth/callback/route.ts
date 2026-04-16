import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import {
  ensureProfileExists,
  getUserNameParts,
  isLikelyFirstGoogleSession,
  sendWelcomeEmail,
} from "@/lib/auth/account-service"

function sanitizeNextPath(nextPath: string | null): string {
  if (!nextPath || !nextPath.startsWith("/")) {
    return "/profile"
  }

  return nextPath
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  const nextPath = sanitizeNextPath(requestUrl.searchParams.get("next"))
  const origin = requestUrl.origin

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      const user = data.session?.user
      const { firstName, lastName } = getUserNameParts(user)

      if (user?.id) {
        await ensureProfileExists({
          userId: user.id,
          firstName,
          lastName,
          avatarUrl:
            (typeof user.user_metadata?.avatar_url === "string" && user.user_metadata.avatar_url) ||
            (typeof user.user_metadata?.picture === "string" && user.user_metadata.picture) ||
            "",
        })
      }

      if (user?.email && isLikelyFirstGoogleSession(user)) {
        await sendWelcomeEmail({
          email: user.email,
          firstName,
          source: "google",
        })
      }

      return NextResponse.redirect(new URL(nextPath, origin))
    }
  }

  return NextResponse.redirect(
    new URL("/login?error=Authentication%20failed", origin)
  )
}
