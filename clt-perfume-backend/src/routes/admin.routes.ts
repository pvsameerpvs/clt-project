import { Router, Request, Response } from 'express'
import { supabaseAdmin } from '../config/supabase'
import { authMiddleware, adminMiddleware } from '../middleware/auth.middleware'

export const adminRoutes = Router()

type AdminOrder = {
  id: string
  user_id: string | null
  total: number | string
  status: string
  created_at: string
  order_number?: string
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

// All admin routes require auth + admin role
adminRoutes.use(authMiddleware, adminMiddleware)

// GET /api/admin/dashboard — Overview stats
adminRoutes.get('/dashboard', async (req: Request, res: Response) => {
  try {
    const [products, orders, customers] = await Promise.all([
      supabaseAdmin.from('products').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('orders').select('id, order_number, total, status, created_at', { count: 'exact' }),
      supabaseAdmin.from('profiles').select('*', { count: 'exact', head: true }),
    ])

    const allOrders = (orders.data || []) as AdminOrder[]

    const totalRevenue = allOrders
      .filter((order) => isRevenueOrder(order.status))
      .reduce((sum, order) => sum + Number(order.total || 0), 0)

    const now = new Date()
    const monthBuckets = Array.from({ length: 6 }, (_, index) => {
      const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (5 - index), 1))
      const key = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`
      return {
        month: key,
        label: date.toLocaleString('en-US', { month: 'short', year: '2-digit', timeZone: 'UTC' }),
        total: 0,
      }
    })

    const bucketMap = new Map(monthBuckets.map((bucket) => [bucket.month, bucket]))

    for (const order of allOrders) {
      if (!isRevenueOrder(order.status)) continue
      const createdAt = new Date(order.created_at)
      if (Number.isNaN(createdAt.getTime())) continue
      const key = `${createdAt.getUTCFullYear()}-${String(createdAt.getUTCMonth() + 1).padStart(2, '0')}`
      const bucket = bucketMap.get(key)
      if (bucket) bucket.total += Number(order.total || 0)
    }

    const recentOrders = [...allOrders]
      .sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at))
      .slice(0, 8)
      .map((order) => ({
        id: order.id,
        orderNumber: order.order_number || order.id.slice(0, 8),
        total: Number(order.total || 0),
        status: normalizeOrderStatusForResponse(order.status),
        createdAt: order.created_at,
      }))

    res.json({
      totalProducts: products.count || 0,
      totalOrders: orders.count || 0,
      totalCustomers: customers.count || 0,
      totalRevenue,
      revenueByMonth: monthBuckets,
      recentOrders,
    })
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

// POST /api/admin/products — Create product
adminRoutes.post('/products', async (req: Request, res: Response) => {
  try {
    const payload = { ...req.body }
    // Map dashboard 'stock' to DB 'stock_quantity'
    if (payload.stock !== undefined) {
      payload.stock_quantity = payload.stock
      delete payload.stock
    }

    const { data, error } = await supabaseAdmin
      .from('products')
      .insert(payload)
      .select()
      .single()

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

    const { data, error } = await supabaseAdmin
      .from('products')
      .update(payload)
      .eq('id', req.params.id)
      .select()
      .single()

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

    let normalized = (data || []).map((order: any) => ({
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
      .select('*, profile:profiles(*), items:order_items(*)')
      .eq('id', req.params.id)
      .single()

    if (error) throw error
    const { stock_quantity, ...rest } = data
    res.json({ ...rest, stock: stock_quantity, status: normalizeOrderStatusForResponse(rest.status) })
  } catch (error: any) {
    res.status(404).json({ error: 'Order not found' })
  }
})

// GET /api/admin/orders/:id/invoice — Generate simple VAT invoice data
adminRoutes.get('/orders/:id/invoice', async (req: Request, res: Response) => {
  try {
    const { data: order, error } = await supabaseAdmin
      .from('orders')
      .select('*, profile:profiles(*), items:order_items(*)')
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
        name: item.product_name,
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
    const { data, error } = await supabaseAdmin
      .from('orders')
      .select('*, profile:profiles(first_name, last_name)')
      .order('created_at', { ascending: false })

    if (error) throw error
    const normalized = (data || []).map((order: any) => ({
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

    const statusToStore = normalizeOrderStatusForStorage(requestedStatus)
    const updateData: any = { status: statusToStore }
    if (statusToStore === 'shipped') updateData.shipped_at = new Date().toISOString()
    if (statusToStore === 'delivered') updateData.delivered_at = new Date().toISOString()

    const { data, error } = await supabaseAdmin
      .from('orders')
      .update(updateData)
      .eq('id', req.params.id)
      .select()
      .single()

    if (error) throw error
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
        .select('user_id, total, status, created_at'),
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

    for (const order of (orders || []) as Array<{ user_id: string | null; total: number | string; status: string; created_at: string }>) {
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
        .select('id, order_number, total, subtotal, tax, shipping_fee, status, created_at, shipping_address')
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

    const normalizedOrders = (orders || []).map((order: any) => ({
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

adminRoutes.delete('/promo-codes/:id', async (req: Request, res: Response) => {
  try {
    const { error } = await supabaseAdmin.from('promo_codes').delete().eq('id', req.params.id)
    if (error) throw error
    res.json({ success: true })
  } catch (error: any) {
    res.status(400).json({ error: error.message })
  }
})
