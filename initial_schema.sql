-- CLT Perfume Platform - Initial Database Schema
-- Paste this into your Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql)

-- 1. PROFILES (Extends Supabase Auth)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, now()) NOT NULL
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 2. CATEGORIES
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  parent_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  description TEXT,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON public.categories(parent_id);

-- 3. PRODUCTS
CREATE TABLE IF NOT EXISTS public.products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID REFERENCES public.categories(id),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  stock_quantity INTEGER DEFAULT 0,
  images TEXT[] DEFAULT '{}',
  scent TEXT, -- Legacy / simplified categorization
  olfactive_family TEXT,
  olfactive_signature TEXT,
  concentration TEXT,
  mood_use TEXT,
  ml TEXT,
  top_notes TEXT[] DEFAULT '{}',
  heart_notes TEXT[] DEFAULT '{}',
  base_notes TEXT[] DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  rating DECIMAL(3,2) DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  is_new BOOLEAN DEFAULT FALSE,
  is_best_seller BOOLEAN DEFAULT FALSE,
  is_exclusive BOOLEAN DEFAULT FALSE,
  is_featured BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  variant_group_id TEXT,
  show_in_catalog BOOLEAN DEFAULT TRUE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);


-- 4. NEWSLETTER
CREATE TABLE IF NOT EXISTS public.newsletter_subs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. PROMO CODES
CREATE TABLE IF NOT EXISTS public.promo_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL,
  discount_type TEXT NOT NULL DEFAULT 'percentage' CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value DECIMAL(10,2) NOT NULL DEFAULT 0,
  active BOOLEAN DEFAULT TRUE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_promo_codes_code_upper ON public.promo_codes (UPPER(code));

-- 6. CART ITEMS
CREATE TABLE IF NOT EXISTS public.cart_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  quantity INTEGER DEFAULT 1 CHECK (quantity > 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

-- 7. ORDERS
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id),
  order_number TEXT UNIQUE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded')),
  subtotal DECIMAL(10,2) NOT NULL,
  promo_code_id UUID REFERENCES public.promo_codes(id) ON DELETE SET NULL,
  promo_code TEXT,
  promo_discount DECIMAL(10,2) DEFAULT 0,
  tax DECIMAL(10,2) DEFAULT 0,
  shipping_fee DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL,
  payment_method TEXT DEFAULT 'card',
  payment_intent_id TEXT,
  stripe_session_id TEXT,
  shipping_address JSONB,
  shipped_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. ORDER ITEMS
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  product_image TEXT,
  product_slug TEXT,
  price DECIMAL(10,2) NOT NULL,
  quantity INTEGER NOT NULL
);

-- 9. PROMO CODE REDEMPTIONS
CREATE TABLE IF NOT EXISTS public.promo_code_redemptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  promo_code_id UUID REFERENCES public.promo_codes(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'redeemed' CHECK (status IN ('reserved', 'redeemed', 'released')),
  reserved_at TIMESTAMP WITH TIME ZONE,
  redeemed_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(promo_code_id, user_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_promo_code_redemptions_order_id
  ON public.promo_code_redemptions(order_id)
  WHERE order_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_promo_code_redemptions_user_id ON public.promo_code_redemptions(user_id);
CREATE INDEX IF NOT EXISTS idx_promo_code_redemptions_promo_code_id ON public.promo_code_redemptions(promo_code_id);

-- 10. FUNCTIONS & TRIGGERS

-- Function to decrement stock
CREATE OR REPLACE FUNCTION decrement_stock(p_product_id UUID, p_quantity INT)
RETURNS VOID AS $$
BEGIN
  UPDATE public.products
  SET stock_quantity = stock_quantity - p_quantity
  WHERE id = p_product_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to atomically reserve or redeem a one-use promo code.
CREATE OR REPLACE FUNCTION public.claim_promo_code_redemption(
  p_promo_code_id UUID,
  p_user_id UUID,
  p_order_id UUID,
  p_status TEXT,
  p_expires_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_now TIMESTAMP WITH TIME ZONE := NOW();
  v_rows INTEGER := 0;
BEGIN
  IF p_status NOT IN ('reserved', 'redeemed') THEN
    RAISE EXCEPTION 'Invalid promo redemption status: %', p_status;
  END IF;

  INSERT INTO public.promo_code_redemptions (
    promo_code_id,
    user_id,
    order_id,
    status,
    reserved_at,
    redeemed_at,
    expires_at,
    created_at,
    updated_at
  )
  VALUES (
    p_promo_code_id,
    p_user_id,
    p_order_id,
    p_status,
    CASE WHEN p_status = 'reserved' THEN v_now ELSE NULL END,
    CASE WHEN p_status = 'redeemed' THEN v_now ELSE NULL END,
    p_expires_at,
    v_now,
    v_now
  )
  ON CONFLICT (promo_code_id, user_id)
  DO UPDATE SET
    order_id = EXCLUDED.order_id,
    status = EXCLUDED.status,
    reserved_at = CASE WHEN EXCLUDED.status = 'reserved' THEN v_now ELSE public.promo_code_redemptions.reserved_at END,
    redeemed_at = CASE WHEN EXCLUDED.status = 'redeemed' THEN v_now ELSE public.promo_code_redemptions.redeemed_at END,
    expires_at = EXCLUDED.expires_at,
    updated_at = v_now
  WHERE (
      public.promo_code_redemptions.status = 'redeemed'
      AND public.promo_code_redemptions.order_id = p_order_id
      AND EXCLUDED.status = 'redeemed'
    )
    OR (
      public.promo_code_redemptions.status <> 'redeemed'
      AND (
        public.promo_code_redemptions.status <> 'reserved'
        OR public.promo_code_redemptions.expires_at <= v_now
        OR public.promo_code_redemptions.order_id = p_order_id
      )
    );

  GET DIAGNOSTICS v_rows = ROW_COUNT;
  RETURN v_rows > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_first_name TEXT;
  v_last_name TEXT;
  v_full_name TEXT;
BEGIN
  v_first_name := new.raw_user_meta_data->>'first_name';
  v_last_name := new.raw_user_meta_data->>'last_name';
  v_full_name := new.raw_user_meta_data->>'full_name';

  -- If Google provides full_name but not split names
  IF v_first_name IS NULL AND v_full_name IS NOT NULL THEN
    v_first_name := split_part(v_full_name, ' ', 1);
    v_last_name := substring(v_full_name from position(' ' in v_full_name) + 1);
  END IF;

  INSERT INTO public.profiles (id, first_name, last_name, avatar_url)
  VALUES (
    new.id, 
    COALESCE(v_first_name, ''), 
    COALESCE(v_last_name, ''), 
    COALESCE(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
