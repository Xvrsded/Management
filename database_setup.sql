-- SQL Migration/Setup Guide for RT/RW Management App Database
-- Run this in your Supabase SQL Editor.

-- 1. Create a Profiles table in public schema
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('warga', 'rt', 'rw', 'admin', 'superadmin')) DEFAULT 'warga',
  full_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for Profiles
CREATE POLICY "Allow public read access to profiles" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Allow users to update their own profiles" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- 2. Syncing Trigger: Automatically sync auth.users to public.profiles on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role, full_name)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'role', 'warga'),
    COALESCE(new.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- 3. Additional Mock Tables structure matching existing RT/RW tables for the dashboard data
-- If these tables already exist, ensure they match this schema structure:

-- Announcements Table
CREATE TABLE IF NOT EXISTS public.announcements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Due Payments (Dues) Table
CREATE TABLE IF NOT EXISTS public.due_payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID REFERENCES public.profiles(id),
  title TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  due_date DATE NOT NULL,
  status TEXT CHECK (status IN ('unpaid', 'pending', 'paid')) DEFAULT 'unpaid',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID REFERENCES public.profiles(id),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS for all newly created tables
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.due_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Generic RLS policies
CREATE POLICY "Allow anyone to read announcements" ON public.announcements FOR SELECT USING (true);
CREATE POLICY "Allow users to read their own payments" ON public.due_payments FOR SELECT USING (auth.uid() = profile_id);
CREATE POLICY "Allow users to read their own notifications" ON public.notifications FOR SELECT USING (auth.uid() = profile_id);
