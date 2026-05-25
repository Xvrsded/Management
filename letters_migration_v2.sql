-- Database Setup Migration for Upgraded Layanan Surat Warga (Citizen Letters Module)
-- Run this in your Supabase SQL Editor to initialize/upgrade the tables and storage policies.

-- 1. Alter public.profiles to support digital signatures for RT/RW admins
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS signature_url TEXT;

-- 2. Create Letter Categories (Master Jenis Surat)
CREATE TABLE IF NOT EXISTS public.letter_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  form_fields JSONB DEFAULT '[]'::jsonb, -- Configures input fields dynamically (label, type, name, placeholder, required)
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS on Categories
ALTER TABLE public.letter_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to active letter categories" ON public.letter_categories
  FOR SELECT USING (is_active = true);

CREATE POLICY "Allow admin to manage letter categories" ON public.letter_categories
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'superadmin')
    )
  );

-- Seed Default Letter Categories (11 Master Types with rich, dynamic form field specs)
INSERT INTO public.letter_categories (name, code, description, form_fields) VALUES
(
  'Surat Pengantar RT/RW', 
  'surat_pengantar', 
  'Surat resmi pengantar dari RT/RW setempat untuk kelengkapan administrasi kelurahan/kecamatan.',
  '[
    {"name": "keterangan", "label": "Keterangan Tambahan (Opsional)", "type": "text", "placeholder": "Contoh: Domisili tetap sejak lahir...", "required": false}
  ]'::jsonb
),
(
  'Surat Keterangan Domisili', 
  'surat_domisili', 
  'Keterangan resmi domisili bertempat tinggal di wilayah RT/RW setempat.',
  '[
    {"name": "alamat_tetap", "label": "Alamat Tetap Di Domisili", "type": "text", "placeholder": "Contoh: Jl. Kebon Jeruk No. 24", "required": true},
    {"name": "lama_tinggal", "label": "Lama Tinggal (Tahun/Bulan)", "type": "text", "placeholder": "Contoh: 3 Tahun...", "required": true}
  ]'::jsonb
),
(
  'Surat Keterangan Usaha', 
  'surat_usaha', 
  'Keterangan kepemilikan usaha mikro/kecil/menengah (UMKM) aktif di domisili.',
  '[
    {"name": "nama_usaha", "label": "Nama Usaha Mikro", "type": "text", "placeholder": "Contoh: Warung Kelontong Berkah", "required": true},
    {"name": "jenis_usaha", "label": "Jenis Bidang Usaha", "type": "text", "placeholder": "Contoh: Perdagangan Sembako", "required": true},
    {"name": "alamat_usaha", "label": "Alamat Lokasi Usaha", "type": "text", "placeholder": "Contoh: Jl. Raya Kebon Jeruk No. 12", "required": true}
  ]'::jsonb
),
(
  'Surat Keterangan Tidak Mampu', 
  'surat_tidak_mampu', 
  'Surat Keterangan Tidak Mampu (SKTM) untuk kebutuhan keringanan sekolah, kesehatan, dll.',
  '[
    {"name": "nama_rumah_sakit", "label": "Nama Sekolah / Rumah Sakit Tujuan", "type": "text", "placeholder": "Contoh: RSUD Koja / SMA Negeri 1", "required": true},
    {"name": "nama_pasien", "label": "Nama Pasien / Siswa Terkait", "type": "text", "placeholder": "Contoh: Budi Santoso (Anak Kandung)", "required": true}
  ]'::jsonb
),
(
  'Surat Keterangan Tinggal', 
  'surat_keterangan_tinggal', 
  'Keterangan izin menetap sementara bagi warga pendatang.',
  '[
    {"name": "alamat_asal", "label": "Alamat Asal KTP", "type": "text", "placeholder": "Contoh: Jl. Diponegoro No. 10, Solo", "required": true},
    {"name": "tujuan_tinggal", "label": "Maksud Menetap Sementara", "type": "text", "placeholder": "Contoh: Bekerja kontrak proyek...", "required": true}
  ]'::jsonb
),
(
  'Surat Keterangan Kelahiran', 
  'surat_kelahiran', 
  'Pengantar kelengkapan pembuatan Akta Kelahiran anak baru.',
  '[
    {"name": "nama_bayi", "label": "Nama Lengkap Bayi", "type": "text", "placeholder": "Contoh: Muhammad Rezky", "required": true},
    {"name": "tanggal_lahir_bayi", "label": "Tanggal Lahir Bayi", "type": "date", "placeholder": "", "required": true},
    {"name": "nama_ayah", "label": "Nama Lengkap Ayah Kandung", "type": "text", "placeholder": "Contoh: Budi Santoso", "required": true},
    {"name": "nama_ibu", "label": "Nama Lengkap Ibu Kandung", "type": "text", "placeholder": "Contoh: Siti Aminah", "required": true}
  ]'::jsonb
),
(
  'Surat Keterangan Kematian', 
  'surat_kematian', 
  'Surat pengantar pelaporan warga wafat.',
  '[
    {"name": "nama_mendiang", "label": "Nama Lengkap Mendiang Warga", "type": "text", "placeholder": "Contoh: Alm. Suherman", "required": true},
    {"name": "tanggal_wafat", "label": "Tanggal Wafat", "type": "date", "placeholder": "", "required": true},
    {"name": "penyebab_wafat", "label": "Penyebab Wafat (Opsional)", "type": "text", "placeholder": "Contoh: Sakit usia lanjut...", "required": false}
  ]'::jsonb
),
(
  'Surat Izin Acara', 
  'surat_izin_acara', 
  'Pengantar permohonan izin menyelenggarakan acara keramaian di lingkungan RT/RW.',
  '[
    {"name": "nama_acara", "label": "Nama / Jenis Acara", "type": "text", "placeholder": "Contoh: Syukuran Pernikahan Warga", "required": true},
    {"name": "tanggal_acara", "label": "Tanggal Pelaksanaan Acara", "type": "date", "placeholder": "", "required": true},
    {"name": "lokasi_acara", "label": "Lokasi Spesifik Pelaksanaan", "type": "text", "placeholder": "Contoh: Lapangan Serbaguna RT 03", "required": true}
  ]'::jsonb
),
(
  'Surat Pengantar Nikah', 
  'surat_pengantar_nikah', 
  'Surat pengantar resmi (Model N1-N4) untuk pendaftaran di KUA kelurahan.',
  '[
    {"name": "nama_pasangan", "label": "Nama Lengkap Calon Pasangan", "type": "text", "placeholder": "Contoh: Diah Lestari", "required": true},
    {"name": "nik_pasangan", "label": "NIK Calon Pasangan (Jika ada)", "type": "text", "placeholder": "Contoh: 327301XXXXXXXXXX", "required": false},
    {"name": "tanggal_pernikahan", "label": "Estimasi Tanggal Akad Pernikahan", "type": "date", "placeholder": "", "required": true}
  ]'::jsonb
),
(
  'Surat Keterangan Pindah', 
  'surat_pindah', 
  'Pengantar perpindahan alamat domisili resmi keluar dari wilayah RT/RW.',
  '[
    {"name": "alamat_tujuan", "label": "Alamat Lengkap Tujuan Pindah", "type": "text", "placeholder": "Contoh: Perum Griya Indah Blok C No. 4, Depok", "required": true},
    {"name": "alasan_pindah", "label": "Alasan Pindah Domisili", "type": "text", "placeholder": "Contoh: Mengikuti penempatan kerja baru...", "required": true},
    {"name": "jumlah_pengikut", "label": "Jumlah Anggota Keluarga Pengikut Pindah", "type": "number", "placeholder": "Contoh: 2", "required": true}
  ]'::jsonb
),
(
  'Custom Surat', 
  'custom_surat', 
  'Pilih tipe ini untuk kebutuhan pengajuan surat lain yang tidak terdaftar di atas.',
  '[
    {"name": "deskripsi_kebutuhan", "label": "Deskripsi Lengkap Kebutuhan Surat Anda", "type": "text", "placeholder": "Jelaskan isi surat pengantar yang Anda butuhkan...", "required": true}
  ]'::jsonb
)
ON CONFLICT (code) DO UPDATE 
SET name = EXCLUDED.name, description = EXCLUDED.description, form_fields = EXCLUDED.form_fields;

