-- Add site_settings table for dynamic content control
CREATE TABLE IF NOT EXISTS public.site_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  hero_slides JSONB DEFAULT '[]',
  ticker_text TEXT,
  pocket_friendly_configs JSONB DEFAULT '[49, 99, 149, 199, 299]',
  collections JSONB DEFAULT '[]',
  brand_story JSONB DEFAULT '{}',
  offers JSONB DEFAULT '[]',
  navigation JSONB DEFAULT '{}',
  global_store_info JSONB DEFAULT '{}',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Allow public to view
CREATE POLICY "Public can view settings" ON public.site_settings
  FOR SELECT USING (true);

-- Only admins can edit
CREATE POLICY "Admins can update settings" ON public.site_settings
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );
