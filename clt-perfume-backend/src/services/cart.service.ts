import { supabaseAdmin } from '../config/supabase'

export class CartService {
  /**
   * Saves the user's cart to the database and resets tracking stage
   */
  static async syncCart(userId: string, items: any[], totalPrice: number) {
    // 1. Update the cart items
    const { error: cartError } = await supabaseAdmin
      .from('user_carts')
      .upsert({
        user_id: userId,
        items: items || [],
        total_price: totalPrice || 0,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' })

    if (cartError) throw cartError

    // 2. Reset abandoned cart tracking stage to 0
    // This ensures that if they were in the middle of a reminder sequence,
    // we start over now that they've updated their cart.
    const { error: trackError } = await supabaseAdmin
      .from('abandoned_cart_tracking')
      .upsert({
        user_id: userId,
        email_sequence_stage: 0,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' })

    if (trackError) throw trackError
  }

  /**
   * Deletes the user's cart and tracking from the database
   */
  static async clearCart(userId: string) {
    const { error: cartError } = await supabaseAdmin
      .from('user_carts')
      .delete()
      .eq('user_id', userId)

    if (cartError) throw cartError

    const { error: trackError } = await supabaseAdmin
      .from('abandoned_cart_tracking')
      .delete()
      .eq('user_id', userId)

    if (trackError) throw trackError
  }
}