-- 3. Upgrade public.letter_requests Table to V2 Relational Schema
-- Safely add new columns if they do not exist
ALTER TABLE public.letter_requests ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES public.letter_categories(id) ON DELETE SET NULL;
ALTER TABLE public.letter_requests ADD COLUMN IF NOT EXISTS request_code TEXT UNIQUE;
ALTER TABLE public.letter_requests ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE public.letter_requests ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES public.profiles(id);
ALTER TABLE public.letter_requests ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.letter_requests ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW());
ALTER TABLE public.letter_requests ADD COLUMN IF NOT EXISTS processed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.letter_requests ADD COLUMN IF NOT EXISTS pdf_url TEXT;
ALTER TABLE public.letter_requests ADD COLUMN IF NOT EXISTS qr_token TEXT UNIQUE;

-- Modify constraint CHECK for status to include 'draft' state
ALTER TABLE public.letter_requests DROP CONSTRAINT IF EXISTS letter_requests_status_check;
ALTER TABLE public.letter_requests ADD CONSTRAINT letter_requests_status_check 
  CHECK (status IN ('draft', 'pending_rt', 'approved_rt', 'finished', 'rejected'));

-- Update existing requests to link back to categories by matching letter_type (code)
UPDATE public.letter_requests r
SET category_id = c.id
FROM public.letter_categories c
WHERE r.letter_type = c.code AND r.category_id IS NULL;

