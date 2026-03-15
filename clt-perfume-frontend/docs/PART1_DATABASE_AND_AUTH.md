# 📖 CLE Perfumes — Complete Full-Stack Documentation

## Part 1: Foundation (Database + Authentication)

---

# Table of Contents

1. [Project Overview](#1-project-overview)
2. [Current Architecture](#2-current-architecture)
3. [Technology Stack](#3-technology-stack)
4. [Database Schema — Complete SQL](#4-database-schema)
5. [Row Level Security (RLS)](#5-row-level-security)
6. [Supabase Auth Configuration](#6-supabase-auth-configuration)
7. [Authentication — Complete Code](#7-authentication-code)
8. [Protected Routes & Middleware](#8-protected-routes)

---

## 1. Project Overview

**CLE Perfumes** is a luxury perfume e-commerce platform based in the UAE, selling premium fragrances with prices in AED.

### Current State (Frontend Only)
- 10 pages, 17 components
- 6 hardcoded products
- Cart & Wishlist stored in localStorage
- Login/Signup forms with no backend logic
- AI Chatbot connected to n8n webhook (working)
- No database, no authentication, no payment

### Target State (Full Stack)
- Supabase PostgreSQL database with 10 tables
- Supabase Auth (Email + Google OAuth)
- Node.js Express backend for payments & admin
- Stripe payment gateway (AED support)
- Order management system
- Admin dashboard
- Full-text search

---

## 2. Current Architecture

### File Structure
```
clt-perfume-frontend/
├── .env.local                          # Supabase credentials (configured)
├── package.json                        # Next.js 16, React 19, Tailwind 4
├── src/
│   ├── app/
│   │   ├── layout.tsx                  # Root layout
│   │   ├── page.tsx                    # Homepage
│   │   ├── globals.css
│   │   ├── login/page.tsx              # Login (UI only)
│   │   ├── signup/page.tsx             # Signup (UI only)
│   │   ├── cart/page.tsx               # Shopping cart
│   │   ├── wishlist/page.tsx           # Wishlist
│   │   ├── collections/[slug]/page.tsx # Collections
│   │   ├── product/[slug]/page.tsx     # Product detail
│   │   ├── offers/page.tsx             # Offers hub
│   │   ├── offers/[slug]/page.tsx      # Individual offer
│   │   ├── complimentary-samples/page.tsx
│   │   ├── personal-engraving/page.tsx
│   │   └── signature-sets/page.tsx
│   ├── components/
│   │   ├── navbar.tsx                  # Navigation (417 lines)
│   │   ├── footer.tsx                  # Footer
│   │   ├── hero.tsx                    # Hero carousel
│   │   ├── collections.tsx
│   │   ├── featured-products.tsx
│   │   ├── brand-story.tsx
│   │   ├── offer-cards.tsx
│   │   ├── pocket-friendly.tsx
│   │   ├── newsletter.tsx
│   │   ├── chat-bot.tsx                # AI chatbot (live)
│   │   ├── product-display.tsx
│   │   ├── product/product-card.tsx
│   │   ├── cart/cart-item.tsx
│   │   └── ui/                         # shadcn/ui
│   ├── contexts/
│   │   ├── providers.tsx
│   │   ├── cart-context.tsx            # localStorage
│   │   └── wishlist-context.tsx        # localStorage
│   └── lib/
│       ├── products.ts                 # 6 hardcoded products
│       ├── utils.ts
│       └── supabase/
│           ├── client.ts               # Browser client
│           ├── server.ts               # Server client
│           └── middleware.ts           # Session helper
├── src/middleware.ts                   # Next.js middleware
└── public/                             # Images
```

### Existing Environment Variables
```env
# .env.local (already configured)
NEXT_PUBLIC_SUPABASE_URL=https://isiykgwvwggdqemguhhz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
```

### Existing Supabase Client Files

**`src/lib/supabase/client.ts`** (Browser Client — for Client Components)
```typescript
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

**`src/lib/supabase/server.ts`** (Server Client — for Server Components)
```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Ignored in Server Components
          }
        },
      },
    }
  )
}
```

**`src/lib/supabase/middleware.ts`** (Session Management)
```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  return supabaseResponse
}
```

**`src/middleware.ts`** (Next.js Middleware)
```typescript
import { type NextRequest } from 'next/server'
import { updateSession } from './lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

---

## 3. Technology Stack

### Frontend
| Technology | Version | Purpose |
|-----------|---------|---------|
| Next.js | 16.1.6 | React framework (App Router) |
| React | 19.2.3 | UI library |
| TypeScript | 5.x | Type safety |
| Tailwind CSS | 4.x | Styling |
| shadcn/ui | latest | UI component library |
| lucide-react | 0.574 | Icons |
| embla-carousel | 8.6 | Hero carousel |
| sonner | 2.x | Toast notifications |

### Backend (To Be Created)
| Technology | Purpose |
|-----------|---------|
| Node.js | Runtime |
| Express | HTTP framework |
| Stripe | Payment processing |
| Nodemailer / Resend | Transactional emails |

### Infrastructure
| Service | Purpose |
|---------|---------|
| Supabase | Database (PostgreSQL) + Auth + Storage |
| Vercel | Frontend hosting |
| Railway / Render | Backend hosting |
| Stripe | Payment gateway |

---

## 4. Database Schema

### Overview — 10 Tables

```
┌─────────────────┐     ┌──────────────────┐
│   auth.users     │     │    categories     │
│ (Supabase built  │     │                  │
│  -in)            │     │  id, name, slug  │
└───────┬─────────┘     └────────┬─────────┘
        │                        │
        │ 1:1                    │ 1:N
        ▼                        ▼
┌─────────────────┐     ┌──────────────────┐
│    profiles      │     │    products       │
│                  │     │                  │
│ first_name,      │     │ name, price,     │
│ last_name,       │     │ images, notes,   │
│ phone, role      │     │ stock, rating    │
└───────┬─────────┘     └────────┬─────────┘
        │                        │
        │ 1:N                    │ 1:N
        ▼                        ▼
┌─────────────────┐     ┌──────────────────┐
│   addresses      │     │    reviews        │
│                  │     │                  │
│ address_line1,   │     │ rating, content, │
│ city, country    │     │ user_id          │
└─────────────────┘     └──────────────────┘
        │
        │ 1:N
        ▼
┌─────────────────┐     ┌──────────────────┐
│    orders        │────▶│   order_items     │
│                  │ 1:N │                  │
│ order_number,    │     │ product_name,    │
│ total, status    │     │ price, quantity  │
└─────────────────┘     └──────────────────┘

┌─────────────────┐     ┌──────────────────┐
│   cart_items     │     │  wishlist_items   │
│                  │     │                  │
│ user_id,         │     │ user_id,         │
│ product_id,      │     │ product_id       │
│ quantity         │     │                  │
└─────────────────┘     └──────────────────┘

┌──────────────────────┐
│ newsletter_subscribers│
│                      │
│ email, is_active     │
└──────────────────────┘
```

### Complete SQL — Copy & Run in Supabase SQL Editor

> **How to run:** Go to your Supabase Dashboard → SQL Editor → New Query → Paste & Run

#### Table 1: `categories`
```sql
-- ============================================
-- TABLE: categories
-- Stores product categories (Men, Women, etc.)
-- ============================================
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Allow anyone to read categories
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Categories are viewable by everyone"
  ON public.categories FOR SELECT
  USING (true);

-- Seed default categories
INSERT INTO public.categories (name, slug, description, image_url) VALUES
  ('Signature Collection', 'signature-collection', 'Our iconic signature fragrances', '/curated-pefume-banner.png'),
  ('Luxury Edition', 'luxury-edition', 'Premium luxury perfumes', '/curated-perfume-men.png'),
  ('Romantic Series', 'romantic-series', 'Romantic and delicate scents', '/curated-pefume-banner-1.jpeg'),
  ('Noir Collection', 'noir-collection', 'Dark and mysterious fragrances', '/curated-perfume-men-2.jpeg'),
  ('Evening Wear', 'evening-wear', 'Sophisticated evening scents', '/best-deals-sets.png'),
  ('Emotional Journey', 'emotional-journey', 'Scents that speak to the heart', '/best-deals-sets-2.png');
```

#### Table 2: `products`
```sql
-- ============================================
-- TABLE: products
-- Stores all perfume products
-- ============================================
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  price DECIMAL(10,2) NOT NULL,
  compare_at_price DECIMAL(10,2),
  description TEXT,
  images TEXT[] DEFAULT '{}',
  scent TEXT,
  notes_top TEXT[] DEFAULT '{}',
  notes_heart TEXT[] DEFAULT '{}',
  notes_base TEXT[] DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  rating DECIMAL(2,1) DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  stock INTEGER DEFAULT 100,
  is_new BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  gender TEXT DEFAULT 'unisex',  -- 'men', 'women', 'unisex'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Anyone can read active products
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Active products are viewable by everyone"
  ON public.products FOR SELECT
  USING (is_active = true);

-- Full-text search index
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS fts tsvector
  GENERATED ALWAYS AS (
    to_tsvector('english',
      coalesce(name, '') || ' ' ||
      coalesce(description, '') || ' ' ||
      coalesce(scent, '')
    )
  ) STORED;

CREATE INDEX IF NOT EXISTS products_fts ON public.products USING gin(fts);
CREATE INDEX IF NOT EXISTS products_slug ON public.products(slug);
CREATE INDEX IF NOT EXISTS products_category ON public.products(category_id);
CREATE INDEX IF NOT EXISTS products_price ON public.products(price);
```

#### Seed Products
```sql
-- ============================================
-- SEED: Insert your 6 existing products
-- ============================================
INSERT INTO public.products (slug, name, category_id, price, description, images, scent, notes_top, notes_heart, notes_base, tags, rating, review_count, is_new, gender)
VALUES
  (
    'breath',
    'Breath',
    (SELECT id FROM public.categories WHERE slug = 'signature-collection'),
    145.00,
    'A refreshing breath of nature that captures the essence of early morning dew. This fragrance embodies the purity of life with its airy and crisp composition.',
    ARRAY['/perfume/breath-perfume1.png', '/perfume/breath-perfume2.png'],
    'Fresh & Airy',
    ARRAY['Bergamot', 'Mint'],
    ARRAY['Green Tea', 'Jasmine'],
    ARRAY['White Musk', 'Cedarwood'],
    ARRAY['Fresh', 'Citrus', 'Airy', 'Daytime'],
    4.8, 124, TRUE, 'unisex'
  ),
  (
    'elan',
    'Elan',
    (SELECT id FROM public.categories WHERE slug = 'luxury-edition'),
    160.00,
    'Radiate confidence and spirit with Elan. A vibrant blend designed for those who carry themselves with grace and energy.',
    ARRAY['/perfume/elan-perfume1.png', '/perfume/elan-perfume2.png'],
    'Vibrant & Spirited',
    ARRAY['Mandarin', 'Pink Pepper'],
    ARRAY['Ylang-Ylang', 'Orange Blossom'],
    ARRAY['Patchouli', 'Vanilla'],
    ARRAY['Vibrant', 'Floral', 'Spicy', 'Evening'],
    4.7, 89, TRUE, 'women'
  ),
  (
    'first-dance',
    'First Dance',
    (SELECT id FROM public.categories WHERE slug = 'romantic-series'),
    155.00,
    'Capture the magic of an unforgettable moment. First Dance is a delicate floral bouquet that evokes romance and timeless elegance.',
    ARRAY['/perfume/first-dance1.png', '/perfume/first-dance2.png'],
    'Floral & Delicate',
    ARRAY['Peony', 'Lychee'],
    ARRAY['Rose', 'Magnolia'],
    ARRAY['Amber', 'Honey'],
    ARRAY['Romantic', 'Floral', 'Sweet', 'Date Night'],
    4.9, 200, FALSE, 'women'
  ),
  (
    'midnight-smock',
    'Midnight Smock',
    (SELECT id FROM public.categories WHERE slug = 'noir-collection'),
    180.00,
    'An enigmatic fragrance for the mysterious soul. Midnight Smock blends smoky notes with dark florals for an intense, captivating scent.',
    ARRAY['/perfume/midnight-perfume1.png', '/perfume/midnight-perfume2.png'],
    'Mysterious & Smoky',
    ARRAY['Incense', 'Black Pepper'],
    ARRAY['Leather', 'Labdanum'],
    ARRAY['Oud', 'Sandalwood'],
    ARRAY['Smoky', 'Intense', 'Winter', 'Night'],
    4.6, 156, FALSE, 'men'
  ),
  (
    'noir-de-soir',
    'Noir de Soir',
    (SELECT id FROM public.categories WHERE slug = 'evening-wear'),
    195.00,
    'The ultimate evening companion. Noir de Soir is deep, sophisticated, and undeniably seductive.',
    ARRAY['/perfume/noir-perfume1.png', '/perfume/noir-perfume2.png'],
    'Dark & Intense',
    ARRAY['Black Currant', 'Bergamot'],
    ARRAY['Dark Chocolate', 'Tuberose'],
    ARRAY['Vetiver', 'Dark Amber'],
    ARRAY['Dark', 'Seductive', 'Gourmand', 'Formal'],
    4.9, 310, FALSE, 'men'
  ),
  (
    'tears-of-love',
    'Tears of Love',
    (SELECT id FROM public.categories WHERE slug = 'emotional-journey'),
    170.00,
    'A poignant and pure fragrance that speaks to the heart. Clean, aquatic notes mix with soft florals for a melancholic beauty.',
    ARRAY['/perfume/tears-of-love1.png', '/perfume/tears-of-love2.png'],
    'Pure & Melancholic',
    ARRAY['Rain Accord', 'Violet Leaf'],
    ARRAY['Iris', 'White Rose'],
    ARRAY['Musk', 'Driftwood'],
    ARRAY['Clean', 'Aquatic', 'Soft', 'Everyday'],
    4.5, 95, TRUE, 'unisex'
  );
```

#### Table 3: `profiles`
```sql
-- ============================================
-- TABLE: profiles
-- Extends Supabase auth.users with app data
-- Auto-creates a profile when user signs up
-- ============================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'customer',  -- 'customer' or 'admin'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'first_name',
    NEW.raw_user_meta_data ->> 'last_name',
    NEW.raw_user_meta_data ->> 'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists, then create
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

#### Table 4: `reviews`
```sql
-- ============================================
-- TABLE: reviews
-- Product reviews by authenticated users
-- ============================================
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  content TEXT,
  images TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  -- One review per product per user
  UNIQUE(product_id, user_id)
);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reviews are viewable by everyone"
  ON public.reviews FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create reviews"
  ON public.reviews FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reviews"
  ON public.reviews FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own reviews"
  ON public.reviews FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS reviews_product ON public.reviews(product_id);
