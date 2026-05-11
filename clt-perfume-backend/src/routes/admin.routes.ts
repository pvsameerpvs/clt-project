import { Router, Request, Response } from 'express'
import { supabaseAdmin } from '../config/supabase'
import { ReturnService } from '../services/return.service'
import { authMiddleware, adminMiddleware } from '../middleware/auth.middleware'
import { sendOrderStatusEmail, sendAdminOrderCancellationNotification } from '../services/email.service'
import { sendOrderStatusWhatsApp } from '../services/whatsapp.service'
import { notifyAdminPush } from '../services/push-notification.service'
import { isCashOnDeliveryPayment, isVisibleAdminOrder } from '../utils/order-visibility'
import { calculateOrderStats, isRevenueOrder as isDashboardRevenueOrder } from '../utils/order-stats'

export const adminRoutes = Router()

async function getAuthUserEmail(userId?: string | null) {
  if (!userId) return undefined

  const { data, error } = await supabaseAdmin.auth.admin.getUserById(userId)
  if (error) {
    console.error('Failed to load auth user for status email fallback:', error.message)
    return undefined
  }

  return data.user?.email || undefined
}

type AdminOrder = {
  id: string
  user_id: string | null
  total: number | string
  tax?: number | string | null
  status: string
  created_at: string
  order_number?: string
  payment_method?: string | null
  payment_intent_id?: string | null
  stripe_session_id?: string | null
}

function isRevenueOrder(status: string) {
  return status !== 'cancelled' && status !== 'refunded'
}

function normalizeOrderStatusForResponse(status: string) {
  if (status === 'paid') return 'confirmed'
  return status
}

function normalizeOrderStatusForStorage(status: string) {
  if (status === 'confirmed') return 'paid'
  return status
}

function getNotificationPaymentStatus(paymentMethod: string | null | undefined, status: string) {
  const method = String(paymentMethod || '').toLowerCase().trim()
  const isCOD = method.includes('cash') || method.includes('cod') || method === ''
  const normalizedStatus = String(status || '').toLowerCase()

  if (isCOD) {
    if (normalizedStatus === 'paid' || normalizedStatus === 'delivered') {
      return 'Paid'
    }

    return 'Cash on Delivery'
  }

	return 'Paid'
}

function isPaidStatus(status: string) {
  const s = status.toLowerCase()
  return s === 'paid' || s === 'delivered'
}

function isUnpaidStatus(status: string) {
  const s = status.toLowerCase()
  return s === 'pending' || s === 'confirmed' || s === 'processing' || s === 'shipped'
}

function isFulfilledOnlinePaymentStatus(status: string) {
  const s = status.toLowerCase()
  return s === 'paid' || s === 'processing' || s === 'shipped' || s === 'delivered'
}

function isValidDateInput(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value)
}

function toUtcStartIso(dateInput: string) {
  const date = new Date(`${dateInput}T00:00:00.000Z`)
  return Number.isNaN(date.getTime()) ? '' : date.toISOString()
}

function toUtcEndIso(dateInput: string) {
  const date = new Date(`${dateInput}T23:59:59.999Z`)
  return Number.isNaN(date.getTime()) ? '' : date.toISOString()
}

function isMissingParentIdColumn(error: { message?: string } | null | undefined) {
  return Boolean(error?.message?.includes("'parent_id'"))
}

function stripParentId<T extends Record<string, unknown>>(payload: T): Omit<T, 'parent_id'> {
  const { parent_id, ...rest } = payload
  return rest
}

function isMissingProductOptionalColumn(error: { message?: string } | null | undefined) {
  const message = error?.message || ''
  return message.includes("'show_in_catalog'") || message.includes("'variant_group_id'")
}

function stripProductOptionalColumns<T extends Record<string, unknown>>(payload: T): Omit<T, 'show_in_catalog' | 'variant_group_id'> {
  const { show_in_catalog, variant_group_id, ...rest } = payload
  return rest
}

type ProductStockInsightItem = {
  id: string
  order_id: string | null
  price: number | string | null
  quantity: number | string | null
}

type ProductStockInsightOrder = {
  id: string
  order_number?: string | null
  user_id?: string | null
  total?: number | string | null
  status?: string | null
  payment_method?: string | null
  created_at?: string | null
  shipping_address?: Record<string, any> | null
  profile?:
    | { first_name?: string | null; last_name?: string | null; email?: string | null }
    | Array<{ first_name?: string | null; last_name?: string | null; email?: string | null }>
    | null
}

type ProductReturnRequest = {
  id: string
  order_id: string | null
  reason?: string | null
  status?: string | null
  created_at?: string | null
  order?: { id?: string | null; order_number?: string | null } | null
}

const STOCK_INSIGHT_PAGE_SIZE = 1000
const STOCK_INSIGHT_IN_CHUNK_SIZE = 150

function chunkArray<T>(items: T[], size: number) {
  const chunks: T[][] = []
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size))
  }
  return chunks
}

function getProfile(profile: ProductStockInsightOrder['profile']) {
  return Array.isArray(profile) ? profile[0] : profile
}

function getStockInsightCustomer(order: ProductStockInsightOrder | undefined) {
  const profile = getProfile(order?.profile)
  const shippingAddress = order?.shipping_address || {}
  const firstName = profile?.first_name || shippingAddress.first_name || ''
  const lastName = profile?.last_name || shippingAddress.last_name || ''
  const customerName = `${firstName} ${lastName}`.trim() || 'Guest customer'
  const customerEmail =
    profile?.email ||
    shippingAddress.contact_email ||
    shippingAddress.email ||
    null

  return { customerName, customerEmail }
}

async function fetchProductStockInsightItems(productId: string) {
  const rows: ProductStockInsightItem[] = []
  let page = 0

  while (true) {
    const from = page * STOCK_INSIGHT_PAGE_SIZE
    const to = from + STOCK_INSIGHT_PAGE_SIZE - 1
    const { data, error } = await supabaseAdmin
      .from('order_items')
      .select('id, order_id, price, quantity')
      .eq('product_id', productId)
      .order('id', { ascending: true })
      .range(from, to)

    if (error) throw error

    const nextRows = (data || []) as ProductStockInsightItem[]
    rows.push(...nextRows)

    if (nextRows.length < STOCK_INSIGHT_PAGE_SIZE) break
    page += 1
  }

  return rows
}

async function fetchProductStockInsightOrders(orderIds: string[]) {
  const rows: ProductStockInsightOrder[] = []

  for (const chunk of chunkArray(orderIds, STOCK_INSIGHT_IN_CHUNK_SIZE)) {
    const { data, error } = await supabaseAdmin
      .from('orders')
      .select('id, order_number, user_id, total, status, payment_method, created_at, shipping_address, profile:profiles(first_name, last_name)')
      .in('id', chunk)

    if (error) throw error
    rows.push(...((data || []) as ProductStockInsightOrder[]))
  }

  return rows
}

async function fetchProductStockInsightReturns(orderIds: string[]) {
  const rows: ProductReturnRequest[] = []

  for (const chunk of chunkArray(orderIds, STOCK_INSIGHT_IN_CHUNK_SIZE)) {
    const { data, error } = await supabaseAdmin
      .from('order_return_requests')
      .select('id, order_id, reason, status, created_at, order:orders(id, order_number)')
      .in('order_id', chunk)
      .order('created_at', { ascending: false })

    if (error) throw error
    rows.push(...((data || []) as ProductReturnRequest[]))
  }

  return rows
}

// All admin routes require auth + admin role
adminRoutes.use(authMiddleware, adminMiddleware)

