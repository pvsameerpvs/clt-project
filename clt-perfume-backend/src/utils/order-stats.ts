
export function isPaidStatus(status: string) {
  const s = String(status || '').toLowerCase()
  return s === 'paid' || s === 'delivered'
}

export function isUnpaidStatus(status: string) {
  const s = String(status || '').toLowerCase()
  return s === 'pending' || s === 'confirmed' || s === 'processing' || s === 'shipped'
}

export function isCOD(paymentMethod: string | null | undefined) {
  const method = String(paymentMethod || '').toLowerCase().trim()
  return method.includes('cash') || method.includes('cod') || method === ''
}

export function calculateOrderStats(orders: any[]) {
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
    const status = String(order.status || '').toLowerCase()
    
    const paid = isPaidStatus(status)
    const unpaid = isUnpaidStatus(status)
    const refunded = status === 'refunded'

    if (paid) {
      totalRevenue += orderTotal
      totalVAT += orderTax
      totalPaidOrders += 1
      
      if (isCOD(order.payment_method)) {
        codRevenue += orderTotal
      } else {
        cardRevenue += orderTotal
      }
    } else if (unpaid) {
      pendingRevenue += orderTotal
      totalUnpaidOrders += 1
    } else if (refunded) {
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
