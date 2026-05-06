import { supabaseAdmin } from '../config/supabase'
import { claimPromoCodeForOrder, getOrderAmountInFils, releasePromoCodeReservation } from './checkout.service'
import { sendOrderConfirmationEmail } from './email.service'
import { sendOrderWhatsAppConfirmation } from './whatsapp.service'

type PaidOrderPaymentInput = {
  orderId?: string | null
  providerPaymentId: string
  providerSessionId?: string | null
  amountTotalFils: number
  currencyCode: string
  customerEmail?: string | null
}

type UnsuccessfulOrderPaymentInput = {
  providerPaymentId: string
  status: string
}

const FULFILLED_ORDER_STATUSES = new Set(['paid', 'processing', 'shipped', 'delivered'])
const CLOSED_ORDER_STATUSES = new Set(['cancelled', 'refunded'])

function isCashPaymentMethod(paymentMethod?: string | null) {
  const method = String(paymentMethod || '').toLowerCase().trim()
  return method.includes('cash') || method.includes('cod')
}

function orderPaymentReferenceMatches(
  order: { stripe_session_id?: string | null; payment_intent_id?: string | null },
  providerPaymentId: string
) {
  return order.stripe_session_id === providerPaymentId || order.payment_intent_id === providerPaymentId
}

async function getAuthUserEmail(userId?: string | null) {
  if (!userId) return undefined

  const { data, error } = await supabaseAdmin.auth.admin.getUserById(userId)
  if (error) {
    console.error('Failed to load auth user for order email fallback:', error.message)
    return undefined
  }

  return data.user?.email || undefined
}

async function findOrderForPayment(input: PaidOrderPaymentInput) {
  const selectFields = 'id, user_id, status, payment_method, shipping_address, order_number, subtotal, total, shipping_fee, promo_code_id, payment_intent_id, stripe_session_id'

  if (input.orderId) {
    const { data, error } = await supabaseAdmin
      .from('orders')
      .select(selectFields)
      .eq('id', input.orderId)
      .maybeSingle()

    if (error) {
      console.error('Paid order lookup failed:', error.message)
      return null
    }

    if (data && !orderPaymentReferenceMatches(data, input.providerPaymentId)) {
      console.error('Paid payment reference does not match requested order:', JSON.stringify({
        orderId: input.orderId,
        paymentId: input.providerPaymentId,
      }))
      return null
    }

    return data
  }

  const sessionLookup = await supabaseAdmin
    .from('orders')
    .select(selectFields)
    .eq('stripe_session_id', input.providerPaymentId)
    .maybeSingle()

  if (sessionLookup.error) {
    console.error('Paid order lookup failed:', sessionLookup.error.message)
    return null
  }

  if (sessionLookup.data) return sessionLookup.data

  const intentLookup = await supabaseAdmin
    .from('orders')
    .select(selectFields)
    .eq('payment_intent_id', input.providerPaymentId)
    .maybeSingle()

  if (intentLookup.error) {
    console.error('Paid order lookup failed:', intentLookup.error.message)
    return null
  }

  return intentLookup.data
}

