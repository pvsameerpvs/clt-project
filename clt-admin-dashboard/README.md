# CLE Perfume Dashboard

Standalone admin dashboard app for CLE Perfume

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

## Admin Push Notifications

1. Set `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_VAPID_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`, and `WEBHOOK_SECRET` in the dashboard environment.
2. In Supabase SQL editor, run `admin-push-notifications.sql` after replacing the webhook secret placeholder with the same `WEBHOOK_SECRET`.
3. Open the live HTTPS dashboard on each device and click `Enable Order Alerts` once per browser/PWA install.

## Routes

- `/login`
- `/dashboard`
- `/dashboard/products`
- `/dashboard/orders`
- `/dashboard/customers`
- `/dashboard/settings`
