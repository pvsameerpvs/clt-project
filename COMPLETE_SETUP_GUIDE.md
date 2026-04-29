# 🚀 CLT Perfume Platform: Complete A-Z Setup Guide

Welcome! This guide will take you from a blank database to a fully functioning luxury perfume shop. Follow these steps in order.

---

## 🏗️ Phase 1: Supabase (The Database)
Supabase is the heart of your project. It stores your perfumes, users, and orders.

### 1. Run the Database Script
*   Log in to [Supabase](https://supabase.com).
*   Open your project.
*   Click the **SQL Editor** icon (`>_`) in the left sidebar.
*   Click **+ New Query**.
*   **Action**: Copy everything from the file [initial_schema.sql](file:///home/pvsameerpvs/Projects/JustSearch/clt-project/initial_schema.sql) and paste it into the editor.
*   Click **Run**.
*   *Result: You now have tables for Products, Orders, Categories, and Profiles.*

### 2. Get your Project Keys
*   Go to **Project Settings** (gear icon) -> **API**.
*   Copy the **Project URL** and the **anon (public)** key.
*   **Action**: Paste these into your `.env.local` files (see Phase 4).

---

## 🔐 Phase 2: Authentication (Google Sign-In)
To let customers log in with Google, you need to connect Google to Supabase.

### 1. Google Cloud Console
*   Go to [Google Cloud Console](https://console.cloud.google.com/).
*   **Create a new project** named "CLT Perfume".
*   Go to **Google Auth Platform** -> **Branding**. Set the app name to `CLE Parfum`, add your support email, homepage (`https://cleparfum.com`), privacy policy, and terms URL.
*   Add `cleparfum.com` under **Authorized domains**.
*   Submit/publish the branding verification if Google asks for it. Until this is verified, Google can show the domain instead of the app name.
*   Go to **Audience** and set it up as **External** if customers will sign in with normal Google accounts.
*   Go to **Credentials** -> **Create Credentials** -> **OAuth client ID**.
*   Choose **Web application**.
*   **Crucial Step**: In "Authorized redirect URIs", paste the URL provided by Supabase (found in Supabase under Authentication -> Providers -> Google).
*   **Action**: Copy your **Client ID** and **Client Secret**.

### 2. Enable in Supabase
*   In Supabase, go to **Authentication** -> **Providers**.
*   Select **Google**.
*   **Action**: Paste your Google Client ID and Secret and click **Save**.

### 3. Supabase URL Configuration
On the Free plan, keep using your Supabase project URL. Google may show the Supabase domain during sign-in until the project is upgraded later.

*   In Supabase -> **Authentication** -> **URL Configuration**, set **Site URL** to `https://cleparfum.com`.
*   Add redirect URLs:
    *   `https://cleparfum.com/auth/callback`
    *   `https://admin.cleparfum.com/auth/callback`
*   In Google Cloud -> **Credentials** -> your OAuth client, keep the Supabase callback URL from Supabase:
    *   `https://isiykgwvwggdqemguhhz.supabase.co/auth/v1/callback`

---

## 💳 Phase 3: Stripe (Payments)
Stripe handles your money and VIP customer payments.

### 1. Get API Keys
*   Log in to [Stripe](https://dashboard.stripe.com/test/apikeys).
*   **Action**: Copy your **Secret key** (starts with `sk_test_`).

### 2. Set up the Webhook (Very Important)
*   Go to **Developers** -> **Webhooks**.
*   Click **Add endpoint**.
*   Endpoint URL: `https://api.cleparfum.com/api/webhooks/stripe`.
*   Select event: `checkout.session.completed`.
*   **Action**: Copy the **Signing secret** (starts with `whsec_`) and save it for the Backend `.env`.

---

## ⚙️ Phase 4: Environment Configuration
Use one production domain map everywhere:

*   Storefront: `https://cleparfum.com`
*   Admin dashboard: `https://admin.cleparfum.com`
*   Backend API: `https://api.cleparfum.com`

### 1. Backend (`/clt-perfume-backend/.env`)
Open this file and update these lines:
```env
SUPABASE_URL= (Your Supabase URL)
SUPABASE_SERVICE_ROLE_KEY= (Your Supabase Service Role Key)
STRIPE_SECRET_KEY= (Your Stripe Secret Key)
STRIPE_WEBHOOK_SECRET= (Your Stripe Webhook Secret)
FRONTEND_URL=https://cleparfum.com
FRONTEND_URLS=https://cleparfum.com,https://admin.cleparfum.com
```

### 2. Frontend & Admin Dashboard
Set these in Vercel Project Settings -> Environment Variables for the storefront:

```env
NEXT_PUBLIC_SUPABASE_URL=https://isiykgwvwggdqemguhhz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
NEXT_PUBLIC_SITE_URL=https://cleparfum.com
NEXT_PUBLIC_ADMIN_URL=https://admin.cleparfum.com
NEXT_PUBLIC_API_URL=https://api.cleparfum.com
```

Set these in Vercel Project Settings -> Environment Variables for the admin dashboard:

```env
NEXT_PUBLIC_SUPABASE_URL=https://isiykgwvwggdqemguhhz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
NEXT_PUBLIC_SITE_URL=https://admin.cleparfum.com
NEXT_PUBLIC_ADMIN_URL=https://admin.cleparfum.com
NEXT_PUBLIC_STOREFRONT_URL=https://cleparfum.com
NEXT_PUBLIC_API_URL=https://api.cleparfum.com
```

---

## 🏁 Phase 5: Starting the Project
Open your terminal and run these commands:

1.  **Backend**: `cd clt-perfume-backend && npm run dev`
2.  **Frontend**: `cd clt-perfume-frontend && npm run dev`
3.  **Admin Dashboard**: `cd clt-admin-dashboard && npm run dev`

---

## 🏆 Final Step: Make yourself an Admin
1.  Go to your website and **Sign up** using your email or Google.
2.  Go to your **Supabase Dashboard** -> **Table Editor** -> `profiles`.
3.  Find your user and change the **`role`** from `customer` to `admin`.
4.  **Action**: Refresh your website. You will now see the "Admin Panel" link in the navbar!

---

### **Need Help?**
If you see an error on any step, just copy and paste the error message to me, and I will fix it for you immediately!