CREATE INDEX IF NOT EXISTS reviews_user ON public.reviews(user_id);
```

#### Table 5: `cart_items`
```sql
-- ============================================
-- TABLE: cart_items
-- User shopping cart (database-backed)
-- ============================================
CREATE TABLE IF NOT EXISTS public.cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity INTEGER DEFAULT 1 CHECK (quantity > 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own cart"
  ON public.cart_items FOR ALL
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS cart_user ON public.cart_items(user_id);
```

#### Table 6: `wishlist_items`
```sql
-- ============================================
-- TABLE: wishlist_items
-- User wishlist (database-backed)
-- ============================================
CREATE TABLE IF NOT EXISTS public.wishlist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

ALTER TABLE public.wishlist_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own wishlist"
  ON public.wishlist_items FOR ALL
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS wishlist_user ON public.wishlist_items(user_id);
```

#### Table 7: `addresses`
```sql
-- ============================================
-- TABLE: addresses
-- User shipping/billing addresses
-- ============================================
CREATE TABLE IF NOT EXISTS public.addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label TEXT DEFAULT 'Home',
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  address_line1 TEXT NOT NULL,
  address_line2 TEXT,
  city TEXT NOT NULL,
  state TEXT,
  country TEXT DEFAULT 'UAE',
  postal_code TEXT,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own addresses"
  ON public.addresses FOR ALL
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS addresses_user ON public.addresses(user_id);
```

#### Table 8: `orders`
```sql
-- ============================================
-- TABLE: orders
-- Customer orders
-- ============================================
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  status TEXT DEFAULT 'pending'
    CHECK (status IN ('pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded')),
  subtotal DECIMAL(10,2) NOT NULL,
  shipping_fee DECIMAL(10,2) DEFAULT 0,
  tax DECIMAL(10,2) DEFAULT 0,
  discount DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'AED',
  shipping_address JSONB,
  billing_address JSONB,
  payment_intent_id TEXT,
  payment_method TEXT DEFAULT 'card',
  stripe_session_id TEXT,
  notes TEXT,
  shipped_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own orders"
  ON public.orders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create orders"
  ON public.orders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS orders_user ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS orders_number ON public.orders(order_number);

-- Function to generate order numbers
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
DECLARE
  today_count INTEGER;
BEGIN
  SELECT COUNT(*) + 1 INTO today_count
  FROM public.orders
  WHERE DATE(created_at) = CURRENT_DATE;

  NEW.order_number := 'CLE-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(today_count::TEXT, 3, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS set_order_number ON public.orders;
CREATE TRIGGER set_order_number
  BEFORE INSERT ON public.orders
  FOR EACH ROW
  WHEN (NEW.order_number IS NULL OR NEW.order_number = '')
  EXECUTE FUNCTION generate_order_number();
```

#### Table 9: `order_items`
```sql
-- ============================================
-- TABLE: order_items
-- Individual items within an order
-- ============================================
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  product_image TEXT,
  product_slug TEXT,
  price DECIMAL(10,2) NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own order items"
  ON public.order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_items.order_id
      AND orders.user_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS order_items_order ON public.order_items(order_id);
```

#### Table 10: `newsletter_subscribers`
```sql
-- ============================================
-- TABLE: newsletter_subscribers
-- Email newsletter subscriptions
-- ============================================
CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  source TEXT DEFAULT 'website',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Anyone can subscribe (insert)
CREATE POLICY "Anyone can subscribe to newsletter"
  ON public.newsletter_subscribers FOR INSERT
  WITH CHECK (true);
```

#### Utility: Updated_at Trigger
```sql
-- ============================================
-- UTILITY: Auto-update "updated_at" column
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cart_items_updated_at BEFORE UPDATE ON public.cart_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_addresses_updated_at BEFORE UPDATE ON public.addresses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

---

## 5. Row Level Security Summary

| Table | SELECT | INSERT | UPDATE | DELETE |
|-------|--------|--------|--------|--------|
| `categories` | Everyone ✅ | Admin only 🔐 | Admin only 🔐 | Admin only 🔐 |
| `products` | Everyone (active only) ✅ | Admin only 🔐 | Admin only 🔐 | Admin only 🔐 |
| `profiles` | Own profile only 🔒 | Auto (trigger) ⚡ | Own profile only 🔒 | — |
| `reviews` | Everyone ✅ | Own reviews 🔒 | Own reviews 🔒 | Own reviews 🔒 |
| `cart_items` | Own cart 🔒 | Own cart 🔒 | Own cart 🔒 | Own cart 🔒 |
| `wishlist_items` | Own wishlist 🔒 | Own wishlist 🔒 | — | Own wishlist 🔒 |
| `addresses` | Own addresses 🔒 | Own addresses 🔒 | Own addresses 🔒 | Own addresses 🔒 |
| `orders` | Own orders 🔒 | Own orders 🔒 | — | — |
| `order_items` | Own order items 🔒 | — | — | — |
| `newsletter` | — | Everyone ✅ | — | — |

---

## 6. Supabase Auth Configuration

### Step-by-Step Setup in Supabase Dashboard

#### A. Enable Email/Password Auth
1. Go to **Authentication** → **Providers**
2. Click **Email**
3. Toggle **Enable Email provider** → ON
4. Set **Confirm email** → OFF (for easier testing, enable later)
5. Click **Save**

#### B. Enable Google OAuth
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or use existing)
3. Navigate to **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **OAuth Client ID**
5. Application type: **Web application**
6. Add **Authorized redirect URIs**:
   ```
   https://isiykgwvwggdqemguhhz.supabase.co/auth/v1/callback
   ```
