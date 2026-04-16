import { supabaseAdmin } from '../config/supabase'
import { sendAbandonedCartEmail } from './email.service'

/**
 * Checks the database for abandoned carts every hour
 * Sequence rules:
 * - 24 hours: 1st email
 * - 48 hours: 2nd email
 * - 72 hours+: repeat every 3 days
 */
export async function checkAbandonedCarts() {
  console.log('[Cron] Checking for abandoned carts...')

  try {
    // 1. Fetch carts older than 24h
    // We get all user_carts and then filter via JS to prevent complex SQL dates in REST
    const { data: carts, error: cartError } = await supabaseAdmin
      .from('user_carts')
      .select('user_id, items, updated_at, total_price')

    if (cartError) throw cartError
    if (!carts || carts.length === 0) return

    for (const cart of carts) {
      // Must have items
      if (!cart.items || cart.items.length === 0) continue

      const cartUpdated = new Date(cart.updated_at).getTime()
      const now = Date.now()
      const hoursSinceUpdate = (now - cartUpdated) / (1000 * 60 * 60)

      if (hoursSinceUpdate < 24) continue // Not abandoned yet

      // Fetch tracking history for this user
      const { data: trackData, error: trackError } = await supabaseAdmin
        .from('abandoned_cart_tracking')
        .select('*')
        .eq('user_id', cart.user_id)
        .single()

      if (trackError && trackError.code !== 'PGRST116') continue // Ignore errors other than "Not found"

      const tracking = trackData || { email_sequence_stage: 0, last_email_sent_at: null }

      let shouldSend = false
      let nextStage = tracking.email_sequence_stage

      const hoursSinceLastEmail = tracking.last_email_sent_at 
        ? (now - new Date(tracking.last_email_sent_at).getTime()) / (1000 * 60 * 60)
        : null

      // Logic rules matching your requirement
      if (tracking.email_sequence_stage === 0) {
        // Send 1st email (after 24h)
        shouldSend = true
        nextStage = 1
      } else if (tracking.email_sequence_stage === 1 && hoursSinceLastEmail !== null && hoursSinceLastEmail >= 24) {
        // Send 2nd email (2 days = 48h after cart abandon, which is 24h after 1st email)
        shouldSend = true
        nextStage = 2
      } else if (tracking.email_sequence_stage === 2 && hoursSinceLastEmail !== null && hoursSinceLastEmail >= 24) {
        // Send 3rd email (3 days = 72h after cart abandon, 24h after 2nd email)
        shouldSend = true
        nextStage = 3
      } else if (tracking.email_sequence_stage >= 3 && hoursSinceLastEmail !== null && hoursSinceLastEmail >= 72) {
        // Send repeating emails (Every 3 days = 72h after the last email)
        shouldSend = true
        nextStage = tracking.email_sequence_stage + 1
      }

      if (shouldSend) {
        // Get user's email
        const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(cart.user_id)
        if (userError || !userData?.user?.email) continue

        // Send Email using Resend
        await sendAbandonedCartEmail(userData.user.email, cart.items, nextStage)

        // Update Tracker
        await supabaseAdmin.from('abandoned_cart_tracking').upsert({
          user_id: cart.user_id,
          last_email_sent_at: new Date().toISOString(),
          email_sequence_stage: nextStage,
          updated_at: new Date().toISOString()
        })
      }
    }
  } catch (err: any) {
    console.error('[Cron] Abandoned cart check failed:', err.message)
  }
}

// Start polling
export function startAbandonedCartCron() {
  console.log('[Cron] Started abandoned cart hourly worker')
  // Run every 1 hour (3600000 ms)
  setInterval(() => {
    checkAbandonedCarts().catch(console.error)
  }, 1000 * 60 * 60)
}
