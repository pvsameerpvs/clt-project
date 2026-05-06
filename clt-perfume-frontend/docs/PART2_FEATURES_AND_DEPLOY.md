# 📖 CLE Perfume — Complete Full-Stack Documentation

## Part 2: Features (Products, Cart, Payments, Orders, Admin, Search, Deploy)

---

# Table of Contents

9. [TypeScript Types](#9-typescript-types)
10. [Product Pages from Database](#10-products-from-database)
11. [Cart & Wishlist — Database Sync](#11-cart-wishlist-database-sync)
12. [Node.js Backend — Complete Setup](#12-nodejs-backend)
13. [Stripe Payment Gateway — Complete](#13-stripe-payment-gateway)
14. [Order Management](#14-order-management)
15. [Admin Dashboard](#15-admin-dashboard)
16. [Search & Filters](#16-search-and-filters)
17. [Newsletter](#17-newsletter)
18. [Deployment](#18-deployment)
19. [Environment Variables — Complete List](#19-environment-variables)
20. [API Reference](#20-api-reference)

---

## 9. TypeScript Types

### File: `src/lib/types.ts` (NEW)
```typescript
// ============================================
// Database Types for CLE Perfume
// ============================================

export interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  image_url: string | null
  created_at: string
}

export interface Product {
  id: string
  slug: string
  name: string
  category_id: string | null
  price: number
  compare_at_price: number | null
  description: string | null
  images: string[]
  scent: string | null
  notes_top: string[]
  notes_heart: string[]
  notes_base: string[]
  tags: string[]
  rating: number
  review_count: number
  stock: number
  is_new: boolean
  is_active: boolean
  gender: string
  created_at: string
  updated_at: string
  // Joined data
  category?: Category
}

export interface Profile {
  id: string
  first_name: string | null
  last_name: string | null
  phone: string | null
  avatar_url: string | null
  role: string
  created_at: string
  updated_at: string
}

export interface Review {
  id: string
  product_id: string
  user_id: string
  rating: number
  content: string | null
  images: string[]
  created_at: string
  // Joined data
  profile?: Profile
}

export interface CartItem {
  id: string
  user_id: string
  product_id: string
  quantity: number
  created_at: string
  updated_at: string
  // Joined data
  product?: Product
}

export interface WishlistItem {
  id: string
  user_id: string
  product_id: string
  created_at: string
  // Joined data
  product?: Product
}

export interface Address {
  id: string
  user_id: string
  label: string
  full_name: string
  phone: string
  address_line1: string
  address_line2: string | null
  city: string
  state: string | null
  country: string
  postal_code: string | null
  is_default: boolean
  created_at: string
  updated_at: string
}

export interface Order {
  id: string
  order_number: string
  user_id: string
  status: 'pending' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded'
  subtotal: number
  shipping_fee: number
  tax: number
  discount: number
  total: number
  currency: string
  shipping_address: Address | null
  billing_address: Address | null
  payment_intent_id: string | null
  payment_method: string
  stripe_session_id: string | null
  notes: string | null
  shipped_at: string | null
  delivered_at: string | null
  created_at: string
  updated_at: string
  // Joined data
  items?: OrderItem[]
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: string | null
  product_name: string
  product_image: string | null
  product_slug: string | null
  price: number
  quantity: number
  created_at: string
}
```

---

## 10. Products from Database

### File: `src/lib/queries/products.ts` (NEW)
```typescript
import { createClient } from '@/lib/supabase/server'
import type { Product } from '@/lib/types'

// Get all active products
export async function getProducts(): Promise<Product[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('products')
    .select('*, category:categories(*)')
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

// Get a single product by slug
export async function getProductBySlug(slug: string): Promise<Product | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('products')
    .select('*, category:categories(*)')
    .eq('slug', slug)
    .eq('is_active', true)
    .single()

  if (error) return null
  return data
}

// Get products by gender (for collections)
export async function getProductsByGender(gender: string): Promise<Product[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('products')
    .select('*, category:categories(*)')
    .eq('is_active', true)
    .or(`gender.eq.${gender},gender.eq.unisex`)
    .order('rating', { ascending: false })

  if (error) throw error
  return data || []
}

// Get new products
export async function getNewProducts(): Promise<Product[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('products')
    .select('*, category:categories(*)')
    .eq('is_active', true)
    .eq('is_new', true)
    .order('created_at', { ascending: false })
    .limit(6)

  if (error) throw error
  return data || []
}

// Get products sorted by price (pocket friendly)
export async function getBudgetProducts(): Promise<Product[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('products')
    .select('*, category:categories(*)')
    .eq('is_active', true)
    .order('price', { ascending: true })
    .limit(6)

  if (error) throw error
  return data || []
}

// Search products
export async function searchProducts(query: string): Promise<Product[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('products')
    .select('*, category:categories(*)')
    .eq('is_active', true)
    .textSearch('fts', query, { type: 'websearch' })
    .limit(20)

  if (error) throw error
  return data || []
}

// Get related products (same category, excluding current)
export async function getRelatedProducts(productId: string, categoryId: string): Promise<Product[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('products')
    .select('*, category:categories(*)')
    .eq('is_active', true)
    .eq('category_id', categoryId)
    .neq('id', productId)
    .limit(5)

  if (error) throw error
  return data || []
}

// Get reviews for a product
export async function getProductReviews(productId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('reviews')
    .select('*, profile:profiles(first_name, last_name, avatar_url)')
    .eq('product_id', productId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}
```

### Updated Product Page: `src/app/product/[slug]/page.tsx`
```tsx
import { notFound } from "next/navigation"
import { getProductBySlug, getRelatedProducts, getProductReviews } from "@/lib/queries/products"
import { ProductDisplay } from "@/components/product-display"

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const product = await getProductBySlug(slug)

  if (!product) {
    notFound()
  }

  const [relatedProducts, reviews] = await Promise.all([
    getRelatedProducts(product.id, product.category_id || ''),
    getProductReviews(product.id),
  ])

  return <ProductDisplay product={product} relatedProducts={relatedProducts} reviews={reviews} />
}
```

### Updated Collections Page: `src/app/collections/[slug]/page.tsx`
```tsx
import { notFound } from "next/navigation"
import { getProductsByGender, getProducts } from "@/lib/queries/products"
import { ProductCard } from "@/components/product/product-card"
import { ArrowLeft } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import Image from "next/image"

const COLLECTIONS: Record<string, { title: string; subtitle: string; description: string; image: string; gender: string }> = {
  mens: {
    title: "Best Men's Collection",
    subtitle: "For Him",
    description: "Discover our most sought-after men's fragrances.",
    image: "/curated-perfume-men.png",
    gender: "men",
  },
  womens: {
    title: "Best Women's Collection",
    subtitle: "For Her",
    description: "An elegant selection of our finest women's perfumes.",
    image: "/curated-pefume-banner.png",
    gender: "women",
  },
  deals: {
    title: "Best Deals & Sets",
    subtitle: "Exclusive Offers",
    description: "Curated gift sets and limited-time offers.",
    image: "/best-deals-sets-2.png",
    gender: "all",
  },
}

export default async function CollectionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  if (!(slug in COLLECTIONS)) notFound()

  const collection = COLLECTIONS[slug]
  const products = collection.gender === "all"
    ? await getProducts()
    : await getProductsByGender(collection.gender)

  return (
    <div className="min-h-screen bg-white pb-20">
      <div className="relative h-[40vh] min-h-[400px] w-full flex items-center justify-center mb-16">
        <Image src={collection.image} alt={collection.title} fill className="object-cover" priority />
        <div className="absolute inset-0 bg-black/60" />
        <div className="relative z-10 text-center px-4 max-w-3xl mx-auto">
          <Badge variant="outline" className="mb-4 text-white border-white/30 tracking-widest uppercase bg-transparent hover:bg-transparent">
            {collection.subtitle}
          </Badge>
          <h1 className="text-4xl md:text-6xl font-serif text-white mb-6">{collection.title}</h1>
          <p className="text-white/80 font-light text-lg">{collection.description}</p>
        </div>
      </div>
      <div className="container mx-auto px-4 md:px-6">
        <div className="mb-10">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-black group">
            <div className="h-8 w-8 rounded-full bg-neutral-100 flex items-center justify-center group-hover:bg-neutral-200">
              <ArrowLeft className="h-4 w-4" />
            </div>
            <span className="font-medium tracking-wide uppercase text-xs">Back to Home</span>
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
        {products.length === 0 && (
          <div className="text-center py-20 text-neutral-500">No products found.</div>
        )}
      </div>
    </div>
  )
}
```

---

## 11. Cart & Wishlist — Database Sync

### File: `src/lib/queries/cart.ts` (NEW)
```typescript
import { createClient } from '@/lib/supabase/client'

// Fetch user's cart from database
export async function fetchCart() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('cart_items')
    .select('*, product:products(*)')
    .eq('user_id', user.id)

  if (error) throw error
  return data
}

// Add item to cart in database
export async function addToCartDB(productId: string, quantity: number) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const { error } = await supabase
    .from('cart_items')
    .upsert({
      user_id: user.id,
      product_id: productId,
      quantity,
    }, {
      onConflict: 'user_id,product_id'
    })

  if (error) throw error
}

// Update cart item quantity
export async function updateCartItemDB(productId: string, quantity: number) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  if (quantity <= 0) {
    await removeFromCartDB(productId)
    return
  }

  const { error } = await supabase
    .from('cart_items')
    .update({ quantity })
    .eq('user_id', user.id)
    .eq('product_id', productId)

  if (error) throw error
}

// Remove item from cart
export async function removeFromCartDB(productId: string) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const { error } = await supabase
    .from('cart_items')
    .delete()
    .eq('user_id', user.id)
    .eq('product_id', productId)

  if (error) throw error
}

// Clear entire cart
export async function clearCartDB() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const { error } = await supabase
    .from('cart_items')
    .delete()
    .eq('user_id', user.id)

  if (error) throw error
}
```

### File: `src/lib/queries/wishlist.ts` (NEW)
```typescript
import { createClient } from '@/lib/supabase/client'

export async function fetchWishlist() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('wishlist_items')
    .select('*, product:products(*)')
    .eq('user_id', user.id)

  if (error) throw error
  return data
}

export async function toggleWishlistDB(productId: string) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  // Check if already in wishlist
  const { data: existing } = await supabase
    .from('wishlist_items')
    .select('id')
    .eq('user_id', user.id)
    .eq('product_id', productId)
    .single()

  if (existing) {
    // Remove from wishlist
    await supabase
      .from('wishlist_items')
      .delete()
      .eq('id', existing.id)
  } else {
    // Add to wishlist
    await supabase
      .from('wishlist_items')
      .insert({ user_id: user.id, product_id: productId })
  }
}
```

---

## 12. Node.js Backend — Complete Setup

### Create the Backend Project
```bash
# From the parent directory (JustSearch/)
mkdir clt-perfume-backend
cd clt-perfume-backend
npm init -y
npm install express cors stripe @supabase/supabase-js dotenv helmet express-rate-limit nodemailer
npm install -D typescript @types/express @types/cors @types/node @types/nodemailer ts-node-dev
npx tsc --init
```

### File: `tsconfig.json`
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### File: `package.json` scripts
```json
{
  "scripts": {
    "dev": "ts-node-dev --respawn --transpile-only src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js"
  }
}
```

### File: `.env`
```env
PORT=4000
NODE_ENV=development

# Supabase (use SERVICE ROLE key for backend — full access)
SUPABASE_URL=https://isiykgwvwggdqemguhhz.supabase.co
SUPABASE_SERVICE_ROLE_KEY=replace_with_your_service_role_key

# Stripe
STRIPE_SECRET_KEY=replace_with_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=replace_with_your_stripe_webhook_secret
STRIPE_PUBLISHABLE_KEY=replace_with_your_stripe_publishable_key

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000

# Email (using Gmail SMTP or Resend)
EMAIL_FROM=noreply@cleperfumes.com
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### File: `src/index.ts`
```typescript
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

const app = express()
const PORT = process.env.PORT || 4000

// Security
app.use(helmet())
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}))

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100
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
app.use('/api/admin', adminRoutes)

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.listen(PORT, () => {
  console.log(`🚀 CLE Perfume API running on port ${PORT}`)
})
```

### File: `src/config/supabase.ts`
```typescript
import { createClient } from '@supabase/supabase-js'

// Admin client (bypasses RLS — for backend use only!)
export const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

// Create a client from a user's JWT token (respects RLS)
export function createUserClient(accessToken: string) {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
      auth: { autoRefreshToken: false, persistSession: false },
    }
  )
}
```

### File: `src/config/stripe.ts`
```typescript
import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
})
```

### File: `src/middleware/auth.middleware.ts`
```typescript
import { Request, Response, NextFunction } from 'express'
import { supabaseAdmin } from '../config/supabase'

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: { id: string; email: string; role?: string }
    }
  }
}

// Verify the Supabase JWT token from the Authorization header
export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing authorization token' })
  }

  const token = authHeader.split(' ')[1]

  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)

  if (error || !user) {
    return res.status(401).json({ error: 'Invalid or expired token' })
  }

  // Get profile for role
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  req.user = {
    id: user.id,
    email: user.email!,
    role: profile?.role || 'customer',
  }

  next()
}

