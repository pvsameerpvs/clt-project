import { Router, Request, Response } from 'express'
import { stripe } from '../config/stripe'
import { supabaseAdmin } from '../config/supabase'
import { authMiddleware } from '../middleware/auth.middleware'

export const paymentRoutes = Router()

// POST /api/payments/create-checkout-session
paymentRoutes.post('/create-checkout-session', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id

    // Get cart items with product details
    const { data: cartItems, error } = await supabaseAdmin
      .from('cart_items')
      .select('quantity, product:products(id, name, price, images, slug)')
      .eq('user_id', userId)

    if (error || !cartItems || cartItems.length === 0) {
      res.status(400).json({ error: 'Cart is empty' })
      return
    }

    // Build Stripe line items
    const lineItems = cartItems.map((item: any) => ({
      price_data: {
        currency: 'aed',
        product_data: {
          name: item.product.name,
          images: item.product.images?.length > 0
            ? [`${process.env.FRONTEND_URL}${item.product.images[0]}`]
            : [],
        },
        unit_amount: Math.round(item.product.price * 100),
      },
      quantity: item.quantity,
    }))

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: lineItems,
      customer_email: req.user!.email,
      metadata: { user_id: userId },
      shipping_address_collection: {
        allowed_countries: ['AE', 'SA', 'BH', 'KW', 'OM', 'QA'],
      },
      success_url: `${process.env.FRONTEND_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/checkout/cancel`,
    })

    res.json({ url: session.url, sessionId: session.id })
  } catch (error: any) {
    console.error('Checkout error:', error)
    res.status(500).json({ error: error.message })
  }
})

// GET /api/payments/session/:sessionId — Get session status
paymentRoutes.get('/session/:sessionId', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const session = await stripe.checkout.sessions.retrieve(req.params.sessionId as string)
    res.json({
      status: session.payment_status,
      customerEmail: session.customer_details?.email,
      amountTotal: session.amount_total,
      currency: session.currency,
    })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})
