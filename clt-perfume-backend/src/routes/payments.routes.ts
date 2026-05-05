import { Router, Request, Response } from 'express'
import { supabaseAdmin } from '../config/supabase'
import { authMiddleware, optionalAuthMiddleware } from '../middleware/auth.middleware'
import {
  CheckoutValidationError,
  claimPromoCodeForOrder,
  getOrderAmountInFils,
  releasePromoCodeReservation,
  resolveCheckoutPricing,
  type CheckoutOrderItem,
  type CheckoutPayload,
} from '../services/checkout.service'
import { buildFrontendUrl } from '../config/public-urls'
import { generateOrderNumber } from '../utils/order-number'

export const paymentRoutes = Router()

function toSafeNumber(value: unknown) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function resolveImageUrl(image?: string | null) {
  if (!image) return undefined
  return buildFrontendUrl(image)
}

// Keeps Stripe totals aligned even when promo discount is applied.
function buildStripeLineItems(
  items: CheckoutOrderItem[],
  subtotal: number,
  total: number
) {
  const safeSubtotal = Math.max(0, toSafeNumber(subtotal))
  const safeTotal = Math.max(0, toSafeNumber(total))

  const targetFils = Math.max(1, Math.round(safeTotal * 100))
  const sourceTotals = items.map((item) => Math.max(0, toSafeNumber(item.price) * Math.max(1, Math.floor(toSafeNumber(item.quantity)))))

  let allocated = 0

  return items.map((item, index) => {
    const qty = Math.max(1, Math.floor(toSafeNumber(item.quantity)))
    const rawTotal = sourceTotals[index]

    let lineFils = 1
    if (index === items.length - 1) {
      lineFils = Math.max(1, targetFils - allocated)
    } else if (safeSubtotal > 0) {
      lineFils = Math.max(1, Math.round((rawTotal / safeSubtotal) * targetFils))
    } else {
      lineFils = Math.max(1, Math.round(toSafeNumber(item.price) * qty * 100))
    }

    allocated += lineFils

    return {
      price_data: {
        currency: 'aed',
        product_data: {
          name: `${item.product_name} x${qty}`,
          images: resolveImageUrl(item.product_image) ? [resolveImageUrl(item.product_image)!] : [],
        },
        unit_amount: lineFils,
      },
      quantity: 1,
    }
  })
}

import axios from 'axios'

