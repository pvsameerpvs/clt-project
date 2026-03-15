import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

function sanitizeNextPath(nextPath: string | null): string {
  if (!nextPath || !nextPath.startsWith("/")) {
    return "/dashboard"
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
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      return NextResponse.redirect(new URL(nextPath, origin))
    }
  }

  return NextResponse.redirect(
    new URL("/login?error=Authentication%20failed", origin)
  )
}
