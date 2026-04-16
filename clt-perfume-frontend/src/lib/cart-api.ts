import { createClient } from "@/lib/supabase/client"
import { CartItem } from "@/contexts/cart-context"

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

/**
 * Syncs the local storage cart to the database for Abandoned Cart Tracking
 */
export async function syncCartToDatabase(items: CartItem[], totalPrice: number): Promise<void> {
  try {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    
    // Only logged in users can be tracked
    if (!session?.access_token) return

    await fetch(`${API_URL}/api/cart/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
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
export async function clearCartFromDatabase(): Promise<void> {
  try {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    
    // Only logged in users have records to clear
    if (!session?.access_token) return

    await fetch(`${API_URL}/api/cart/clear`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`
      }
    })
  } catch (err) {
    console.error('[CartAPI] Failed to clear cart tracker:', err)
  }
}
