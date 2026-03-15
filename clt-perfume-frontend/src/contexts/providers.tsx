"use client"

import { CartProvider } from "./cart-context"
import { WishlistProvider } from "./wishlist-context"
import { AuthProvider } from "./auth-context"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <CartProvider>
        <WishlistProvider>
          {children}
        </WishlistProvider>
      </CartProvider>
    </AuthProvider>
  )
}
