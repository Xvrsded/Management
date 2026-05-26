-- Migration: UMKM V2 (Storage and Schema update)

-- 1. Create umkm-products Storage Bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('umkm-products', 'umkm-products', true)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on storage.objects if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Storage RLS: Anyone can view
CREATE POLICY "Public Access umkm-products"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'umkm-products');

-- Storage RLS: Authenticated users can insert
CREATE POLICY "Auth Users Insert umkm-products"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'umkm-products');

-- Storage RLS: Authenticated users can update own images
CREATE POLICY "Users Update Own umkm-products"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'umkm-products' AND auth.uid() = owner);

-- Storage RLS: Authenticated users can delete own images
CREATE POLICY "Users Delete Own umkm-products"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'umkm-products' AND auth.uid() = owner);

-- 2. Update umkm_products table schema
ALTER TABLE public.umkm_products 
  DROP COLUMN IF EXISTS image_url,
  ADD COLUMN IF NOT EXISTS foto_urls TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS link_url TEXT;