7. Copy the **Client ID** and **Client Secret**
8. Go back to Supabase → **Authentication** → **Providers** → **Google**
9. Toggle ON, paste Client ID and Client Secret
10. Click **Save**

#### C. Configure Redirect URLs
1. Go to **Authentication** → **URL Configuration**
2. Set **Site URL**: `http://localhost:3000` (change for production)
3. Add **Redirect URLs**:
   ```
   http://localhost:3000/auth/callback
   http://localhost:3000/login
   https://your-production-domain.com/auth/callback
   ```

---

## 7. Authentication — Complete Code

### File: `src/app/auth/callback/route.ts` (NEW)
```typescript
// This handles the OAuth callback from Google/email confirmation
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/login?error=auth_failed`)
}
```

### File: `src/app/login/page.tsx` (UPDATED — Full Working Version)
```tsx
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Loader2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      toast.error(error.message)
      setLoading(false)
      return
    }

    toast.success("Welcome back!")
    router.push("/")
    router.refresh()
  }

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      toast.error(error.message)
    }
  }

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-neutral-50">
      {/* Left Area - Editorial Image */}
      <div className="relative hidden lg:block overflow-hidden">
        <Image
          src="/login-bg.png"
          alt="Luxury Perfumes Background"
          fill
          className="object-cover scale-105"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        <div className="absolute top-10 left-10 z-10 text-white">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <ArrowLeft className="h-4 w-4" />
            <span className="text-xs tracking-[0.2em] font-medium uppercase">Return to Boutique</span>
          </Link>
        </div>
        <div className="absolute bottom-12 left-12 right-12 z-10 text-white">
          <h2 className="text-4xl font-serif leading-tight mb-4">
            "A perfume is like a piece of clothing, a message, a way of presenting oneself."
          </h2>
          <p className="font-light tracking-wide text-white/80 uppercase text-xs">
            Discover Your Signature Scent
          </p>
        </div>
      </div>

      {/* Right Area - Form Container */}
      <div className="flex flex-col justify-center items-center p-6 md:p-12 relative">
        <div className="w-full max-w-[420px] bg-white p-8 sm:p-12 shadow-[0_0_50px_-12px_rgba(0,0,0,0.08)] rounded-3xl border border-neutral-100">
          <div className="mb-10 text-center">
            <div className="flex justify-center mb-6">
              <div className="flex flex-col items-center">
                <span className="text-4xl font-serif font-bold tracking-tighter text-black">CLE</span>
                <span className="text-[9px] tracking-[0.4em] uppercase mt-1 text-neutral-500">Perfumes</span>
              </div>
            </div>
            <h1 className="text-2xl font-serif text-neutral-900 mb-2">Welcome Back</h1>
            <p className="text-sm text-neutral-500 font-light">Sign in to your CLE account to continue.</p>
          </div>

          <div className="space-y-6">
            {/* Google Login */}
            <Button
              variant="outline"
              onClick={handleGoogleLogin}
              className="w-full h-12 rounded-xl border-neutral-200 hover:bg-neutral-50 flex items-center justify-center gap-3 transition-colors bg-white hover:text-black"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path fillRule="evenodd" clipRule="evenodd" d="M23.52 12.2727C23.52 11.4218 23.4436 10.6036 23.3018 9.81818H12V14.4545H18.4582C18.18 15.9491 17.34 17.2145 16.0364 18.0873V21.0873H19.9145C22.1836 19.0091 23.52 15.9273 23.52 12.2727Z" fill="#4285F4"/>
                <path fillRule="evenodd" clipRule="evenodd" d="M12 24C15.24 24 17.9674 22.9254 19.9146 21.0873L16.0365 18.0873C14.9837 18.7964 13.6092 19.2273 12 19.2273C8.88 19.2273 6.23466 17.1218 5.28556 14.3073L1.35284 17.3818C3.31647 21.2891 7.34738 24 12 24Z" fill="#34A853"/>
                <path fillRule="evenodd" clipRule="evenodd" d="M5.28545 14.3073C5.04545 13.5982 4.90909 12.8236 4.90909 12C4.90909 11.1764 5.04545 10.4018 5.28545 9.69273V6.62182H1.35273C0.534545 8.25273 0.0654545 10.0745 0.0654545 12C0.0654545 13.9255 0.534545 15.7473 1.35273 17.3782L5.28545 14.3073Z" fill="#FBBC05"/>
                <path fillRule="evenodd" clipRule="evenodd" d="M12 4.77273C13.7619 4.77273 15.3383 5.37818 16.5819 6.56182L20.0019 3.14182C17.962 1.25455 15.2346 0 12 0C7.34738 0 3.31647 2.71091 1.35284 6.61818L5.28556 9.69273C6.23466 6.87818 8.88 4.77273 12 4.77273Z" fill="#EA4335"/>
              </svg>
              <span className="font-medium text-xs tracking-wide text-neutral-700">Continue with Google</span>
            </Button>

            <div className="relative flex items-center py-2">
              <div className="flex-grow border-t border-neutral-100"></div>
              <span className="flex-shrink-0 mx-4 text-neutral-400 text-xs font-medium bg-white px-2 uppercase tracking-widest">Or</span>
              <div className="flex-grow border-t border-neutral-100"></div>
            </div>

            {/* Email/Password Form */}
            <form onSubmit={handleEmailLogin} className="space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-[11px] uppercase tracking-wider text-neutral-500 font-medium ml-1">
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="h-12 rounded-xl border-neutral-200 focus-visible:ring-black focus-visible:border-black bg-neutral-50/50 px-4 text-sm transition-all"
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center ml-1">
                  <Label htmlFor="password" className="text-[11px] uppercase tracking-wider text-neutral-500 font-medium">
                    Password
                  </Label>
                  <Link href="/forgot-password" className="text-[11px] text-neutral-400 hover:text-black transition-colors underline-offset-4 hover:underline">
                    Forgot password?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="h-12 rounded-xl border-neutral-200 focus-visible:ring-black focus-visible:border-black bg-neutral-50/50 px-4 text-sm transition-all"
                  required
                  disabled={loading}
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 rounded-xl bg-black text-white hover:bg-neutral-800 uppercase tracking-widest text-xs font-medium transition-all shadow-lg shadow-black/10 mt-2"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign In"}
              </Button>
            </form>

            <div className="text-center pt-4">
              <p className="text-neutral-500 text-sm font-light">
                Don't have an account?{" "}
                <Link href="/signup" className="text-black font-semibold hover:underline underline-offset-4 transition-all">
                  Create one now
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
```

### File: `src/app/signup/page.tsx` (UPDATED — Full Working Version)
```tsx
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Loader2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

