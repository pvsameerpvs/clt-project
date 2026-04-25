-- RUN THIS IN SUPABASE SQL EDITOR TO REPAIR YOUR PRODUCTS TABLE
-- Some columns were missing from your previous table creation.

ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS scent TEXT,
ADD COLUMN IF NOT EXISTS top_notes TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS heart_notes TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS base_notes TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS rating DECIMAL(3,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS review_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_new BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_best_seller BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_exclusive BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS variant_group_id TEXT,
ADD COLUMN IF NOT EXISTS show_in_catalog BOOLEAN DEFAULT TRUE;

-- Also ensure categories table is ready
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='categories' AND column_name='image_url') THEN
        ALTER TABLE public.categories ADD COLUMN image_url TEXT;
    END IF;
END $$;

-- Enable parent/child category hierarchy for mega menu and subcategory filtering
ALTER TABLE public.categories
ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES public.categories(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON public.categories(parent_id);

-- Ensure promo codes and one-use-per-user redemption tracking are available
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

-- Ensure orders can store promo snapshots used by checkout flows
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS promo_code_id UUID REFERENCES public.promo_codes(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS promo_code TEXT,
ADD COLUMN IF NOT EXISTS promo_discount DECIMAL(10,2) DEFAULT 0;

UPDATE public.orders
SET promo_discount = 0
WHERE promo_discount IS NULL;

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

-- Refresh PostgREST schema cache (Supabase API)
NOTIFY pgrst, 'reload schema';
