"use server"

import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getAdminUrl } from "@/lib/public-config"

export async function login(formData: FormData) {
  const supabase = await createClient()

  const email = String(formData.get("email") || "").trim()
  const password = String(formData.get("password") || "")

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

  redirect("/dashboard")
}

export async function signInWithGoogle() {
  const supabase = await createClient()
  const baseUrl = getAdminUrl()
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${baseUrl}/auth/callback`,
    },
  })

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`)
  }

  if (data.url) {
    redirect(data.url)
  }
}
