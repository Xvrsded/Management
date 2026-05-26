-- Migration: Forum Images
-- Description: Creates forum-images bucket and adds image_urls to forum_posts

-- 1. Create forum-images Storage Bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('forum-images', 'forum-images', true)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on storage.objects if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Storage RLS: Anyone can view
CREATE POLICY "Public Access forum-images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'forum-images');

-- Storage RLS: Authenticated users can insert
CREATE POLICY "Auth Users Insert forum-images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'forum-images');

-- Storage RLS: Authenticated users can update own images
CREATE POLICY "Users Update Own forum-images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'forum-images' AND auth.uid() = owner);

-- Storage RLS: Authenticated users can delete own images
CREATE POLICY "Users Delete Own forum-images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'forum-images' AND auth.uid() = owner);

-- 2. Add image_urls to forum_posts
ALTER TABLE public.forum_posts 
  ADD COLUMN IF NOT EXISTS image_urls TEXT[] DEFAULT '{}';
