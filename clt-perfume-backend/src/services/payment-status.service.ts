import { supabaseAdmin } from '../config/supabase'
import type { ZiinaPaymentIntent } from './ziina.service'
import { fulfillPaidOrderPayment, markOrderPaymentUnsuccessful } from './payment-fulfillment.service'

export type PaymentStatusOrder = {
  id: string
  user_id?: string | null
  status?: string | null
  stripe_session_id?: string | null
  payment_intent_id?: string | null
}

export type PaymentStatusResponse = {
  status: string
  providerStatus: string
  amountTotal: number
  currency: string
  latestError: ZiinaPaymentIntent['latest_error'] | null
  orderStatus: string | null
  fulfilled: boolean
  unsuccessfulMarked: boolean
}

export async function findPaymentOrderById(orderId: string) {
  const { data, error } = await supabaseAdmin
    .from('orders')
    .select('id, user_id, status, stripe_session_id, payment_intent_id')
    .eq('id', orderId)
    .maybeSingle()

  if (error) {
    throw error
  }

  return (data || null) as PaymentStatusOrder | null
}

export function getOrderPaymentReference(order: PaymentStatusOrder) {
  return order.payment_intent_id || order.stripe_session_id || ''
}

export function canAccessPaymentOrder(order: PaymentStatusOrder, userId?: string | null) {
  return !order.user_id || order.user_id === userId
}

export function paymentReferenceMatchesOrder(order: PaymentStatusOrder, paymentIntentId: string) {
  return order.stripe_session_id === paymentIntentId || order.payment_intent_id === paymentIntentId
}

function toPublicPaymentStatus(status: string) {
  return status === 'completed' ? 'paid' : status
}

async function refreshOrderStatus(orderId: string, fallbackStatus?: string | null) {
  const { data } = await supabaseAdmin
    .from('orders')
    .select('status')
    .eq('id', orderId)
    .maybeSingle()

  return data?.status || fallbackStatus || null
}

export async function syncPaymentIntentToOrder(
  paymentIntent: ZiinaPaymentIntent,
  order?: PaymentStatusOrder | null
): Promise<PaymentStatusResponse> {
  let fulfilled = false
  let unsuccessfulMarked = false
  let orderStatus: string | null = order?.status || null

  if (order && paymentIntent.status === 'completed') {
    fulfilled = await fulfillPaidOrderPayment({
      orderId: order.id,
      providerPaymentId: paymentIntent.id,
      providerSessionId: paymentIntent.id,
      amountTotalFils: paymentIntent.amount,
    })
  }

  if (order && (paymentIntent.status === 'failed' || paymentIntent.status === 'canceled')) {
    unsuccessfulMarked = await markOrderPaymentUnsuccessful({
      providerPaymentId: paymentIntent.id,
      status: paymentIntent.status,
    })
  }

  if (order) {
    orderStatus = await refreshOrderStatus(order.id, order.status)
  }

  return {
    status: toPublicPaymentStatus(paymentIntent.status),
    providerStatus: paymentIntent.status,
    amountTotal: paymentIntent.amount,
    currency: paymentIntent.currency_code,
    latestError: paymentIntent.latest_error || null,
    orderStatus,
    fulfilled,
    unsuccessfulMarked,
  }
}