// GET /api/admin/dashboard — Overview stats
adminRoutes.get('/dashboard', async (req: Request, res: Response) => {
  try {
    const [products, orders, customers] = await Promise.all([
      supabaseAdmin.from('products').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('orders').select('id, user_id, order_number, total, tax, status, created_at, payment_method, payment_intent_id, stripe_session_id'),
      supabaseAdmin.from('profiles').select('*', { count: 'exact', head: true }),
    ])

    const allOrders = (orders.data || []) as AdminOrder[]
    const visibleOrders = allOrders.filter(isVisibleAdminOrder)

    const stats = calculateOrderStats(visibleOrders)
    const { 
      totalRevenue, 
      cardRevenue, 
      codRevenue, 
      pendingRevenue, 
      totalRefunds,
      totalPaidOrders, 
      totalUnpaidOrders, 
      totalRefundedOrders,
      totalVAT 
    } = stats

    const now = new Date()
    const monthBuckets = Array.from({ length: 6 }, (_, index) => {
      const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (5 - index), 1))
      const key = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`
      return {
        month: key,
        label: date.toLocaleString('en-US', { month: 'short', year: '2-digit', timeZone: 'UTC' }),
        total: 0,
        orders: 0,
      }
    })

    const bucketMap = new Map(monthBuckets.map((bucket) => [bucket.month, bucket]))

    for (const order of visibleOrders) {
      if (!isDashboardRevenueOrder(order)) continue
      const createdAt = new Date(order.created_at)
      if (Number.isNaN(createdAt.getTime())) continue
      const key = `${createdAt.getUTCFullYear()}-${String(createdAt.getUTCMonth() + 1).padStart(2, '0')}`
      const bucket = bucketMap.get(key)
      if (bucket) {
        bucket.total += Number(order.total || 0)
        bucket.orders += 1
      }
    }

    const recentOrders = [...visibleOrders]
      .sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at))
      .slice(0, 8)
      .map((order) => ({
        id: order.id,
        user_id: order.user_id,
        orderNumber: order.order_number || order.id.slice(0, 8),
        total: Number(order.total || 0),
        status: normalizeOrderStatusForResponse(order.status),
        createdAt: order.created_at,
      }))

    res.json({
      totalProducts: products?.count || 0,
      totalOrders: visibleOrders.length,
      totalCustomers: customers?.count || 0,
      totalRevenue,
      cardRevenue,
      codRevenue,
      pendingRevenue,
      totalRefunds,
      totalVAT,
      totalPaidOrders,
      totalUnpaidOrders,
      totalRefundedOrders,
      revenueByMonth: monthBuckets,
      recentOrders,
    })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// GET /api/admin/return-requests — List all return requests
adminRoutes.get('/return-requests', async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('order_return_requests')
      .select('*, order:orders(*, profile:profiles(first_name, last_name))')
      .order('created_at', { ascending: false })

    res.json(data)
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// PUT /api/admin/return-requests/:id/status
adminRoutes.put('/return-requests/:id/status', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { status, message } = req.body

    const result = await ReturnService.updateRequestStatus(id as string, status as any, message as string)

    if (!result.success) {
      res.status(400).json({ error: result.error })
      return
    }

    res.json(result.data)
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// GET /api/admin/products — List all products
adminRoutes.get('/products', async (req: Request, res: Response) => {
  try {
    let query = supabaseAdmin
      .from('products')
      .select('*, category:categories(name)')
      .order('created_at', { ascending: false })

    if (req.query.ml) {
      query = query.eq('ml', req.query.ml)
    }

    const { data, error } = await query

    if (error) throw error

    const mapped = (data || []).map((p: any) => {
      const { stock_quantity, ...rest } = p
      return { ...rest, stock: stock_quantity }
    })

    res.json(mapped)
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// GET /api/admin/products/:id — Get a single product by ID
adminRoutes.get('/products/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { data, error } = await supabaseAdmin
      .from('products')
      .select('*, category:categories(name)')
      .eq('id', id)
      .single()

    if (error || !data) {
      res.status(404).json({ error: 'Product not found' })
      return
    }

    const { stock_quantity, ...rest } = data as any
    res.json({ ...rest, stock: stock_quantity })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// GET /api/admin/products/:id/stock-insights — Product-level sales, order, and return summary
adminRoutes.get('/products/:id/stock-insights', async (req: Request, res: Response) => {
  try {
    const productId = String(req.params.id || '').trim()
    if (!productId) {
      res.status(400).json({ error: 'Product id is required' })
      return
    }

    const items = await fetchProductStockInsightItems(productId)

    if (items.length === 0) {
      res.json({
        productId,
        totalOrders: 0,
        totalQuantity: 0,
        uniqueCustomers: 0,
        grossSales: 0,
        returnRequests: 0,
        pendingReturns: 0,
        lastOrderedAt: null,
        recentOrders: [],
        recentReturns: [],
      })
      return
    }

    const orderIds = Array.from(
      new Set(items.map((item) => item.order_id).filter((orderId): orderId is string => Boolean(orderId)))
    )
    const orders = await fetchProductStockInsightOrders(orderIds)
    const visibleOrders = orders.filter(isVisibleAdminOrder)
    const visibleOrderIds = new Set(visibleOrders.map((order) => order.id))
    const returnRequests = await fetchProductStockInsightReturns(Array.from(visibleOrderIds))

    const ordersById = new Map(visibleOrders.map((order) => [order.id, order]))
    const orderLineTotals = new Map<string, { quantity: number; lineTotal: number }>()
    let totalQuantity = 0
    let grossSales = 0

    for (const item of items) {
      if (!item.order_id) continue
      if (!visibleOrderIds.has(item.order_id)) continue
      const quantity = Math.max(0, Number(item.quantity || 0))
      const lineTotal = Number(item.price || 0) * quantity
      const current = orderLineTotals.get(item.order_id) || { quantity: 0, lineTotal: 0 }

      orderLineTotals.set(item.order_id, {
        quantity: current.quantity + quantity,
        lineTotal: current.lineTotal + lineTotal,
      })
      totalQuantity += quantity
      grossSales += lineTotal
    }

    const customerIds = new Set(
      visibleOrders
        .map((order) => order.user_id)
        .filter((userId): userId is string => Boolean(userId))
    )
    const lastOrderedAt =
      visibleOrders
        .map((order) => order.created_at)
        .filter((createdAt): createdAt is string => Boolean(createdAt))
        .sort((a, b) => +new Date(b) - +new Date(a))[0] || null

    const recentOrders = Array.from(visibleOrderIds)
      .map((orderId) => {
        const order = ordersById.get(orderId)
        const totals = orderLineTotals.get(orderId)
        if (!order || !totals) return null

        const { customerName, customerEmail } = getStockInsightCustomer(order)
        return {
          orderId: order.id,
          orderNumber: order.order_number || order.id.slice(0, 8),
          customerName,
          customerEmail,
          status: normalizeOrderStatusForResponse(String(order.status || 'pending')),
          createdAt: order.created_at || '',
          quantity: totals.quantity,
          lineTotal: totals.lineTotal,
        }
      })
      .filter(Boolean)
      .sort((a: any, b: any) => +new Date(b.createdAt) - +new Date(a.createdAt))
      .slice(0, 8)

    const recentReturns = returnRequests
      .sort((a, b) => +new Date(b.created_at || '') - +new Date(a.created_at || ''))
      .slice(0, 6)
      .map((request) => ({
        id: request.id,
        orderId: request.order_id,
        orderNumber: request.order?.order_number || request.order_id?.slice(0, 8) || null,
        reason: request.reason || null,
        status: request.status || 'pending',
        createdAt: request.created_at || '',
      }))

    res.json({
      productId,
      totalOrders: visibleOrderIds.size,
      totalQuantity,
      uniqueCustomers: customerIds.size,
      grossSales,
      returnRequests: returnRequests.length,
      pendingReturns: returnRequests.filter((request) => String(request.status || '').toLowerCase() === 'pending').length,
      lastOrderedAt,
      recentOrders,
      recentReturns,
    })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// POST /api/admin/products — Create product
adminRoutes.post('/products', async (req: Request, res: Response) => {
  try {
    const payload = { ...req.body }
    // Map dashboard 'stock' to DB 'stock_quantity'
    if (payload.stock !== undefined) {
      payload.stock_quantity = payload.stock
      delete payload.stock
    }

    let { data, error } = await supabaseAdmin
      .from('products')
      .insert(payload)
      .select()
      .single()

    if (error && isMissingProductOptionalColumn(error)) {
      const retry = await supabaseAdmin
        .from('products')
        .insert(stripProductOptionalColumns(payload))
        .select()
        .single()
      data = retry.data
      error = retry.error
    }

    if (error) throw error
    const { stock_quantity, ...rest } = data
    res.json({ ...rest, stock: stock_quantity })
  } catch (error: any) {
    res.status(400).json({ error: error.message })
  }
})

// PUT /api/admin/products/:id — Update product
adminRoutes.put('/products/:id', async (req: Request, res: Response) => {
  try {
    const payload = { ...req.body }
    // Map dashboard 'stock' to DB 'stock_quantity'
    if (payload.stock !== undefined) {
      payload.stock_quantity = payload.stock
      delete payload.stock
    }

    let { data, error } = await supabaseAdmin
      .from('products')
      .update(payload)
      .eq('id', req.params.id)
      .select()
      .single()

    if (error && isMissingProductOptionalColumn(error)) {
      const retry = await supabaseAdmin
        .from('products')
        .update(stripProductOptionalColumns(payload))
        .eq('id', req.params.id)
        .select()
        .single()
      data = retry.data
      error = retry.error
    }

    if (error) throw error
    const { stock_quantity, ...rest } = data
    res.json({ ...rest, stock: stock_quantity })
  } catch (error: any) {
    res.status(400).json({ error: error.message })
  }
})

// DELETE /api/admin/products/:id — Delete product
adminRoutes.delete('/products/:id', async (req: Request, res: Response) => {
  try {
    const { error } = await supabaseAdmin
      .from('products')
      .delete()
      .eq('id', req.params.id)

    if (error) throw error
    res.json({ success: true })
  } catch (error: any) {
    res.status(400).json({ error: error.message })
  }
})

// === CATEGORIES CRUD ===

// GET /api/admin/categories — List all categories
adminRoutes.get('/categories', async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('categories')
      .select('*')
      .order('name', { ascending: true })

    if (error) throw error
    res.json(data)
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// POST /api/admin/categories — Create category
adminRoutes.post('/categories', async (req: Request, res: Response) => {
  try {
    const payload = req.body || {}

    let { data, error } = await supabaseAdmin
      .from('categories')
      .insert(payload)
      .select()
      .single()

    if (error && isMissingParentIdColumn(error)) {
      const retry = await supabaseAdmin
        .from('categories')
        .insert(stripParentId(payload))
        .select()
        .single()
      data = retry.data
      error = retry.error
    }

    if (error) throw error
    res.json(data)
  } catch (error: any) {
    res.status(400).json({ error: error.message })
  }
})

// PUT /api/admin/categories/:id — Update category
adminRoutes.put('/categories/:id', async (req: Request, res: Response) => {
  try {
    const payload = req.body || {}

    let { data, error } = await supabaseAdmin
      .from('categories')
      .update(payload)
      .eq('id', req.params.id)
      .select()
      .single()

    if (error && isMissingParentIdColumn(error)) {
      const retry = await supabaseAdmin
        .from('categories')
        .update(stripParentId(payload))
        .eq('id', req.params.id)
        .select()
        .single()
      data = retry.data
      error = retry.error
    }

    if (error) throw error
    res.json(data)
  } catch (error: any) {
    res.status(400).json({ error: error.message })
  }
})

// DELETE /api/admin/categories/:id — Delete category
adminRoutes.delete('/categories/:id', async (req: Request, res: Response) => {
  try {
    const { error } = await supabaseAdmin
      .from('categories')
      .delete()
      .eq('id', req.params.id)

    if (error) throw error
    res.json({ success: true })
  } catch (error: any) {
    res.status(400).json({ error: error.message })
  }
})

// GET /api/admin/orders/search — Server-side filtered order list
adminRoutes.get('/orders/search', async (req: Request, res: Response) => {
  try {
    const scope = String(req.query.scope || 'all').toLowerCase()
    const statusFilter = String(req.query.status || 'all').toLowerCase()
    const searchText = String(req.query.q || '').trim().toLowerCase()
    const dateFromInput = String(req.query.date_from || '').trim()
    const dateToInput = String(req.query.date_to || '').trim()
    const includePaymentAttempts = String(req.query.include_payment_attempts || '').toLowerCase() === 'true'

    let query = supabaseAdmin
      .from('orders')
      .select('*, profile:profiles(first_name, last_name)')
      .order('created_at', { ascending: false })

    if (statusFilter && statusFilter !== 'all') {
      query = query.eq('status', normalizeOrderStatusForStorage(statusFilter))
    }

    if (scope === 'today') {
      const now = new Date()
      const todayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
      const nextDayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1))
      query = query.gte('created_at', todayStart.toISOString()).lt('created_at', nextDayStart.toISOString())
    }

    if (isValidDateInput(dateFromInput)) {
      const startIso = toUtcStartIso(dateFromInput)
      if (startIso) query = query.gte('created_at', startIso)
    }

    if (isValidDateInput(dateToInput)) {
      const endIso = toUtcEndIso(dateToInput)
      if (endIso) query = query.lte('created_at', endIso)
    }

    const { data, error } = await query

    if (error) throw error

    let normalized = (data || [])
      .filter((order: any) => includePaymentAttempts || isVisibleAdminOrder(order))
      .map((order: any) => ({
        ...order,
        status: normalizeOrderStatusForResponse(order.status),
      }))

    if (searchText) {
      normalized = normalized.filter((order: any) => {
        const orderCode = String(order.order_number || order.id || '').toLowerCase()
        const profile = Array.isArray(order.profile) ? order.profile[0] : order.profile
        const customerName = `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim().toLowerCase()
        const status = String(order.status || '').toLowerCase()
        return (
          orderCode.includes(searchText) ||
          String(order.id || '').toLowerCase().includes(searchText) ||
          customerName.includes(searchText) ||
          status.includes(searchText)
        )
      })
    }

    res.json(normalized)
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// GET /api/admin/orders/:id — Get details for a specific order
adminRoutes.get('/orders/:id', async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('orders')
      .select(`
        *,
        profile:profiles(*),
        items:order_items(
          *,
          product:products(ml, images)
        ),
        return_requests:order_return_requests(*)
      `)
      .eq('id', req.params.id)
      .single()

    if (error || !data) throw error
    
    // Flatten fields for the frontend
    const normalizedItems = (data.items || []).map((item: any) => ({
      ...item,
      product_ml: item.product?.ml || null,
      product_image: item.product?.images?.[0] || null
    }))

    const { stock_quantity, ...rest } = data
    res.json({ 
      ...rest, 
      items: normalizedItems,
      stock: stock_quantity, 
      status: normalizeOrderStatusForResponse(rest.status) 
    })
  } catch (error: any) {
    console.error('ORDER_DETAILS_FAIL:', error)
    res.status(404).json({ error: 'Order not found' })
  }
})

