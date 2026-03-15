import Link from "next/link"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/server"
import { signOut } from "@/app/auth/actions"
import { getAdminBaseUrl } from "@/lib/admin-url"

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login?next=/dashboard")
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  const isAdmin = profile?.role === "admin"
  const adminAppUrl = getAdminBaseUrl()

  return (
    <div className="min-h-screen bg-neutral-50 p-6 md:p-10">
      <div className="mx-auto max-w-3xl rounded-3xl border border-neutral-200 bg-white p-8 shadow-sm">
        <p className="mb-2 text-xs uppercase tracking-[0.2em] text-neutral-500">
          CLE Perfumes
        </p>
        <h1 className="mb-2 text-3xl font-serif text-neutral-900">Dashboard</h1>
        <p className="mb-8 text-sm text-neutral-600">
          You are signed in with Supabase.
        </p>

        <div className="space-y-4 rounded-2xl border border-neutral-200 bg-neutral-50 p-5">
          <div>
            <p className="text-xs uppercase tracking-wide text-neutral-500">Email</p>
            <p className="text-sm text-neutral-900">{user.email || "Not available"}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-neutral-500">User ID</p>
            <p className="break-all text-sm text-neutral-900">{user.id}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-neutral-500">Last Sign In</p>
            <p className="text-sm text-neutral-900">
              {user.last_sign_in_at || "Not available"}
            </p>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <form action={signOut}>
            <Button type="submit" className="rounded-xl bg-black px-6 text-white hover:bg-neutral-800">
              Sign Out
            </Button>
          </form>
          {isAdmin && (
            <a href={adminAppUrl}>
              <Button type="button" variant="outline" className="rounded-xl px-6">
                Open CLT Admin App
              </Button>
            </a>
          )}
          <Link href="/">
            <Button type="button" variant="outline" className="rounded-xl px-6">
              Go to Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
