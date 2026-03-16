# CLT Project - Current Functionality and Pending Work

Audit date: 2026-03-16  
Workspace: `/home/pvsameerpvs/Projects/JustSearch/clt-project`

## 1. Monorepo Structure

- `clt-perfume-frontend` (Next.js 16, store frontend, default port 3000)
- `clt-admin-dashboard` (Next.js 16, admin panel, port 3001)
- `clt-perfume-backend` (Express + Supabase + Stripe, port 4000)
- SQL files in repo root:
  - `initial_schema.sql`
  - `site_settings.sql`
  - `repair_database.sql`

## 2. Architecture Summary

- Frontend fetches products/categories/settings/newsletter API from backend.
- Admin dashboard fetches protected backend admin APIs using Supabase bearer token.
- Backend uses Supabase service role for DB operations and Stripe for payments + webhooks.
- Authentication is Supabase Auth for both frontend and admin.

## 3. Frontend Status (`clt-perfume-frontend`)

## 3.1 Implemented Routes

- `/` Home
- `/search`
- `/product/[slug]`
- `/collections/[slug]`
- `/offers`
- `/offers/[slug]`
- `/signature-sets`
- `/personal-engraving`
- `/complimentary-samples`
- `/cart`
- `/wishlist`
- `/dashboard` (customer profile + order list)
- `/login`, `/signup`, `/auth/callback`
- Admin redirect helpers:
  - `/admin`
  - `/admin/[...path]`
  - `/clt-dashboard`

## 3.2 Connected Features

- Product list/search/category pages use backend:
  - `GET /api/products`
  - `GET /api/products/:slug`
  - `GET /api/products/categories`
  - `GET /api/products/categories/:slug`
- Dynamic site sections load from `GET /api/settings`.
- Newsletter form is connected to `POST /api/newsletter/subscribe`.
- Auth (email/password + Google) is connected to Supabase.

## 3.3 Frontend Gaps

- Cart is localStorage-only (`cle_cart`), not synced to backend `cart_items`.
- Checkout button is UI-only; no call to `POST /api/payments/create-checkout-session`.
- Missing frontend routes expected by backend Stripe success/cancel URLs:
  - `/checkout/success`
  - `/checkout/cancel`
- `Buy Now` button on product page has no payment logic.
- `/dashboard` links to `/dashboard/orders/:id`, but this route does not exist in frontend app.
- Marketing pages still use static product data from `src/lib/products.ts`:
  - `/signature-sets`
  - `/personal-engraving`
  - `/complimentary-samples`
  - `/offers/[slug]` related product blocks
- Frontend still uses `src/middleware.ts`; Next.js now recommends `proxy.ts` convention.

## 4. Admin Dashboard Status (`clt-admin-dashboard`)

## 4.1 Implemented Routes

- `/login`
- `/dashboard` (overview)
- `/dashboard/products`
- `/dashboard/categories`
- `/dashboard/orders`
- `/dashboard/customers`
- `/dashboard/settings`
- `/dashboard/newsletter`
- `/dashboard/messages`
- `/dashboard/coupons`

## 4.2 Connected Features

- Admin auth + role enforcement:
  - session required
  - `profiles.role = admin` required
- Product CRUD connected to backend admin endpoints.
- Category CRUD connected to backend admin endpoints.
- Orders list + status update connected.
- Customers list connected.
- Settings read/write connected.
- Newsletter subscribers list connected.
- Contact messages list + mark as read connected.
- Promo code CRUD connected.

## 4.3 Admin Gaps

- No admin UI currently uses:
  - `GET /api/admin/orders/:id` (detail)
  - `GET /api/admin/orders/:id/invoice`
- Admin messages module expects incoming contact messages, but frontend has no contact form + no public backend endpoint to create messages.
- Redirect loops can appear for non-admin users trying `/dashboard`; access requires `profiles.role = 'admin'`.

## 5. Backend Status (`clt-perfume-backend`)

## 5.1 Implemented API Endpoints

Public:

- `GET /api/health`
- `GET /api/settings`
- `GET /api/products`
- `GET /api/products/:slug`
- `GET /api/products/categories`
- `GET /api/products/categories/:slug`
- `POST /api/newsletter/subscribe`
- `POST /api/webhooks/stripe`

