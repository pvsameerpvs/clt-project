"use client"

import Link from "next/link"
import { User, Heart, ShoppingBag } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { useCart } from "@/contexts/cart-context"
import { useWishlist } from "@/contexts/wishlist-context"
import { Badge } from "@/components/ui/badge"

export function NavbarActions() {
  const { user, isLoading } = useAuth()
  const { totalItems } = useCart()
  const { items: wishlistItems } = useWishlist()

  const accountHref = user ? "/profile/account" : "/login"
  const accountLabel = user ? "Account" : "Log In"

  return (
    <div className="flex items-center gap-4 md:gap-6 flex-shrink-0 text-neutral-600">
      <Link
        href={accountHref}
        className={`flex flex-col items-center gap-1 transition-colors ${isLoading ? "pointer-events-none opacity-60" : "hover:text-black"}`}
      >
        <User className={`h-5 w-5 ${user ? "text-black" : ""}`} />
        <span className="text-[10px] uppercase tracking-wide">{accountLabel}</span>
      </Link>

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
