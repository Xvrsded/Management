-- Migration: UMKM Products
-- Description: Creates umkm_products table for citizens to sell items

CREATE TABLE IF NOT EXISTS public.umkm_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  price NUMERIC NOT NULL DEFAULT 0,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_umkm_products_profile_id ON public.umkm_products(profile_id);

-- Apply updated_at trigger
DROP TRIGGER IF EXISTS set_umkm_products_updated_at ON public.umkm_products;
CREATE TRIGGER set_umkm_products_updated_at
  BEFORE UPDATE ON public.umkm_products
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- Setup RLS
ALTER TABLE public.umkm_products ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone authenticated can view products
DROP POLICY IF EXISTS "Anyone can view UMKM products" ON public.umkm_products;
CREATE POLICY "Anyone can view UMKM products"
ON public.umkm_products FOR SELECT
TO authenticated
USING (true);

-- Policy: Authenticated users can insert their own products
DROP POLICY IF EXISTS "Users can insert own UMKM products" ON public.umkm_products;
CREATE POLICY "Users can insert own UMKM products"
ON public.umkm_products FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = profile_id);

-- Policy: Users can update their own products
DROP POLICY IF EXISTS "Users can update own UMKM products" ON public.umkm_products;
CREATE POLICY "Users can update own UMKM products"
ON public.umkm_products FOR UPDATE
TO authenticated
USING (auth.uid() = profile_id)
WITH CHECK (auth.uid() = profile_id);

-- Policy: Users can delete their own products
DROP POLICY IF EXISTS "Users can delete own UMKM products" ON public.umkm_products;
CREATE POLICY "Users can delete own UMKM products"
ON public.umkm_products FOR DELETE
TO authenticated
USING (auth.uid() = profile_id);
