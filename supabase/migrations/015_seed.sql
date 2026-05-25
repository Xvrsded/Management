-- Seed Data
-- Safe seed data with ON CONFLICT DO NOTHING to prevent duplicates

-- Seed RW 01
INSERT INTO public.rw (rw_number, name, address)
VALUES ('001', 'RW 01', 'Jl. Raya Utama No. 1')
ON CONFLICT (rw_number) DO NOTHING;

-- Seed RT 01 (linked to RW 01)
INSERT INTO public.rt (rw_id, rt_number, name, address)
SELECT id, '001', 'RT 01', 'Jl. Raya Utama No. 1'
FROM public.rw
WHERE rw_number = '001'
ON CONFLICT (rw_id, rt_number) DO NOTHING;

-- Seed Payment Categories
INSERT INTO public.payment_categories (name, kategori, default_amount)
VALUES 
  ('Iuran Kebersihan Bulanan', 'bulanan', 30000),
  ('Iuran Keamanan & Ronda', 'bulanan', 45000),
  ('Iuran Kas Sampah Lingkungan', 'bulanan', 15000),
  ('Kas Bakti Sosial Sukarela', 'sukarela', 20000),
  ('Iuran Insidental Perbaikan Gapura', 'insidental', 100000)
ON CONFLICT DO NOTHING;