-- Automatically generate default request codes and qr_tokens for existing historical data
UPDATE public.letter_requests
SET 
  request_code = COALESCE(request_code, 'SR-' || TO_CHAR(created_at, 'YYMM') || '-' || SUBSTR(id::text, 1, 4)),
  qr_token = COALESCE(qr_token, encode(digest(id::text || gen_random_uuid()::text, 'sha256'), 'hex'))
WHERE request_code IS NULL OR qr_token IS NULL;

-- Make request_code NOT NULL
ALTER TABLE public.letter_requests ALTER COLUMN request_code SET NOT NULL;

-- 4. Create Letter Bookmarks (Surat Favorit Warga)
CREATE TABLE IF NOT EXISTS public.letter_bookmarks (
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  category_id UUID REFERENCES public.letter_categories(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  PRIMARY KEY (profile_id, category_id)
);

-- Enable RLS on Bookmarks
ALTER TABLE public.letter_bookmarks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow users to manage their own bookmarks" ON public.letter_bookmarks
  FOR ALL USING (auth.uid() = profile_id);

-- 5. Create Letter Templates (Kop Surat & Copy Variable Placeholders)
CREATE TABLE IF NOT EXISTS public.letter_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID REFERENCES public.letter_categories(id) ON DELETE CASCADE UNIQUE NOT NULL,
  template_content TEXT NOT NULL, -- Store HTML/Markdown with Kop Surat, body, and placeholders e.g., {{nama}}, {{nik}}
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS on Templates
ALTER TABLE public.letter_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read to templates" ON public.letter_templates
  FOR SELECT USING (true);

CREATE POLICY "Allow admins to manage templates" ON public.letter_templates
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'superadmin')
    )
  );

