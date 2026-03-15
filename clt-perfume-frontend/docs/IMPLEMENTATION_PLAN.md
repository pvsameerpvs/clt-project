# 🚀 CLE Perfumes — Full-Stack Implementation Plan

> **Goal:** Turn the existing frontend into a complete, production-ready e-commerce store  
> **Frontend:** Next.js 16 (App Router) — already built ✅  
> **Database:** Supabase (PostgreSQL) — already configured ✅  
> **Backend:** Node.js (Express) — to be created  
> **Payment:** Stripe (best for UAE/international)  

---

## 📋 Implementation Phases

```
Phase 1: Database Schema (Supabase)         ← START HERE
Phase 2: Authentication (Supabase Auth)
Phase 3: Products from Database
Phase 4: Cart & Wishlist (Database-backed)
Phase 5: Node.js Backend API
Phase 6: Payment Gateway (Stripe)
Phase 7: Order Management
Phase 8: Admin Dashboard
Phase 9: Search & Filters
Phase 10: Deployment
```

---

## Phase 1: 🗄️ Database Schema (Supabase)

Create these tables in your Supabase project. This is the foundation for everything.

### Tables to Create

#### 1. `profiles` (extends Supabase auth.users)
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create profile when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

#### 2. `categories`
```sql
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 3. `products`
```sql
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  category_id UUID REFERENCES categories(id),
  price DECIMAL(10,2) NOT NULL,
  compare_at_price DECIMAL(10,2),  -- for showing discounts
  description TEXT,
  images TEXT[] DEFAULT '{}',       -- array of image URLs
  scent TEXT,
  notes_top TEXT[] DEFAULT '{}',
  notes_heart TEXT[] DEFAULT '{}',
  notes_base TEXT[] DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  rating DECIMAL(2,1) DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  stock INTEGER DEFAULT 0,
  is_new BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 4. `reviews`
```sql
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  content TEXT,
  images TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 5. `cart_items`
```sql
CREATE TABLE cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER DEFAULT 1 CHECK (quantity > 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);
```

#### 6. `wishlist_items`
```sql
CREATE TABLE wishlist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);
```

#### 7. `addresses`
```sql
CREATE TABLE addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  label TEXT DEFAULT 'Home',      -- Home, Office, etc.
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  address_line1 TEXT NOT NULL,
  address_line2 TEXT,
  city TEXT NOT NULL,
  state TEXT,
  country TEXT DEFAULT 'UAE',
  postal_code TEXT,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 8. `orders`
```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT UNIQUE NOT NULL,  -- e.g., CLE-20260314-001
  user_id UUID REFERENCES auth.users(id),
  status TEXT DEFAULT 'pending',  -- pending, paid, processing, shipped, delivered, cancelled
  subtotal DECIMAL(10,2) NOT NULL,
  shipping_fee DECIMAL(10,2) DEFAULT 0,
  tax DECIMAL(10,2) DEFAULT 0,
  discount DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL,
  shipping_address JSONB,
  payment_intent_id TEXT,          -- Stripe payment intent
  payment_method TEXT,             -- card, cod, etc.
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 9. `order_items`
```sql
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  product_name TEXT NOT NULL,       -- snapshot at time of order
  product_image TEXT,               -- snapshot
  price DECIMAL(10,2) NOT NULL,     -- snapshot
  quantity INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 10. `newsletter_subscribers`
```sql
CREATE TABLE newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Row Level Security (RLS) Policies
```sql
-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Products & Categories: Anyone can read
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Products are viewable by everyone" ON products FOR SELECT USING (true);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Categories are viewable by everyone" ON categories FOR SELECT USING (true);

-- Profiles: Users can read/update their own
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Cart: Users can manage their own cart
CREATE POLICY "Users can manage own cart" ON cart_items FOR ALL USING (auth.uid() = user_id);

-- Wishlist: Users can manage their own wishlist
CREATE POLICY "Users can manage own wishlist" ON wishlist_items FOR ALL USING (auth.uid() = user_id);

