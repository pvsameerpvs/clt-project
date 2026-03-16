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
ADD COLUMN IF NOT EXISTS is_exclusive BOOLEAN DEFAULT FALSE;

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

-- Refresh PostgREST schema cache (Supabase API)
NOTIFY pgrst, 'reload schema';