// Admin-only middleware
export function adminMiddleware(req: Request, res: Response, next: NextFunction) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' })
  }
  next()
}
```

---

## 13. Stripe Payment Gateway — Complete

### File: `src/routes/payments.routes.ts`
```typescript
import { Router, Request, Response } from 'express'
import { stripe } from '../config/stripe'
import { supabaseAdmin } from '../config/supabase'
import { authMiddleware } from '../middleware/auth.middleware'

export const paymentRoutes = Router()

// POST /api/payments/create-checkout-session
paymentRoutes.post('/create-checkout-session', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id

    // Get user's cart items with product details
    const { data: cartItems, error } = await supabaseAdmin
      .from('cart_items')
      .select('quantity, product:products(id, name, price, images, slug)')
      .eq('user_id', userId)

    if (error || !cartItems || cartItems.length === 0) {
      return res.status(400).json({ error: 'Cart is empty' })
    }

    // Build Stripe line items
    const lineItems = cartItems.map((item: any) => ({
      price_data: {
        currency: 'aed',
        product_data: {
          name: item.product.name,
          images: item.product.images.length > 0
            ? [`${process.env.FRONTEND_URL}${item.product.images[0]}`]
            : [],
          metadata: {
            product_id: item.product.id,
            slug: item.product.slug,
          },
        },
        unit_amount: Math.round(item.product.price * 100), // Stripe uses smallest currency unit (fils)
      },
      quantity: item.quantity,
    }))

    // Calculate subtotal
    const subtotal = cartItems.reduce(
      (sum: number, item: any) => sum + item.product.price * item.quantity, 0
    )

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: lineItems,
      customer_email: req.user!.email,
      metadata: {
        user_id: userId,
        subtotal: subtotal.toString(),
      },
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
```

### File: `src/routes/webhooks.routes.ts`
```typescript
import { Router, Request, Response } from 'express'
import express from 'express'
import { stripe } from '../config/stripe'
import { supabaseAdmin } from '../config/supabase'
import Stripe from 'stripe'

export const webhookRoutes = Router()

// Use raw body for webhook verification
webhookRoutes.post(
  '/stripe',
  express.raw({ type: 'application/json' }),
  async (req: Request, res: Response) => {
    const sig = req.headers['stripe-signature'] as string
    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET!
      )
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message)
      return res.status(400).send(`Webhook Error: ${err.message}`)
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        await handleCheckoutCompleted(session)
        break
      }
      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        console.error('Payment failed:', paymentIntent.id)
        break
      }
      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    res.json({ received: true })
  }
)

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.user_id
  if (!userId) return

  try {
    // 1. Get user's cart items
    const { data: cartItems } = await supabaseAdmin
      .from('cart_items')
      .select('quantity, product:products(id, name, price, images, slug)')
      .eq('user_id', userId)

    if (!cartItems || cartItems.length === 0) return

    // 2. Calculate totals
    const subtotal = cartItems.reduce(
      (sum: number, item: any) => sum + item.product.price * item.quantity, 0
    )

    // 3. Create the order
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert({
        user_id: userId,
        order_number: '', // auto-generated by trigger
        status: 'paid',
        subtotal,
        shipping_fee: 0,
        tax: subtotal * 0.05, // 5% VAT
        total: subtotal + (subtotal * 0.05),
        payment_intent_id: session.payment_intent as string,
        stripe_session_id: session.id,
        payment_method: 'card',
        shipping_address: session.shipping_details ? {
          full_name: session.shipping_details.name,
          address_line1: session.shipping_details.address?.line1,
          address_line2: session.shipping_details.address?.line2,
          city: session.shipping_details.address?.city,
          state: session.shipping_details.address?.state,
          country: session.shipping_details.address?.country,
          postal_code: session.shipping_details.address?.postal_code,
        } : null,
      })
      .select()
      .single()

    if (orderError || !order) {
      console.error('Failed to create order:', orderError)
      return
    }

    // 4. Create order items
    const orderItems = cartItems.map((item: any) => ({
      order_id: order.id,
      product_id: item.product.id,
      product_name: item.product.name,
      product_image: item.product.images[0] || null,
      product_slug: item.product.slug,
      price: item.product.price,
      quantity: item.quantity,
    }))

    await supabaseAdmin.from('order_items').insert(orderItems)

    // 5. Update product stock
    for (const item of cartItems as any[]) {
      await supabaseAdmin.rpc('decrement_stock', {
        p_product_id: item.product.id,
        p_quantity: item.quantity,
      })
    }

    // 6. Clear the user's cart
    await supabaseAdmin
      .from('cart_items')
      .delete()
      .eq('user_id', userId)

    console.log(`✅ Order ${order.order_number} created for user ${userId}`)

  } catch (error) {
    console.error('Error handling checkout:', error)
  }
}
```

### Stock Decrement Function (run in Supabase SQL Editor)
```sql
-- Function to safely decrement stock
CREATE OR REPLACE FUNCTION decrement_stock(p_product_id UUID, p_quantity INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE public.products
  SET stock = GREATEST(stock - p_quantity, 0)
  WHERE id = p_product_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Frontend: Add to `.env.local`
```env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_KEY
NEXT_PUBLIC_API_URL=http://localhost:4000
```

### Frontend: Checkout Button Component
```tsx
// Use this in your cart page to trigger checkout
"use client"
import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

export function CheckoutButton() {
  const [loading, setLoading] = useState(false)

  const handleCheckout = async () => {
    setLoading(true)
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      toast.error("Please sign in to checkout")
      window.location.href = "/login?next=/cart"
      return
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/payments/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
      })

      const data = await response.json()

      if (data.url) {
        window.location.href = data.url // Redirect to Stripe
      } else {
        toast.error(data.error || "Failed to create checkout session")
      }
    } catch (error) {
      toast.error("Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      onClick={handleCheckout}
      disabled={loading}
      className="w-full h-14 rounded-xl bg-black text-white hover:bg-neutral-800 uppercase tracking-widest text-xs font-medium"
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Proceed to Checkout"}
    </Button>
  )
}
```

---

## 14. Order Management

### File: `src/routes/orders.routes.ts`
```typescript
import { Router, Request, Response } from 'express'
import { supabaseAdmin } from '../config/supabase'
import { authMiddleware } from '../middleware/auth.middleware'

export const orderRoutes = Router()

// GET /api/orders — Get user's order history
orderRoutes.get('/', authMiddleware, async (req: Request, res: Response) => {
  const { data, error } = await supabaseAdmin
    .from('orders')
    .select('*, items:order_items(*)')
    .eq('user_id', req.user!.id)
    .order('created_at', { ascending: false })

  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

// GET /api/orders/:id — Get single order details
orderRoutes.get('/:id', authMiddleware, async (req: Request, res: Response) => {
  const { data, error } = await supabaseAdmin
    .from('orders')
    .select('*, items:order_items(*)')
    .eq('id', req.params.id)
    .eq('user_id', req.user!.id)
    .single()

  if (error) return res.status(404).json({ error: 'Order not found' })
  res.json(data)
})
```

---

## 15. Admin Dashboard

### File: `src/routes/admin.routes.ts`
```typescript
import { Router, Request, Response } from 'express'
import { supabaseAdmin } from '../config/supabase'
import { authMiddleware, adminMiddleware } from '../middleware/auth.middleware'

export const adminRoutes = Router()

// All admin routes require auth + admin role
adminRoutes.use(authMiddleware, adminMiddleware)

// GET /api/admin/dashboard — Overview stats
adminRoutes.get('/dashboard', async (req: Request, res: Response) => {
  const [products, orders, customers] = await Promise.all([
    supabaseAdmin.from('products').select('id', { count: 'exact' }),
    supabaseAdmin.from('orders').select('id, total, status', { count: 'exact' }),
    supabaseAdmin.from('profiles').select('id', { count: 'exact' }),
  ])

  const totalRevenue = (orders.data || [])
    .filter((o: any) => o.status !== 'cancelled' && o.status !== 'refunded')
    .reduce((sum: number, o: any) => sum + Number(o.total), 0)

  res.json({
    totalProducts: products.count || 0,
    totalOrders: orders.count || 0,
    totalCustomers: customers.count || 0,
    totalRevenue,
  })
})

// POST /api/admin/products — Create product
adminRoutes.post('/products', async (req: Request, res: Response) => {
  const { data, error } = await supabaseAdmin
    .from('products')
    .insert(req.body)
    .select()
    .single()

  if (error) return res.status(400).json({ error: error.message })
  res.json(data)
})

// PUT /api/admin/products/:id — Update product
adminRoutes.put('/products/:id', async (req: Request, res: Response) => {
  const { data, error } = await supabaseAdmin
    .from('products')
    .update(req.body)
    .eq('id', req.params.id)
    .select()
    .single()

  if (error) return res.status(400).json({ error: error.message })
  res.json(data)
})

// DELETE /api/admin/products/:id — Delete product
adminRoutes.delete('/products/:id', async (req: Request, res: Response) => {
  const { error } = await supabaseAdmin
    .from('products')
    .delete()
    .eq('id', req.params.id)

  if (error) return res.status(400).json({ error: error.message })
  res.json({ success: true })
})

// PUT /api/admin/orders/:id/status — Update order status
adminRoutes.put('/orders/:id/status', async (req: Request, res: Response) => {
  const { status } = req.body
  const validStatuses = ['pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded']

  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid status' })
  }

  const updateData: any = { status }
  if (status === 'shipped') updateData.shipped_at = new Date().toISOString()
  if (status === 'delivered') updateData.delivered_at = new Date().toISOString()

  const { data, error } = await supabaseAdmin
    .from('orders')
    .update(updateData)
    .eq('id', req.params.id)
    .select()
    .single()

  if (error) return res.status(400).json({ error: error.message })
  res.json(data)
})
```

---

## 16. Search and Filters

### File: `src/app/api/search/route.ts` (Next.js API Route — on frontend)
```typescript
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q') || ''
  const gender = searchParams.get('gender')
  const minPrice = searchParams.get('minPrice')
  const maxPrice = searchParams.get('maxPrice')
  const sort = searchParams.get('sort') || 'newest'

  const supabase = await createClient()
  let queryBuilder = supabase
    .from('products')
    .select('*, category:categories(*)')
    .eq('is_active', true)

  // Text search
  if (query) {
    queryBuilder = queryBuilder.textSearch('fts', query, { type: 'websearch' })
  }

  // Gender filter
  if (gender && gender !== 'all') {
    queryBuilder = queryBuilder.or(`gender.eq.${gender},gender.eq.unisex`)
  }

  // Price range
  if (minPrice) queryBuilder = queryBuilder.gte('price', Number(minPrice))
  if (maxPrice) queryBuilder = queryBuilder.lte('price', Number(maxPrice))

  // Sorting
  switch (sort) {
    case 'price_asc':
      queryBuilder = queryBuilder.order('price', { ascending: true })
      break
    case 'price_desc':
      queryBuilder = queryBuilder.order('price', { ascending: false })
      break
    case 'rating':
      queryBuilder = queryBuilder.order('rating', { ascending: false })
      break
    case 'newest':
    default:
      queryBuilder = queryBuilder.order('created_at', { ascending: false })
  }

  const { data, error } = await queryBuilder.limit(50)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
```

---

## 17. Newsletter

### File: `src/routes/newsletter.routes.ts`
```typescript
import { Router, Request, Response } from 'express'
import { supabaseAdmin } from '../config/supabase'

export const newsletterRoutes = Router()

// POST /api/newsletter/subscribe
newsletterRoutes.post('/subscribe', async (req: Request, res: Response) => {
  const { email } = req.body

  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Valid email required' })
  }

  const { error } = await supabaseAdmin
    .from('newsletter_subscribers')
    .upsert({ email }, { onConflict: 'email' })

  if (error) return res.status(500).json({ error: error.message })
  res.json({ success: true, message: 'Subscribed successfully!' })
})
```

---

## 18. Deployment

### Frontend (Vercel)
1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com) → Import project
3. Connect your GitHub repo
4. Add environment variables:
   ```
   NEXT_PUBLIC_SUPABASE_URL
   NEXT_PUBLIC_SUPABASE_ANON_KEY
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
   NEXT_PUBLIC_API_URL (your backend URL)
   ```
