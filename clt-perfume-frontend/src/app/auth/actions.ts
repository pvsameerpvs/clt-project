"use server"

import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import {
  findExistingAccountByEmail,
  sendWelcomeEmail,
} from "@/lib/auth/account-service"
import { getApiUrl, getSiteUrl } from "@/lib/public-config"

function sanitizeNextPath(nextPath: string | null): string {
  if (!nextPath || !nextPath.startsWith("/")) {
    return "/"
  }

  return nextPath
}

async function getBaseUrl() {
  const headerStore = await headers()
  return getSiteUrl(headerStore.get("origin"))
}

function getFriendlyAuthErrorMessage(message: string) {
  const normalized = message.trim().toLowerCase()

  if (
    normalized.includes("email rate limit exceeded") ||
    normalized.includes("rate limit") ||
    normalized.includes("you can only request this after")
  ) {
    return "Too many email requests were sent recently. Please wait a few minutes and try again."
  }

  if (normalized.includes("invalid login credentials")) {
    return "Incorrect email or password. Please try again."
  }

  if (normalized.includes("email not confirmed")) {
    return "Your previous signup was not completed. Please create your account again or contact support."
  }

  if (normalized.includes("user already registered")) {
    return "This email is already registered. Please log in instead."
  }

  if (normalized.includes("provider is not enabled")) {
    return "Google sign-in is not available right now. Please use email login or try again later."
  }

  if (normalized.includes("signup is disabled")) {
    return "Account signup is not available right now. Please try again later."
  }

  return message
}

export async function login(formData: FormData) {
  const supabase = await createClient()

  const email = String(formData.get("email") || "").trim()
  const password = String(formData.get("password") || "")
  const nextPath = sanitizeNextPath(String(formData.get("next") || ""))

  if (!email || !password) {
    return { error: "Email and password are required" }
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { error: getFriendlyAuthErrorMessage(error.message) }
  }

  return { success: true, redirect: nextPath }
}

export async function signup(formData: FormData) {
  const supabase = await createClient()

  const firstName = String(formData.get("firstName") || "").trim()
  const lastName = String(formData.get("lastName") || "").trim()
  const email = String(formData.get("email") || "").trim()
  const password = String(formData.get("password") || "")

  if (!email || !password) {
    redirect("/signup?error=Email%20and%20password%20are%20required")
  }

  const apiBaseUrl = (process.env.API_URL || getApiUrl()).replace(/\/+$/, "")

  let signupPayload: {
    user?: {
      id?: string
      email?: string
      user_metadata?: Record<string, unknown>
    }
    error?: string
  } | null = null

  try {
    const signupResponse = await fetch(`${apiBaseUrl}/api/auth/signup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        firstName,
        lastName,
        email,
        password,
      }),
      cache: "no-store",
    })

    signupPayload = await signupResponse.json().catch(() => null)

    if (!signupResponse.ok) {
      return {
        error: getFriendlyAuthErrorMessage(
          signupPayload?.error || "We couldn't create your account right now. Please try again."
        ),
      }
    }
  } catch {
    return {
      error: "We couldn't reach the signup service right now. Please try again in a moment.",
    }
  }

  const user = signupPayload?.user

  if (!user?.email) {
    return { error: "We couldn't create your account right now. Please try again." }
  }

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (signInError) {
    return {
      error:
        "Your account was created, but we could not sign you in automatically. Please log in with your email and password.",
    }
  }

  if (user.email) {
    await sendWelcomeEmail({
      email: user.email,
      firstName,
      source: "signup",
    })
  }

  return { success: true, redirect: "/" }
}

export async function signInWithGoogle(formData?: FormData) {
  const supabase = await createClient()
  const baseUrl = await getBaseUrl()
  const nextPath = sanitizeNextPath(String(formData?.get("next") || ""))
  const email = String(formData?.get("email") || "").trim().toLowerCase()

  if (email) {
    const existingAccount = await findExistingAccountByEmail(email)

    if (existingAccount.exists && existingAccount.providers.includes("email") && !existingAccount.providers.includes("google")) {
      redirect(`/login?error=${encodeURIComponent("This email already uses password login. Please sign in with your email and password.")}`)
    }
  }

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${baseUrl}/auth/callback?next=${encodeURIComponent(nextPath)}`,
    },
  })

  if (error) {
    redirect(`/login?error=${encodeURIComponent(getFriendlyAuthErrorMessage(error.message))}`)
  }

  if (!data.url) {
    redirect("/login?error=Google%20sign-in%20URL%20is%20missing")
  }

  redirect(data.url)
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  return { success: true }
}

export async function verifyEmailAbstract(email: string) {
  try {
    const apiKey = process.env.ABSTRACT_EMAIL_API_KEY;
    if (!apiKey) return { success: true }; // Skip if no API key is configured
    
    const res = await fetch(`https://emailvalidation.abstractapi.com/v1/?api_key=${apiKey}&email=${encodeURIComponent(email)}`);
    const data = await res.json();
    
    if (data.deliverability === "UNDELIVERABLE") {
      return { success: false, message: "This email address does not exist or is undeliverable." };
    }
    
    if (data.is_disposable_email?.value === true) {
       return { success: false, message: "Disposable/temporary emails are not allowed." };
    }
    
    return { success: true };
  } catch (err) {
    console.error("Email verification error:", err);
    return { success: true }; // Safe fallback if API fails
  }
}
