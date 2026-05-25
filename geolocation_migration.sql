-- SQL Migration to support Geolocation features
-- Run this in your Supabase SQL Editor.

-- 1. Rumah (Houses) Table
CREATE TABLE IF NOT EXISTS public.houses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_name TEXT NOT NULL,
  house_number TEXT NOT NULL,
  address TEXT NOT NULL,
  latitude NUMERIC(10,7),
  longitude NUMERIC(10,7),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);
ALTER TABLE public.houses ADD COLUMN IF NOT EXISTS latitude NUMERIC(10,7);
ALTER TABLE public.houses ADD COLUMN IF NOT EXISTS longitude NUMERIC(10,7);

-- 2. Kegiatan (Activities) Table
CREATE TABLE IF NOT EXISTS public.activities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  event_date DATE NOT NULL,
  latitude NUMERIC(10,7),
  longitude NUMERIC(10,7),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);
ALTER TABLE public.activities ADD COLUMN IF NOT EXISTS latitude NUMERIC(10,7);
ALTER TABLE public.activities ADD COLUMN IF NOT EXISTS longitude NUMERIC(10,7);

-- 3. Absensi (Attendance) Table
CREATE TABLE IF NOT EXISTS public.attendance (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  activity_id UUID REFERENCES public.activities(id) ON DELETE CASCADE,
  latitude NUMERIC(10,7),
  longitude NUMERIC(10,7),
  distance_meters NUMERIC(10,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  CONSTRAINT unique_attendance UNIQUE(profile_id, activity_id)
);
ALTER TABLE public.attendance ADD COLUMN IF NOT EXISTS latitude NUMERIC(10,7);
ALTER TABLE public.attendance ADD COLUMN IF NOT EXISTS longitude NUMERIC(10,7);
ALTER TABLE public.attendance ADD COLUMN IF NOT EXISTS distance_meters NUMERIC(10,2);

-- 4. Aduan Laporan (Reports) Table
CREATE TABLE IF NOT EXISTS public.reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  latitude NUMERIC(10,7),
  longitude NUMERIC(10,7),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS latitude NUMERIC(10,7);
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS longitude NUMERIC(10,7);


-- =============================================
-- SECURITY & ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================

ALTER TABLE public.houses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid conflict
DROP POLICY IF EXISTS "Allow authenticated read to houses" ON public.houses;
DROP POLICY IF EXISTS "Allow authenticated read to activities" ON public.activities;
DROP POLICY IF EXISTS "Allow authenticated read to attendance" ON public.attendance;
DROP POLICY IF EXISTS "Allow authenticated read to reports" ON public.reports;
DROP POLICY IF EXISTS "Allow staff to manage houses" ON public.houses;
DROP POLICY IF EXISTS "Allow staff to manage activities" ON public.activities;
DROP POLICY IF EXISTS "Allow citizens to submit attendance" ON public.attendance;
DROP POLICY IF EXISTS "Allow citizens to submit reports" ON public.reports;

-- Select Policies (All authenticated users can read)
CREATE POLICY "Allow authenticated read to houses" ON public.houses FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated read to activities" ON public.activities FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated read to attendance" ON public.attendance FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated read to reports" ON public.reports FOR SELECT USING (auth.role() = 'authenticated');

-- Insert/Update Policies
CREATE POLICY "Allow staff to manage houses" ON public.houses FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role IN ('rt', 'rw', 'admin', 'superadmin')
  )
);

CREATE POLICY "Allow staff to manage activities" ON public.activities FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role IN ('rt', 'rw', 'admin', 'superadmin')
  )
);

CREATE POLICY "Allow citizens to submit attendance" ON public.attendance FOR INSERT WITH CHECK (auth.uid() = profile_id);
CREATE POLICY "Allow citizens to submit reports" ON public.reports FOR INSERT WITH CHECK (auth.uid() = profile_id);
