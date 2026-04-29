# 🏛️ CLE Perfume — Complete Project Overview

> **Project:** `clt-perfume-frontend` — A luxury perfume e-commerce frontend  
> **Tech Stack:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, shadcn/ui  
> **Currency:** AED (UAE Dirhams)

---

## 📄 All Pages (10 Routes)

| # | Route | Page | Status |
|---|-------|------|--------|
| 1 | `/` | **Homepage** | ✅ Working |
| 2 | `/login` | **Login Page** | ⚠️ UI Only (no auth logic) |
| 3 | `/signup` | **Signup Page** | ⚠️ UI Only (no auth logic) |
| 4 | `/cart` | **Shopping Cart** | ✅ Working (localStorage) |
| 5 | `/wishlist` | **Wishlist** | ✅ Working (localStorage) |
| 6 | `/collections/[slug]` | **Collection Pages** (mens, womens, deals) | ✅ Working |
| 7 | `/product/[slug]` | **Product Detail Page** | ✅ Working |
| 8 | `/offers` | **Exclusive Offers Hub** | ✅ Working |
| 9 | `/complimentary-samples` | **Free Samples Landing** | ✅ Working |
| 10 | `/personal-engraving` | **Engraving Service Landing** | ✅ Working |
| 11 | `/signature-sets` | **Signature Sets Landing** | ✅ Working |
| 12 | `/offers/[slug]` | **Individual Offer Page** | ⚠️ Route exists but not reviewed |

---

## 🧩 All Components (17 Components)

### Layout Components
| Component | File | Description |
|-----------|------|-------------|
| **Navbar** | `navbar.tsx` (417 lines) | Full navbar with marquee banner, search bar, mega menus (Men/Women/Best Sets), mobile offcanvas drawer, cart/wishlist badge counts |
| **Footer** | `footer.tsx` | 5-column footer with brand info, shop links, company links, social media icons, App Store/Google Play badges |
| **Providers** | `contexts/providers.tsx` | Wraps `CartProvider` + `WishlistProvider` |

### Homepage Sections
| Component | File | Description |
|-----------|------|-------------|
| **Hero** | `hero.tsx` | Auto-playing image carousel (4 slides) with overlaid text & CTA button |
| **Collections** | `collections.tsx` | Collection category cards |
| **FeaturedProducts** | `featured-products.tsx` | Featured product showcase |
| **BrandStory** | `brand-story.tsx` | Brand storytelling section |
| **OfferCards** | `offer-cards.tsx` | Promo cards for offers (samples, engraving, sets) |
| **PocketFriendly** | `pocket-friendly.tsx` | Budget-friendly perfume section |
| **Newsletter** | `newsletter.tsx` | Email newsletter signup |

### Feature Components
| Component | File | Description |
|-----------|------|-------------|
| **Chatbot** | `chat-bot.tsx` | Floating AI chatbot ("Ask CLE") powered by n8n webhook API |
| **ProductCard** | `product/product-card.tsx` | Reusable product card with wishlist toggle |
| **ProductDisplay** | `product-display.tsx` | Full product detail view (images, notes, reviews, add-to-cart) |
| **CartItem** | `cart/cart-item.tsx` | Individual cart line item with quantity controls |

### UI Components (shadcn/ui)
Located in `src/components/ui/`: Button, Input, Label, Badge, Carousel, Sonner (toast)

---

## 🛍️ Products (6 Perfumes — All Hardcoded)

| # | Name | Category | Price (AED) | Slug | New? |
|---|------|----------|-------------|------|------|
| 1 | **Breath** | Signature Collection | 145 | `breath` | ✅ |
| 2 | **Elan** | Luxury Edition | 160 | `elan` | ✅ |
| 3 | **First Dance** | Romantic Series | 155 | `first-dance` | ❌ |
| 4 | **Midnight Smock** | Noir Collection | 180 | `midnight-smock` | ❌ |
| 5 | **Noir de Soir** | Evening Wear | 195 | `noir-de-soir` | ❌ |
| 6 | **Tears of Love** | Emotional Journey | 170 | `tears-of-love` | ✅ |

> Each product has: name, description, 2 images, scent type, fragrance notes (top/heart/base), tags, rating, review count, and reviews array.

---

## 🔌 Current Data & State Management

| Feature | Current Method | Connected to Supabase? |
|---------|---------------|----------------------|
| **Products** | Hardcoded in `src/lib/products.ts` | ❌ No |
| **Cart** | React Context + `localStorage` | ❌ No |
| **Wishlist** | React Context + `localStorage` | ❌ No |
| **User Auth (Login/Signup)** | UI forms only — no submit logic | ❌ No |
| **Search** | Visual input only — no search logic | ❌ No |
| **Chatbot** | Connected to external n8n webhook API | N/A |
| **Newsletter** | Visual form only — no submit logic | ❌ No |
| **Checkout** | Button only — no checkout flow | ❌ No |

---

## ⚠️ What's NOT Functional Yet (Needs Supabase)

