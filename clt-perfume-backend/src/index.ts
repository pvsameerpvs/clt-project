import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import dotenv from 'dotenv'

dotenv.config()

import { paymentRoutes } from './routes/payments.routes'
import { orderRoutes } from './routes/orders.routes'
import { webhookRoutes } from './routes/webhooks.routes'
import { newsletterRoutes } from './routes/newsletter.routes'
import { adminRoutes } from './routes/admin.routes'
import { settingsRoutes } from './routes/settings.routes'
import { productRoutes } from './routes/product.routes'
import { promoCodeRoutes } from './routes/promo-codes.routes'
import { authRoutes } from './routes/auth.routes'
import { cartRoutes } from './routes/cart.routes'
import { getAllowedOrigins } from './config/public-urls'

const app = express()
const PORT = process.env.PORT || 4000
const allowedOrigins = getAllowedOrigins()

// Request logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`)
  next()
})

// Security
app.use(helmet())
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true)
      return
    }
    callback(new Error(`Origin ${origin} is not allowed by CORS`))
  },
  credentials: true,
}))

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10000 // Increased for development to prevent blocking refreshes
})
app.use(limiter)

// Webhook route MUST come before express.json() (needs raw body)
app.use('/api/webhooks', webhookRoutes)

// Parse JSON for all other routes
app.use(express.json())

// Routes
app.use('/api/payments', paymentRoutes)
app.use('/api/orders', orderRoutes)
app.use('/api/newsletter', newsletterRoutes)
app.use('/api/promo-codes', promoCodeRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/settings', settingsRoutes)
app.use('/api/products', productRoutes)
app.use('/api/auth', authRoutes)
app.use('/api/cart', cartRoutes)



// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

import { startAbandonedCartCron } from './services/cron.service'


// Export the app for Vercel
export default app

if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`🚀 CLE Perfume API running on port ${PORT}`)
    
    // Start the background cron worker for abandoned carts
    startAbandonedCartCron()
  })
}
