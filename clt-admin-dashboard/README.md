# CLT Admin Dashboard

Standalone admin dashboard app for CLE Perfumes.

## Run

1. Install deps:
   npm install
2. Copy env file:
   cp .env.example .env.local
3. Start app:
   npm run dev

Dashboard runs on `http://localhost:3001`.

## Required Connection

- Backend API (`clt-perfume-backend`) should run on `http://localhost:4000`.
- Set `NEXT_PUBLIC_API_URL=http://localhost:4000` in `.env.local`.
- Login with an account that has `profiles.role = 'admin'`.

## Routes

- `/login`
- `/dashboard`
- `/dashboard/products`
- `/dashboard/orders`
- `/dashboard/customers`
- `/dashboard/settings`