-- Seed Letter Categories
INSERT INTO public.letter_categories (name, code, description, form_fields) VALUES
(
  'Surat Pengantar RT/RW', 
  'surat_pengantar', 
  'Surat resmi pengantar dari RT/RW setempat untuk kelengkapan administrasi kelurahan/kecamatan.',
  '[{"name": "keterangan", "label": "Keterangan Tambahan (Opsional)", "type": "text", "placeholder": "Contoh: Domisili tetap sejak lahir...", "required": false}]'::jsonb
),
(
  'Surat Keterangan Domisili', 
  'surat_domisili', 
  'Keterangan resmi domisili bertempat tinggal di wilayah RT/RW setempat.',
  '[{"name": "alamat_tetap", "label": "Alamat Tetap Di Domisili", "type": "text", "placeholder": "Contoh: Jl. Kebon Jeruk No. 24", "required": true}, {"name": "lama_tinggal", "label": "Lama Tinggal (Tahun/Bulan)", "type": "text", "placeholder": "Contoh: 3 Tahun...", "required": true}]'::jsonb
),
(
  'Surat Keterangan Usaha', 
  'surat_usaha', 
  'Keterangan kepemilikan usaha mikro/kecil/menengah (UMKM) aktif di domisili.',
  '[{"name": "nama_usaha", "label": "Nama Usaha Mikro", "type": "text", "placeholder": "Contoh: Warung Kelontong Berkah", "required": true}, {"name": "jenis_usaha", "label": "Jenis Bidang Usaha", "type": "text", "placeholder": "Contoh: Perdagangan Sembako", "required": true}, {"name": "alamat_usaha", "label": "Alamat Lokasi Usaha", "type": "text", "placeholder": "Contoh: Jl. Raya Kebon Jeruk No. 12", "required": true}]'::jsonb
),
(
  'Surat Keterangan Tidak Mampu', 
  'surat_tidak_mampu', 
  'Surat Keterangan Tidak Mampu (SKTM) untuk kebutuhan keringanan sekolah, kesehatan, dll.',
  '[{"name": "nama_rumah_sakit", "label": "Nama Sekolah / Rumah Sakit Tujuan", "type": "text", "placeholder": "Contoh: RSUD Koja / SMA Negeri 1", "required": true}, {"name": "nama_pasien", "label": "Nama Pasien / Siswa Terkait", "type": "text", "placeholder": "Contoh: Budi Santoso (Anak Kandung)", "required": true}]'::jsonb
),
(
  'Surat Keterangan Tinggal', 
  'surat_keterangan_tinggal', 
  'Keterangan izin menetap sementara bagi warga pendatang.',
  '[{"name": "alamat_asal", "label": "Alamat Asal KTP", "type": "text", "placeholder": "Contoh: Jl. Diponegoro No. 10, Solo", "required": true}, {"name": "tujuan_tinggal", "label": "Maksud Menetap Sementara", "type": "text", "placeholder": "Contoh: Bekerja kontrak proyek...", "required": true}]'::jsonb
),
(
  'Surat Keterangan Kelahiran', 
  'surat_kelahiran', 
  'Pengantar kelengkapan pembuatan Akta Kelahiran anak baru.',
  '[{"name": "nama_bayi", "label": "Nama Lengkap Bayi", "type": "text", "placeholder": "Contoh: Muhammad Rezky", "required": true}, {"name": "tanggal_lahir_bayi", "label": "Tanggal Lahir Bayi", "type": "date", "placeholder": "", "required": true}, {"name": "nama_ayah", "label": "Nama Lengkap Ayah Kandung", "type": "text", "placeholder": "Contoh: Budi Santoso", "required": true}, {"name": "nama_ibu", "label": "Nama Lengkap Ibu Kandung", "type": "text", "placeholder": "Contoh: Siti Aminah", "required": true}]'::jsonb
),
(
  'Surat Keterangan Kematian', 
  'surat_kematian', 
  'Surat pengantar pelaporan warga wafat.',
  '[{"name": "nama_mendiang", "label": "Nama Lengkap Mendiang Warga", "type": "text", "placeholder": "Contoh: Alm. Suherman", "required": true}, {"name": "tanggal_wafat", "label": "Tanggal Wafat", "type": "date", "placeholder": "", "required": true}, {"name": "penyebab_wafat", "label": "Penyebab Wafat (Opsional)", "type": "text", "placeholder": "Contoh: Sakit usia lanjut...", "required": false}]'::jsonb
),
(
  'Surat Izin Acara', 
  'surat_izin_acara', 
  'Pengantar permohonan izin menyelenggarakan acara keramaian di lingkungan RT/RW.',
  '[{"name": "nama_acara", "label": "Nama / Jenis Acara", "type": "text", "placeholder": "Contoh: Syukuran Pernikahan Warga", "required": true}, {"name": "tanggal_acara", "label": "Tanggal Pelaksanaan Acara", "type": "date", "placeholder": "", "required": true}, {"name": "lokasi_acara", "label": "Lokasi Spesifik Pelaksanaan", "type": "text", "placeholder": "Contoh: Lapangan Serbaguna RT 03", "required": true}]'::jsonb
),
(
  'Surat Pengantar Nikah', 
  'surat_pengantar_nikah', 
  'Surat pengantar resmi (Model N1-N4) untuk pendaftaran di KUA kelurahan.',
  '[{"name": "nama_pasangan", "label": "Nama Lengkap Calon Pasangan", "type": "text", "placeholder": "Contoh: Diah Lestari", "required": true}, {"name": "nik_pasangan", "label": "NIK Calon Pasangan (Jika ada)", "type": "text", "placeholder": "Contoh: 327301XXXXXXXXXX", "required": false}, {"name": "tanggal_pernikahan", "label": "Estimasi Tanggal Akad Pernikahan", "type": "date", "placeholder": "", "required": true}]'::jsonb
),
(
  'Surat Keterangan Pindah', 
  'surat_pindah', 
  'Pengantar perpindahan alamat domisili resmi keluar dari wilayah RT/RW.',
  '[{"name": "alamat_tujuan", "label": "Alamat Lengkap Tujuan Pindah", "type": "text", "placeholder": "Contoh: Perum Griya Indah Blok C No. 4, Depok", "required": true}, {"name": "alasan_pindah", "label": "Alasan Pindah Domisili", "type": "text", "placeholder": "Contoh: Mengikuti penempatan kerja baru...", "required": true}, {"name": "jumlah_pengikut", "label": "Jumlah Anggota Keluarga Pengikut Pindah", "type": "number", "placeholder": "Contoh: 2", "required": true}]'::jsonb
),
(
  'Custom Surat', 
  'custom_surat', 
  'Pilih tipe ini untuk kebutuhan pengajuan surat lain yang tidak terdaftar di atas.',
  '[{"name": "deskripsi_kebutuhan", "label": "Deskripsi Lengkap Kebutuhan Surat Anda", "type": "text", "placeholder": "Jelaskan isi surat pengantar yang Anda butuhkan...", "required": true}]'::jsonb
)
ON CONFLICT (code) DO UPDATE 
SET name = EXCLUDED.name, description = EXCLUDED.description, form_fields = EXCLUDED.form_fields;

-- Note: Admin user and sample houses will be created through the application
-- as they require auth.user IDs which are generated during user registration
