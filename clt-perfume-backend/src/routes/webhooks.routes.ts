import { Router, Request, Response } from 'express'
import express from 'express'
import { stripe } from '../config/stripe'
import { supabaseAdmin } from '../config/supabase'
import Stripe from 'stripe'

export const webhookRoutes = Router()

webhookRoutes.post(
  '/stripe',
  express.raw({ type: 'application/json' }),
  async (req: Request, res: Response): Promise<void> => {
    const sig = req.headers['stripe-signature'] as string
    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message)
      res.status(400).send(`Webhook Error: ${err.message}`)
      return
    }

    switch (event.type) {
      case 'checkout.session.completed': {
        // The event.data.object already contains the full Stripe.Checkout.Session object
        // No need to retrieve it again using req.params.sessionId as it's not available here.
        const session = event.data.object as Stripe.Checkout.Session
        await handleCheckoutCompleted(session)
        break
      }
      case 'payment_intent.payment_failed': {
        const pi = event.data.object as Stripe.PaymentIntent
        console.error('❌ Payment failed:', pi.id)
        break
      }
      default:
        console.log(`Unhandled event: ${event.type}`)
    }

    res.json({ received: true })
  }
)

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.user_id
  if (!userId) return

  try {
    // 1. Get user's cart items
    const { data: cartItems } = await supabaseAdmin
      .from('cart_items')
      .select('quantity, product:products(id, name, price, images, slug)')
      .eq('user_id', userId)

    if (!cartItems || cartItems.length === 0) return

    // 2. Calculate totals
    const subtotal = cartItems.reduce(
      (sum: number, item: any) => sum + item.product.price * item.quantity, 0
    )
    const tax = Math.round(subtotal * 0.05 * 100) / 100 // 5% VAT

    // 3. Create order
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert({
        user_id: userId,
        order_number: '',
        status: 'paid',
        subtotal,
        shipping_fee: 0,
        tax,
        total: subtotal + tax,
        payment_intent_id: session.payment_intent as string,
        stripe_session_id: session.id,
        payment_method: 'card',
        shipping_address: (session as any).shipping_details ? {
          full_name: (session as any).shipping_details.name,
          address_line1: (session as any).shipping_details.address?.line1,
          address_line2: (session as any).shipping_details.address?.line2,
          city: (session as any).shipping_details.address?.city,
          state: (session as any).shipping_details.address?.state,
          country: (session as any).shipping_details.address?.country,
          postal_code: (session as any).shipping_details.address?.postal_code,
        } : null,
      })
      .select()
      .single()

    if (orderError || !order) {
      console.error('Failed to create order:', orderError)
      return
    }

    // 4. Create order items
    const orderItems = cartItems.map((item: any) => ({
      order_id: order.id,
      product_id: item.product.id,
      product_name: item.product.name,
      product_image: item.product.images?.[0] || null,
      product_slug: item.product.slug,
      price: item.product.price,
      quantity: item.quantity,
    }))
    await supabaseAdmin.from('order_items').insert(orderItems)

    // 5. Decrement stock
    for (const item of cartItems as any[]) {
      await supabaseAdmin.rpc('decrement_stock', {
        p_product_id: item.product.id,
        p_quantity: item.quantity,
      })
    }

    // 6. Clear cart
    await supabaseAdmin.from('cart_items').delete().eq('user_id', userId)

    console.log(`✅ Order ${order.order_number} created for user ${userId}`)
  } catch (error) {
    console.error('Error handling checkout:', error)
  }
}
