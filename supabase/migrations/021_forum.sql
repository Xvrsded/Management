-- Migration: Forum Warga
-- Description: Adds avatar_url to profiles and creates forum_posts table

-- 1. Add avatar_url to profiles if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema='public' AND table_name='profiles' AND column_name='avatar_url') THEN
        ALTER TABLE public.profiles ADD COLUMN avatar_url TEXT;
    END IF;
END $$;

-- 2. Create forum_posts table
CREATE TABLE IF NOT EXISTS public.forum_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_forum_posts_profile_id ON public.forum_posts(profile_id);
CREATE INDEX IF NOT EXISTS idx_forum_posts_created_at ON public.forum_posts(created_at DESC);

-- 3. Apply updated_at trigger
DROP TRIGGER IF EXISTS set_forum_posts_updated_at ON public.forum_posts;
CREATE TRIGGER set_forum_posts_updated_at
  BEFORE UPDATE ON public.forum_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- 4. Setup RLS
ALTER TABLE public.forum_posts ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone authenticated can view posts
DROP POLICY IF EXISTS "Anyone can view forum posts" ON public.forum_posts;
CREATE POLICY "Anyone can view forum posts"
ON public.forum_posts FOR SELECT
TO authenticated
USING (true);

-- Policy: Authenticated users can insert their own posts
DROP POLICY IF EXISTS "Users can insert own forum posts" ON public.forum_posts;
CREATE POLICY "Users can insert own forum posts"
ON public.forum_posts FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = profile_id);

-- Policy: Users can update their own posts
DROP POLICY IF EXISTS "Users can update own forum posts" ON public.forum_posts;
CREATE POLICY "Users can update own forum posts"
ON public.forum_posts FOR UPDATE
TO authenticated
USING (auth.uid() = profile_id)
WITH CHECK (auth.uid() = profile_id);

-- Policy: Users can delete their own posts
DROP POLICY IF EXISTS "Users can delete own forum posts" ON public.forum_posts;
CREATE POLICY "Users can delete own forum posts"
ON public.forum_posts FOR DELETE
TO authenticated
USING (auth.uid() = profile_id);
