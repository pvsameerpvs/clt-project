# CLE Perfume — Complete Database Schema

## Overview
- **Database:** Supabase (PostgreSQL 17)
- **Project Ref:** `isiykgwvwggdqemguhhz`
- **Region:** `ap-northeast-2`
- **Tables:** 10
- **Currency:** AED

---

## Table Relationships Diagram

```
auth.users (Supabase built-in)
    │
    ├──1:1──► profiles (id = auth.users.id)
    │              └── role: 'customer' | 'admin'
    │
    ├──1:N──► addresses
    ├──1:N──► cart_items ◄──N:1── products
    ├──1:N──► wishlist_items ◄──N:1── products
    ├──1:N──► reviews ◄──N:1── products
    └──1:N──► orders
                  └──1:N──► order_items ◄──N:1── products

categories ──1:N──► products

newsletter_subscribers (standalone)
```

---

## Table 1: `categories`
Purpose: Product categories (Signature Collection, Luxury Edition, etc.)

| Column | Type | Default | Nullable | Constraints |
|--------|------|---------|----------|-------------|
| `id` | UUID | `gen_random_uuid()` | NO | PRIMARY KEY |
| `name` | TEXT | — | NO | — |
| `slug` | TEXT | — | NO | UNIQUE |
| `description` | TEXT | — | YES | — |
| `image_url` | TEXT | — | YES | — |
| `created_at` | TIMESTAMPTZ | `NOW()` | YES | — |

**RLS:** Everyone can SELECT. Admin-only INSERT/UPDATE/DELETE.

**Seed Data:** 6 categories
- Signature Collection, Luxury Edition, Romantic Series, Noir Collection, Evening Wear, Emotional Journey

---

## Table 2: `products`
Purpose: All perfume products with images, scent notes, pricing, stock

| Column | Type | Default | Nullable | Constraints |
|--------|------|---------|----------|-------------|
| `id` | UUID | `gen_random_uuid()` | NO | PRIMARY KEY |
| `slug` | TEXT | — | NO | UNIQUE |
| `name` | TEXT | — | NO | — |
| `category_id` | UUID | — | YES | FK → categories(id) ON DELETE SET NULL |
| `price` | DECIMAL(10,2) | — | NO | — |
| `compare_at_price` | DECIMAL(10,2) | — | YES | For showing discounts |
| `description` | TEXT | — | YES | — |
| `images` | TEXT[] | `'{}'` | YES | Array of image paths |
| `scent` | TEXT | — | YES | e.g., "Fresh & Airy" |
| `ml` | TEXT | — | YES | e.g., "50ml", "100ml" |
| `notes_top` | TEXT[] | `'{}'` | YES | Top fragrance notes |
| `notes_heart` | TEXT[] | `'{}'` | YES | Heart fragrance notes |
| `notes_base` | TEXT[] | `'{}'` | YES | Base fragrance notes |
| `tags` | TEXT[] | `'{}'` | YES | e.g., ["Fresh","Citrus"] |
| `rating` | DECIMAL(2,1) | `0` | YES | 0.0 to 5.0 |
| `review_count` | INTEGER | `0` | YES | — |
| `stock` | INTEGER | `100` | YES | Available inventory |
| `is_new` | BOOLEAN | `FALSE` | YES | Show "NEW" badge |
| `is_active` | BOOLEAN | `TRUE` | YES | Soft delete |
| `gender` | TEXT | `'unisex'` | YES | 'men','women','unisex' |
| `fts` | TSVECTOR | auto-generated | YES | Full-text search index |
| `created_at` | TIMESTAMPTZ | `NOW()` | YES | — |
| `updated_at` | TIMESTAMPTZ | `NOW()` | YES | Auto-updated by trigger |

**Indexes:** `slug`, `category_id`, `price`, `fts` (GIN)
**RLS:** Everyone can SELECT where `is_active = true`. Admin-only INSERT/UPDATE/DELETE.

**Seed Data:** 6 products (Breath, Elan, First Dance, Midnight Smock, Noir de Soir, Tears of Love)

---

## Table 3: `profiles`
Purpose: Extends Supabase auth.users with app-specific data. Auto-created on signup.

| Column | Type | Default | Nullable | Constraints |
|--------|------|---------|----------|-------------|
| `id` | UUID | — | NO | PRIMARY KEY, FK → auth.users(id) ON DELETE CASCADE |
| `first_name` | TEXT | — | YES | — |
| `last_name` | TEXT | — | YES | — |
| `phone` | TEXT | — | YES | — |
| `avatar_url` | TEXT | — | YES | — |
| `role` | TEXT | `'customer'` | YES | 'customer' or 'admin' |
| `created_at` | TIMESTAMPTZ | `NOW()` | YES | — |
| `updated_at` | TIMESTAMPTZ | `NOW()` | YES | Auto-updated by trigger |

