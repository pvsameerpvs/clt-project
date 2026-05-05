export type OrderPaymentVisibilityInput = {
  status?: string | null
  payment_method?: string | null
}

export function isCashOnDeliveryPayment(paymentMethod: string | null | undefined) {
  const method = String(paymentMethod || '').toLowerCase().trim()
  return method.includes('cash') || method.includes('cod') || method === ''
}

export function isUnpaidOnlinePaymentAttempt(order: OrderPaymentVisibilityInput) {
  if (isCashOnDeliveryPayment(order.payment_method)) return false

  const status = String(order.status || '').toLowerCase()
  return status === 'pending' || status === 'cancelled' || status === 'canceled' || status === 'failed'
}

export function isVisibleAdminOrder(order: OrderPaymentVisibilityInput) {
  return !isUnpaidOnlinePaymentAttempt(order)
}