5. Deploy!

### Backend (Railway)
1. Push backend to a separate GitHub repo (or monorepo with `/backend` path)
2. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub
3. Add all `.env` variables from your backend
4. Railway auto-detects Node.js and deploys
5. Copy the deployment URL (e.g., `https://clt-perfume-backend.up.railway.app`)
6. Update frontend env: `NEXT_PUBLIC_API_URL=https://clt-perfume-backend.up.railway.app`

### Stripe Webhook Setup (Production)
1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://your-backend-url.com/api/webhooks/stripe`
3. Select events: `checkout.session.completed`, `payment_intent.payment_failed`
4. Copy the webhook secret → add to backend env as `STRIPE_WEBHOOK_SECRET`

### Supabase Auth (Production)
1. Update Site URL to your production domain
2. Add production redirect URLs
3. Update Google OAuth redirect URI to point to production Supabase URL

---

## 19. Environment Variables — Complete List

### Frontend (`.env.local`)
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://isiykgwvwggdqemguhhz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...

# Stripe (publishable key only!)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:4000
```

### Backend (`.env`)
```env
PORT=4000
NODE_ENV=development

# Supabase (SERVICE ROLE — full access, never expose to frontend!)
SUPABASE_URL=https://isiykgwvwggdqemguhhz.supabase.co
SUPABASE_SERVICE_ROLE_KEY=replace_with_your_service_role_key