-- Addresses: Users can manage their own addresses
CREATE POLICY "Users can manage own addresses" ON addresses FOR ALL USING (auth.uid() = user_id);

-- Orders: Users can view their own orders
CREATE POLICY "Users can view own orders" ON orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create orders" ON orders FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Order Items: Users can view their own order items
CREATE POLICY "Users can view own order items" ON order_items FOR SELECT 
  USING (EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid()));

-- Reviews: Anyone can read, authenticated users can create
CREATE POLICY "Reviews are viewable by everyone" ON reviews FOR SELECT USING (true);
CREATE POLICY "Authenticated users can write reviews" ON reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own reviews" ON reviews FOR UPDATE USING (auth.uid() = user_id);

-- Newsletter: Anyone can subscribe
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can subscribe" ON newsletter_subscribers FOR INSERT WITH CHECK (true);
```

---

## Phase 2: 🔐 Authentication (Supabase Auth)

### What to Set Up in Supabase Dashboard
1. **Email/Password Auth** — Enable in Auth → Providers → Email
2. **Google OAuth** — Enable in Auth → Providers → Google
   - Create OAuth credentials at [Google Cloud Console](https://console.cloud.google.com/)
   - Add the Client ID and Secret to Supabase
3. **Redirect URLs** — Configure in Auth → URL Configuration
   - Site URL: `http://localhost:3000` (dev) / your production URL
   - Redirect URLs: `http://localhost:3000/auth/callback`

### Frontend Changes Needed
| File | What to Do |
|------|-----------|
| `login/page.tsx` | Connect form to `supabase.auth.signInWithPassword()` |
| `login/page.tsx` | Connect Google button to `supabase.auth.signInWithOAuth({ provider: 'google' })` |
| `signup/page.tsx` | Connect form to `supabase.auth.signUp()` |
| `src/app/auth/callback/route.ts` | **Create:** Handle OAuth callback (exchange code for session) |
| `navbar.tsx` | Show user name/avatar instead of "Sign In" when logged in |
| `middleware.ts` | Already created ✅ — protects routes and refreshes sessions |

### New Pages to Create
| Route | Purpose |
|-------|---------|
| `/auth/callback` | OAuth redirect handler (route handler) |
| `/profile` | User profile page (name, email, addresses) |
| `/profile/orders` | Order history |
| `/forgot-password` | Password reset request |
| `/reset-password` | New password entry (from email link) |

---

## Phase 3: 📦 Products from Database

### Migration Steps
1. **Seed the database** — Insert your 6 existing products + categories into Supabase tables
2. **Upload images to Supabase Storage** — Move product images from `/public/perfume/` to a Supabase Storage bucket
3. **Update product pages** — Fetch from Supabase instead of importing from `products.ts`
4. **Update collection pages** — Query products by category instead of hardcoded IDs

### Key Changes
| File | What Changes |
|------|-------------|
| `lib/products.ts` | Replace with Supabase queries |
| `product/[slug]/page.tsx` | Fetch product from DB by slug |
| `collections/[slug]/page.tsx` | Fetch products by category slug |
| `featured-products.tsx` | Fetch featured/new products from DB |
| `pocket-friendly.tsx` | Fetch products sorted by price |

---

## Phase 4: 🛒 Cart & Wishlist (Database-Backed)

### Strategy
- **Logged-in users** → Save cart/wishlist to Supabase `cart_items` / `wishlist_items` tables
- **Guest users** → Keep using `localStorage` (current behavior)
- **On login** → Merge localStorage cart into database cart

### Changes
| File | What Changes |
|------|-------------|
| `cart-context.tsx` | Add Supabase sync when user is logged in |
| `wishlist-context.tsx` | Add Supabase sync when user is logged in |

---

## Phase 5: 🖥️ Node.js Backend API

### Why a Separate Backend?
- **Payment processing** (Stripe secret key must NEVER be on frontend)
- **Order creation** (server-side validation)
- **Webhook handling** (Stripe sends events to your server)
- **Admin operations** (bulk updates, reports)
- **Email notifications** (order confirmation, shipping updates)

