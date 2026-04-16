import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.middleware'
import { CartService } from '../services/cart.service'

export const cartRoutes = Router()

/**
 * @route POST /api/cart/sync
 * @desc Syncs local cart to database for abandoned cart tracking
 * @access Private
 */
cartRoutes.post('/sync', authMiddleware, async (req, res) => {
  try {
    const userId = req.user!.id
    const { items, totalPrice } = req.body

    await CartService.syncCart(userId, items, totalPrice)
    
    return res.json({ success: true })
  } catch (err: any) {
    console.error('[CartRoutes] Sync Error:', err.message)
    return res.status(500).json({ error: 'Internal server error' })
  }
})

/**
 * @route POST /api/cart/clear
 * @desc Deletes cart tracking once an order is placed
 * @access Private
 */
cartRoutes.post('/clear', authMiddleware, async (req, res) => {
  try {
    const userId = req.user!.id
    await CartService.clearCart(userId)
    
    return res.json({ success: true })
  } catch (err: any) {
    console.error('[CartRoutes] Clear Error:', err.message)
    return res.status(500).json({ error: 'Internal server error' })
  }
})