# Stripe (secret key — never expose to frontend!)
STRIPE_SECRET_KEY=replace_with_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=replace_with_your_stripe_webhook_secret

# Frontend URL
FRONTEND_URL=http://localhost:3000

# Email
EMAIL_FROM=noreply@cleperfumes.com
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

---

## 20. API Reference

### Frontend API Routes (Next.js)
| Method | Route | Auth | Purpose |
|--------|-------|------|---------|
| GET | `/api/search?q=&gender=&minPrice=&maxPrice=&sort=` | Public | Search & filter products |

### Backend API Routes (Express)
| Method | Route | Auth | Purpose |
|--------|-------|------|---------|
| GET | `/api/health` | Public | Health check |
| POST | `/api/payments/create-checkout-session` | User | Start Stripe checkout |
| POST | `/api/webhooks/stripe` | Stripe | Handle payment events |
| GET | `/api/orders` | User | Get order history |
| GET | `/api/orders/:id` | User | Get order detail |
| POST | `/api/newsletter/subscribe` | Public | Subscribe to newsletter |
| GET | `/api/admin/dashboard` | Admin | Dashboard stats |
| POST | `/api/admin/products` | Admin | Create product |
| PUT | `/api/admin/products/:id` | Admin | Update product |
| DELETE | `/api/admin/products/:id` | Admin | Delete product |
| PUT | `/api/admin/orders/:id/status` | Admin | Update order status |

