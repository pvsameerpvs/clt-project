import { Router, Request, Response } from 'express'
import { stripe } from '../config/stripe'
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

export const paymentRoutes = Router()

function toSafeNumber(value: unknown) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function generateOrderNumber() {
  const stamp = Date.now().toString(36).toUpperCase()
  const suffix = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, '0')
  return `CLT-${stamp}-${suffix}`
}

function resolveImageUrl(image?: string | null) {
  if (!image) return undefined
  if (image.startsWith('http://') || image.startsWith('https://')) return image
  if (!process.env.FRONTEND_URL) return undefined
  return `${process.env.FRONTEND_URL}${image}`
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

async function createSessionFromDbCart(userId: string, userEmail?: string | null) {
  const { data: cartItems, error } = await supabaseAdmin
    .from('cart_items')
    .select('product_id, quantity')
    .eq('user_id', userId)

  if (error || !cartItems || cartItems.length === 0) {
    throw new Error('Cart is empty')
  }

  const pricing = await resolveCheckoutPricing(cartItems, null)
  const lineItems = buildStripeLineItems(pricing.items, pricing.subtotal, pricing.total)

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'payment',
    line_items: lineItems,
    customer_email: userEmail || undefined,
    metadata: { user_id: userId },
    shipping_address_collection: {
      allowed_countries: ['AE', 'SA', 'BH', 'KW', 'OM', 'QA'],
    },
    success_url: `${process.env.FRONTEND_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.FRONTEND_URL}/checkout/cancel`,
  })

  return { url: session.url, sessionId: session.id }
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
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: stripeLineItems,
      customer_email: userEmail || undefined,
      metadata,
      shipping_address_collection: {
        allowed_countries: ['AE', 'SA', 'BH', 'KW', 'OM', 'QA'],
      },
      success_url: `${process.env.FRONTEND_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}&order_id=${order.id}`,
      cancel_url: `${process.env.FRONTEND_URL}/checkout/cancel?order_id=${order.id}`,
    })

    return {
      url: session.url,
      sessionId: session.id,
      orderId: order.id,
    }
  } catch (error) {
    await releasePromoCodeReservation(order.id)
    await supabaseAdmin.from('order_items').delete().eq('order_id', order.id)
    await supabaseAdmin.from('orders').delete().eq('id', order.id)
    throw error
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
    const session = await stripe.checkout.sessions.retrieve(req.params.sessionId as string)
    res.json({
      status: session.payment_status,
      customerEmail: session.customer_details?.email,
      amountTotal: session.amount_total,
      currency: session.currency,
    })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})
