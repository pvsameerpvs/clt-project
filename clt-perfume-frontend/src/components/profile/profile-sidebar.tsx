import {
  Ban,
  CreditCard,
  Heart,
  KeyRound,
  MapPin,
  ShoppingBag,
  Star,
  UserCircle2,
} from "lucide-react"
import type { ProfileSection } from "./profile-types"

const NAV_ITEMS: Array<{
  id: ProfileSection
  label: string
  icon: React.ComponentType<{ className?: string }>
}> = [
  { id: "account", label: "My Accounts", icon: UserCircle2 },
  { id: "orders", label: "My Orders", icon: ShoppingBag },
  { id: "addresses", label: "My Addresses", icon: MapPin },
  { id: "returns", label: "Returns & Cancel", icon: Ban },
  { id: "reviews", label: "My Rating & Reviews", icon: Star },
  { id: "wishlist", label: "My Wishlist", icon: Heart },
  { id: "payment", label: "Payment", icon: CreditCard },
  { id: "password", label: "Change Password", icon: KeyRound },
]

type ProfileSidebarProps = {
  initials: string
  fullName: string
  activeSection: ProfileSection
  onSectionChange: (section: ProfileSection) => void
}

export function ProfileSidebar({ initials, fullName, activeSection, onSectionChange }: ProfileSidebarProps) {
  return (
    <aside className="h-fit rounded-2xl border border-neutral-200 bg-white shadow-sm">
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

      <nav className="p-2">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon
          const isActive = activeSection === item.id

          return (
            <button
              key={item.id}
              onClick={() => onSectionChange(item.id)}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium transition ${
                isActive ? "bg-black text-white" : "text-neutral-700 hover:bg-white"
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{item.label}</span>
            </button>
          )
        })}
      </nav>
    </aside>
  )
}
