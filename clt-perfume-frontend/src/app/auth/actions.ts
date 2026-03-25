"use server"

import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

function sanitizeNextPath(nextPath: string | null): string {
  if (!nextPath || !nextPath.startsWith("/")) {
    return "/profile"
  }

  return nextPath
}

async function getBaseUrl() {
  const headerStore = await headers()
  return (
    headerStore.get("origin") ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "http://localhost:3000"
  )
}

export async function login(formData: FormData) {
  const supabase = await createClient()

  const email = String(formData.get("email") || "").trim()
  const password = String(formData.get("password") || "")
  const nextPath = sanitizeNextPath(String(formData.get("next") || ""))

  if (!email || !password) {
    redirect("/login?error=Email%20and%20password%20are%20required")
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`)
  }

  redirect(nextPath)
}

export async function signup(formData: FormData) {
  const supabase = await createClient()
  const baseUrl = await getBaseUrl()

  const firstName = String(formData.get("firstName") || "").trim()
  const lastName = String(formData.get("lastName") || "").trim()
  const email = String(formData.get("email") || "").trim()
  const password = String(formData.get("password") || "")

  if (!email || !password) {
    redirect("/signup?error=Email%20and%20password%20are%20required")
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${baseUrl}/auth/callback?next=/profile`,
      data: {
        first_name: firstName,
        last_name: lastName,
      },
    },
  })

  if (error) {
    redirect(`/signup?error=${encodeURIComponent(error.message)}`)
  }

  if (data.session) {
    redirect("/profile")
  }

  redirect("/login?message=Check%20your%20email%20to%20confirm%20your%20account")
}

export async function signInWithGoogle() {
  const supabase = await createClient()
  const baseUrl = await getBaseUrl()

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${baseUrl}/auth/callback?next=/profile`,
    },
  })

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`)
  }

  if (!data.url) {
    redirect("/login?error=Google%20sign-in%20URL%20is%20missing")
  }

  redirect(data.url)
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect("/login")
}
