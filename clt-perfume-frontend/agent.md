# CLE Perfumes — AI Agent Context

## Project Summary
CLE Perfumes is a luxury perfume e-commerce website based in UAE. Currency is AED.
Built with Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, shadcn/ui.
Backend uses Supabase (PostgreSQL + Auth) and a separate Node.js Express API for payments.

## Tech Stack
- **Frontend:** Next.js 16.1.6, React 19.2.3, TypeScript 5, Tailwind CSS 4, shadcn/ui, lucide-react
- **Database:** Supabase (PostgreSQL) — project ref: `isiykgwvwggdqemguhhz`
- **Auth:** Supabase Auth (Email/Password + Google OAuth)
- **Backend API:** Node.js + Express (separate project at `../clt-perfume-backend/`)
- **Admin Dashboard:** Integrated into the backend API for stats, product, and order management
- **Payments:** Stripe (AED currency)
- **Hosting:** Vercel (frontend), Railway (backend)

## Project Structure
```
src/
├── app/                           # Next.js App Router pages
│   ├── layout.tsx                 # Root layout (Navbar + Footer + Chatbot + Toaster)
│   ├── page.tsx                   # Homepage
│   ├── globals.css                # Global styles
│   ├── auth/callback/route.ts     # OAuth callback handler
│   ├── login/page.tsx             # Login (Supabase Auth)
│   ├── signup/page.tsx            # Signup (Supabase Auth)
│   ├── cart/page.tsx              # Shopping cart
│   ├── wishlist/page.tsx          # Wishlist
│   ├── collections/[slug]/page.tsx # Collection pages (mens/womens/deals)
│   ├── product/[slug]/page.tsx    # Product detail
│   ├── offers/page.tsx            # Offers hub
│   ├── offers/[slug]/page.tsx     # Individual offer detail
│   ├── complimentary-samples/     # Free samples landing page
│   ├── personal-engraving/        # Engraving service page
│   └── signature-sets/            # Signature sets page
├── components/
│   ├── navbar.tsx                 # Main nav with mega menus, mobile drawer, search, cart/wishlist badges
│   ├── footer.tsx                 # Footer with social links, app store badges
│   ├── hero.tsx                   # Auto-play image carousel (embla-carousel)
│   ├── collections.tsx            # Collection category cards
│   ├── featured-products.tsx      # Featured product grid
│   ├── brand-story.tsx            # Brand philosophy section
│   ├── offer-cards.tsx            # Promotional offer cards
│   ├── pocket-friendly.tsx        # Budget-friendly products section
│   ├── newsletter.tsx             # Email newsletter signup form
│   ├── chat-bot.tsx               # AI chatbot ("Ask CLE") — connected to n8n webhook
│   ├── product-display.tsx        # Full product detail component
│   ├── product/product-card.tsx   # Reusable product card with wishlist toggle
│   ├── cart/cart-item.tsx          # Cart line item with quantity controls
│   └── ui/                        # shadcn/ui components (Button, Input, Label, Badge, Carousel, Sonner)
├── contexts/
│   ├── providers.tsx              # Combined CartProvider + WishlistProvider
│   ├── cart-context.tsx           # Cart state (localStorage + Supabase sync for logged-in users)
│   └── wishlist-context.tsx       # Wishlist state (localStorage + Supabase sync)
└── lib/
    ├── products.ts                # Legacy hardcoded products (6 perfumes) — being migrated to DB
    ├── types.ts                   # TypeScript interfaces for all database tables
    ├── utils.ts                   # Utility functions (cn for class merging)
    ├── queries/
    │   ├── products.ts            # Supabase product queries (getProducts, getBySlug, search, etc.)
    │   ├── cart.ts                # Supabase cart operations
    │   └── wishlist.ts            # Supabase wishlist operations
    └── supabase/
        ├── client.ts              # Browser Supabase client (for Client Components)
        ├── server.ts              # Server Supabase client (for Server Components)
        └── middleware.ts          # Session refresh helper

clt-perfume-backend/                   # Node.js + Express Backend
├── src/
│   ├── config/                        # Supabase & Stripe config
│   ├── middleware/                    # Auth & Admin middleware
│   ├── routes/                        # Payments, Orders, Newsletter, Admin routes
│   └── index.ts                       # Entry point
```

