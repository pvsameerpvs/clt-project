import { Router } from 'express'
import { supabaseAdmin } from '../config/supabase'

export const productRoutes = Router()

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

// GET /api/products - List all active products with filtering
productRoutes.get('/', async (req, res) => {
  try {
    const { category, search, minPrice, maxPrice, limit } = req.query
    
    let query = supabaseAdmin
      .from('products')
      .select('*, category:categories(name, slug)')
      .eq('is_active', true)

    // Filter by category slug
    if (category) {
      // We first need the category ID if we only have the slug
      const { data: catData } = await supabaseAdmin
        .from('categories')
        .select('id')
        .eq('slug', category)
        .single()
      
      if (catData) {
        query = query.eq('category_id', catData.id)
      }
    }

    // Filter by price
    if (minPrice) query = query.gte('price', minPrice)
    if (maxPrice) query = query.lte('price', maxPrice)

    // Search by name or description
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
