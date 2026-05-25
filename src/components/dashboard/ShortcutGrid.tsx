'use client'

import Link from 'next/link'
import { 
  CreditCard, 
  FileText, 
  Megaphone, 
  Calendar, 
  CheckSquare, 
  AlertTriangle, 
  Users, 
  Home, 
  User, 
  PhoneCall 
} from 'lucide-react'

interface ShortcutGridProps {
  role: string
}

export default function ShortcutGrid({ role }: ShortcutGridProps) {
  const isStaff = ['rt', 'rw', 'admin', 'superadmin'].includes(role)

  const shortcuts = [
    {
      href: '/iuran',
      label: 'Bayar Iuran',
      description: 'Bayar iuran bulanan',
      icon: CreditCard,
      bgClass: 'bg-emerald-50 text-emerald-600 border-emerald-100/50',
    },
    {
      href: '/surat',
      label: 'Pengajuan Surat',
      description: 'Pengantar surat digital',
      icon: FileText,
      bgClass: 'bg-blue-50 text-blue-600 border-blue-100/50',
    },
    {
      href: '/pengumuman',
      label: 'Pengumuman',
      description: 'Kabar & pengumuman baru',
      icon: Megaphone,
      bgClass: 'bg-rose-50 text-rose-600 border-rose-100/50',
    },
    {
      href: '/kegiatan',
      label: 'Kegiatan',
      description: 'Agenda & rapat RT/RW',
      icon: Calendar,
      bgClass: 'bg-purple-50 text-purple-600 border-purple-100/50',
    },
    {
      href: '/absensi',
      label: 'Absensi Warga',
      description: 'Absensi kehadiran acara',
      icon: CheckSquare,
      bgClass: 'bg-teal-50 text-teal-600 border-teal-100/50',
    },
    {
      href: '/laporan',
      label: 'Laporan Aduan',
      description: 'Aduan & keluhan wilayah',
      icon: AlertTriangle,
      bgClass: 'bg-amber-50 text-amber-600 border-amber-100/50',
    },
    {
      href: isStaff ? '/warga' : '/profile',
      label: isStaff ? 'Data Warga' : 'Profil Warga',
      description: isStaff ? 'Kelola kependudukan' : 'Detail profil & akun',
      icon: isStaff ? Users : User,
      bgClass: isStaff 
        ? 'bg-indigo-50 text-indigo-600 border-indigo-100/50' 
        : 'bg-sky-50 text-sky-600 border-sky-100/50',
    },
    {
      href: isStaff ? '/rumah' : '#',
      label: isStaff ? 'Data Rumah' : 'Hubungi RT',
      description: isStaff ? 'Kelola pemetaan rumah' : 'Hubungi pengurus RT',
      icon: isStaff ? Home : PhoneCall,
      bgClass: isStaff 
        ? 'bg-fuchsia-50 text-fuchsia-600 border-fuchsia-100/50' 
        : 'bg-pink-50 text-pink-600 border-pink-100/50',
      onClick: isStaff ? undefined : () => {
        window.location.href = 'tel:081234567890'
      }
    },
  ]

  return (
    <div className="select-none">
      <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-3.5 px-1">
        Layanan Pintar {isStaff ? 'Pengurus' : 'Warga'}
      </h4>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {shortcuts.map((shortcut, index) => {
          const Icon = shortcut.icon
          
          const CardContent = (
            <div className="bg-white hover:bg-slate-50/50 border border-slate-100/80 p-3 sm:p-3.5 rounded-2xl flex items-center space-x-3 transition-all hover:scale-[1.02] active:scale-[0.98] hover:shadow-xs hover:border-slate-200 group cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-600/10 h-16 sm:h-18">
              <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shrink-0 border transition-transform duration-300 group-hover:scale-110 ${shortcut.bgClass}`}>
                <Icon className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-slate-800 leading-tight group-hover:text-blue-600 transition-colors truncate">
                  {shortcut.label}
                </p>
                <p className="text-[9px] sm:text-[10px] text-slate-400 mt-1 font-semibold leading-none truncate">
                  {shortcut.description}
                </p>
              </div>
            </div>
          )

          if (shortcut.href === '#') {
            return (
              <div key={`shortcut-${index}`} onClick={shortcut.onClick}>
                {CardContent}
              </div>
            )
          }

          return (
            <Link key={shortcut.href} href={shortcut.href}>
              {CardContent}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
