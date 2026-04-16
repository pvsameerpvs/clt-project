import { Router, Request, Response } from 'express'
import { supabaseAdmin } from '../config/supabase'
import { authMiddleware, optionalAuthMiddleware } from '../middleware/auth.middleware'
import { sendOrderConfirmationEmail } from '../services/email.service'
import { sendOrderWhatsAppConfirmation } from '../services/whatsapp.service'

export const orderRoutes = Router()

type PromoDiscountType = 'percentage' | 'fixed'

type CodCheckoutItemPayload = {
  product_id: string
  quantity: number
  unit_price: number
  original_unit_price?: number
}

type CodCheckoutPayload = {
  items?: CodCheckoutItemPayload[]
  promo?: {
    code?: string
    discountType?: PromoDiscountType
    discountValue?: number
  } | null
  shipping_address?: Record<string, unknown> | null
}

type ReturnRequestPayload = {
  reason?: string
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

function normalizeOrderStatusForResponse(status: string) {
  if (status === 'paid') return 'confirmed'
  return status
}

function isMissingRelationError(error: { message?: string } | null | undefined) {
  const message = (error?.message || '').toLowerCase()
  return (
    (message.includes('relation') && message.includes('does not exist')) ||
    message.includes('could not find the table') ||
    message.includes('schema cache')
  )
}

// GET /api/orders — Get user's order history
orderRoutes.get('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('orders')
      .select('*, items:order_items(*)')
      .eq('user_id', req.user!.id)
      .order('created_at', { ascending: false })

    if (error) {
      res.status(500).json({ error: error.message })
      return
    }
    const normalized = (data || []).map((order: any) => ({
      ...order,
      status: normalizeOrderStatusForResponse(order.status),
    }))
    res.json(normalized)
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// POST /api/orders/cod-checkout — Create order from frontend cart (Cash on Delivery)
orderRoutes.post('/cod-checkout', optionalAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const payload = (req.body || {}) as CodCheckoutPayload
    const rawItems = Array.isArray(payload.items) ? payload.items : []

    const items = rawItems
      .map((item) => ({
        product_id: String(item.product_id || '').trim(),
        quantity: Math.max(1, Math.floor(toSafeNumber(item.quantity))),
        unit_price: Math.max(0, toSafeNumber(item.unit_price)),
        original_unit_price: Math.max(0, toSafeNumber(item.original_unit_price ?? item.unit_price)),
      }))
      .filter((item) => item.product_id && item.quantity > 0)

    if (items.length === 0) {
      console.log('[Orders] Cart items empty for payload:', JSON.stringify(payload, null, 2))
      res.status(400).json({ error: 'Cart is empty' })
      return
    }

    const uniqueProductIds = Array.from(new Set(items.map((item) => item.product_id)))
    const { data: productRows, error: productsError } = await supabaseAdmin
      .from('products')
      .select('id, name, slug, images')
      .in('id', uniqueProductIds)

    if (productsError) {
      res.status(500).json({ error: productsError.message })
      return
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
      res.status(400).json({ error: 'One or more products are unavailable' })
      return
    }

    const subtotal = items.reduce((sum, item) => sum + item.unit_price * item.quantity, 0)
    const promoDiscount = calculatePromoDiscount(subtotal, payload.promo || null)
    const total = Math.max(0, subtotal - promoDiscount)
    const orderNumber = generateOrderNumber()

    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert({
        user_id: req.user?.id || null,
        order_number: orderNumber,
        status: 'pending',
        subtotal,
        tax: 0,
        shipping_fee: 0,
        total,
        payment_method: 'cash_on_delivery',
        shipping_address: payload.shipping_address || null,
      })
      .select()
      .single()

    if (orderError || !order) {
      res.status(500).json({ error: orderError?.message || 'Failed to create order' })
      return
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
      res.status(500).json({ error: orderItemsError.message })
      return
    }

    const stockAdjustments = new Map<string, number>()
    for (const item of items) {
      stockAdjustments.set(
        item.product_id,
        (stockAdjustments.get(item.product_id) || 0) + item.quantity
      )
    }

    for (const [productId, quantity] of stockAdjustments) {
      await supabaseAdmin.rpc('decrement_stock', {
        p_product_id: productId,
        p_quantity: quantity,
      })
    }

    const contactEmail = (payload.shipping_address as any)?.contact_email || req.user?.email
    const contactWhatsapp = (payload.shipping_address as any)?.contact_whatsapp

    const emailResult = await sendOrderConfirmationEmail({
      order_number: order.order_number,
      subtotal: Number(order.subtotal || 0),
      total: Number(order.total || 0),
      promo_discount: promoDiscount,
      shipping_fee: Number(order.shipping_fee || 0),
      payment_method: order.payment_method,
      items: orderItems,
      contact_email: contactEmail
    })

    if (!emailResult.ok && !emailResult.skipped) {
      console.error('[Orders] Order confirmation email failed:', emailResult.error)
    }

    console.log('[Orders] Triggering WhatsApp confirmation for:', contactWhatsapp)
    sendOrderWhatsAppConfirmation({
      order_number: order.order_number,
      total: Number(order.total || 0),
      contact_whatsapp: contactWhatsapp,
      items: orderItems.map(item => ({
        product_name: item.product_name,
        quantity: item.quantity,
        price: item.price
      }))
    })

    res.status(201).json({
      id: order.id,
      order_number: order.order_number,
      status: order.status,
      subtotal: Number(order.subtotal || 0),
      promo_discount: promoDiscount,
      total: Number(order.total || 0),
      payment_method: order.payment_method,
    })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// GET /api/orders/return-requests — Get return requests for current user
orderRoutes.get('/return-requests', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('order_return_requests')
      .select('id, order_id, reason, status, created_at, updated_at, order:orders(order_number, total, status, created_at)')
      .eq('user_id', req.user!.id)
      .order('created_at', { ascending: false })

    if (error) {
      if (isMissingRelationError(error)) {
        res.json([])
        return
      }
      throw error
    }

    const normalized = (data || []).map((request: any) => ({
      ...request,
      order: request.order
        ? {
            ...request.order,
            status: normalizeOrderStatusForResponse(request.order.status),
            total: Number(request.order.total || 0),
          }
        : null,
    }))

    res.json(normalized)
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

orderRoutes.post('/:id/cancel', authMiddleware, async (req: Request, res: Response) => {
  try {
    const orderId = String(req.params.id || '').trim()
    if (!orderId) {
      res.status(400).json({ error: 'Order id is required' })
      return
    }

    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('id, status')
      .eq('id', orderId)
      .eq('user_id', req.user!.id)
      .single()

    if (orderError || !order) {
      res.status(404).json({ error: 'Order not found' })
      return
    }

    const currentStatus = normalizeOrderStatusForResponse(order.status)
    const cancelAllowed = ['pending', 'confirmed', 'processing']

    if (!cancelAllowed.includes(currentStatus)) {
      res.status(400).json({ error: `Order cannot be cancelled at ${currentStatus} stage` })
      return
    }

    const { data: updated, error: updateError } = await supabaseAdmin
      .from('orders')
      .update({ status: 'cancelled' })
      .eq('id', orderId)
      .eq('user_id', req.user!.id)
      .select('id, status')
      .single()

    if (updateError || !updated) {
      res.status(500).json({ error: updateError?.message || 'Failed to cancel order' })
      return
    }

    res.json({
      id: updated.id,
      status: normalizeOrderStatusForResponse(updated.status),
    })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

orderRoutes.post('/:id/return-request', authMiddleware, async (req: Request, res: Response) => {
  try {
    const orderId = String(req.params.id || '').trim()
    if (!orderId) {
      res.status(400).json({ error: 'Order id is required' })
      return
    }

    const payload = (req.body || {}) as ReturnRequestPayload
    const reason = String(payload.reason || '').trim()

    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('id, status')
      .eq('id', orderId)
      .eq('user_id', req.user!.id)
      .single()

    if (orderError || !order) {
      res.status(404).json({ error: 'Order not found' })
      return
    }

    const normalizedOrderStatus = normalizeOrderStatusForResponse(order.status)
    if (normalizedOrderStatus !== 'delivered') {
      res.status(400).json({ error: 'Only delivered orders are eligible for return requests' })
      return
    }

    const existingRequest = await supabaseAdmin
      .from('order_return_requests')
      .select('id, status')
      .eq('order_id', orderId)
      .eq('user_id', req.user!.id)
      .in('status', ['pending', 'approved'])
      .maybeSingle()

    if (existingRequest.error && !isMissingRelationError(existingRequest.error)) {
      throw existingRequest.error
    }

    if (existingRequest.data?.id) {
      res.status(400).json({ error: 'Return request already submitted for this order' })
      return
    }

    const { data: created, error: createError } = await supabaseAdmin
      .from('order_return_requests')
      .insert({
        order_id: orderId,
        user_id: req.user!.id,
        reason: reason || null,
        status: 'pending',
      })
      .select('id, order_id, reason, status, created_at, updated_at')
      .single()

    if (createError || !created) {
      if (isMissingRelationError(createError)) {
        res.status(500).json({ error: 'Return requests are not configured in database yet' })
        return
      }
      res.status(500).json({ error: createError?.message || 'Failed to create return request' })
      return
    }

    res.status(201).json(created)
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

orderRoutes.get('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('orders')
      .select('*, items:order_items(*)')
      .eq('id', req.params.id)
      .eq('user_id', req.user!.id)
      .single()

    if (error) {
      res.status(404).json({ error: 'Order not found' })
      return
    }
    res.json({
      ...data,
      status: normalizeOrderStatusForResponse(data.status),
    })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})
