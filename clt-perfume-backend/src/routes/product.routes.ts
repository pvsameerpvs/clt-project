import { Router } from 'express'
import { supabaseAdmin } from '../config/supabase'

export const productRoutes = Router()

function isMissingParentIdColumn(error: { message?: string } | null | undefined) {
  return Boolean(error?.message?.includes("'parent_id'"))
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
    
    let query = supabaseAdmin
      .from('products')
      .select('*, category:categories(name, slug)')
      .eq('is_active', true)

    // 1. Category Bypass (Hierarchical)
    if (category) {
      const { data: catData } = await supabaseAdmin
        .from('categories')
        .select('id')
        .eq('slug', category)
        .single()
      
      if (catData) {
        const { data: childCategories, error: childCategoriesError } = await supabaseAdmin
          .from('categories')
          .select('id')
          .eq('parent_id', catData.id)

        if (childCategoriesError && !isMissingParentIdColumn(childCategoriesError)) {
          throw childCategoriesError
        }

        const categoryIds = [catData.id, ...(childCategories || []).map((item: { id: string }) => item.id)]
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

// GET /api/products/:slug - Get single product
productRoutes.get('/:slug', async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('products')
      .select('*, category:categories(name)')
      .eq('slug', req.params.slug)
      .single()

    if (error) throw error

    const { stock_quantity, ...rest } = data
    res.json({ ...rest, stock: stock_quantity })
  } catch (error: any) {
    res.status(404).json({ error: 'Product not found' })
  }
})
