import { CartItem } from "@/contexts/cart-context"

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

/**
 * Syncs the local storage cart to the database for Abandoned Cart Tracking
 */
export async function syncCartToDatabase(
  accessToken: string | null,
  items: CartItem[],
  totalPrice: number
): Promise<void> {
  try {
    // Only logged in users can be tracked
    if (!accessToken) return

    await fetch(`${API_URL}/api/cart/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({ items, totalPrice })
    })
  } catch (err) {
    console.error('[CartAPI] Failed to sync cart:', err)
  }
}

/**
 * Clears the user's cart in the database to stop the Abandoned Cart pipeline
 */
export async function clearCartFromDatabase(accessToken: string | null): Promise<void> {
  try {
    // Only logged in users have records to clear
    if (!accessToken) return

    await fetch(`${API_URL}/api/cart/clear`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    })
  } catch (err) {
    console.error('[CartAPI] Failed to clear cart tracker:', err)
  }
}
