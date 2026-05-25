-- Database Setup Migration for Keuangan & Iuran Module
-- Run this in your Supabase SQL Editor to extend the schema.

-- 1. Create Payment Categories Table
CREATE TABLE IF NOT EXISTS public.payment_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  kategori TEXT NOT NULL CHECK (kategori IN ('bulanan', 'insidental', 'sukarela')),
  default_amount NUMERIC NOT NULL,
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.payment_categories ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Categories
CREATE POLICY "Allow anyone to read payment categories" ON public.payment_categories 
  FOR SELECT USING (true);

CREATE POLICY "Allow staff to manage payment categories" ON public.payment_categories 
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('rt', 'rw', 'admin', 'superadmin')
    )
  );

-- Seed realistic payment categories if empty
INSERT INTO public.payment_categories (name, kategori, default_amount)
VALUES 
  ('Iuran Kebersihan Bulanan', 'bulanan', 30000),
  ('Iuran Keamanan & Ronda', 'bulanan', 45000),
  ('Iuran Kas Sampah Lingkungan', 'bulanan', 15000),
  ('Kas Bakti Sosial Sukarela', 'sukarela', 20000),
  ('Iuran Insidental Perbaikan Gapura', 'insidental', 100000)
ON CONFLICT DO NOTHING;

-- 2. Create Payment Transactions Table (Midtrans/Xendit/Tripay Gateway Ready)
CREATE TABLE IF NOT EXISTS public.payment_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  payment_id UUID REFERENCES public.due_payments(id) ON DELETE CASCADE, -- Linked back to due_payments
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  transaction_code TEXT UNIQUE NOT NULL,
  amount NUMERIC NOT NULL,
  payment_method TEXT NOT NULL, -- 'manual_transfer', 'qris', 'midtrans_gopay', 'xendit_va'
  payment_status TEXT CHECK (payment_status IN ('pending', 'waiting_verification', 'verified', 'rejected', 'expired')) DEFAULT 'pending' NOT NULL,
  proof_url TEXT,
  paid_at TIMESTAMP WITH TIME ZONE,
  approved_by UUID REFERENCES public.profiles(id),
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Transactions
CREATE POLICY "Allow users to view their own transactions" ON public.payment_transactions 
  FOR SELECT USING (auth.uid() = profile_id);

CREATE POLICY "Allow users to insert their own transactions" ON public.payment_transactions 
  FOR INSERT WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "Allow staff to view all transactions" ON public.payment_transactions 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('rt', 'rw', 'admin', 'superadmin')
    )
  );

CREATE POLICY "Allow staff to update transaction states" ON public.payment_transactions 
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('rt', 'rw', 'admin', 'superadmin')
    )
  );
