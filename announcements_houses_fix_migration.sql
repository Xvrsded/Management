-- Fix announcements & houses tables + RLS (run in Supabase SQL Editor)

-- ---------------------------------------------------------------------------
-- 1. Tables
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.announcements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.houses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  owner_name TEXT NOT NULL,
  house_number TEXT NOT NULL,
  address TEXT NOT NULL,
  latitude NUMERIC(10, 7),
  longitude NUMERIC(10, 7),
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.houses ADD COLUMN IF NOT EXISTS profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.houses ADD COLUMN IF NOT EXISTS latitude NUMERIC(10, 7);
ALTER TABLE public.houses ADD COLUMN IF NOT EXISTS longitude NUMERIC(10, 7);

-- ---------------------------------------------------------------------------
-- 2. RLS
-- ---------------------------------------------------------------------------
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.houses ENABLE ROW LEVEL SECURITY;

-- Announcements: drop old policies
DROP POLICY IF EXISTS "Allow anyone to read announcements" ON public.announcements;
DROP POLICY IF EXISTS "Allow authenticated read announcements" ON public.announcements;
DROP POLICY IF EXISTS "Allow staff insert announcements" ON public.announcements;
DROP POLICY IF EXISTS "Allow staff manage announcements" ON public.announcements;

CREATE POLICY "Allow authenticated read announcements"
  ON public.announcements FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow staff insert announcements"
  ON public.announcements FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('rt', 'rw', 'admin', 'superadmin')
    )
  );

CREATE POLICY "Allow staff update announcements"
  ON public.announcements FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('rt', 'rw', 'admin', 'superadmin')
    )
  );

CREATE POLICY "Allow staff delete announcements"
  ON public.announcements FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('rt', 'rw', 'admin', 'superadmin')
    )
  );

-- Houses: drop old policies
DROP POLICY IF EXISTS "Allow authenticated read to houses" ON public.houses;
DROP POLICY IF EXISTS "Allow staff to manage houses" ON public.houses;
DROP POLICY IF EXISTS "Allow staff read all houses" ON public.houses;
DROP POLICY IF EXISTS "Allow staff manage houses" ON public.houses;
DROP POLICY IF EXISTS "Allow citizen read own house" ON public.houses;

CREATE POLICY "Allow staff read all houses"
  ON public.houses FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('rt', 'rw', 'admin', 'superadmin')
    )
  );

CREATE POLICY "Allow citizen read own house"
  ON public.houses FOR SELECT
  TO authenticated
  USING (profile_id = auth.uid());

CREATE POLICY "Allow staff manage houses"
  ON public.houses FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('rt', 'rw', 'admin', 'superadmin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('rt', 'rw', 'admin', 'superadmin')
    )
  );

-- Warga may link their own house row (optional self-registration)
CREATE POLICY "Allow citizen insert own house"
  ON public.houses FOR INSERT
  TO authenticated
  WITH CHECK (profile_id = auth.uid());