## Database Schema (Supabase — 10 Tables)
1. **categories** — Product categories (Signature, Luxury, Romantic, Noir, Evening, Emotional)
2. **products** — Perfumes with images, scent notes, tags, rating, stock, gender, full-text search index
3. **profiles** — Extends auth.users (first_name, last_name, phone, avatar_url, role). Auto-created on signup via trigger.
4. **reviews** — Product reviews (rating 1-5, content, images). One review per product per user.
5. **cart_items** — User shopping cart. Unique constraint on (user_id, product_id).
6. **wishlist_items** — User wishlist. Unique constraint on (user_id, product_id).
7. **addresses** — Shipping/billing addresses with label, is_default flag.
8. **orders** — Orders with auto-generated order numbers (CLE-YYYYMMDD-NNN), status tracking, Stripe payment IDs.
9. **order_items** — Line items with snapshot of product data at time of purchase.
10. **newsletter_subscribers** — Email subscriptions.

All tables have Row Level Security (RLS) enabled. Products/categories are publicly readable. User data is restricted to the owning user.

## Products (6 Perfumes)
| Name | Price (AED) | Category | Gender |
|------|-------------|----------|--------|
| Breath | 145 | Signature Collection | Unisex |
| Elan | 160 | Luxury Edition | Women |
| First Dance | 155 | Romantic Series | Women |
| Midnight Smock | 180 | Noir Collection | Men |
| Noir de Soir | 195 | Evening Wear | Men |
| Tears of Love | 170 | Emotional Journey | Unisex |

## Key Integrations
- **AI Chatbot:** Connected to `https://justsearchdeveloper.app.n8n.cloud/webhook/...` via POST requests
- **Supabase MCP:** Configured at `~/.cursor/mcp.json` with access token for direct database operations
- **Stripe:** Checkout Sessions API with webhook at `/api/webhooks/stripe`

## Environment Variables
```
# Frontend (.env.local)
NEXT_PUBLIC_SUPABASE_URL=https://isiykgwvwggdqemguhhz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon_key>
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
NEXT_PUBLIC_API_URL=http://localhost:4000

# Backend (.env)
SUPABASE_URL=<same>
SUPABASE_SERVICE_ROLE_KEY=<service_role_key>
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

## Design System
- **Fonts:** Inter (sans) + Playfair Display (serif)
- **Colors:** Black/white/neutral palette. Gold (#yellow-600) for offers. Luxury minimal aesthetic.
- **Style:** Premium, editorial, high-fashion e-commerce look
- **Layout:** Light theme only (forced). Rounded cards, subtle shadows, serif headings, sans body.

## Commands
```bash
npm run dev     # Start dev server (port 3000)
npm run build   # Production build
npm run lint    # ESLint
```

## Important Notes
- Cart and Wishlist use localStorage for guests, Supabase for logged-in users
- Login/Signup forms are wired to Supabase Auth with email/password and Google OAuth
- Products are being migrated from hardcoded `products.ts` to Supabase database
- The middleware at `src/middleware.ts` handles session refresh and route protection
- Protected routes: `/profile`, `/checkout` (redirect to login if not authenticated)
- **Admin Dashboard API:** Accessible at `/api/admin/dashboard` (requires admin role)
- **Stripe Webhooks:** Backend handles `checkout.session.completed` to create orders and decrement stock
- Order numbers are auto-generated by a PostgreSQL trigger: `CLE-YYYYMMDD-NNN`
- Full documentation available in `docs/` directory
