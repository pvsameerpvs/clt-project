import { Router, Request, Response } from 'express'
import { supabaseAdmin } from '../config/supabase'
import { authMiddleware, optionalAuthMiddleware } from '../middleware/auth.middleware'
import { 
  sendOrderConfirmationEmail, 
  sendAdminNewOrderNotification,
  sendAdminOrderCancellationNotification 
} from '../services/email.service'
import {
  CheckoutValidationError,
  claimPromoCodeForOrder,
  resolveCheckoutPricing,
  type CheckoutPayload,
} from '../services/checkout.service'
import { sendOrderWhatsAppConfirmation } from '../services/whatsapp.service'
import { notifyAdminPush } from '../services/push-notification.service'
import { generateOrderNumber } from '../utils/order-number'
import { isCashOnDeliveryPayment, isUnpaidOnlinePaymentAttempt } from '../utils/order-visibility'

export const orderRoutes = Router()

type ReturnRequestPayload = {
  reason?: string
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
    const normalized = (data || [])
      .filter((order: any) => !isUnpaidOnlinePaymentAttempt(order))
      .map((order: any) => ({
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
    const payload = (req.body || {}) as CheckoutPayload
    const pricing = await resolveCheckoutPricing(payload.items, payload.promo || null, req.user?.id || null)
    const orderNumber = generateOrderNumber()

    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert({
        user_id: req.user?.id || null,
        order_number: orderNumber,
        status: 'pending',
        subtotal: pricing.subtotal,
        promo_code_id: pricing.promoCodeId || null,
        promo_code: pricing.promoCode || null,
        promo_discount: pricing.promoDiscount || 0,
        tax: 0,
        shipping_fee: 0,
        total: pricing.total,
        payment_method: 'cash_on_delivery',
        shipping_address: payload.shipping_address || null,
      })
      .select()
      .single()

    if (orderError || !order) {
      res.status(500).json({ error: orderError?.message || 'Failed to create order' })
      return
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
      res.status(500).json({ error: orderItemsError.message })
      return
    }

    try {
      await claimPromoCodeForOrder(req.user?.id || null, pricing.promoCodeId, order.id, 'redeemed')
    } catch (error) {
      await supabaseAdmin.from('orders').delete().eq('id', order.id)
      throw error
    }

    const stockAdjustments = new Map<string, number>()
    for (const item of pricing.items) {
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
      promo_discount: pricing.promoDiscount,
      shipping_fee: Number(order.shipping_fee || 0),
      payment_method: order.payment_method,
      items: orderItems,
      contact_email: contactEmail
    })

    if (!emailResult.ok && !emailResult.skipped) {
      console.error('[Orders] Order confirmation email failed:', emailResult.error)
    }

    // NEW: Send dedicated high-priority notification to admin
    await sendAdminNewOrderNotification({
      order_number: order.order_number,
      subtotal: Number(order.subtotal || 0),
      total: Number(order.total || 0),
      promo_discount: pricing.promoDiscount,
      shipping_fee: Number(order.shipping_fee || 0),
      payment_method: order.payment_method,
      items: orderItems,
      contact_email: contactEmail,
      contact_name: (payload.shipping_address as any)?.contact_name,
      contact_whatsapp: contactWhatsapp,
      shipping_address: payload.shipping_address
    })

    // Notify admin via push alongside email
    notifyAdminPush({
      type: 'INSERT',
      table: 'orders',
      record: {
        id: order.id,
        order_number: order.order_number,
        status: order.status,
        total: order.total,
      },
    }).catch((err) => console.error('[Orders] Direct push failed for new order:', err))

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
      promo_discount: pricing.promoDiscount,
      total: Number(order.total || 0),
      payment_method: order.payment_method,
    })
  } catch (error: any) {
    const statusCode = error instanceof CheckoutValidationError ? 400 : 500
    res.status(statusCode).json({ error: error.message })
  }
})

// GET /api/orders/return-requests — Get return requests for current user
orderRoutes.get('/return-requests', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('order_return_requests')
      .select('id, order_id, reason, status, created_at, updated_at, order:orders(order_number, total, status, payment_method, created_at)')
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
      .select('id, status, payment_method, order_number, total')
      .eq('id', orderId)
      .eq('user_id', req.user!.id)
      .single()

    if (orderError || !order) {
      res.status(404).json({ error: 'Order not found' })
      return
    }

    const currentStatus = normalizeOrderStatusForResponse(order.status)
    const isCashOrder = isCashOnDeliveryPayment(order.payment_method)
    const cancelAllowed = isCashOrder
      ? ['pending', 'confirmed', 'processing'].includes(currentStatus)
      : currentStatus === 'pending'

    if (!cancelAllowed) {
      res.status(400).json({
        error: isCashOrder
          ? `Order cannot be cancelled at ${currentStatus} stage`
          : 'Paid online orders must be reviewed by support before cancellation or refund',
      })
      return
    }

    const { data: updated, error: updateError } = await supabaseAdmin
      .from('orders')
      .update({ status: 'cancelled' })
      .eq('id', orderId)
      .eq('user_id', req.user!.id)
      .eq('status', order.status)
      .select('id, status')
      .single()

    if (updateError || !updated) {
      res.status(500).json({ error: updateError?.message || 'Failed to cancel order' })
      return
    }

    // Notify Admin of cancellation
    await sendAdminOrderCancellationNotification({
      order_number: order.order_number,
      total: Number(order.total || 0),
      reason: 'Cancelled by customer'
    })

    // Notify admin via push alongside email
    notifyAdminPush({
      type: 'UPDATE',
      table: 'orders',
      record: {
        id: order.id,
        order_number: order.order_number,
        status: 'cancelled',
        total: order.total,
      },
      old_record: { status: order.status },
    }).catch((err) => console.error('[Orders] Direct push failed for cancellation:', err))

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
      .select('id, status, delivered_at')
      .eq('id', orderId)
      .eq('user_id', req.user!.id)
      .single()

    if (orderError || !order) {
      res.status(404).json({ error: 'Order not found' })
      return
    }

    // 1. Must be delivered
    if (order.status !== 'completed' && order.status !== 'delivered') {
      res.status(400).json({ error: 'Only delivered orders can be returned.' })
      return
    }

    // 2. Must be within 24 hours of delivery
    if (!order.delivered_at) {
      res.status(400).json({ error: 'Delivery timestamp missing. Please contact support.' })
      return
    }

    const deliveryTime = new Date(order.delivered_at).getTime()
    const currentTime = new Date().getTime()
    const hoursSinceDelivery = (currentTime - deliveryTime) / (1000 * 60 * 60)

    if (hoursSinceDelivery > 24) {
      res.status(400).json({ error: 'Return window (24 hours) has expired for this order.' })
      return
    }

    const existingRequest = await supabaseAdmin
      .from('order_return_requests')
      .select('id, status')
      .eq('order_id', orderId)
      .eq('user_id', req.user!.id)
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

    // Notify admin via push for new return request
    notifyAdminPush({
      type: 'INSERT',
      table: 'order_return_requests',
      record: {
        id: created.id,
        order_id: orderId,
        reason: reason || null,
        status: created.status,
      },
    }).catch((err) => console.error('[Orders] Direct push failed for return request:', err))

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

    if (error || !data) {
      res.status(404).json({ error: 'Order not found' })
      return
    }

    if (isUnpaidOnlinePaymentAttempt(data)) {
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
