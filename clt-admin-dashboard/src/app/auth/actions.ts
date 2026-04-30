"use server"

import { redirect } from "next/navigation"
import { AUTH_SERVICE_UNAVAILABLE_MESSAGE } from "@/lib/auth-errors"
import { createClient } from "@/lib/supabase/server"
import { getAdminUrl } from "@/lib/public-config"

export async function login(formData: FormData) {
  const supabase = await createClient()

  const email = String(formData.get("email") || "").trim()
  const password = String(formData.get("password") || "")

  if (!email || !password) {
    redirect("/login?error=Email%20and%20password%20are%20required")
  }

  let authError: string | null = null

  try {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    authError = error?.message || null
  } catch (error) {
    console.error("[auth] Supabase password sign-in failed.", error)
    redirect(`/login?error=${encodeURIComponent(AUTH_SERVICE_UNAVAILABLE_MESSAGE)}`)
  }

  if (authError) {
    redirect(`/login?error=${encodeURIComponent(authError)}`)
  }

  redirect("/dashboard")
}

export async function signInWithGoogle() {
  const supabase = await createClient()
  const baseUrl = getAdminUrl()
  let authError: string | null = null
  let redirectUrl: string | null = null

  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${baseUrl}/auth/callback`,
      },
    })
    authError = error?.message || null
    redirectUrl = data.url || null
  } catch (error) {
    console.error("[auth] Supabase Google sign-in failed.", error)
    redirect(`/login?error=${encodeURIComponent(AUTH_SERVICE_UNAVAILABLE_MESSAGE)}`)
  }

  if (authError) {
    redirect(`/login?error=${encodeURIComponent(authError)}`)
  }

  if (redirectUrl) {
    redirect(redirectUrl)
  }

  redirect("/login?error=Google%20sign-in%20URL%20is%20missing")
}