### 🔴 Critical (No Backend)
1. **Authentication** — Login & Signup forms exist but have zero logic. No Supabase Auth connected.
2. **Product Data** — All 6 products are hardcoded in a TypeScript file. Not fetched from any database.
3. **Cart Persistence** — Cart is only in `localStorage`. Not synced to a user account.
4. **Wishlist Persistence** — Same as cart — `localStorage` only.
5. **Checkout/Orders** — "Proceed to Checkout" button does nothing.
6. **Search** — Search bar is visual only, no search functionality.

### 🟡 Medium Priority
7. **Newsletter Signup** — Form exists, no backend to collect emails.
8. **Product Reviews** — Only 1 hardcoded review exists. No ability to submit reviews.
9. **Collections** — Collection assignments are hardcoded (e.g., product IDs `["4","5","1"]` for men's).
10. **Google OAuth** — "Continue with Google" button exists on login/signup but has no logic.

### 🟢 Nice to Have
11. **Order History / Profile** — No user profile or order history pages exist.
12. **Forgot Password** — Link exists but goes to `#`.
13. **Privacy Policy / Terms** — Links exist in footer but go to `#`.
14. **App Store Links** — Placeholder `#` links in footer.

---

## ✅ What IS Working (Frontend Only)

1. ✅ **Beautiful responsive UI** — Full luxury e-commerce layout
2. ✅ **Hero carousel** — Auto-sliding banner with 4 images
3. ✅ **Mega menu navigation** — Men, Women, Best Sets with image-rich dropdowns
4. ✅ **Mobile navigation** — Full offcanvas drawer with sub-menus
5. ✅ **Product browsing** — Browse 3 collections (men/women/deals)
6. ✅ **Product detail** — Full product pages with images, notes, reviews
7. ✅ **Add to cart** — Functional cart with quantity updates (localStorage)
8. ✅ **Wishlist** — Toggle products in/out of wishlist (localStorage)
9. ✅ **AI Chatbot** — "Ask CLE" chatbot connected to n8n webhook (live!)
10. ✅ **Toast notifications** — Sonner toasts for cart/wishlist actions
11. ✅ **Marquee banner** — Scrolling "Ramadan Special" promotional banner
12. ✅ **Offer landing pages** — Complimentary Samples, Personal Engraving, Signature Sets

---

## 🏗️ Supabase Config (Just Added)

| File | Purpose |
|------|---------|
| `.env.local` | Contains `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` (populated!) |
| `src/lib/supabase/client.ts` | Browser client (for Client Components) |
| `src/lib/supabase/server.ts` | Server client (for Server Components & API Routes) |
| `src/lib/supabase/middleware.ts` | Session refresh helper |
| `src/middleware.ts` | Next.js middleware for auth session management |
| `~/.cursor/mcp.json` | Supabase MCP server configuration with access token |

> **Supabase Project:** `isiykgwvwggdqemguhhz` ("pvsameerpvs's Project") — Active, region: `ap-northeast-2`

---

## 📁 Complete File Structure

```
clt-perfume-frontend/
├── .env.local                          # Supabase credentials
├── src/
│   ├── app/
│   │   ├── layout.tsx                  # Root layout (Navbar + Footer + Chatbot + Toaster)
│   │   ├── page.tsx                    # Homepage
│   │   ├── globals.css                 # Global styles
│   │   ├── login/page.tsx              # Login page
│   │   ├── signup/page.tsx             # Signup page
│   │   ├── cart/page.tsx               # Shopping cart
│   │   ├── wishlist/page.tsx           # Wishlist
│   │   ├── collections/[slug]/page.tsx # Collection pages (mens/womens/deals)
│   │   ├── product/[slug]/page.tsx     # Product detail page
│   │   ├── offers/page.tsx             # Offers hub
│   │   ├── offers/[slug]/page.tsx      # Individual offer
│   │   ├── complimentary-samples/      # Free samples landing
│   │   ├── personal-engraving/         # Engraving landing
│   │   └── signature-sets/            # Sets landing
│   ├── components/
│   │   ├── navbar.tsx                  # Main navigation
│   │   ├── footer.tsx                  # Site footer
│   │   ├── hero.tsx                    # Hero carousel
│   │   ├── collections.tsx             # Collection cards
│   │   ├── featured-products.tsx       # Featured products
│   │   ├── brand-story.tsx             # Brand story section
│   │   ├── offer-cards.tsx             # Offer promotion cards
│   │   ├── pocket-friendly.tsx         # Budget section
│   │   ├── newsletter.tsx              # Newsletter signup
│   │   ├── chat-bot.tsx                # AI chatbot
│   │   ├── product-display.tsx         # Product detail component
│   │   ├── product/product-card.tsx    # Product card
│   │   ├── cart/cart-item.tsx           # Cart item
│   │   └── ui/                         # shadcn/ui components
│   ├── contexts/
│   │   ├── providers.tsx               # Combined providers
│   │   ├── cart-context.tsx            # Cart state (localStorage)
│   │   └── wishlist-context.tsx        # Wishlist state (localStorage)
│   └── lib/
│       ├── products.ts                 # Hardcoded product data (6 perfumes)
│       ├── utils.ts                    # Utility functions (cn)
│       └── supabase/                   # Supabase client utilities
│           ├── client.ts
│           ├── server.ts
│           └── middleware.ts
└── public/                             # Images & assets
```