**Trigger:** `on_auth_user_created` — automatically inserts a profile row when a new user signs up. Copies `first_name`, `last_name`, `avatar_url` from user metadata.

**RLS:** Users can SELECT and UPDATE their own profile only.

---

## Table 4: `reviews`
Purpose: Product reviews by authenticated users

| Column | Type | Default | Nullable | Constraints |
|--------|------|---------|----------|-------------|
| `id` | UUID | `gen_random_uuid()` | NO | PRIMARY KEY |
| `product_id` | UUID | — | NO | FK → products(id) ON DELETE CASCADE |
| `user_id` | UUID | — | NO | FK → auth.users(id) ON DELETE CASCADE |
| `rating` | INTEGER | — | NO | CHECK (1 to 5) |
| `content` | TEXT | — | YES | Review text |
| `images` | TEXT[] | `'{}'` | YES | Review images |
| `created_at` | TIMESTAMPTZ | `NOW()` | YES | — |

**Unique:** `(product_id, user_id)` — one review per product per user
**Indexes:** `product_id`, `user_id`
**RLS:** Everyone can SELECT. Authenticated users can INSERT/UPDATE/DELETE their own.

---

## Table 5: `cart_items`
Purpose: Shopping cart for logged-in users

| Column | Type | Default | Nullable | Constraints |
|--------|------|---------|----------|-------------|
| `id` | UUID | `gen_random_uuid()` | NO | PRIMARY KEY |
| `user_id` | UUID | — | NO | FK → auth.users(id) ON DELETE CASCADE |
| `product_id` | UUID | — | NO | FK → products(id) ON DELETE CASCADE |
| `quantity` | INTEGER | `1` | YES | CHECK (quantity > 0) |
| `created_at` | TIMESTAMPTZ | `NOW()` | YES | — |
| `updated_at` | TIMESTAMPTZ | `NOW()` | YES | Auto-updated by trigger |

**Unique:** `(user_id, product_id)` — prevents duplicate entries, use UPSERT to update quantity
**Indexes:** `user_id`
**RLS:** Users can manage (SELECT/INSERT/UPDATE/DELETE) their own cart only.

---

## Table 6: `wishlist_items`
Purpose: Saved/favorited products for logged-in users

| Column | Type | Default | Nullable | Constraints |
|--------|------|---------|----------|-------------|
| `id` | UUID | `gen_random_uuid()` | NO | PRIMARY KEY |
| `user_id` | UUID | — | NO | FK → auth.users(id) ON DELETE CASCADE |
| `product_id` | UUID | — | NO | FK → products(id) ON DELETE CASCADE |
| `created_at` | TIMESTAMPTZ | `NOW()` | YES | — |

**Unique:** `(user_id, product_id)`
**Indexes:** `user_id`
**RLS:** Users can manage their own wishlist only.

---

## Table 7: `addresses`
Purpose: User shipping/billing addresses

| Column | Type | Default | Nullable | Constraints |
|--------|------|---------|----------|-------------|
| `id` | UUID | `gen_random_uuid()` | NO | PRIMARY KEY |
| `user_id` | UUID | — | NO | FK → auth.users(id) ON DELETE CASCADE |
| `label` | TEXT | `'Home'` | YES | Home, Office, etc. |
| `full_name` | TEXT | — | NO | Recipient name |
| `phone` | TEXT | — | NO | Contact number |
| `address_line1` | TEXT | — | NO | Street address |
| `address_line2` | TEXT | — | YES | Apt, suite, etc. |
| `city` | TEXT | — | NO | — |
| `state` | TEXT | — | YES | — |
| `country` | TEXT | `'UAE'` | YES | — |
| `postal_code` | TEXT | — | YES | — |
| `is_default` | BOOLEAN | `FALSE` | YES | Default address flag |
| `created_at` | TIMESTAMPTZ | `NOW()` | YES | — |
| `updated_at` | TIMESTAMPTZ | `NOW()` | YES | Auto-updated by trigger |

**Indexes:** `user_id`
**RLS:** Users can manage their own addresses only.

---

## Table 8: `orders`
Purpose: Customer orders with payment and shipping info

