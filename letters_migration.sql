-- Database Setup Migration for Pengajuan Surat (Letter Request) Module
-- Run this in your Supabase SQL Editor to initialize the tables and storage.

-- 1. Create Citizen Profiles (Data Kependudukan Warga)
CREATE TABLE IF NOT EXISTS public.citizen_profiles (
  id UUID REFERENCES public.profiles(id) ON DELETE CASCADE PRIMARY KEY,
  nik TEXT NOT NULL UNIQUE,
  kk TEXT NOT NULL,
  phone TEXT,
  address TEXT NOT NULL,
  rt TEXT NOT NULL,
  rw TEXT NOT NULL,
  gender TEXT CHECK (gender IN ('L', 'P')),
  place_of_birth TEXT,
  date_of_birth DATE,
  religion TEXT,
  occupation TEXT,
  marital_status TEXT,
  nationality TEXT DEFAULT 'WNI',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 2. Create Letter Requests (Daftar Pengajuan Surat)
CREATE TABLE IF NOT EXISTS public.letter_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  letter_type TEXT NOT NULL CHECK (letter_type IN ('surat_pengantar', 'surat_keterangan_domisili', 'surat_keterangan_tidak_mampu', 'surat_keterangan_usaha')),
  purpose TEXT NOT NULL,
  custom_fields JSONB DEFAULT '{}'::jsonb,
  status TEXT CHECK (status IN ('pending_rt', 'approved_rt', 'approved_rw', 'finished', 'rejected')) DEFAULT 'pending_rt' NOT NULL,
  support_document_url TEXT,
  letter_number TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. Create Letter Approvals (Catatan Persetujuan/Penolakan RT/RW)
CREATE TABLE IF NOT EXISTS public.letter_approvals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  letter_request_id UUID REFERENCES public.letter_requests(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('rt', 'rw')),
  approver_id UUID REFERENCES public.profiles(id) NOT NULL,
  status TEXT CHECK (status IN ('approved', 'rejected')) NOT NULL,
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.citizen_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.letter_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.letter_approvals ENABLE ROW LEVEL SECURITY;

-- 4. Enable Row Level Security Policies

-- Citizen Profiles policies:
-- Users can manage (select/insert/update/delete) their own profiles
CREATE POLICY "Allow users to manage their own citizen profile" ON public.citizen_profiles
  FOR ALL USING (auth.uid() = id);

-- Staff (RT/RW/Admin) can read all citizen profiles
CREATE POLICY "Allow staff to view all citizen profiles" ON public.citizen_profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('rt', 'rw', 'admin', 'superadmin')
    )
  );

-- Letter Requests policies:
-- Citizens can select/insert their own letter requests
CREATE POLICY "Allow citizens to read their own letter requests" ON public.letter_requests
  FOR SELECT USING (auth.uid() = profile_id);

CREATE POLICY "Allow citizens to submit letter requests" ON public.letter_requests
  FOR INSERT WITH CHECK (auth.uid() = profile_id);

-- Staff can read and update all letter requests
CREATE POLICY "Allow staff to read all letter requests" ON public.letter_requests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('rt', 'rw', 'admin', 'superadmin')
    )
  );

CREATE POLICY "Allow staff to update letter requests" ON public.letter_requests
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('rt', 'rw', 'admin', 'superadmin')
    )
  );

-- Letter Approvals policies:
-- Citizens can view approvals for their own letters
CREATE POLICY "Allow citizens to view their letter approvals" ON public.letter_approvals
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.letter_requests
      WHERE id = letter_request_id AND profile_id = auth.uid()
    )
  );

-- Staff can select/insert letter approvals
CREATE POLICY "Allow staff to view all letter approvals" ON public.letter_approvals
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('rt', 'rw', 'admin', 'superadmin')
    )
  );

CREATE POLICY "Allow staff to insert letter approvals" ON public.letter_approvals
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('rt', 'rw', 'admin', 'superadmin')
    )
  );

-- 5. Storage Setup
-- Storage Bucket for letter supporting documents
INSERT INTO storage.buckets (id, name, public) 
VALUES ('letter-documents', 'letter-documents', true)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on storage objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Storage Policies
-- Warga can upload supporting documents under their own user ID folder
CREATE POLICY "Allow citizens to upload supporting documents" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'letter-documents' AND 
    (auth.uid()::text = (storage.foldername(name))[1])
  );

-- Warga can read their own uploaded documents
CREATE POLICY "Allow citizens to read their own supporting documents" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'letter-documents' AND 
    (auth.uid()::text = (storage.foldername(name))[1])
  );

-- RT/RW/Admin/Superadmin can read all uploaded documents
CREATE POLICY "Allow staff to view all supporting documents" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'letter-documents' AND
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('rt', 'rw', 'admin', 'superadmin')
    )
  );
