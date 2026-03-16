"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Users,
  Settings,
  LogOut,
  LayoutGrid,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

const menuItems = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { label: "Products", href: "/dashboard/products", icon: Package },
  { label: "Collections", href: "/dashboard/categories", icon: LayoutGrid },
  { label: "Orders", href: "/dashboard/orders", icon: ShoppingBag },
  { label: "Customers", href: "/dashboard/customers", icon: Users },
  { label: "Newsletter", href: "/dashboard/newsletter", icon: LayoutDashboard },
  { label: "Messages", href: "/dashboard/messages", icon: LayoutDashboard },
  { label: "Coupons", href: "/dashboard/coupons", icon: LayoutDashboard },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
]

export function DashboardShell({
  children,
  userEmail,
}: {
  children: React.ReactNode
  userEmail: string
}) {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/login")
  }

  return (
    <div className="min-h-screen bg-neutral-50 md:grid md:grid-cols-[260px_1fr]">
      <aside className="border-b border-neutral-200 bg-white px-4 py-4 md:grid md:min-h-screen md:grid-rows-[auto_1fr_auto] md:gap-5 md:border-b-0 md:border-r md:p-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.08em] text-neutral-500">CLT</p>
          <h2 className="mt-1 text-xl font-semibold text-neutral-900">Admin Dashboard</h2>
        </div>

        <nav className="mt-4 flex gap-2 overflow-x-auto pb-1 md:mt-0 md:grid md:content-start md:gap-2 md:overflow-visible md:pb-0">
          {menuItems.map((item) => {
            const active = item.href === "/dashboard" ? pathname === item.href : pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "inline-flex shrink-0 items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition-colors md:flex",
                  active
                    ? "border-black bg-black text-white"
                    : "border-transparent bg-white text-neutral-600 hover:border-neutral-300 hover:text-neutral-900"
                )}
              >
                <item.icon size={16} />
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="mt-4 border-t border-neutral-200 pt-3 md:mt-0">
          <p className="mb-2 truncate text-xs text-neutral-500">{userEmail}</p>
          <Button
            onClick={handleLogout}
            variant="outline"
            className="w-full justify-center border-red-200 text-red-600 hover:border-red-300 hover:bg-red-50 hover:text-red-700"
          >
            <LogOut size={14} />
            Logout
          </Button>
        </div>
      </aside>

      <main className="p-4 sm:p-6">{children}</main>
    </div>
  )
}