export default function SignupPage() {
  const router = useRouter()
  const supabase = createClient()
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
        },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      toast.error(error.message)
      setLoading(false)
      return
    }

    toast.success("Account created! Check your email to confirm.")
    router.push("/login")
  }

  const handleGoogleSignup = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      toast.error(error.message)
    }
  }

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-neutral-50 mb-reverse">
      {/* Left Area - Form Container */}
      <div className="flex flex-col justify-center items-center p-6 md:p-12 relative order-2 lg:order-1">
        <div className="w-full max-w-[420px] bg-white p-8 sm:p-12 shadow-[0_0_50px_-12px_rgba(0,0,0,0.08)] rounded-3xl border border-neutral-100">
          <div className="mb-8 text-center">
            <div className="flex justify-center mb-6">
              <div className="flex flex-col items-center">
                <span className="text-4xl font-serif font-bold tracking-tighter text-black">CLE</span>
                <span className="text-[9px] tracking-[0.4em] uppercase mt-1 text-neutral-500">Perfumes</span>
              </div>
            </div>
            <h1 className="text-2xl font-serif text-neutral-900 mb-2">Create an Account</h1>
            <p className="text-sm text-neutral-500 font-light">Join us to start curating your signature collection.</p>
          </div>

          <div className="space-y-6">
            <Button
              variant="outline"
              onClick={handleGoogleSignup}
              className="w-full h-12 rounded-xl border-neutral-200 hover:bg-neutral-50 flex items-center justify-center gap-3"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path fillRule="evenodd" clipRule="evenodd" d="M23.52 12.2727C23.52 11.4218 23.4436 10.6036 23.3018 9.81818H12V14.4545H18.4582C18.18 15.9491 17.34 17.2145 16.0364 18.0873V21.0873H19.9145C22.1836 19.0091 23.52 15.9273 23.52 12.2727Z" fill="#4285F4"/>
                <path fillRule="evenodd" clipRule="evenodd" d="M12 24C15.24 24 17.9674 22.9254 19.9146 21.0873L16.0365 18.0873C14.9837 18.7964 13.6092 19.2273 12 19.2273C8.88 19.2273 6.23466 17.1218 5.28556 14.3073L1.35284 17.3818C3.31647 21.2891 7.34738 24 12 24Z" fill="#34A853"/>
                <path fillRule="evenodd" clipRule="evenodd" d="M5.28545 14.3073C5.04545 13.5982 4.90909 12.8236 4.90909 12C4.90909 11.1764 5.04545 10.4018 5.28545 9.69273V6.62182H1.35273C0.534545 8.25273 0.0654545 10.0745 0.0654545 12C0.0654545 13.9255 0.534545 15.7473 1.35273 17.3782L5.28545 14.3073Z" fill="#FBBC05"/>
                <path fillRule="evenodd" clipRule="evenodd" d="M12 4.77273C13.7619 4.77273 15.3383 5.37818 16.5819 6.56182L20.0019 3.14182C17.962 1.25455 15.2346 0 12 0C7.34738 0 3.31647 2.71091 1.35284 6.61818L5.28556 9.69273C6.23466 6.87818 8.88 4.77273 12 4.77273Z" fill="#EA4335"/>
              </svg>
              <span className="font-medium text-xs tracking-wide text-neutral-700">Continue with Google</span>
            </Button>

            <div className="relative flex items-center py-2">
              <div className="flex-grow border-t border-neutral-100"></div>
              <span className="flex-shrink-0 mx-4 text-neutral-400 text-xs font-medium bg-white px-2 uppercase tracking-widest">Or</span>
              <div className="flex-grow border-t border-neutral-100"></div>
            </div>

            <form onSubmit={handleSignup} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="firstName" className="text-[11px] uppercase tracking-wider text-neutral-500 font-medium ml-1">First Name</Label>
                  <Input
                    id="firstName"
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Jane"
                    className="h-12 rounded-xl border-neutral-200 focus-visible:ring-black bg-neutral-50/50 px-4 text-sm"
                    required
                    disabled={loading}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="lastName" className="text-[11px] uppercase tracking-wider text-neutral-500 font-medium ml-1">Last Name</Label>
                  <Input
                    id="lastName"
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Doe"
                    className="h-12 rounded-xl border-neutral-200 focus-visible:ring-black bg-neutral-50/50 px-4 text-sm"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="space-y-1.5 pt-1">
                <Label htmlFor="email" className="text-[11px] uppercase tracking-wider text-neutral-500 font-medium ml-1">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="h-12 rounded-xl border-neutral-200 focus-visible:ring-black bg-neutral-50/50 px-4 text-sm"
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-1.5 pt-1">
                <Label htmlFor="password" className="text-[11px] uppercase tracking-wider text-neutral-500 font-medium ml-1">Create Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="h-12 rounded-xl border-neutral-200 focus-visible:ring-black bg-neutral-50/50 px-4 text-sm"
                  required
                  minLength={8}
                  disabled={loading}
                />
                <p className="text-[10px] text-neutral-400 font-light mt-1 ml-1">Must be at least 8 characters long.</p>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 rounded-xl bg-black text-white hover:bg-neutral-800 uppercase tracking-widest text-xs font-medium mt-4"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create Account"}
              </Button>
            </form>

            <div className="text-center pt-2">
              <p className="text-[10px] text-neutral-400 font-light leading-relaxed mb-4 px-2">
                By registering, you agree to our <Link href="#" className="underline underline-offset-2">Terms of Service</Link> and <Link href="#" className="underline underline-offset-2">Privacy Policy</Link>.
              </p>
              <p className="text-neutral-500 text-sm font-light mt-4 pt-4 border-t border-neutral-100">
                Already have an account?{" "}
                <Link href="/login" className="text-black font-semibold hover:underline underline-offset-4">Sign In</Link>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Area - Editorial Image */}
      <div className="relative hidden lg:block overflow-hidden order-1 lg:order-2">
        <Image src="/Philosophy.png" alt="Luxury Perfumes" fill className="object-cover scale-105" priority />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        <div className="absolute top-10 right-10 z-10 text-white">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <span className="text-xs tracking-[0.2em] font-medium uppercase">Return to Boutique</span>
            <ArrowLeft className="h-4 w-4 rotate-180" />
          </Link>
        </div>
        <div className="absolute bottom-12 right-12 left-12 z-10 text-white text-right">
          <h2 className="text-4xl font-serif leading-tight mb-4">"Join the exclusive circle. Discover a world of unparalleled luxury."</h2>
          <p className="font-light tracking-wide text-white/80 uppercase text-xs">Unlock Exclusive Collections</p>
        </div>
      </div>
    </div>
  )
}
```

---

## 8. Protected Routes & Middleware

### Updated `src/middleware.ts` (with route protection)
```typescript
import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from './lib/supabase/middleware'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  // First, update the session
  const response = await updateSession(request)

  // Define protected routes (require login)
  const protectedRoutes = ['/profile', '/checkout']
  const isProtectedRoute = protectedRoutes.some(route =>
    request.nextUrl.pathname.startsWith(route)
  )

  if (isProtectedRoute) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return request.cookies.getAll() },
          setAll() {},
        },
      }
    )

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('next', request.nextUrl.pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  // Redirect logged-in users away from auth pages
  const authRoutes = ['/login', '/signup']
  const isAuthRoute = authRoutes.some(route =>
    request.nextUrl.pathname.startsWith(route)
  )

  if (isAuthRoute) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return request.cookies.getAll() },
          setAll() {},
        },
      }
    )

    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mp4)$).*)',
  ],
}
```

---

> **Continue to Part 2** for: Products from Database, Cart/Wishlist sync, Node.js Backend, Stripe Payments, Order Management, Admin Dashboard, Search & Filters, and Deployment.
