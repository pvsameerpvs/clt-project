import { Router, Request, Response } from 'express'
import { stripe } from '../config/stripe'
import { supabaseAdmin } from '../config/supabase'
import { authMiddleware } from '../middleware/auth.middleware'

export const paymentRoutes = Router()

type PromoDiscountType = 'percentage' | 'fixed'

type CheckoutItemPayload = {
  product_id: string
  quantity: number
  unit_price: number
}

type CheckoutPayload = {
  items?: CheckoutItemPayload[]
  promo?: {
    discountType?: PromoDiscountType
    discountValue?: number
  } | null
  shipping_address?: Record<string, unknown> | null
}

function toSafeNumber(value: unknown) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function calculatePromoDiscount(
  subtotal: number,
  promo?: { discountType?: PromoDiscountType; discountValue?: number } | null
) {
  if (!promo?.discountType) return 0
  const safeSubtotal = Math.max(0, toSafeNumber(subtotal))
  const safeDiscountValue = Math.max(0, toSafeNumber(promo.discountValue))

  if (promo.discountType === 'fixed') {
    return Math.min(safeSubtotal, safeDiscountValue)
  }

  const percentage = Math.min(100, safeDiscountValue)
  return (safeSubtotal * percentage) / 100
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
  items: Array<{ product_name: string; product_image?: string | null; price: number; quantity: number }>,
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
    .select('quantity, product:products(id, name, price, images, slug)')
    .eq('user_id', userId)

  if (error || !cartItems || cartItems.length === 0) {
    throw new Error('Cart is empty')
  }

  const lineItems = cartItems.map((item: any) => ({
    price_data: {
      currency: 'aed',
      product_data: {
        name: item.product.name,
        images: resolveImageUrl(item.product.images?.[0]) ? [resolveImageUrl(item.product.images?.[0])!] : [],
      },
      unit_amount: Math.max(1, Math.round(toSafeNumber(item.product.price) * 100)),
    },
    quantity: Math.max(1, Math.floor(toSafeNumber(item.quantity))),
  }))

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
  userId: string,
  userEmail: string | null | undefined,
  payload: CheckoutPayload
) {
  const rawItems = Array.isArray(payload.items) ? payload.items : []

  const items = rawItems
    .map((item) => ({
      product_id: String(item.product_id || '').trim(),
      quantity: Math.max(1, Math.floor(toSafeNumber(item.quantity))),
      unit_price: Math.max(0, toSafeNumber(item.unit_price)),
    }))
    .filter((item) => item.product_id && item.quantity > 0)

  if (items.length === 0) {
    throw new Error('Cart is empty')
  }

  const uniqueProductIds = Array.from(new Set(items.map((item) => item.product_id)))
  const { data: productRows, error: productsError } = await supabaseAdmin
    .from('products')
    .select('id, name, slug, images')
    .in('id', uniqueProductIds)

  if (productsError) {
    throw new Error(productsError.message)
  }

  const products = (productRows || []) as Array<{
    id: string
    name: string
    slug: string | null
    images: string[] | null
  }>

  const productMap = new Map(products.map((product) => [product.id, product]))
  const missingProduct = uniqueProductIds.find((id) => !productMap.has(id))
  if (missingProduct) {
    throw new Error('One or more products are unavailable')
  }

  const subtotal = items.reduce((sum, item) => sum + item.unit_price * item.quantity, 0)
  const promoDiscount = calculatePromoDiscount(subtotal, payload.promo || null)
  const total = Math.max(0, subtotal - promoDiscount)

  if (total <= 0) {
    throw new Error('Checkout total must be greater than zero for bank payment')
  }

  const orderNumber = generateOrderNumber()

  const { data: order, error: orderError } = await supabaseAdmin
    .from('orders')
    .insert({
      user_id: userId,
      order_number: orderNumber,
      status: 'pending',
      subtotal,
      tax: 0,
      shipping_fee: 0,
      total,
      payment_method: 'card',
      shipping_address: payload.shipping_address || null,
    })
    .select()
    .single()

  if (orderError || !order) {
    throw new Error(orderError?.message || 'Failed to create order')
  }

  const orderItems = items.map((item) => {
    const product = productMap.get(item.product_id)!
    return {
      order_id: order.id,
      product_id: item.product_id,
      product_name: product.name,
      product_image: product.images?.[0] || null,
      product_slug: product.slug || null,
      price: item.unit_price,
      quantity: item.quantity,
    }
  })

  const { error: orderItemsError } = await supabaseAdmin
    .from('order_items')
    .insert(orderItems)

  if (orderItemsError) {
    throw new Error(orderItemsError.message)
  }

  const stripeLineItems = buildStripeLineItems(orderItems, subtotal, total)

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'payment',
    line_items: stripeLineItems,
    customer_email: userEmail || undefined,
    metadata: {
      user_id: userId,
      order_id: order.id,
      checkout_flow: 'direct_order',
    },
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
}

// POST /api/payments/create-checkout-session
paymentRoutes.post('/create-checkout-session', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id
    const payload = (req.body || {}) as CheckoutPayload

    const hasPayloadItems = Array.isArray(payload.items) && payload.items.length > 0

    const result = hasPayloadItems
      ? await createSessionFromPayload(userId, req.user!.email, payload)
      : await createSessionFromDbCart(userId, req.user!.email)

    res.json(result)
  } catch (error: any) {
    console.error('Checkout error:', error)
    res.status(500).json({ error: error.message })
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