async function createSessionFromDbCart(userId: string, userEmail?: string | null) {
  const { data: cartItems, error } = await supabaseAdmin
    .from('cart_items')
    .select('product_id, quantity, products(name, images, slug, price)')
    .eq('user_id', userId)

  if (error || !cartItems || cartItems.length === 0) {
    throw new Error('Cart is empty')
  }

  // Format cart items to match CheckoutOrderItem for pricing resolution
  const formattedItems = cartItems.map(item => ({
    product_id: item.product_id,
    quantity: item.quantity,
    product_name: (item.products as any).name,
    product_image: (item.products as any).images?.[0] || null,
    product_slug: (item.products as any).slug,
    price: (item.products as any).price
  }))

  const pricing = await resolveCheckoutPricing(formattedItems, null, userId)

  if (pricing.total <= 0) {
    throw new CheckoutValidationError('Checkout total must be greater than zero for bank payment')
  }

  const orderNumber = generateOrderNumber()

  // Create the order immediately as pending
  const { data: order, error: orderError } = await supabaseAdmin
    .from('orders')
    .insert({
      user_id: userId,
      order_number: orderNumber,
      status: 'pending',
      subtotal: pricing.subtotal,
      tax: 0,
      shipping_fee: 0,
      total: pricing.total,
      payment_method: 'card',
      shipping_address: null, // User address is handled differently in cart flow or can be updated later
    })
    .select()
    .single()

  if (orderError || !order) {
    throw new Error(orderError?.message || 'Failed to create order')
  }

  const orderItems = formattedItems.map((item) => ({
    order_id: order.id,
    product_id: item.product_id,
    product_name: item.product_name,
    product_image: item.product_image,
    product_slug: item.product_slug,
    price: item.price,
    quantity: item.quantity,
  }))

  const { error: orderItemsError } = await supabaseAdmin
    .from('order_items')
    .insert(orderItems)

  if (orderItemsError) {
    await supabaseAdmin.from('orders').delete().eq('id', order.id)
    throw new Error(orderItemsError.message)
  }

  try {
    // Ziina Integration
    const response = await axios.post(
      'https://api-v2.ziina.com/api/payment_intent',
      {
        amount: getOrderAmountInFils(pricing.total),
        currency_code: 'AED',
        message: `Order #${order.order_number}`,
        success_url: buildFrontendUrl(
          `/checkout/success?session_id=ziina_${order.id}&order_id=${order.id}&order_number=${encodeURIComponent(order.order_number)}`
        ),
        cancel_url: buildFrontendUrl(`/checkout/cancel?order_id=${order.id}`),
        test: process.env.NODE_ENV !== 'production'
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.ZIINA_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    )

    // Save the payment intent ID to the order
    await supabaseAdmin
      .from('orders')
      .update({ stripe_session_id: response.data.id || `ziina_${order.id}` })
      .eq('id', order.id)

    return { 
      url: response.data.redirect_url || response.data.message_url, 
      sessionId: response.data.id || `ziina_${order.id}`,
      orderId: order.id,
      orderNumber: order.order_number,
    }
  } catch (error: any) {
    console.error('Ziina Cart Create Payment Error:', error?.response?.data || error)
    await supabaseAdmin.from('order_items').delete().eq('order_id', order.id)
    await supabaseAdmin.from('orders').delete().eq('id', order.id)
    throw new Error(error?.response?.data?.message || 'Failed to initialize Ziina payment for cart')
  }
}

async function createSessionFromPayload(
  userId: string | null,
  userEmail: string | null | undefined,
  payload: CheckoutPayload
) {
  const pricing = await resolveCheckoutPricing(payload.items, payload.promo || null, userId)

  if (pricing.total <= 0) {
    throw new CheckoutValidationError('Checkout total must be greater than zero for bank payment')
  }

  const orderNumber = generateOrderNumber()

  const { data: order, error: orderError } = await supabaseAdmin
    .from('orders')
    .insert({
      user_id: userId,
      order_number: orderNumber,
      status: 'pending',
      subtotal: pricing.subtotal,
      promo_code_id: pricing.promoCodeId || null,
      promo_code: pricing.promoCode || null,
      promo_discount: pricing.promoDiscount || 0,
      tax: 0,
      shipping_fee: 0,
      total: pricing.total,
      payment_method: 'card',
      shipping_address: payload.shipping_address || null,
    })
    .select()
    .single()

  if (orderError || !order) {
    throw new Error(orderError?.message || 'Failed to create order')
  }

  const orderItems = pricing.items.map((item) => ({
    order_id: order.id,
    product_id: item.product_id,
    product_name: item.product_name,
    product_image: item.product_image,
    product_slug: item.product_slug,
    price: item.price,
    quantity: item.quantity,
  }))

  const { error: orderItemsError } = await supabaseAdmin
    .from('order_items')
    .insert(orderItems)

  if (orderItemsError) {
    await supabaseAdmin.from('orders').delete().eq('id', order.id)
    throw new Error(orderItemsError.message)
  }

  try {
    await claimPromoCodeForOrder(userId, pricing.promoCodeId, order.id, 'reserved')
  } catch (error) {
    await supabaseAdmin.from('orders').delete().eq('id', order.id)
    throw error
  }

  const stripeLineItems = buildStripeLineItems(pricing.items, pricing.subtotal, pricing.total)
  const metadata: Record<string, string> = {
    order_id: order.id,
    checkout_flow: 'direct_order',
    expected_total_fils: String(getOrderAmountInFils(pricing.total)),
  }

  if (userId) {
    metadata.user_id = userId
  }

  try {
    const response = await axios.post(
      'https://api-v2.ziina.com/api/payment_intent',
      {
        amount: getOrderAmountInFils(pricing.total),
        currency_code: 'AED',
        message: `Order #${order.order_number}`,
        success_url: buildFrontendUrl(
          `/checkout/success?session_id=ziina_${order.id}&order_id=${order.id}&order_number=${encodeURIComponent(order.order_number)}`
        ),
        cancel_url: buildFrontendUrl(`/checkout/cancel?order_id=${order.id}`),
        test: process.env.NODE_ENV !== 'production' // Optional, typically Ziina handles test mode via token, but this is a common param.
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.ZIINA_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    )

    // Save the payment intent ID to the order
    await supabaseAdmin
      .from('orders')
      .update({ stripe_session_id: response.data.id || `ziina_${order.id}` })
      .eq('id', order.id)

    return {
      url: response.data.redirect_url || response.data.message_url,
      sessionId: response.data.id || `ziina_${order.id}`,
      orderId: order.id,
      orderNumber: order.order_number,
    }
  } catch (error: any) {
    console.error('Ziina Create Payment Error:', error?.response?.data || error)
    await releasePromoCodeReservation(order.id)
    await supabaseAdmin.from('order_items').delete().eq('order_id', order.id)
    await supabaseAdmin.from('orders').delete().eq('id', order.id)
    throw new Error(error?.response?.data?.message || 'Failed to initialize Ziina payment')
  }
}

// POST /api/payments/create-checkout-session
paymentRoutes.post('/create-checkout-session', optionalAuthMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id || null
    const payload = (req.body || {}) as CheckoutPayload

    const hasPayloadItems = Array.isArray(payload.items) && payload.items.length > 0

    if (!hasPayloadItems && (!userId || !req.user?.email)) {
      throw new CheckoutValidationError('Sign in is required to use saved cart checkout')
    }

    const result = hasPayloadItems
      ? await createSessionFromPayload(userId, req.user?.email, payload)
      : await createSessionFromDbCart(userId!, req.user!.email)

    res.json(result)
  } catch (error: any) {
    console.error('Checkout error:', error)
    const statusCode = error instanceof CheckoutValidationError ? 400 : 500
    res.status(statusCode).json({ error: error.message })
  }
})

// GET /api/payments/session/:sessionId — Get session status
paymentRoutes.get('/session/:sessionId', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const sessionId = req.params.sessionId as string
    
    // With Ziina, you typically fetch the payment intent status
    const response = await axios.get(`https://api-v2.ziina.com/api/payment_intent/${sessionId}`, {
      headers: {
        Authorization: `Bearer ${process.env.ZIINA_API_KEY}`
      }
    })

    res.json({
      status: response.data.status === 'completed' ? 'paid' : response.data.status,
      amountTotal: response.data.amount,
      currency: response.data.currency_code,
    })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})
