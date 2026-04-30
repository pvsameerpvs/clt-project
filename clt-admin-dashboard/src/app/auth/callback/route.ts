import { AUTH_SERVICE_UNAVAILABLE_MESSAGE } from "@/lib/auth-errors"
import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  const oauthError = requestUrl.searchParams.get("error_description") || requestUrl.searchParams.get("error")

  if (oauthError) {
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(oauthError)}`, request.url)
    )
  }

  if (code) {
    const supabase = await createClient()
    try {
      await supabase.auth.exchangeCodeForSession(code)
    } catch (error) {
      console.error("[auth] Supabase OAuth callback failed.", error)
      return NextResponse.redirect(
        new URL(`/login?error=${encodeURIComponent(AUTH_SERVICE_UNAVAILABLE_MESSAGE)}`, request.url)
      )
    }
  }

  // URL to redirect to after sign in process completes
  return NextResponse.redirect(new URL("/dashboard", request.url))
}
