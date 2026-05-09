"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { LayoutGrid, LogOut } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { DashboardNav } from "@/components/dashboard/dashboard-nav"
import { GlobalOrderAlerts } from "@/components/dashboard/global-order-alerts"

export function DashboardShell({
  children,
  userEmail,
}: {
  children: React.ReactNode
  userEmail: string
}) {
  const router = useRouter()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/login")
  }

  return (
    <div className="flex h-[100dvh] w-full bg-neutral-50 overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden w-[280px] flex-none border-r border-neutral-200 bg-white md:block">
        <DashboardNav userEmail={userEmail} onLogout={handleLogout} />
      </aside>

      {/* Main Column */}
      <div className="flex flex-1 flex-col min-w-0 h-full overflow-hidden">
        {/* Mobile Header */}
        <header className="flex h-16 items-center justify-between border-b border-neutral-200 bg-white px-6 shrink-0 md:hidden">
          <div className="flex items-center gap-2">
            <span className="font-serif font-bold italic text-neutral-900 text-xl tracking-tight">CLE Perfume</span>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="rounded-full hover:bg-neutral-100"
          >
            <LayoutGrid className="h-5 w-5 text-neutral-600" />
          </Button>
        </header>

        {/* Mobile Menu Overlay */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 bg-white md:hidden animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex justify-end p-4 border-b border-neutral-50">
              <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(false)} className="rounded-full">
                <LogOut className="h-5 w-5 rotate-180" />
              </Button>
            </div>
            <DashboardNav 
              userEmail={userEmail} 
              onLogout={handleLogout} 
              onItemClick={() => setIsMobileMenuOpen(false)} 
            />
          </div>
        )}

        {/* Scrollable Main Content */}
        <main className="flex-1 w-full overflow-y-auto overflow-x-hidden scroll-smooth bg-neutral-50/50">
          <div className="min-h-full w-full">
            <div className="mx-auto max-w-7xl px-4 py-8 sm:px-10 sm:py-12">
              {children}
            </div>
          </div>
        </main>
      </div>

      <GlobalOrderAlerts />
    </div>
  )
}
