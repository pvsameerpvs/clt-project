"use client"
 
import { AuthProvider } from "./auth-context"
import { ProfileProvider } from "./profile-context"
import { CartProvider } from "./cart-context"
import { WishlistProvider } from "./wishlist-context"
 
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ProfileProvider>
        <CartProvider>
          <WishlistProvider>
            {children}
          </WishlistProvider>
        </CartProvider>
      </ProfileProvider>
    </AuthProvider>
  )
}
