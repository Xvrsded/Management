-- Migration: Forum Likes and Comments

CREATE TABLE IF NOT EXISTS public.forum_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.forum_posts(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(post_id, profile_id)
);

CREATE TABLE IF NOT EXISTS public.forum_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.forum_posts(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- RLS forum_likes
ALTER TABLE public.forum_likes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view forum likes" ON public.forum_likes;
CREATE POLICY "Anyone can view forum likes" ON public.forum_likes FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Users can insert own likes" ON public.forum_likes;
CREATE POLICY "Users can insert own likes" ON public.forum_likes FOR INSERT TO authenticated WITH CHECK (auth.uid() = profile_id);
DROP POLICY IF EXISTS "Users can delete own likes" ON public.forum_likes;
CREATE POLICY "Users can delete own likes" ON public.forum_likes FOR DELETE TO authenticated USING (auth.uid() = profile_id);

-- RLS forum_comments
ALTER TABLE public.forum_comments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view forum comments" ON public.forum_comments;
CREATE POLICY "Anyone can view forum comments" ON public.forum_comments FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Users can insert own comments" ON public.forum_comments;
CREATE POLICY "Users can insert own comments" ON public.forum_comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = profile_id);
DROP POLICY IF EXISTS "Users can delete own comments" ON public.forum_comments;
CREATE POLICY "Users can delete own comments" ON public.forum_comments FOR DELETE TO authenticated USING (auth.uid() = profile_id);
