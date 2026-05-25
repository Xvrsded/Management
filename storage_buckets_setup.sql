-- 1. Create Buckets if they don't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('attachments', 'attachments', true, 5242880, '{"image/png", "image/jpeg", "image/jpg"}'),
  ('payment-proofs', 'payment-proofs', true, 5242880, '{"image/png", "image/jpeg", "image/jpg"}'),
  ('letter-documents', 'letter-documents', true, 5242880, '{"application/pdf", "image/png", "image/jpeg", "image/jpg"}')
ON CONFLICT (id) DO UPDATE SET 
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 2. Setup RLS Policies for the buckets

-- Allow Public Access to view files (since public=true, this is standard)
CREATE POLICY "Public Access" 
ON storage.objects FOR SELECT 
USING (bucket_id IN ('attachments', 'payment-proofs', 'letter-documents'));

-- Allow Authenticated users to upload files
CREATE POLICY "Authenticated Upload" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id IN ('attachments', 'payment-proofs', 'letter-documents'));

-- Allow users to update their own files
CREATE POLICY "Owner Update" 
ON storage.objects FOR UPDATE 
TO authenticated 
USING (auth.uid() = owner AND bucket_id IN ('attachments', 'payment-proofs', 'letter-documents'));

-- Allow users to delete their own files
CREATE POLICY "Owner Delete" 
ON storage.objects FOR DELETE 
TO authenticated 
USING (auth.uid() = owner AND bucket_id IN ('attachments', 'payment-proofs', 'letter-documents'));
