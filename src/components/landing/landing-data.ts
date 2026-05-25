import type { LucideIcon } from 'lucide-react'
import {
  FileText,
  Wallet,
  Upload,
  MessageSquareWarning,
  MapPin,
  ClipboardCheck,
  Users,
  Bell,
  Home,
  Building2,
  ShieldCheck,
  Smartphone,
  Zap,
  Lock,
  HeartHandshake,
} from 'lucide-react'

export const NAV_LINKS = [
  { href: '#beranda', label: 'Beranda' },
  { href: '#fitur', label: 'Fitur' },
  { href: '#tentang', label: 'Tentang' },
  { href: '#kontak', label: 'Kontak' },
] as const

export const HERO_BADGES = [
  'Mobile Friendly',
  'Ringan',
  'Real-time',
  'Aman',
] as const

export type FeatureItem = {
  icon: LucideIcon
  title: string
  description: string
  iconBg: string
  iconColor: string
  cardBg: string
}

export const FEATURES: FeatureItem[] = [
  {
    icon: FileText,
    title: 'Pengajuan Surat Digital',
    description: 'Ajukan surat pengantar dan dokumen RT/RW tanpa antre.',
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-700',
    cardBg: 'bg-blue-50/80',
  },
  {
    icon: Wallet,
    title: 'Pembayaran Iuran',
    description: 'Bayar iuran bulanan dengan status transparan dan riwayat jelas.',
    iconBg: 'bg-emerald-100',
    iconColor: 'text-emerald-700',
    cardBg: 'bg-emerald-50/80',
  },
  {
    icon: Upload,
    title: 'Upload Bukti Transfer',
    description: 'Kirim bukti pembayaran langsung dari HP, tanpa ribet.',
    iconBg: 'bg-orange-100',
    iconColor: 'text-orange-700',
    cardBg: 'bg-orange-50/80',
  },
  {
    icon: MessageSquareWarning,
    title: 'Laporan Warga',
    description: 'Laporkan masalah lingkungan dan pantau tindak lanjutnya.',
    iconBg: 'bg-violet-100',
    iconColor: 'text-violet-700',
    cardBg: 'bg-violet-50/80',
  },
  {
    icon: MapPin,
    title: 'Geolocation Rumah',
    description: 'Data lokasi rumah warga terpetakan untuk layanan lebih cepat.',
    iconBg: 'bg-cyan-100',
    iconColor: 'text-cyan-700',
    cardBg: 'bg-cyan-50/80',
  },
  {
    icon: ClipboardCheck,
    title: 'Absensi Kegiatan',
    description: 'Hadir kegiatan RT/RW dengan QR scan yang praktis.',
    iconBg: 'bg-indigo-100',
    iconColor: 'text-indigo-700',
    cardBg: 'bg-indigo-50/80',
  },
  {
    icon: Users,
    title: 'Data Keluarga',
    description: 'Kelola data keluarga dan anggota rumah secara terpusat.',
    iconBg: 'bg-rose-100',
    iconColor: 'text-rose-700',
    cardBg: 'bg-rose-50/80',
  },
  {
    icon: Bell,
    title: 'Notifikasi Real-time',
    description: 'Dapatkan info pengumuman dan status layanan seketika.',
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-700',
    cardBg: 'bg-amber-50/80',
  },
]

export type RoleTab = 'warga' | 'admin'

export const ROLE_TABS: { id: RoleTab; label: string; icon: LucideIcon }[] = [
  { id: 'warga', label: 'Warga', icon: Home },
  { id: 'admin', label: 'RT / RW / Admin', icon: Building2 },
]

export const ROLE_FEATURES: Record<
  RoleTab,
  { title: string; subtitle: string; items: string[]; accent: string }
> = {
  warga: {
    title: 'Untuk Warga',
    subtitle: 'Semua layanan harian dalam genggaman Anda.',
    items: [
      'Bayar iuran bulanan',
      'Ajukan surat pengantar',
      'Lihat pengumuman RT/RW',
      'Absensi kegiatan lingkungan',
      'Laporan masalah lingkungan',
    ],
    accent: 'from-blue-600 to-cyan-500',
  },
  admin: {
    title: 'Untuk Pengurus RT/RW',
    subtitle: 'Kelola lingkungan dengan data yang rapi dan transparan.',
    items: [
      'Approval & verifikasi surat',
      'Monitoring iuran warga',
      'Manajemen data warga',
      'Export laporan administrasi',
      'Validasi absensi kegiatan',
      'Statistik wilayah real-time',
    ],
    accent: 'from-emerald-600 to-teal-500',
  },
}

export const LETTER_STEPS = [
  { step: 1, title: 'Warga Ajukan Surat', desc: 'Isi formulir digital' },
  { step: 2, title: 'RT Verifikasi', desc: 'Cek kelengkapan data' },
  { step: 3, title: 'RW Validasi', desc: 'Persetujuan akhir' },
  { step: 4, title: 'Surat Selesai', desc: 'Siap diunduh/cetak' },
] as const

export const PAYMENT_METHODS = ['QRIS', 'Transfer Bank', 'E-wallet'] as const

export const ADVANTAGES = [
  { icon: Smartphone, text: 'Ringan untuk HP low-end' },
  { icon: Lock, text: 'Aman dengan Supabase Auth' },
  { icon: Zap, text: 'Mobile-first & cepat diakses' },
  { icon: Bell, text: 'Notifikasi real-time' },
  { icon: HeartHandshake, text: 'Mudah digunakan semua umur' },
  { icon: ShieldCheck, text: 'Antarmuka sederhana, tidak ribet' },
] as const

export const STATS = [
  { value: '1.000+', label: 'Warga Terdaftar' },
  { value: '250+', label: 'Surat Selesai' },
  { value: 'Rp 50jt+', label: 'Iuran Terkumpul' },
  { value: '120+', label: 'Kegiatan Berjalan' },
] as const

export const FOOTER_LINKS = [
  { href: '#beranda', label: 'Beranda' },
  { href: '#fitur', label: 'Fitur' },
  { href: '#tentang', label: 'Tentang' },
  { href: '/login', label: 'Masuk' },
  { href: '/register', label: 'Daftar' },
] as const