Authenticated customer:

- `POST /api/payments/create-checkout-session`
- `GET /api/payments/session/:sessionId`
- `GET /api/orders`
- `GET /api/orders/:id`

Authenticated admin:

- `GET /api/admin/dashboard`
- Product CRUD: `GET/POST/PUT/DELETE /api/admin/products`
- Category CRUD: `GET/POST/PUT/DELETE /api/admin/categories`
- Orders: `GET /api/admin/orders`, `GET /api/admin/orders/:id`, `GET /api/admin/orders/:id/invoice`, `PUT /api/admin/orders/:id/status`
- Customers: `GET /api/admin/customers`
- Newsletter: `GET /api/admin/newsletter`
- Messages: `GET /api/admin/messages`, `PUT /api/admin/messages/:id/read`
- Promo codes: `GET/POST/DELETE /api/admin/promo-codes`

Settings write (admin only):

- `PUT /api/settings`

## 5.2 Backend Risks / Pending

- Checkout webhook inserts orders with `order_number: ''` (empty string).  
  This is high risk because `orders.order_number` is `UNIQUE`; repeated paid orders can fail.
- No request body schema validation on admin/public write routes.
- No automated tests.
- No public endpoint to create `contact_messages` (admin can read/mark, but no producer in this repo).

## 6. Database Status

## 6.1 SQL Files in Repo

- `initial_schema.sql` defines:
  - `profiles`, `categories`, `products`, `newsletter_subs`, `cart_items`, `orders`, `order_items`
  - function `decrement_stock`
  - auth trigger `handle_new_user`
- `site_settings.sql` defines:
  - `site_settings`
- `repair_database.sql` patches missing product/category columns.

## 6.2 Live DB Check (from current backend env)

Live table checks executed from backend script:

- `profiles`: OK (count 3)
- `categories`: OK (count 2)
- `products`: OK (count 3)
- `newsletter_subs`: OK (count 0)
- `site_settings`: OK (count 1)
- `cart_items`: OK (count 0)
- `orders`: OK (count 0)
- `order_items`: OK (count 0)
- `contact_messages`: OK (count 0)
- `promo_codes`: OK (count 0)

## 6.3 Schema Drift to Fix

- `contact_messages` and `promo_codes` are used by backend/admin, but not present in root SQL migration files.
- Fresh setup from only `initial_schema.sql` + `site_settings.sql` can miss these newer tables.

## 7. Quality and Health Checks

Run on 2026-03-16:

- Backend: `npm run build` -> PASS
- Frontend: `npx tsc --noEmit` -> PASS
- Admin: `npx tsc --noEmit` -> PASS

Lint:

- Frontend: `npm run lint` -> FAIL (`23 errors`, `2 warnings`)
- Admin: `npm run lint` -> FAIL (`23 errors`, `4 warnings`)
- Most lint errors are `@typescript-eslint/no-explicit-any`.

## 8. Integration Status Matrix

Complete:

- Frontend -> backend catalog/settings/newsletter
- Frontend/admin -> Supabase auth
- Admin -> backend protected APIs
- Backend -> Supabase and Stripe wiring

Partial / Missing:

- Frontend checkout flow end-to-end
- Frontend contact/message flow
- Frontend customer order detail route
- Promo code usage in frontend checkout
- SQL migrations fully aligned with latest backend features

## 9. Pending Functionality (Priority Order)

1. Complete checkout end-to-end:
   - Sync cart with `cart_items`
   - Create checkout session from frontend
   - Add `/checkout/success` and `/checkout/cancel` pages
2. Fix order number generation in webhook:
   - stop inserting empty `order_number`
   - add deterministic/unique order number generation
3. Add contact pipeline:
   - frontend contact page/form
   - public backend route to insert `contact_messages`
4. Implement frontend order detail page:
   - add `/dashboard/orders/[id]` or remove broken link
5. Add migration SQL for new tables:
   - `contact_messages`
   - `promo_codes`
6. Reduce lint debt:
   - replace `any` with typed interfaces across frontend/admin
7. Modernize frontend middleware file:
   - move `middleware.ts` to `proxy.ts` pattern in Next.js 16
8. Add tests:
   - backend endpoint smoke tests
   - core frontend/admin integration tests