### Project Structure
```
clt-perfume-backend/              ← NEW PROJECT
├── package.json
├── .env
├── src/
│   ├── index.ts                  # Express app entry
│   ├── config/
│   │   ├── supabase.ts           # Supabase admin client
│   │   └── stripe.ts             # Stripe client
│   ├── routes/
│   │   ├── auth.routes.ts        # Auth-related endpoints
│   │   ├── orders.routes.ts      # Order CRUD
│   │   ├── payments.routes.ts    # Stripe checkout & webhooks
│   │   ├── products.routes.ts    # Admin product management
│   │   └── webhooks.routes.ts    # Stripe webhook handler
│   ├── middleware/
│   │   ├── auth.middleware.ts    # Verify Supabase JWT
│   │   └── admin.middleware.ts   # Admin role check
│   ├── services/
│   │   ├── order.service.ts      # Order business logic
│   │   ├── payment.service.ts    # Stripe logic
│   │   └── email.service.ts      # Email notifications
│   └── utils/
│       └── helpers.ts
```

### Key Dependencies
```json
{
  "dependencies": {
    "express": "^4.21.0",
    "cors": "^2.8.5",
    "stripe": "^17.0.0",
    "@supabase/supabase-js": "^2.99.0",
    "dotenv": "^16.4.0",
    "helmet": "^8.0.0",
    "express-rate-limit": "^7.0.0",
    "nodemailer": "^7.0.0"
  }
}
```

### Key API Endpoints
| Method | Endpoint | Purpose |
|--------|----------|---------|
| `POST` | `/api/checkout/create-session` | Create Stripe Checkout Session |
| `POST` | `/api/webhooks/stripe` | Handle Stripe webhook events |
| `GET`  | `/api/orders` | Get user's order history |
| `GET`  | `/api/orders/:id` | Get order details |
| `POST` | `/api/newsletter/subscribe` | Subscribe to newsletter |
| `POST` | `/api/admin/products` | Create product (admin) |
| `PUT`  | `/api/admin/products/:id` | Update product (admin) |
| `DELETE`| `/api/admin/products/:id` | Delete product (admin) |

---

## Phase 6: 💳 Payment Gateway (Stripe)

### Why Stripe?
- Works in UAE ✅
- Supports AED ✅
- Excellent developer experience
- Supports cards, Apple Pay, Google Pay
- Built-in fraud protection

### Setup Steps

