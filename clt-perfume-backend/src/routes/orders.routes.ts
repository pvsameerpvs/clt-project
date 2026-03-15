import { Router, Request, Response } from 'express'
import { supabaseAdmin } from '../config/supabase'
import { authMiddleware } from '../middleware/auth.middleware'

export const orderRoutes = Router()

// GET /api/orders — Get user's order history
orderRoutes.get('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('orders')
      .select('*, items:order_items(*)')
      .eq('user_id', req.user!.id)
      .order('created_at', { ascending: false })

    if (error) {
      res.status(500).json({ error: error.message })
      return
    }
    res.json(data)
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// GET /api/orders/:id — Get single order details
orderRoutes.get('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('orders')
      .select('*, items:order_items(*)')
      .eq('id', req.params.id)
      .eq('user_id', req.user!.id)
      .single()

    if (error) {
      res.status(404).json({ error: 'Order not found' })
      return
    }
    res.json(data)
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})
