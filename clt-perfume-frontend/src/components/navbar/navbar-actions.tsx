"use client"

import Link from "next/link"
import { User, Heart, ShoppingBag, LayoutDashboard, LogOut } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { useCart } from "@/contexts/cart-context"
import { useWishlist } from "@/contexts/wishlist-context"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"

export function NavbarActions() {
  const { user, isAdmin } = useAuth()
  const { totalItems } = useCart()
  const { items: wishlistItems } = useWishlist()
  const supabase = createClient()
  const router = useRouter()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.refresh()
  }

  return (
    <div className="flex items-center gap-4 md:gap-6 flex-shrink-0 text-neutral-600">
      {user ? (
        <div className="group relative flex flex-col items-center gap-1 cursor-pointer">
          <User className="h-5 w-5 text-black" />
          <span className="text-[10px] uppercase tracking-wide">Account</span>
          <div className="absolute top-full right-0 mt-2 w-48 bg-white shadow-xl border border-neutral-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-[60] p-4 flex flex-col gap-3">
            <Link href="/dashboard" className="text-[10px] uppercase tracking-widest hover:text-black">My Profile</Link>
            {isAdmin && (
              <Link href="/admin" className="text-[10px] uppercase tracking-widest text-amber-600 hover:text-amber-700 flex items-center gap-2">
                <LayoutDashboard className="h-3 w-3" /> Admin Panel
              </Link>
            )}
            <button onClick={handleSignOut} className="text-[10px] uppercase tracking-widest text-red-500 hover:text-red-600 text-left flex items-center gap-2 pt-2 border-t border-neutral-100">
              <LogOut className="h-3 w-3" /> Sign Out
            </button>
          </div>
        </div>
      ) : (
        <Link href="/login" className="flex flex-col items-center gap-1 hover:text-black transition-colors">
          <User className="h-5 w-5" />
          <span className="text-[10px] uppercase tracking-wide">Sign In</span>
        </Link>
      )}

      <Link href="/wishlist" className="flex flex-col items-center gap-1 hover:text-black transition-colors relative">
        <div className="relative">
          <Heart className="h-5 w-5" />
          {wishlistItems.length > 0 && (
            <Badge className="absolute -top-1.5 -right-1.5 h-3.5 w-3.5 p-0 flex items-center justify-center bg-black text-white rounded-full text-[9px] border border-white">
              {wishlistItems.length}
            </Badge>
          )}
        </div>
        <span className="hidden lg:block text-[10px] uppercase tracking-wide">Wishlist</span>
      </Link>

      <Link href="/cart" className="flex flex-col items-center gap-1 hover:text-black transition-colors relative">
        <div className="relative">
          <ShoppingBag className="h-5 w-5" />
          {totalItems > 0 && (
            <Badge className="absolute -top-1.5 -right-1.5 h-3.5 w-3.5 p-0 flex items-center justify-center bg-black text-white rounded-full text-[9px] border border-white">
              {totalItems}
            </Badge>
          )}
        </div>
        <span className="hidden lg:block text-[10px] uppercase tracking-wide">My Bag</span>
      </Link>
    </div>
  )
}