#### 1. Create Stripe Account
- Go to [stripe.com](https://stripe.com) and create a business account
- Get your **Publishable Key** (for frontend) and **Secret Key** (for backend)

#### 2. Environment Variables

**Frontend (.env.local):**
```env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

**Backend (.env):**
```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

#### 3. Payment Flow
```
Customer clicks "Checkout"
        ↓
Frontend sends cart items to your Node.js backend
        ↓
Backend creates a Stripe Checkout Session (with line items, prices)
        ↓
Backend returns the session URL
        ↓
Frontend redirects customer to Stripe's hosted checkout page
        ↓
Customer enters card details on Stripe's secure page
        ↓
On success → Stripe redirects to your /order-success page
On failure → Stripe redirects to your /order-failed page
        ↓
Stripe sends a webhook to your backend confirming payment
        ↓
Backend creates the order in Supabase, updates stock, sends email
```

#### 4. New Frontend Pages
| Route | Purpose |
|-------|---------|
| `/checkout` | Shipping address form + order summary |
| `/checkout/success` | "Thank you for your order!" page |
| `/checkout/cancel` | "Payment failed, try again" page |

---

## Phase 7: 📋 Order Management

### Order Flow States
```
pending → paid → processing → shipped → delivered
                                   ↘ cancelled
```

### What to Build
1. **Order confirmation email** — Send after successful payment
2. **Order history page** — `/profile/orders`
3. **Order detail page** — `/profile/orders/[id]`
4. **Order status tracking** — Show status timeline on order detail

---

## Phase 8: 👑 Admin Dashboard

### Option A: Use Supabase Dashboard (Quick)
- Manage products directly in Supabase table editor
- View orders, users, etc.

### Option B: Build Custom Admin (Better)
| Route | Purpose |
|-------|---------|
| `/admin` | Dashboard overview (total sales, orders, users) |
| `/admin/products` | Product list + CRUD |
| `/admin/orders` | Order list + status management |
| `/admin/customers` | Customer list |

### Admin Role Setup
```sql
-- Add role column to profiles  
ALTER TABLE profiles ADD COLUMN role TEXT DEFAULT 'customer';
-- Set yourself as admin
UPDATE profiles SET role = 'admin' WHERE id = 'YOUR_USER_ID';
```

---

## Phase 9: 🔍 Search & Filters

### What to Implement
1. **Full-text search** — Use Supabase's built-in PostgreSQL full-text search
2. **Category filters** — Filter by Men/Women/etc.
3. **Price range filter** — Min/Max price slider
4. **Sort options** — Price low-high, high-low, newest, best rated
5. **Tag filters** — Filter by scent family (Woody, Floral, etc.)

### Supabase Full-Text Search Setup
```sql
-- Add search index to products
ALTER TABLE products ADD COLUMN fts tsvector
  GENERATED ALWAYS AS (
    to_tsvector('english', coalesce(name, '') || ' ' || coalesce(description, ''))
  ) STORED;

CREATE INDEX products_fts ON products USING gin(fts);
```

---

## Phase 10: 🌐 Deployment

### Frontend (Next.js)
- **Vercel** (recommended) — Free tier, automatic deploys from GitHub
- Set environment variables in Vercel dashboard

### Backend (Node.js)
- **Railway** or **Render** — Easy Node.js hosting
- Or **Supabase Edge Functions** — Serverless, no separate hosting needed

### Database
- **Supabase** — Already hosted ✅

### Domain & SSL
- Point your domain to Vercel
- SSL is automatic on Vercel

---

## 🎯 Recommended Build Order

> [!IMPORTANT]
> Follow this exact order. Each phase builds on the previous one.

| Step | Phase | Estimated Duration | Priority |
|------|-------|--------------------|----------|
| 1 | **Database Schema** (Phase 1) | 1 session | 🔴 Critical |
| 2 | **Authentication** (Phase 2) | 1-2 sessions | 🔴 Critical |
| 3 | **Products from DB** (Phase 3) | 1 session | 🔴 Critical |
| 4 | **Cart/Wishlist sync** (Phase 4) | 1 session | 🟡 Important |
| 5 | **Node.js Backend** (Phase 5) | 2 sessions | 🔴 Critical |
| 6 | **Stripe Payment** (Phase 6) | 2 sessions | 🔴 Critical |
| 7 | **Order Management** (Phase 7) | 1-2 sessions | 🟡 Important |
| 8 | **Search & Filters** (Phase 9) | 1 session | 🟡 Important |
| 9 | **Admin Dashboard** (Phase 8) | 2-3 sessions | 🟢 Nice to have |
| 10 | **Deployment** (Phase 10) | 1 session | 🔴 Critical |

---

## 🛠️ Tools & Accounts You'll Need

| Tool | Purpose | Link |
|------|---------|------|
| **Supabase** | Database + Auth | Already set up ✅ |
| **Stripe** | Payment processing | [stripe.com](https://stripe.com) |
| **Google Cloud Console** | Google OAuth credentials | [console.cloud.google.com](https://console.cloud.google.com) |
| **Vercel** | Frontend hosting | [vercel.com](https://vercel.com) |
| **Railway** or **Render** | Backend hosting | [railway.app](https://railway.app) |
| **Resend** or **Nodemailer** | Transactional emails | [resend.com](https://resend.com) |

---

## 💡 Quick Wins You Can Do Right Now

1. ✅ Create the database schema (Phase 1) — I can do this now via the Supabase API!
2. ✅ Wire up login/signup with Supabase Auth (Phase 2)
3. ✅ Seed your 6 existing products into the database (Phase 3)

> [!TIP]
> **Want me to start building Phase 1 (Database Schema) right now?** I can create all the tables, RLS policies, and seed your products using the Supabase API — just say the word!
