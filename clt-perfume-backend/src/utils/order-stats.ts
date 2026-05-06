
import { isCashOnDeliveryPayment } from './order-visibility'

type OrderStatsInput = {
  total?: number | string | null
  tax?: number | string | null
  status?: string | null
  payment_method?: string | null
}

const ONLINE_REVENUE_STATUSES = new Set(['paid', 'confirmed', 'processing', 'shipped', 'delivered'])
const COD_REVENUE_STATUSES = new Set(['pending', 'paid', 'confirmed', 'processing', 'shipped', 'delivered'])
const UNPAID_ONLINE_STATUSES = new Set(['pending'])
const REFUNDED_STATUSES = new Set(['refunded'])
const CANCELLED_STATUSES = new Set(['cancelled', 'canceled'])

function normalizeStatus(status?: string | null) {
  return String(status || '').toLowerCase().trim()
}

export function isRevenueOrder(order: Pick<OrderStatsInput, 'status' | 'payment_method'>) {
  const status = normalizeStatus(order.status)
  if (CANCELLED_STATUSES.has(status) || REFUNDED_STATUSES.has(status)) return false

  if (isCOD(order.payment_method)) {
    return COD_REVENUE_STATUSES.has(status)
  }

  return ONLINE_REVENUE_STATUSES.has(status)
}

export function isUnpaidOnlineOrder(order: Pick<OrderStatsInput, 'status' | 'payment_method'>) {
  if (isCOD(order.payment_method)) return false
  return UNPAID_ONLINE_STATUSES.has(normalizeStatus(order.status))
}

export function isRefundedOrder(order: Pick<OrderStatsInput, 'status'>) {
  return REFUNDED_STATUSES.has(normalizeStatus(order.status))
}

export function isCOD(paymentMethod: string | null | undefined) {
  return isCashOnDeliveryPayment(paymentMethod)
}

export function calculateOrderStats(orders: OrderStatsInput[]) {
  let totalRevenue = 0
  let cardRevenue = 0
  let codRevenue = 0
  let pendingRevenue = 0
  let totalRefunds = 0
  let totalVAT = 0
  let totalPaidOrders = 0
  let totalUnpaidOrders = 0
  let totalRefundedOrders = 0

  for (const order of orders) {
    const orderTotal = Number(order.total || 0)
    const orderTax = Number(order.tax || 0)
    const cod = isCOD(order.payment_method)

    if (isRevenueOrder(order)) {
      totalRevenue += orderTotal
      totalVAT += orderTax
      totalPaidOrders += 1
      
      if (cod) {
        codRevenue += orderTotal
      } else {
        cardRevenue += orderTotal
      }
    } else if (isUnpaidOnlineOrder(order)) {
      pendingRevenue += orderTotal
      totalUnpaidOrders += 1
    } else if (isRefundedOrder(order)) {
      totalRefunds += orderTotal
      totalRefundedOrders += 1
    }
  }

  return {
    totalRevenue,
    cardRevenue,
    codRevenue,
    pendingRevenue,
    totalRefunds,
    totalVAT,
    totalPaidOrders,
    totalUnpaidOrders,
    totalRefundedOrders,
    totalOrders: orders.length
  }
}
