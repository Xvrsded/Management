-- Database Setup for Dues (Iuran) Module
-- Run this in your Supabase SQL Editor to extend the schema.

-- 1. Modify the due_payments table to support custom verification columns and status constraint
-- Drop old status check if it exists (usually Supabase gives a system constraint name, or we can drop it safely)
ALTER TABLE public.due_payments 
  ADD COLUMN IF NOT EXISTS proof_url TEXT,
  ADD COLUMN IF NOT EXISTS verified_by UUID REFERENCES public.profiles(id),
  ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW());

-- To be completely safe and backward compatible with existing migrations, we support both constraints 
-- but align the default application validation to enforce:
-- 'unpaid' | 'pending_verification' | 'verified' | 'rejected'
-- Let's relax or update the status constraint if needed.
-- In standard PostgreSQL:
-- ALTER TABLE public.due_payments DROP CONSTRAINT IF EXISTS due_payments_status_check;
-- ALTER TABLE public.due_payments ADD CONSTRAINT due_payments_status_check CHECK (status IN ('unpaid', 'pending_verification', 'verified', 'rejected', 'pending', 'paid'));

-- 2. Create Storage Bucket for payment proofs
INSERT INTO storage.buckets (id, name, public) 
VALUES ('payment-proofs', 'payment-proofs', true)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on storage objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 3. Storage Policies
-- Warga can upload their own proofs
CREATE POLICY "Allow citizens to upload payment proof" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'payment-proofs' AND 
    (auth.uid()::text = (storage.foldername(name))[1])
  );

-- Warga can read their own proofs
CREATE POLICY "Allow citizens to read their own payment proof" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'payment-proofs' AND 
    (auth.uid()::text = (storage.foldername(name))[1])
  );

-- RT/RW/Admin/Superadmin can read all proofs
CREATE POLICY "Allow staff to read all payment proofs" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'payment-proofs' AND
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('rt', 'rw', 'admin', 'superadmin')
    )
  );