// GET /api/admin/orders/:id/invoice — Generate simple VAT invoice data
adminRoutes.get('/orders/:id/invoice', async (req: Request, res: Response) => {
  try {
    const { data: order, error } = await supabaseAdmin
      .from('orders')
      .select(`
        *,
        profile:profiles(*),
        items:order_items(
          *,
          product:products(ml, images)
        )
      `)
      .eq('id', req.params.id)
      .single()

    if (error || !order) throw new Error('Order not found')

    const invoiceData = {
      invoiceNumber: `INV-${order.order_number || order.id.slice(0, 8)}`,
      date: new Date(order.created_at).toLocaleDateString(),
      customerName: `${order.profile?.first_name || ''} ${order.profile?.last_name || ''}`.trim() || 'Valued Customer',
      customerEmail: order.profile?.email || '',
      shippingAddress: order.shipping_address,
      items: order.items.map((item: any) => ({
        name: item.product?.ml ? `${item.product_name} (${item.product.ml} ML)` : item.product_name,
        quantity: item.quantity,
        price: item.price,
        total: item.price * item.quantity
      })),
      subtotal: order.subtotal,
      vatAmount: order.tax || (order.subtotal * 0.05), // 5% VAT in UAE
      shipping: order.shipping_fee || 0,
      total: order.total
    }

    res.json(invoiceData)
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// GET /api/admin/orders — List all orders
adminRoutes.get('/orders', async (req: Request, res: Response) => {
  try {
    const includePaymentAttempts = String(req.query.include_payment_attempts || '').toLowerCase() === 'true'
    const { data, error } = await supabaseAdmin
      .from('orders')
      .select('*, profile:profiles(first_name, last_name)')
      .order('created_at', { ascending: false })

    if (error) throw error
    const normalized = (data || [])
      .filter((order: any) => includePaymentAttempts || isVisibleAdminOrder(order))
      .map((order: any) => ({
        ...order,
        status: normalizeOrderStatusForResponse(order.status),
      }))
    res.json(normalized)
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// PUT /api/admin/orders/:id/status — Update order status
adminRoutes.put('/orders/:id/status', async (req: Request, res: Response) => {
  try {
    const requestedStatus = String(req.body?.status || '').toLowerCase().trim()
    const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded', 'paid']

    if (!validStatuses.includes(requestedStatus)) {
      res.status(400).json({ error: 'Invalid status' })
      return
    }

    const { data: existingOrder, error: existingOrderError } = await supabaseAdmin
      .from('orders')
      .select('id, status, payment_method')
      .eq('id', req.params.id)
      .single()

    if (existingOrderError || !existingOrder) {
      res.status(404).json({ error: 'Order not found' })
      return
    }

    const statusToStore = normalizeOrderStatusForStorage(requestedStatus)
    const oldStatus = String(existingOrder.status || '').toLowerCase()
    const isCashOrder = isCashOnDeliveryPayment(existingOrder.payment_method)
    const isOnlineOrder = !isCashOrder
    const isMovingOnlineOrderForward = ['paid', 'processing', 'shipped', 'delivered'].includes(statusToStore)

    if (isOnlineOrder && isMovingOnlineOrderForward && !isFulfilledOnlinePaymentStatus(oldStatus)) {
      res.status(400).json({ error: 'Online payment must be confirmed by Ziina before this order can move forward.' })
      return
    }

    if (isOnlineOrder && statusToStore === 'refunded' && !isFulfilledOnlinePaymentStatus(oldStatus)) {
      res.status(400).json({ error: 'Only confirmed online payments can be refunded.' })
      return
    }

    if (
      statusToStore === 'delivered' &&
      !['paid', 'confirmed', 'processing', 'shipped', 'delivered'].includes(oldStatus)
    ) {
      res.status(400).json({ error: 'Delivered status can only be set after the order reaches the paid/confirmed stage.' })
      return
    }

    // Automatic Restocking Logic
    const isNowCancelled = (statusToStore === 'cancelled' || statusToStore === 'refunded')
    const wasAlreadyCancelled = (oldStatus === 'cancelled' || oldStatus === 'refunded')
    const stockWasPreviouslyDeducted = isCashOrder || isFulfilledOnlinePaymentStatus(oldStatus)

    if (isNowCancelled && !wasAlreadyCancelled && stockWasPreviouslyDeducted) {
      // Fetch items to restore stock
      const { data: items } = await supabaseAdmin
        .from('order_items')
        .select('product_id, quantity')
        .eq('order_id', req.params.id)

      if (items && items.length > 0) {
        for (const item of items) {
          if (!item.product_id) continue
          // Increment stock (using negative quantity in decrement_stock if increment_stock doesn't exist)
          await supabaseAdmin.rpc('decrement_stock', {
            p_product_id: item.product_id,
            p_quantity: -Math.abs(item.quantity),
          })
        }
      }
    }

    const notificationStatus = requestedStatus
    const paymentStatus = getNotificationPaymentStatus(existingOrder.payment_method, requestedStatus)
    const updateData: any = { status: statusToStore }
    if (statusToStore === 'shipped') updateData.shipped_at = new Date().toISOString()
    if (statusToStore === 'delivered') updateData.delivered_at = new Date().toISOString()

    const { data, error } = await supabaseAdmin
      .from('orders')
      .update(updateData)
      .eq('id', req.params.id)
      .eq('status', existingOrder.status)
      .select()
      .maybeSingle()

    if (error) throw error
    if (!data) {
      res.status(409).json({ error: 'Order status changed before this update could be saved. Refresh and try again.' })
      return
    }

    // NEW: Notify admin of cancellation/refund if it just happened
    if (isNowCancelled && !wasAlreadyCancelled) {
      await sendAdminOrderCancellationNotification({
        order_number: data.order_number,
        total: Number(data.total || 0),
        reason: `Manual status update to ${requestedStatus} via Admin Dashboard`
      })
    }

    const contactEmail =
      (data.shipping_address as any)?.contact_email ||
      (await getAuthUserEmail(data.user_id)) ||
      undefined
    const contactWhatsapp = (data.shipping_address as any)?.contact_whatsapp

    const emailResult = await sendOrderStatusEmail(
      data.order_number,
      notificationStatus,
      contactEmail,
      paymentStatus
    )
    if (!emailResult.ok && !emailResult.skipped) {
      console.error('Order status email failed:', emailResult.error)
    }

    sendOrderStatusWhatsApp(data.order_number, notificationStatus, contactWhatsapp, paymentStatus)

    // Notify admin via push alongside email
    notifyAdminPush({
      type: 'UPDATE',
      table: 'orders',
      record: {
        id: data.id,
        order_number: data.order_number,
        status: data.status,
        total: data.total,
      },
      old_record: { status: oldStatus },
    }).catch((err) => console.error('[Admin] Direct push failed for status update:', err))

    res.json({
      ...data,
      status: normalizeOrderStatusForResponse(data.status),
    })
  } catch (error: any) {
    res.status(400).json({ error: error.message })
  }
})

// GET /api/admin/customers — Customer list with spending summary
adminRoutes.get('/customers', async (req: Request, res: Response) => {
  try {
    const [{ data: profiles, error: profileError }, { data: orders, error: orderError }] = await Promise.all([
      supabaseAdmin
        .from('profiles')
        .select('id, first_name, last_name, phone, avatar_url, role, created_at')
        .order('created_at', { ascending: false }),
      supabaseAdmin
        .from('orders')
        .select('user_id, total, status, payment_method, created_at'),
    ])

    if (profileError) throw profileError
    if (orderError) throw orderError

    const emailByUserId = new Map<string, string | null>()
    let page = 1
    const perPage = 200
    while (true) {
      const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage })
      if (error) throw error

      const users = data.users || []
      for (const user of users) {
        emailByUserId.set(user.id, user.email || null)
      }

      if (users.length < perPage) break
      page += 1
    }

    const orderStats = new Map<string, { orderCount: number; totalSpent: number; lastOrderAt: string | null }>()

    for (const order of (orders || []) as Array<{ user_id: string | null; total: number | string; status: string; payment_method?: string | null; created_at: string }>) {
      if (!isVisibleAdminOrder(order)) continue
      if (!order.user_id) continue
      const stats = orderStats.get(order.user_id) || { orderCount: 0, totalSpent: 0, lastOrderAt: null }

      stats.orderCount += 1
      if (isRevenueOrder(order.status)) {
        stats.totalSpent += Number(order.total || 0)
      }

      if (!stats.lastOrderAt || +new Date(order.created_at) > +new Date(stats.lastOrderAt)) {
        stats.lastOrderAt = order.created_at
      }

      orderStats.set(order.user_id, stats)
    }

    const data = (profiles || []).map((profile: any) => {
      const stats = orderStats.get(profile.id) || { orderCount: 0, totalSpent: 0, lastOrderAt: null }
      return {
        id: profile.id,
        firstName: profile.first_name || null,
        lastName: profile.last_name || null,
        email: emailByUserId.get(profile.id) || null,
        phone: profile.phone || null,
        avatarUrl: profile.avatar_url || null,
        role: profile.role || 'customer',
        createdAt: profile.created_at,
        orderCount: stats.orderCount,
        totalSpent: stats.totalSpent,
        lastOrderAt: stats.lastOrderAt,
      }
    })

    res.json(data)
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// GET /api/admin/customers/:id — Customer details with orders and shipping addresses
adminRoutes.get('/customers/:id', async (req: Request, res: Response) => {
  try {
    const customerId = String(req.params.id || '').trim()
    if (!customerId) {
      res.status(400).json({ error: 'Customer id is required' })
      return
    }

    const [{ data: profile, error: profileError }, { data: orders, error: ordersError }, authUserResult] = await Promise.all([
      supabaseAdmin
        .from('profiles')
        .select('id, first_name, last_name, phone, avatar_url, role, created_at')
        .eq('id', customerId)
        .single(),
      supabaseAdmin
        .from('orders')
        .select('id, order_number, total, subtotal, tax, shipping_fee, status, payment_method, created_at, shipping_address')
        .eq('user_id', customerId)
        .order('created_at', { ascending: false }),
      supabaseAdmin.auth.admin.getUserById(customerId),
    ])

    if (profileError || !profile) {
      res.status(404).json({ error: 'Customer not found' })
      return
    }
    if (ordersError) throw ordersError
    if (authUserResult.error) throw authUserResult.error

    const customer = {
      id: profile.id,
      firstName: profile.first_name || null,
      lastName: profile.last_name || null,
      email: authUserResult.data.user?.email || null,
      phone: profile.phone || null,
      avatarUrl: profile.avatar_url || null,
      role: profile.role || 'customer',
      createdAt: profile.created_at,
    }

    const normalizedOrders = (orders || [])
      .filter((order: any) => isVisibleAdminOrder(order))
      .map((order: any) => ({
        ...order,
        status: normalizeOrderStatusForResponse(order.status),
        total: Number(order.total || 0),
        subtotal: Number(order.subtotal || 0),
        tax: Number(order.tax || 0),
        shipping_fee: Number(order.shipping_fee || 0),
      }))

    const shippingAddresses = Array.from(
      new Map(
        normalizedOrders
          .map((order: any) => order.shipping_address)
          .filter((address: unknown) => Boolean(address && typeof address === 'object'))
          .map((address: any) => [JSON.stringify(address), address])
      ).values()
    )

    res.json({
      customer,
      orders: normalizedOrders,
      shippingAddresses,
    })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// === NEWSLETTER ===
adminRoutes.get('/newsletter', async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabaseAdmin.from('newsletter_subs').select('*').order('created_at', { ascending: false })
    if (error) throw error
    res.json(data)
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// === CONTACT MESSAGES ===
adminRoutes.get('/messages', async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabaseAdmin.from('contact_messages').select('*').order('created_at', { ascending: false })
    if (error) throw error
    res.json(data)
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

adminRoutes.put('/messages/:id/read', async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabaseAdmin.from('contact_messages').update({ is_read: true }).eq('id', req.params.id).select().single()
    if (error) throw error
    res.json(data)
  } catch (error: any) {
    res.status(400).json({ error: error.message })
  }
})

// === PROMO CODES ===
adminRoutes.get('/promo-codes', async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabaseAdmin.from('promo_codes').select('*').order('created_at', { ascending: false })
    if (error) throw error
    res.json(data)
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

adminRoutes.post('/promo-codes', async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabaseAdmin.from('promo_codes').insert(req.body).select().single()
    if (error) throw error
    res.json(data)
  } catch (error: any) {
    res.status(400).json({ error: error.message })
  }
})

adminRoutes.put('/promo-codes/:id', async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('promo_codes')
      .update(req.body)
      .eq('id', req.params.id)
      .select()
      .single()
    if (error) throw error
    res.json(data)
  } catch (error: any) {
    res.status(400).json({ error: error.message })
  }
})

adminRoutes.delete('/promo-codes/:id', async (req: Request, res: Response) => {
  try {
    const { error } = await supabaseAdmin.from('promo_codes').delete().eq('id', req.params.id)
    if (error) throw error
    res.json({ success: true })
  } catch (error: any) {
    res.status(400).json({ error: error.message })
  }
})

// ── Reviews ──────────────────────────────────────────────────

// GET all reviews (admin sees all, approved + pending)
adminRoutes.get('/reviews', async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('reviews')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) throw error
    res.json(data || [])
  } catch (error: any) {
    res.status(400).json({ error: error.message })
  }
})

// PUT approve a review
adminRoutes.put('/reviews/:id/approve', async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('reviews')
      .update({ is_approved: true })
      .eq('id', req.params.id)
      .select()
      .single()
    if (error) throw error
    res.json(data)
  } catch (error: any) {
    res.status(400).json({ error: error.message })
  }
})

// DELETE a review
adminRoutes.delete('/reviews/:id', async (req: Request, res: Response) => {
  try {
    const { error } = await supabaseAdmin.from('reviews').delete().eq('id', req.params.id)
    if (error) throw error
    res.json({ success: true })
  } catch (error: any) {
    res.status(400).json({ error: error.message })
  }
})
// === PRODUCT PROMOTIONS (GIFT SYSTEM) ===

// GET /api/admin/promotions — List all promotions
adminRoutes.get('/promotions', async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('product_promotions')
      .select('*, parent:products!parent_id(name, slug, images, ml), child:products!child_id(name, slug, images, ml)')
      .order('created_at', { ascending: false })

    if (error) throw error
    res.json(data)
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// POST /api/admin/promotions — Create promotion
adminRoutes.post('/promotions', async (req: Request, res: Response) => {
  try {
    const { parent_id, child_id, discount_percentage, is_active } = req.body
    
    if (!parent_id || !child_id) {
      return res.status(400).json({ error: 'Parent and Child products are required.' })
    }

    const { data, error } = await supabaseAdmin
      .from('product_promotions')
      .insert({
        parent_id,
        child_id,
        discount_percentage: discount_percentage ?? 100,
        is_active: is_active !== false
      })
      .select('*, parent:products!parent_id(name, slug, images, ml), child:products!child_id(name, slug, images, ml)')
      .single()

    if (error) throw error
    res.json(data)
  } catch (error: any) {
    res.status(400).json({ error: error.message })
  }
})

// PUT /api/admin/promotions/:id — Update promotion
adminRoutes.put('/promotions/:id', async (req: Request, res: Response) => {
  try {
    const { discount_percentage, is_active } = req.body
    
    const { data, error } = await supabaseAdmin
      .from('product_promotions')
      .update({
        discount_percentage,
        is_active
      })
      .eq('id', req.params.id)
      .select('*, parent:products!parent_id(name, slug, images, ml), child:products!child_id(name, slug, images, ml)')
      .single()

    if (error) throw error
    res.json(data)
  } catch (error: any) {
    console.error('DEBUG_PROMOTION_UPDATE_FAIL:', error)
    res.status(400).json({ error: error.message })
  }
})

// DELETE /api/admin/promotions/:id — Delete promotion
adminRoutes.delete('/promotions/:id', async (req: Request, res: Response) => {
  try {
    const { error } = await supabaseAdmin
      .from('product_promotions')
      .delete()
      .eq('id', req.params.id)

    if (error) throw error
    res.json({ success: true })
  } catch (error: any) {
    res.status(400).json({ error: error.message })
  }
})
