-- Storage Buckets Setup
-- Create storage buckets for file uploads

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Payment Proofs Bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('payment-proofs', 'payment-proofs', true)
ON CONFLICT (id) DO NOTHING;

-- Letter Documents Bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('letter-documents', 'letter-documents', true)
ON CONFLICT (id) DO NOTHING;

-- Signatures Bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('signatures', 'signatures', true)
ON CONFLICT (id) DO NOTHING;
