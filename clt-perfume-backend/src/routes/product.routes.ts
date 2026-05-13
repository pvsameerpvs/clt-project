import { Router } from 'express'
import { supabaseAdmin } from '../config/supabase'

export const productRoutes = Router()

function isMissingParentIdColumn(error: { message?: string } | null | undefined) {
  return Boolean(error?.message?.includes("'parent_id'"))
}

function isProductsCategoriesRelationSchemaError(error: { message?: string } | null | undefined) {
  const message = error?.message || ''
  return (
    message.includes("relationship between 'products' and 'categories'") ||
    (message.includes("'categories'") && message.includes('schema cache'))
  )
}

async function resolveCategoryBranchIds(rootCategoryId: string) {
  const { data, error } = await supabaseAdmin
    .from('categories')
    .select('id, parent_id')

  if (error) {
    if (isMissingParentIdColumn(error)) {
      return [rootCategoryId]
    }
    throw error
  }

  const byParent = new Map<string, string[]>()
  for (const row of data || []) {
    const item = row as { id: string; parent_id?: string | null }
    if (!item.parent_id) continue
    if (!byParent.has(item.parent_id)) byParent.set(item.parent_id, [])
    byParent.get(item.parent_id)?.push(item.id)
  }

  const seen = new Set<string>()
  const ordered: string[] = []
  const stack = [rootCategoryId]

  while (stack.length) {
    const current = stack.pop()
    if (!current || seen.has(current)) continue
    seen.add(current)
    ordered.push(current)

    const children = byParent.get(current) || []
    for (const child of children) {
      if (!seen.has(child)) stack.push(child)
    }
  }

  return ordered.length ? ordered : [rootCategoryId]
}

async function markProductsRequiringGiftSelection<T extends { id: string }>(products: T[]) {
  if (!products.length) return products

  const productIds = products.map((product) => product.id).filter(Boolean)
  if (!productIds.length) return products

  const { data, error } = await supabaseAdmin
    .from('product_promotions')
    .select('parent_id')
    .in('parent_id', productIds)
    .eq('is_active', true)

  if (error) {
    console.warn('[products] unable to resolve active gift promotions:', error.message)
    return products
  }

  const parentIds = new Set((data || []).map((promotion) => promotion.parent_id).filter(Boolean))
  return products.map((product) => ({
    ...product,
    requires_gift_selection: parentIds.has(product.id),
  }))
}

// GET /api/products/categories - List all categories
productRoutes.get('/categories', async (req, res) => {
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

// GET /api/products/categories/:slug - Get single category
productRoutes.get('/categories/:slug', async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('categories')
      .select('*')
      .eq('slug', req.params.slug)
      .single()

    if (error) throw error
    res.json(data)
  } catch (error: any) {
    res.status(404).json({ error: 'Category not found' })
  }
})

// GET /api/products - List all active products with advanced filtering
productRoutes.get('/', async (req, res) => {
  try {
    const { 
      category, 
      search, 
      minPrice, 
      maxPrice, 
      limit,
      is_best_seller,
      is_new,
      is_exclusive,
      scent
    } = req.query
    
    const runProductsQuery = async (withCategoryJoin: boolean) => {
      let query = supabaseAdmin
        .from('products')
        .select(withCategoryJoin ? '*, category:categories(name, slug)' : '*')
        .eq('is_active', true)

      // 1. Category Bypass (Hierarchical)
      if (category) {
        const { data: catData } = await supabaseAdmin
          .from('categories')
          .select('id')
          .eq('slug', category)
          .single()

        if (catData) {
          const categoryIds = await resolveCategoryBranchIds(catData.id)
          query = query.in('category_id', categoryIds)
        }
      }

      // 2. Feature Bypass (Flags)
      if (is_best_seller === 'true') query = query.eq('is_best_seller', true)
      if (is_new === 'true') query = query.eq('is_new', true)
      if (is_exclusive === 'true') query = query.eq('is_exclusive', true)

      // 3. Scent/Note Bypass (Text Search)
      if (scent) {
        query = query.ilike('scent', `%${scent}%`)
      }

      // ml exact/ilike match Bypass
      if (req.query.ml) {
        query = query.eq('ml', req.query.ml)
      }

      // 4. Price Filters
      if (minPrice) query = query.gte('price', minPrice)
      if (maxPrice) query = query.lte('price', maxPrice)

      // 5. General Search
      if (search) {
        query = query.ilike('name', `%${search}%`)
      }

      query = query.order('created_at', { ascending: false })

      if (limit) {
        query = query.limit(Number(limit))
      }

      return query
    }

    let { data, error } = await runProductsQuery(true)

    if (error && isProductsCategoriesRelationSchemaError(error)) {
      const retry = await runProductsQuery(false)
      data = retry.data
      error = retry.error
    }

    if (error) throw error

    const mapped = (data || []).map((p: any) => {
      const { stock_quantity, ...rest } = p
      return { ...rest, stock: stock_quantity }
    })

    res.json(await markProductsRequiringGiftSelection(mapped))
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// GET /api/products/:slug - Get single product
productRoutes.get('/:slug', async (req, res) => {
  try {
    let { data, error } = await supabaseAdmin
      .from('products')
      .select('*, category:categories(name, slug)')
      .eq('slug', req.params.slug)
      .single()

    if (error && isProductsCategoriesRelationSchemaError(error)) {
      const retry = await supabaseAdmin
        .from('products')
        .select('*')
        .eq('slug', req.params.slug)
        .single()
      data = retry.data
      error = retry.error
    }

    if (error) throw error

    const { stock_quantity, ...rest } = data
    const [product] = await markProductsRequiringGiftSelection([{ ...rest, stock: stock_quantity }])
    res.json(product)
  } catch (error: any) {
    res.status(404).json({ error: 'Product not found' })
  }
})
// GET /api/products/:id/promotions — Get active promotions/gifts for a product
productRoutes.get('/:id/promotions', async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('product_promotions')
      .select('*, gift:products!child_id(*)')
      .eq('parent_id', req.params.id)
      .eq('is_active', true)

    if (error) throw error
    
    // Map stock_quantity to stock for consistency
    const mapped = (data || []).map((item: any) => {
      if (item.gift) {
        const { stock_quantity, ...rest } = item.gift
        item.gift = { ...rest, stock: stock_quantity }
      }
      return item
    })

    res.json(mapped)
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})