| Column | Type | Default | Nullable | Constraints |
|--------|------|---------|----------|-------------|
| `id` | UUID | `gen_random_uuid()` | NO | PRIMARY KEY |
| `order_number` | TEXT | auto-generated | NO | UNIQUE — format: `CLE-YYYYMMDD-NNN` |
| `user_id` | UUID | — | YES | FK → auth.users(id) |
| `status` | TEXT | `'pending'` | YES | CHECK: pending, paid, processing, shipped, delivered, cancelled, refunded |
| `subtotal` | DECIMAL(10,2) | — | NO | Sum of item prices |
| `shipping_fee` | DECIMAL(10,2) | `0` | YES | — |
| `tax` | DECIMAL(10,2) | `0` | YES | 5% VAT |
| `discount` | DECIMAL(10,2) | `0` | YES | Applied discount |
| `total` | DECIMAL(10,2) | — | NO | Final amount charged |
| `currency` | TEXT | `'AED'` | YES | — |
| `shipping_address` | JSONB | — | YES | Address snapshot |
| `billing_address` | JSONB | — | YES | Address snapshot |
| `payment_intent_id` | TEXT | — | YES | Stripe PaymentIntent ID |
| `stripe_session_id` | TEXT | — | YES | Stripe Checkout Session ID |
| `payment_method` | TEXT | `'card'` | YES | card, cod, etc. |
| `notes` | TEXT | — | YES | Customer notes |
| `shipped_at` | TIMESTAMPTZ | — | YES | When shipped |
| `delivered_at` | TIMESTAMPTZ | — | YES | When delivered |
| `created_at` | TIMESTAMPTZ | `NOW()` | YES | — |
| `updated_at` | TIMESTAMPTZ | `NOW()` | YES | Auto-updated by trigger |

**Trigger:** `set_order_number` — auto-generates order number on INSERT: `CLE-20260314-001`
**Indexes:** `user_id`, `status`, `order_number`
**RLS:** Users can SELECT and INSERT their own orders.

**Order Status Flow:**
```
pending → paid → processing → shipped → delivered
                                    ↘ cancelled
                                    ↘ refunded
```

---

## Table 9: `order_items`
Purpose: Individual products within an order (snapshot at time of purchase)

| Column | Type | Default | Nullable | Constraints |
|--------|------|---------|----------|-------------|
| `id` | UUID | `gen_random_uuid()` | NO | PRIMARY KEY |
| `order_id` | UUID | — | NO | FK → orders(id) ON DELETE CASCADE |
| `product_id` | UUID | — | YES | FK → products(id) ON DELETE SET NULL |
| `product_name` | TEXT | — | NO | Snapshot of product name |
| `product_image` | TEXT | — | YES | Snapshot of first image |
| `product_slug` | TEXT | — | YES | For linking back to product |
| `price` | DECIMAL(10,2) | — | NO | Snapshot of price at purchase |
| `quantity` | INTEGER | — | NO | CHECK (quantity > 0) |
| `created_at` | TIMESTAMPTZ | `NOW()` | YES | — |

**Indexes:** `order_id`
**RLS:** Users can SELECT order items for their own orders only (checked via JOIN to orders table).

---

## Table 10: `newsletter_subscribers`
Purpose: Email newsletter subscriptions

| Column | Type | Default | Nullable | Constraints |
|--------|------|---------|----------|-------------|
| `id` | UUID | `gen_random_uuid()` | NO | PRIMARY KEY |
| `email` | TEXT | — | NO | UNIQUE |
| `is_active` | BOOLEAN | `TRUE` | YES | For unsubscribe |
| `source` | TEXT | `'website'` | YES | Where they signed up |
| `created_at` | TIMESTAMPTZ | `NOW()` | YES | — |

**RLS:** Anyone can INSERT. No public SELECT/UPDATE/DELETE.

---

## Database Functions

### `handle_new_user()` — Auto-create profile
Triggered AFTER INSERT on `auth.users`. Creates a row in `profiles` with user metadata.

### `generate_order_number()` — Auto-generate order number
Triggered BEFORE INSERT on `orders`. Generates format: `CLE-YYYYMMDD-NNN` (e.g., `CLE-20260314-001`).

### `update_updated_at_column()` — Auto-update timestamps
Triggered BEFORE UPDATE on: `profiles`, `products`, `cart_items`, `addresses`, `orders`.
Sets `updated_at = NOW()`.

### `decrement_stock(p_product_id, p_quantity)` — Reduce stock
Called by backend after successful payment. Uses `GREATEST(stock - quantity, 0)` to prevent negative stock.

---

## RLS Policy Summary

| Table | SELECT | INSERT | UPDATE | DELETE |
|-------|--------|--------|--------|--------|
| categories | ✅ Public | 🔐 Admin | 🔐 Admin | 🔐 Admin |
| products | ✅ Public (active only) | 🔐 Admin | 🔐 Admin | 🔐 Admin |
| profiles | 🔒 Own only | ⚡ Auto trigger | 🔒 Own only | — |
| reviews | ✅ Public | 🔒 Own only | 🔒 Own only | 🔒 Own only |
| cart_items | 🔒 Own only | 🔒 Own only | 🔒 Own only | 🔒 Own only |
| wishlist_items | 🔒 Own only | 🔒 Own only | — | 🔒 Own only |
| addresses | 🔒 Own only | 🔒 Own only | 🔒 Own only | 🔒 Own only |
| orders | 🔒 Own only | 🔒 Own only | — | — |
| order_items | 🔒 Own (via order) | — | — | — |
| newsletter | — | ✅ Public | — | — |

✅ = Anyone, 🔒 = Authenticated user (own data), 🔐 = Admin only, ⚡ = Automatic
