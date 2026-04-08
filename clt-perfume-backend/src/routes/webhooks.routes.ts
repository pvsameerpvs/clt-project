import { Router, Request, Response } from 'express'
import express from 'express'
import { stripe } from '../config/stripe'
import { supabaseAdmin } from '../config/supabase'
import Stripe from 'stripe'
import { sendOrderConfirmationEmail } from '../services/email.service'

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

async function fulfillDirectOrderPayment(session: Stripe.Checkout.Session) {
  const orderId = session.metadata?.order_id
  if (!orderId) return false

  const { data: order, error: orderError } = await supabaseAdmin
    .from('orders')
    .select('id, user_id, status, payment_method, shipping_address, order_number, subtotal, total, shipping_fee')
    .eq('id', orderId)
    .maybeSingle()

  if (orderError || !order) {
    console.error('Direct checkout order not found:', orderError?.message || orderId)
    return false
  }

  if (order.status === 'paid' || order.status === 'processing' || order.status === 'shipped' || order.status === 'delivered') {
    return true
  }

  const { data: orderItems, error: itemsError } = await supabaseAdmin
    .from('order_items')
    .select('product_id, quantity, product_name, price, product_image')
    .eq('order_id', order.id)

  if (itemsError) {
    console.error('Failed to load direct checkout order items:', itemsError.message)
    return false
  }

  for (const item of orderItems || []) {
    if (!item.product_id) continue
    await supabaseAdmin.rpc('decrement_stock', {
      p_product_id: item.product_id,
      p_quantity: item.quantity,
    })
  }

  const { error: updateError } = await supabaseAdmin
    .from('orders')
    .update({
      status: 'paid',
      payment_intent_id: session.payment_intent as string,
      stripe_session_id: session.id,
    })
    .eq('id', order.id)

  if (updateError) {
    console.error('Failed to mark direct checkout order as paid:', updateError.message)
    return false
  }

  if (order.user_id) {
    await supabaseAdmin.from('cart_items').delete().eq('user_id', order.user_id)
  }

  const contactEmail = (order.shipping_address as any)?.contact_email

  sendOrderConfirmationEmail({
    order_number: order.order_number || '',
    subtotal: Number(order.subtotal || 0),
    total: Number(order.total || 0),
    promo_discount: Number(order.subtotal || 0) + Number(order.shipping_fee || 0) - Number(order.total || 0),
    shipping_fee: Number(order.shipping_fee || 0),
    payment_method: order.payment_method || 'card',
    items: (orderItems || []).map((item) => ({
      product_name: item.product_name,
      quantity: item.quantity,
      price: item.price,
      product_image: item.product_image
    })),
    contact_email: contactEmail || session.customer_details?.email || undefined
  })

  console.log(`✅ Direct order ${order.id} marked paid`)
  return true
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const directHandled = await fulfillDirectOrderPayment(session)
  if (directHandled) return

  const userId = session.metadata?.user_id
  if (!userId) return

  try {
    const { data: cartItems } = await supabaseAdmin
      .from('cart_items')
      .select('quantity, product:products(id, name, price, images, slug)')
      .eq('user_id', userId)

    if (!cartItems || cartItems.length === 0) return

    const subtotal = cartItems.reduce(
      (sum: number, item: any) => sum + item.product.price * item.quantity, 0
    )
    const tax = Math.round(subtotal * 0.05 * 100) / 100

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

    for (const item of cartItems as any[]) {
      await supabaseAdmin.rpc('decrement_stock', {
        p_product_id: item.product.id,
        p_quantity: item.quantity,
      })
    }

    await supabaseAdmin.from('cart_items').delete().eq('user_id', userId)

    sendOrderConfirmationEmail({
      order_number: order.order_number || '',
      subtotal: Number(order.subtotal || 0),
      total: Number(order.total || 0),
      promo_discount: 0, // Old cart flow didn't support promo codes natively as tracked fields
      shipping_fee: Number(order.shipping_fee || 0),
      payment_method: order.payment_method || 'card',
      items: orderItems,
      contact_email: session.customer_details?.email || undefined
    })

    console.log(`✅ Order ${order.order_number} created for user ${userId}`)
  } catch (error) {
    console.error('Error handling checkout:', error)
  }
}