### Supabase Direct Queries (from Frontend)
| Table | Operation | Auth | Location |
|-------|-----------|------|----------|
| `products` | SELECT | Public | Server Components |
| `categories` | SELECT | Public | Server Components |
| `reviews` | SELECT | Public | Server Components |
| `reviews` | INSERT | User | Client Components |
| `cart_items` | ALL | User (own) | Client Components |
| `wishlist_items` | ALL | User (own) | Client Components |
| `addresses` | ALL | User (own) | Client Components |
| `profiles` | SELECT/UPDATE | User (own) | Client Components |
| `newsletter_subscribers` | INSERT | Public | Client Components |

---

## ✅ Build Checklist

- [ ] **Phase 1:** Run all SQL in Supabase SQL Editor (create tables, RLS, seed data)
- [ ] **Phase 2:** Configure Supabase Auth (Email + Google OAuth)
- [ ] **Phase 2:** Create `src/app/auth/callback/route.ts`
- [ ] **Phase 2:** Update `login/page.tsx` with Supabase auth logic
- [ ] **Phase 2:** Update `signup/page.tsx` with Supabase auth logic
- [ ] **Phase 2:** Update `middleware.ts` with route protection
- [ ] **Phase 3:** Create `src/lib/types.ts`
- [ ] **Phase 3:** Create `src/lib/queries/products.ts`
- [ ] **Phase 3:** Update `product/[slug]/page.tsx` to fetch from DB
- [ ] **Phase 3:** Update `collections/[slug]/page.tsx` to fetch from DB
- [ ] **Phase 4:** Create `src/lib/queries/cart.ts`
- [ ] **Phase 4:** Create `src/lib/queries/wishlist.ts`
- [ ] **Phase 4:** Update `cart-context.tsx` with DB sync
- [ ] **Phase 5:** Create `clt-perfume-backend/` project
- [ ] **Phase 5:** Set up Express server with all routes
- [ ] **Phase 6:** Create Stripe account, get API keys
- [ ] **Phase 6:** Create checkout session route
- [ ] **Phase 6:** Create Stripe webhook handler
- [ ] **Phase 6:** Add `CheckoutButton` component
- [ ] **Phase 6:** Create `/checkout/success` and `/checkout/cancel` pages
- [ ] **Phase 7:** Create order history page `/profile/orders`
- [ ] **Phase 8:** Create admin routes
- [ ] **Phase 9:** Create search API route
- [ ] **Phase 10:** Deploy frontend to Vercel
- [ ] **Phase 10:** Deploy backend to Railway
- [ ] **Phase 10:** Configure Stripe webhooks for production

---

> **🎉 This is your COMPLETE documentation.** Follow the checklist above phase-by-phase, and you'll have a fully functional e-commerce store! If you need help implementing any specific phase, just ask.
