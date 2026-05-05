import { Router, Request, Response } from 'express'
import { supabaseAdmin } from '../config/supabase'
import { optionalAuthMiddleware } from '../middleware/auth.middleware'
import {
  CheckoutValidationError,
  claimPromoCodeForOrder,
  getOrderAmountInFils,
  releasePromoCodeReservation,
  resolveCheckoutPricing,
  type CheckoutPayload,
} from '../services/checkout.service'
import { buildFrontendUrl } from '../config/public-urls'
import { generateOrderNumber } from '../utils/order-number'
import {
  createZiinaPaymentIntent,
  getZiinaPaymentIntent,
  shouldCreateZiinaTestPayment,
} from '../services/ziina.service'
import {
  canAccessPaymentOrder,
  findPaymentOrderById,
  getOrderPaymentReference,
  paymentReferenceMatchesOrder,
  syncPaymentIntentToOrder,
} from '../services/payment-status.service'

export const paymentRoutes = Router()

type PendingPaymentOrder = {
  id: string
  order_number: string
}

function getZiinaCheckoutUrls(order: PendingPaymentOrder) {
  const orderId = encodeURIComponent(order.id)
  const orderNumber = encodeURIComponent(order.order_number)

  return {
    successUrl: buildFrontendUrl(
      `/checkout/success?session_id={PAYMENT_INTENT_ID}&order_id=${orderId}&order_number=${orderNumber}&payment=bank`
    ),
    cancelUrl: buildFrontendUrl(
      `/checkout/cancel?session_id={PAYMENT_INTENT_ID}&order_id=${orderId}&order_number=${orderNumber}&payment=cancelled`
    ),
    failureUrl: buildFrontendUrl(
      `/checkout/cancel?session_id={PAYMENT_INTENT_ID}&order_id=${orderId}&order_number=${orderNumber}&payment=failed`
    ),
  }
}

async function createZiinaCheckoutForOrder(order: PendingPaymentOrder, total: number) {
  const amountFils = getOrderAmountInFils(total)
  if (amountFils < 200) {
    throw new CheckoutValidationError('Bank payment minimum amount is AED 2')
  }

  const { successUrl, cancelUrl, failureUrl } = getZiinaCheckoutUrls(order)
  const paymentIntent = await createZiinaPaymentIntent({
    amount: amountFils,
    currencyCode: 'AED',
    message: `Order #${order.order_number}`,
    successUrl,
    cancelUrl,
    failureUrl,
    test: shouldCreateZiinaTestPayment(),
  })

  const { error: paymentReferenceError } = await supabaseAdmin
    .from('orders')
    .update({
      payment_intent_id: paymentIntent.id,
      stripe_session_id: paymentIntent.id,
    })
    .eq('id', order.id)

  if (paymentReferenceError) {
    throw new Error(paymentReferenceError.message)
  }

  return {
    url: paymentIntent.redirect_url!,
    sessionId: paymentIntent.id,
    orderId: order.id,
    orderNumber: order.order_number,
  }
}

async function createSessionFromDbCart(userId: string) {
  const { data: cartItems, error } = await supabaseAdmin
    .from('cart_items')
    .select('product_id, quantity, products(name, images, slug, price)')
    .eq('user_id', userId)

  if (error || !cartItems || cartItems.length === 0) {
    throw new Error('Cart is empty')
  }

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
    return await createZiinaCheckoutForOrder(order, pricing.total)
  } catch (error: any) {
    console.error('Ziina Cart Create Payment Error:', error?.response?.data || error)
    await supabaseAdmin.from('order_items').delete().eq('order_id', order.id)
    await supabaseAdmin.from('orders').delete().eq('id', order.id)
    if (error instanceof CheckoutValidationError) throw error
    throw new Error(error?.response?.data?.message || error?.message || 'Failed to initialize Ziina payment for cart')
  }
}

async function createSessionFromPayload(
  userId: string | null,
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

  try {
    return await createZiinaCheckoutForOrder(order, pricing.total)
  } catch (error: any) {
    console.error('Ziina Create Payment Error:', error?.response?.data || error)
    await releasePromoCodeReservation(order.id)
    await supabaseAdmin.from('order_items').delete().eq('order_id', order.id)
    await supabaseAdmin.from('orders').delete().eq('id', order.id)
    if (error instanceof CheckoutValidationError) throw error
    throw new Error(error?.response?.data?.message || error?.message || 'Failed to initialize Ziina payment')
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
      ? await createSessionFromPayload(userId, payload)
      : await createSessionFromDbCart(userId!)

    res.json(result)
  } catch (error: any) {
    console.error('Checkout error:', error)
    const statusCode = error instanceof CheckoutValidationError ? 400 : 500
    res.status(statusCode).json({ error: error.message })
  }
})

// GET /api/payments/session/:sessionId — Verify Ziina payment status
paymentRoutes.get('/session/:sessionId', optionalAuthMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const sessionId = String(req.params.sessionId || '').trim()
    const orderId = typeof req.query.order_id === 'string' ? req.query.order_id.trim() : ''

    if (!sessionId) {
      res.status(400).json({ error: 'Payment session id is required' })
      return
    }

    const paymentIntent = await getZiinaPaymentIntent(sessionId)
    let order = null

    if (orderId) {
      order = await findPaymentOrderById(orderId)
      if (!order) {
        res.status(404).json({ error: 'Order not found for payment session' })
        return
      }

      if (!canAccessPaymentOrder(order, req.user?.id)) {
        res.status(403).json({ error: 'You do not have access to this payment session' })
        return
      }

      if (!paymentReferenceMatchesOrder(order, sessionId)) {
        res.status(404).json({ error: 'Payment session does not match this order' })
        return
      }
    }

    res.json(await syncPaymentIntentToOrder(paymentIntent, order))
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// GET /api/payments/order/:orderId/status — Verify Ziina status from a stored order payment reference
paymentRoutes.get('/order/:orderId/status', optionalAuthMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const orderId = String(req.params.orderId || '').trim()
    if (!orderId) {
      res.status(400).json({ error: 'Order id is required' })
      return
    }

    const order = await findPaymentOrderById(orderId)
    if (!order) {
      res.status(404).json({ error: 'Order not found' })
      return
    }

    if (!canAccessPaymentOrder(order, req.user?.id)) {
      res.status(403).json({ error: 'You do not have access to this order payment' })
      return
    }

    const paymentIntentId = getOrderPaymentReference(order)
    if (!paymentIntentId) {
      res.status(404).json({ error: 'Order does not have a Ziina payment reference' })
      return
    }

    const paymentIntent = await getZiinaPaymentIntent(paymentIntentId)
    res.json(await syncPaymentIntentToOrder(paymentIntent, order))
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})
