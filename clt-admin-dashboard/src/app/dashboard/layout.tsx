import { redirect } from "next/navigation"
import { AUTH_SERVICE_UNAVAILABLE_MESSAGE } from "@/lib/auth-errors"
import { createClient } from "@/lib/supabase/server"
import { DashboardShell } from "@/components/dashboard-shell"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  let user = null

  try {
    const {
      data: { user: sessionUser },
    } = await supabase.auth.getUser()
    user = sessionUser
  } catch (error) {
    console.error("[dashboard] Supabase session lookup failed.", error)
    redirect(`/login?error=${encodeURIComponent(AUTH_SERVICE_UNAVAILABLE_MESSAGE)}`)
  }

  if (!user) {
    redirect("/login")
  }

  let profile = null

  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle()
    if (error) throw error
    profile = data
  } catch (error) {
    console.error("[dashboard] Supabase admin profile lookup failed.", error)
    redirect(`/login?error=${encodeURIComponent(AUTH_SERVICE_UNAVAILABLE_MESSAGE)}`)
  }

  if (profile?.role !== "admin") {
    redirect("/login?error=Admin%20access%20required")
  }

  return <DashboardShell userEmail={user.email || "admin"}>{children}</DashboardShell>
}
