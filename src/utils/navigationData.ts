// Centralized data-only navigation items config.
// Does NOT import lucide-react or React, making it 100% safe to import in Next.js Middleware/Edge Runtime.

export interface NavigationDataItem {
  href: string
  label: string
  roles: string[]
  iconName: string
}

export const NAVIGATION_DATA: NavigationDataItem[] = [
  { href: '/dashboard', label: 'Dashboard', iconName: 'LayoutDashboard', roles: ['warga', 'rt', 'rw', 'admin', 'superadmin'] },
  { href: '/iuran', label: 'Iuran Bulanan', iconName: 'CreditCard', roles: ['warga', 'rt', 'rw', 'admin', 'superadmin'] },
  { href: '/surat', label: 'Surat Pengantar', iconName: 'FileText', roles: ['warga', 'rt', 'rw', 'admin', 'superadmin'] },
  { href: '/pengumuman', label: 'Pengumuman', iconName: 'Megaphone', roles: ['warga', 'rt', 'rw', 'admin', 'superadmin'] },
  { href: '/kegiatan', label: 'Agenda Kegiatan', iconName: 'Calendar', roles: ['warga', 'rt', 'rw', 'admin', 'superadmin'] },
  { href: '/absensi', label: 'Absensi Warga', iconName: 'CheckSquare', roles: ['warga', 'rt', 'rw', 'admin', 'superadmin'] },
  { href: '/laporan', label: 'Laporan Aduan', iconName: 'AlertTriangle', roles: ['warga', 'rt', 'rw', 'admin', 'superadmin'] },
  { href: '/warga', label: 'Data Warga', iconName: 'Users', roles: ['rt', 'rw', 'admin', 'superadmin'] },
  { href: '/keluarga', label: 'Data Keluarga', iconName: 'FolderOpen', roles: ['rt', 'rw', 'admin', 'superadmin'] },
  { href: '/rumah', label: 'Data Rumah', iconName: 'Home', roles: ['rt', 'rw', 'admin', 'superadmin'] },
  { href: '/profile', label: 'Profil Saya', iconName: 'User', roles: ['warga', 'rt', 'rw', 'admin', 'superadmin'] },
  { href: '/settings', label: 'Pengaturan', iconName: 'Settings', roles: ['admin', 'superadmin'] }
]

// Pure data mapping for Middleware authentication checks
export const ROUTE_PERMISSIONS = NAVIGATION_DATA.reduce<Record<string, string[]>>((acc, item) => {
  acc[item.href] = item.roles
  return acc
}, {})
