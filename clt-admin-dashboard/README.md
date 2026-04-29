# CLE Perfume Dashboard

Standalone admin dashboard app for CLE Perfumes.

## Run

1. Install deps:
   npm install
2. Copy env file:
   cp .env.example .env.local
3. Start app:
   npm run dev

Production dashboard runs on `https://admin.cleparfum.com`.

## Required Connection

- Backend API (`clt-perfume-backend`) should be reachable at `https://api.cleparfum.com`.
- Set `NEXT_PUBLIC_API_URL=https://api.cleparfum.com` in Vercel production env.
- Set `NEXT_PUBLIC_STOREFRONT_URL=https://cleparfum.com` in Vercel production env.
- Login with an account that has `profiles.role = 'admin'`.

## Routes

- `/login`
- `/dashboard`
- `/dashboard/products`
- `/dashboard/orders`
- `/dashboard/customers`
- `/dashboard/settings`
