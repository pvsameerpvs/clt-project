import React, { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Ban,
  CreditCard,
  Heart,
  KeyRound,
  MapPin,
  ShoppingBag,
  UserCircle2,
  LogOut,
} from "lucide-react"
import type { ProfileSection } from "./profile-types"
import { signOut } from "@/app/auth/actions"

const NAV_ITEMS: Array<{
  id: ProfileSection | "wishlist-direct"
  label: string
  icon: React.ComponentType<{ className?: string }>
  href: string
}> = [
  { id: "account", label: "My Account", icon: UserCircle2, href: "/profile/account" },
  { id: "orders", label: "My Orders", icon: ShoppingBag, href: "/profile/orders" },
  { id: "addresses", label: "My Addresses", icon: MapPin, href: "/profile/addresses" },
  { id: "returns", label: "Returns & Cancel", icon: Ban, href: "/profile/returns" },
  { id: "wishlist-direct", label: "My Wishlist", icon: Heart, href: "/wishlist" },
  { id: "payment", label: "Payment", icon: CreditCard, href: "/profile/payment" },
  { id: "password", label: "Change Password", icon: KeyRound, href: "/profile/password" },
]

type ProfileSidebarProps = {
  initials: string
  fullName: string
}

export function ProfileSidebar({ initials, fullName }: ProfileSidebarProps) {
  const pathname = usePathname()
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)

  return (
    <>
      <aside className="h-fit rounded-2xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-neutral-200 p-5">
          <div className="flex items-center gap-3">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-neutral-200 bg-white text-sm font-semibold text-neutral-700">
              {initials}
            </div>
            <div>
              <p className="text-xs text-neutral-500">Hello</p>
              <p className="max-w-[180px] truncate text-lg font-semibold text-neutral-900" title={fullName}>
                {fullName}
              </p>
            </div>
          </div>
        </div>

        <nav className="p-2 space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href

            return (
              <Link
                key={item.id}
                href={item.href}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium transition ${
                  isActive ? "bg-black text-white" : "text-neutral-700 hover:bg-neutral-50"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            )
          })}

          <div className="pt-2 mt-2 border-t border-neutral-100">
            <button
              type="button"
              onClick={() => setShowLogoutConfirm(true)}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium text-red-600 transition hover:bg-red-50"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </nav>
      </aside>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="w-full max-w-sm rounded-[24px] bg-white p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-600 mx-auto">
              <LogOut className="h-8 w-8" />
            </div>
            <h3 className="mb-2 text-center text-xl font-bold text-neutral-900 font-serif">Sign Out</h3>
            <p className="mb-8 text-center text-neutral-500 leading-relaxed">
              Are you sure you want to log out of your <br/> CLE Perfume account?
            </p>
            <div className="flex flex-col gap-3">
              <button 
                onClick={async () => {
                  setShowLogoutConfirm(false)
                  await signOut()
                  // Force a full page reload to clear memory/cookies definitively
                  window.location.href = "/login"
                }}
                className="w-full rounded-xl bg-black py-4 text-sm font-bold text-white transition hover:bg-neutral-800 active:scale-[0.98]"
              >
                Yes, Sign Out
              </button>
              <button 
                onClick={() => setShowLogoutConfirm(false)}
                className="w-full rounded-xl border border-neutral-200 py-4 text-sm font-bold text-neutral-700 transition hover:bg-neutral-50 active:scale-[0.98]"
              >
                Never mind
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
