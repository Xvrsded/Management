-- Citizen Onboarding & Document Storage Migration
-- Adds verification fields to citizen_profiles and creates storage bucket for documents

-- 1. Add verification fields to citizen_profiles
ALTER TABLE public.citizen_profiles
ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
ADD COLUMN IF NOT EXISTS verification_notes TEXT,
ADD COLUMN IF NOT EXISTS documents JSONB DEFAULT '{}'::jsonb;

-- Create index for verification_status
CREATE INDEX IF NOT EXISTS idx_citizen_profiles_verification_status ON public.citizen_profiles(verification_status);

-- 2. Setup Storage Bucket for citizen documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'citizen-documents',
    'citizen-documents',
    false, -- Keep it private
    2097152, -- 2MB
    ARRAY['image/jpeg', 'image/png', 'image/webp']::text[]
) ON CONFLICT (id) DO UPDATE SET
    public = false,
    file_size_limit = 2097152,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp']::text[];

-- 3. Setup Storage RLS Policies
-- Enable RLS
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any to avoid conflicts
DROP POLICY IF EXISTS "Citizens can upload their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Citizens can view their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Admins can view all documents" ON storage.objects;

-- Policy: Citizens can upload their own documents (restricted by user id in path)
CREATE POLICY "Citizens can upload their own documents" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
    bucket_id = 'citizen-documents' AND
    auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Citizens can view their own documents
CREATE POLICY "Citizens can view their own documents" ON storage.objects
FOR SELECT TO authenticated
USING (
    bucket_id = 'citizen-documents' AND
    auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Admins, RT, and RW can view all documents
CREATE POLICY "Admins can view all documents" ON storage.objects
FOR SELECT TO authenticated
USING (
    bucket_id = 'citizen-documents' AND
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role IN ('admin', 'superadmin', 'rt', 'rw')
    )
);

-- Policy: Citizens can update their own documents
CREATE POLICY "Citizens can update their own documents" ON storage.objects
FOR UPDATE TO authenticated
USING (
    bucket_id = 'citizen-documents' AND
    auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Citizens can delete their own documents
CREATE POLICY "Citizens can delete their own documents" ON storage.objects
FOR DELETE TO authenticated
USING (
    bucket_id = 'citizen-documents' AND
    auth.uid()::text = (storage.foldername(name))[1]
);
