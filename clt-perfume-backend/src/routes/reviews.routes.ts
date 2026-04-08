import { Router, Request, Response } from 'express'
import { supabaseAdmin } from '../config/supabase'
import { authMiddleware } from '../middleware/auth.middleware'

export const reviewRoutes = Router()

// POST /api/reviews — submit a new review (authenticated customers only)
reviewRoutes.post('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id
    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' })
    }

    const { product_id, product_name, user_name, user_email, user_avatar, rating, content } = req.body

    if (!product_id || !rating || !content) {
      return res.status(400).json({ error: 'product_id, rating and content are required' })
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' })
    }

    const { data, error } = await supabaseAdmin
      .from('reviews')
      .insert({
        product_id,
        product_name: product_name || null,
        user_id: userId,
        user_name,
        user_email: user_email || null,
        user_avatar: user_avatar || null,
        rating: Number(rating),
        content: content.trim(),
        is_approved: false, // admin must approve
      })
      .select()
      .single()

    if (error) throw error

    res.status(201).json(data)
  } catch (error: any) {
    console.error('[ReviewRoutes] POST /api/reviews error:', error)
    res.status(400).json({ error: error.message })
  }
})

// GET /api/reviews?product_id=xxx — fetch approved reviews for a product
reviewRoutes.get('/', async (req: Request, res: Response) => {
  try {
    const { product_id } = req.query
    if (!product_id) {
      return res.status(400).json({ error: 'product_id query param is required' })
    }

    const { data, error } = await supabaseAdmin
      .from('reviews')
      .select('id, user_name, user_avatar, rating, content, created_at')
      .eq('product_id', String(product_id))
      .eq('is_approved', true)
      .order('created_at', { ascending: false })

    if (error) throw error

    res.json(data || [])
  } catch (error: any) {
    res.status(400).json({ error: error.message })
  }
})
