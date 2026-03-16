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
    <div style={{ minHeight: "100vh", display: "grid", gridTemplateColumns: "260px 1fr" }}>
      <aside
        style={{
          borderRight: "1px solid #e5e7eb",
          background: "#fff",
          padding: 16,
          display: "grid",
          gridTemplateRows: "auto 1fr auto",
          gap: 20,
        }}
      >
        <div>
          <p style={{ margin: 0, fontSize: 11, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            CLT
          </p>
          <h2 style={{ margin: "4px 0 0", fontSize: 20 }}>Admin Dashboard</h2>
        </div>

        <nav style={{ display: "grid", gap: 8, alignContent: "start" }}>
          {menuItems.map((item) => {
            const active = item.href === "/dashboard" ? pathname === item.href : pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 12px",
                  borderRadius: 10,
                  border: active ? "1px solid #111" : "1px solid transparent",
                  background: active ? "#111" : "transparent",
                  color: active ? "#fff" : "#4b5563",
                  fontSize: 14,
                }}
              >
                <item.icon size={16} />
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div style={{ borderTop: "1px solid #e5e7eb", paddingTop: 12 }}>
          <p style={{ margin: "0 0 10px", fontSize: 12, color: "#6b7280" }}>{userEmail}</p>
          <button
            onClick={handleLogout}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              border: "1px solid #fecaca",
              color: "#dc2626",
              background: "#fff",
              borderRadius: 10,
              padding: "10px 12px",
              cursor: "pointer",
            }}
          >
            <LogOut size={14} />
            Logout
          </button>
        </div>
      </aside>

      <main style={{ padding: 20 }}>{children}</main>
    </div>
  )
}
