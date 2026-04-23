"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Users,
  Settings,
  LogOut,
  LayoutGrid,
  Mail,
  MessageSquare,
  Ticket,
  RefreshCcw,
  Gift,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { getAdminOrders } from "@/lib/admin-api"

export const menuItems = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { label: "Products", href: "/dashboard/products", icon: Package },
  { label: "Collections", href: "/dashboard/categories", icon: LayoutGrid },
  { label: "Orders", href: "/dashboard/orders", icon: ShoppingBag },
  { label: "Customers", href: "/dashboard/customers", icon: Users },
  { label: "Newsletter", href: "/dashboard/newsletter", icon: Mail },
  { label: "Messages", href: "/dashboard/messages", icon: MessageSquare },
  { label: "Returns", href: "/dashboard/returns", icon: RefreshCcw },
  { label: "Coupons", href: "/dashboard/coupons", icon: Ticket },
  { label: "Promotions", href: "/dashboard/promotions", icon: Gift },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
]

interface DashboardNavProps {
  userEmail: string
  onLogout: () => void
  onItemClick?: () => void
}

export function DashboardNav({ userEmail, onLogout, onItemClick }: DashboardNavProps) {
  const pathname = usePathname()
  const [newOrderCount, setNewOrderCount] = useState(0)
  const [newReturnCount, setNewReturnCount] = useState(0)

  const incomingStatuses = useMemo(() => new Set(["pending", "confirmed", "processing"]), [])

  useEffect(() => {
    let mounted = true

    async function loadNewOrderCount() {
      try {
        const [todayOrders, allReturns] = await Promise.all([
          getAdminOrders({ scope: "today" }),
          import("@/lib/admin-api").then(api => api.getAdminReturnRequests())
        ])
        
        if (!mounted) return
        
        // 1. Calculate new orders
        const incoming = todayOrders.filter((order) => incomingStatuses.has(String(order.status || "").toLowerCase()))
        setNewOrderCount(incoming.length)

        // 2. Calculate pending returns
        const pendingReturns = allReturns.filter(r => String(r.status || "").toLowerCase() === "pending")
        setNewReturnCount(pendingReturns.length)
      } catch {
        if (!mounted) return
        setNewOrderCount(0)
        setNewReturnCount(0)
      }
    }

    loadNewOrderCount()
    const timer = setInterval(loadNewOrderCount, 30000)

    return () => {
      mounted = false
      clearInterval(timer)
    }
  }, [incomingStatuses])

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center px-6 border-b border-neutral-100 mb-6">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400">CLE Perfume</p>
        <span className="ml-2 font-serif text-lg font-bold">Dashboard</span>
      </div>

      <nav className="flex-1 space-y-1.5 px-3">
        {menuItems.map((item) => {
          const active = item.href === "/dashboard" ? pathname === item.href : pathname.startsWith(item.href)
          const isOrdersItem = item.href === "/dashboard/orders"
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onItemClick}
              className={cn(
                "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                active
                  ? "bg-black text-white shadow-lg shadow-black/10"
                  : "text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900"
              )}
            >
              <item.icon className={cn("h-4 w-4 transition-colors", active ? "text-white" : "text-neutral-400 group-hover:text-neutral-900")} />
              <span>{item.label}</span>
              {isOrdersItem && newOrderCount > 0 && (
                <span
                  className={cn(
                    "ml-auto inline-flex min-w-6 items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-bold",
                    active ? "bg-white text-black" : "bg-red-100 text-red-700"
                  )}
                >
                  {newOrderCount > 99 ? "99+" : newOrderCount}
                </span>
              )}
              {item.href === "/dashboard/returns" && newReturnCount > 0 && (
                <span
                  className={cn(
                    "ml-auto inline-flex min-w-6 items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-bold",
                    active ? "bg-white text-black" : "bg-red-100 text-red-700"
                  )}
                >
                  {newReturnCount > 99 ? "99+" : newReturnCount}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-neutral-100 p-6">
        <div className="mb-6 rounded-2xl bg-neutral-50 p-4 border border-neutral-100/50">
          <p className="truncate text-xs font-bold text-neutral-900">{userEmail}</p>
          <p className="text-[9px] text-neutral-500 uppercase tracking-widest mt-1 font-medium">Administrator Profile</p>
        </div>
        <Button
          onClick={onLogout}
          variant="outline"
          className="w-full justify-start gap-3 border-neutral-200 text-neutral-600 hover:bg-red-50 hover:text-red-600 hover:border-red-100 rounded-xl px-4"
        >
          <LogOut size={14} />
          <span className="font-semibold">Sign Out</span>
        </Button>
      </div>
    </div>
  )
}