export async function fulfillPaidOrderPayment(input: PaidOrderPaymentInput) {
  const order = await findOrderForPayment(input)
  if (!order) {
    console.error('Paid payment has no matching order:', input.providerPaymentId)
    return false
  }

  if (isCashPaymentMethod(order.payment_method)) {
    console.error('Ziina payment attempted to fulfill a cash-on-delivery order:', JSON.stringify({ orderId: order.id }))
    return false
  }

  if (String(input.currencyCode || '').toUpperCase() !== 'AED') {
    console.error(
      'Paid payment currency mismatch:',
      JSON.stringify({
        orderId: order.id,
        paymentId: input.providerPaymentId,
        expectedCurrency: 'AED',
        paidCurrency: input.currencyCode,
      })
    )
    return false
  }

  const expectedAmountFils = getOrderAmountInFils(order.total)
  const paidAmountFils = Math.max(0, Number(input.amountTotalFils || 0))

  if (paidAmountFils !== expectedAmountFils) {
    console.error(
      'Paid payment amount mismatch:',
      JSON.stringify({
        orderId: order.id,
        paymentId: input.providerPaymentId,
        expectedAmountFils,
        paidAmountFils,
      })
    )
    return false
  }

  if (FULFILLED_ORDER_STATUSES.has(order.status)) {
    return true
  }

  if (CLOSED_ORDER_STATUSES.has(order.status)) {
    console.error('Paid payment arrived for a closed order:', JSON.stringify({ orderId: order.id, status: order.status }))
    return false
  }

  if (order.promo_code_id && order.user_id) {
    try {
      await claimPromoCodeForOrder(order.user_id, order.promo_code_id, order.id, 'redeemed')
    } catch (error: any) {
      console.error('Failed to finalize promo redemption:', error?.message || error)
      return false
    }
  }

  const { data: transitionedOrder, error: transitionError } = await supabaseAdmin
    .from('orders')
    .update({
      status: 'paid',
      payment_intent_id: input.providerPaymentId,
      stripe_session_id: input.providerSessionId || input.providerPaymentId,
    })
    .eq('id', order.id)
    .eq('status', 'pending')
    .select('id')
    .maybeSingle()

  if (transitionError) {
    console.error('Failed to mark order as paid:', transitionError.message)
    return false
  }

  if (!transitionedOrder) {
    const { data: latestOrder } = await supabaseAdmin
      .from('orders')
      .select('status')
      .eq('id', order.id)
      .maybeSingle()

    return latestOrder ? FULFILLED_ORDER_STATUSES.has(latestOrder.status) : false
  }

  const { data: orderItems, error: itemsError } = await supabaseAdmin
    .from('order_items')
    .select('product_id, quantity, product_name, price, product_image')
    .eq('order_id', order.id)

  if (itemsError) {
    console.error('Failed to load paid order items:', itemsError.message)
    return true
  }

  const stockAdjustments = new Map<string, number>()
  for (const item of orderItems || []) {
    if (!item.product_id) continue
    stockAdjustments.set(
      item.product_id,
      (stockAdjustments.get(item.product_id) || 0) + Number(item.quantity || 0)
    )
  }

  for (const [productId, quantity] of stockAdjustments) {
    const { error: stockError } = await supabaseAdmin.rpc('decrement_stock', {
      p_product_id: productId,
      p_quantity: quantity,
    })

    if (stockError) {
      console.error('Failed to decrement paid order stock:', stockError.message)
    }
  }

  if (order.user_id) {
    await supabaseAdmin.from('cart_items').delete().eq('user_id', order.user_id)
  }

  const contactEmail =
    (order.shipping_address as any)?.contact_email ||
    (await getAuthUserEmail(order.user_id)) ||
    input.customerEmail ||
    undefined
  const contactWhatsapp = (order.shipping_address as any)?.contact_whatsapp

  const emailResult = await sendOrderConfirmationEmail({
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
      product_image: item.product_image,
    })),
    contact_email: contactEmail,
  })

  if (!emailResult.ok && !emailResult.skipped) {
    console.error('Paid order confirmation email failed:', emailResult.error)
  }

  sendOrderWhatsAppConfirmation({
    order_number: order.order_number || '',
    total: Number(order.total || 0),
    contact_whatsapp: contactWhatsapp,
    items: (orderItems || []).map((item) => ({
      product_name: item.product_name,
      quantity: item.quantity,
      price: item.price,
    })),
  })

  console.log(`Paid order ${order.id} fulfilled`)
  return true
}

export async function markOrderPaymentUnsuccessful(input: UnsuccessfulOrderPaymentInput) {
  const sessionLookup = await supabaseAdmin
    .from('orders')
    .select('id, status')
    .eq('stripe_session_id', input.providerPaymentId)
    .maybeSingle()

  if (sessionLookup.error) {
    console.error('Unsuccessful payment order lookup failed:', sessionLookup.error.message)
    return false
  }

  let order = sessionLookup.data
  if (!order) {
    const intentLookup = await supabaseAdmin
      .from('orders')
      .select('id, status')
      .eq('payment_intent_id', input.providerPaymentId)
      .maybeSingle()

    if (intentLookup.error) {
      console.error('Unsuccessful payment order lookup failed:', intentLookup.error.message)
      return false
    }

    order = intentLookup.data
  }

  if (!order || order.status !== 'pending') {
    return false
  }

  const { error: updateError } = await supabaseAdmin
    .from('orders')
    .update({ status: 'cancelled' })
    .eq('id', order.id)
    .eq('status', 'pending')

  if (updateError) {
    console.error('Failed to mark unsuccessful payment order as cancelled:', updateError.message)
    return false
  }

  await releasePromoCodeReservation(order.id)
  console.log(`Order ${order.id} cancelled after Ziina payment status ${input.status}`)
  return true
}