-- Seed Default Templates
INSERT INTO public.letter_templates (category_id, template_content)
SELECT id, '
<div style="font-family: Arial, sans-serif; line-height: 1.6; padding: 20px;">
  <!-- Kop Surat -->
  <div style="text-align: center; border-bottom: 3px double #000; padding-bottom: 10px; margin-bottom: 20px;">
    <h2 style="margin: 0; text-transform: uppercase;">PENGURUS RUKUN TETANGGA 03 / RUKUN WARGA 05</h2>
    <h3 style="margin: 0; text-transform: uppercase;">KELURAHAN GUNTUR - KECAMATAN SETIABUDI</h3>
    <p style="margin: 5px 0 0 0; font-size: 11px;">Sekretariat: Jl. Kebon Jeruk No. 24, Jakarta Selatan 12980</p>
  </div>

  <!-- Judul Surat -->
  <div style="text-align: center; margin-bottom: 25px;">
    <h3 style="text-decoration: underline; margin: 0; text-transform: uppercase;">SURAT KETERANGAN PENGANTAR</h3>
    <p style="margin: 5px 0 0 0; font-size: 12px; font-weight: bold;">Nomor: {{nomor_surat}}</p>
  </div>

  <!-- Pembuka -->
  <p>Yang bertanda tangan di bawah ini Pengurus RT 03 / RW 05 Kelurahan Guntur, Kecamatan Setiabudi, Jakarta Selatan dengan ini menerangkan bahwa:</p>

  <!-- Biodata Warga -->
  <table style="width: 100%; margin-left: 20px; margin-bottom: 20px; border-collapse: collapse;">
    <tr><td style="width: 150px;">Nama Lengkap</td><td>: <strong>{{nama}}</strong></td></tr>
    <tr><td>NIK / No. KTP</td><td>: {{nik}}</td></tr>
    <tr><td>No. Kartu Keluarga</td><td>: {{kk}}</td></tr>
    <tr><td>Jenis Kelamin</td><td>: {{jenis_kelamin}}</td></tr>
    <tr><td>Tempat, Tgl Lahir</td><td>: {{tempat_lahir}}, {{tanggal_lahir}}</td></tr>
    <tr><td>Agama</td><td>: {{agama}}</td></tr>
    <tr><td>Pekerjaan</td><td>: {{pekerjaan}}</td></tr>
    <tr><td>Alamat KTP</td><td>: {{alamat}}</td></tr>
  </table>

  <!-- Isi Penjelas -->
  <p>Orang tersebut di atas benar adalah warga domisili kami yang bertempat tinggal di lingkungan kami. Surat Keterangan Pengantar ini diberikan kepada yang bersangkutan untuk dipergunakan sebagai syarat keperluan:</p>
  <div style="background: #f8fafc; padding: 12px 18px; border-left: 4px solid #3b82f6; font-style: italic; margin-bottom: 20px; border-radius: 4px;">
    "{{keperluan}}"
  </div>

  <!-- Penutup -->
  <p>Demikian Surat Keterangan Pengantar ini dibuat dengan sebenarnya untuk dapat dipergunakan sebagaimana mestinya dan penuh tanggung jawab.</p>

  <!-- Tanda Tangan Block -->
  <table style="width: 100%; margin-top: 40px; text-align: center; border-collapse: collapse;">
    <tr>
      <td style="width: 50%;">
        <p style="margin-bottom: 60px;">Mengetahui,<br/><strong>Ketua RT 03</strong></p>
        <p style="text-decoration: underline; margin: 0;"><strong>H. Akhmad Sobari</strong></p>
      </td>
      <td style="width: 50%;">
        <p style="margin: 0 0 5px 0;">Jakarta, {{tanggal_sekarang}}</p>
        <p style="margin: 0 0 10px 0;"><strong>Ketua RW 05</strong></p>
        <!-- Digital Signature PNG Stamp -->
        <div style="height: 60px; display: flex; align-items: center; justify-content: center; margin: 5px 0;">
          {{tanda_tangan_digital}}
        </div>
        <p style="text-decoration: underline; margin: 0;"><strong>Ir. H. Gunawan</strong></p>
      </td>
    </tr>
  </table>
</div>
' FROM public.letter_categories WHERE code = 'surat_pengantar' ON CONFLICT (category_id) DO NOTHING;

-- 6. Create Letter Logs (Audit trails)
CREATE TABLE IF NOT EXISTS public.letter_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  letter_request_id UUID REFERENCES public.letter_requests(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL,
  actor_id UUID REFERENCES public.profiles(id) NOT NULL,
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS on Logs
ALTER TABLE public.letter_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow citizens to read their own letter logs" ON public.letter_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.letter_requests r
      WHERE r.id = letter_request_id AND r.profile_id = auth.uid()
    )
  );

CREATE POLICY "Allow staff to manage letter logs" ON public.letter_logs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('rt', 'rw', 'admin', 'superadmin')
    )
  );

-- 7. Add automated letter code trigger on new submissions
CREATE OR REPLACE FUNCTION public.generate_request_code_and_token()
RETURNS TRIGGER AS $$
DECLARE
  seq_num TEXT;
  date_part TEXT;
BEGIN
  date_part := TO_CHAR(NOW(), 'YYMM');
  -- Fetch sequence based on count in current month
  SELECT COALESCE(TO_CHAR(COUNT(*) + 1, 'FM000'), '001') INTO seq_num
  FROM public.letter_requests
  WHERE TO_CHAR(created_at, 'YYMM') = date_part;

  NEW.request_code := 'SR-' || date_part || '-' || seq_num;
  NEW.qr_token := encode(digest(NEW.id::text || gen_random_uuid()::text, 'sha256'), 'hex');
  NEW.submitted_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER on_letter_request_submitting
  BEFORE INSERT ON public.letter_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_request_code_and_token();

-- 8. Add Storage Setup for Digital Signature Bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('signatures', 'signatures', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies for Signatures
CREATE POLICY "Allow staff to upload digital signature stamps" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'signatures' AND
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('rt', 'rw', 'admin', 'superadmin')
    )
  );

CREATE POLICY "Allow public read access to signatures" ON storage.objects
  FOR SELECT USING (bucket_id = 'signatures');
