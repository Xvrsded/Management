'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuthStore } from '@/store/useAuthStore'
import { logoutAction } from '@/app/auth/actions'
import { LogOut } from 'lucide-react'
import NotificationBell from './NotificationBell'
import { NAVIGATION_ITEMS } from '@/utils/navigationConfig'

// Dynamic HSL and Tailwind accent styling configurations depending on user roles
const ROLE_THEMES: Record<string, {
  brandBg: string
  activeBg: string
  activeText: string
  activeIndicator: string
  avatarBg: string
  avatarText: string
}> = {
  warga: {
    brandBg: 'bg-gradient-to-br from-blue-600 to-indigo-700 shadow-blue-600/25',
    activeBg: 'bg-blue-50/80 text-blue-600 font-bold',
    activeText: 'text-blue-600',
    activeIndicator: 'bg-blue-600',
    avatarBg: 'bg-blue-50 border-blue-100',
    avatarText: 'text-blue-600'
  },
  rt: {
    brandBg: 'bg-gradient-to-br from-emerald-600 to-teal-700 shadow-emerald-600/25',
    activeBg: 'bg-emerald-50/80 text-emerald-600 font-bold',
    activeText: 'text-emerald-600',
    activeIndicator: 'bg-emerald-600',
    avatarBg: 'bg-emerald-50 border-emerald-100',
    avatarText: 'text-emerald-600'
  },
  rw: {
    brandBg: 'bg-gradient-to-br from-purple-600 to-indigo-700 shadow-purple-600/25',
    activeBg: 'bg-purple-50/80 text-purple-600 font-bold',
    activeText: 'text-purple-600',
    activeIndicator: 'bg-purple-600',
    avatarBg: 'bg-purple-50 border-purple-100',
    avatarText: 'text-purple-600'
  },
  admin: {
    brandBg: 'bg-gradient-to-br from-slate-800 to-cyan-800 shadow-slate-800/25',
    activeBg: 'bg-slate-100 text-slate-800 font-bold',
    activeText: 'text-slate-800',
    activeIndicator: 'bg-slate-800',
    avatarBg: 'bg-slate-100 border-slate-200',
    avatarText: 'text-slate-800'
  },
  superadmin: {
    brandBg: 'bg-gradient-to-br from-zinc-900 to-purple-950 shadow-zinc-950/25',
    activeBg: 'bg-indigo-50 text-indigo-950 font-bold',
    activeText: 'text-indigo-950',
    activeIndicator: 'bg-indigo-950',
    avatarBg: 'bg-indigo-50 border-indigo-100',
    avatarText: 'text-indigo-950'
  }
}

export default function Sidebar() {
  const pathname = usePathname()
  const { user } = useAuthStore()

  const userRole = user?.role || 'warga'
  const filteredNav = NAVIGATION_ITEMS.filter((item) => item.roles.includes(userRole))

  const theme = ROLE_THEMES[userRole] || ROLE_THEMES.warga

  const roleLabels: Record<string, { label: string; color: string }> = {
    warga: { label: 'Warga', color: 'bg-slate-100 text-slate-500 border border-slate-200/40' },
    rt: { label: 'Ketua RT', color: 'bg-emerald-50 text-emerald-600 border border-emerald-100/60' },
    rw: { label: 'Ketua RW', color: 'bg-purple-50 text-purple-600 border border-purple-100/60' },
    admin: { label: 'Admin', color: 'bg-cyan-50 text-cyan-700 border border-cyan-100' },
    superadmin: { label: 'Super Admin', color: 'bg-zinc-900 text-purple-400 border border-zinc-800' }
  }

  const roleBadge = roleLabels[userRole] || roleLabels.warga

  // Grouped Navigation menu sections
  const groups = [
    {
      title: 'Menu Utama',
      endpoints: ['/dashboard', '/pengumuman', '/kegiatan']
    },
    {
      title: 'Administrasi',
      endpoints: ['/iuran', '/surat', '/absensi', '/laporan', '/warga', '/keluarga', '/rumah']
    },
    {
      title: 'Akun',
      endpoints: ['/profile', '/settings']
    }
  ]

  const handleLogout = async () => {
    await logoutAction()
    window.location.href = '/login'
  }

  return (
    <aside className="hidden md:flex md:w-60 md:flex-col bg-white border-r border-slate-100 h-screen sticky top-0 shrink-0 shadow-[4px_0_24px_-4px_rgba(0,0,0,0.01)] z-20">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-50">
        <div className="flex items-center space-x-2.5">
          <div className={`w-9 h-9 rounded-xl ${theme.brandBg} text-white flex items-center justify-center font-black text-xs shrink-0`}>
            RT
          </div>
          <div>
            <h1 className="text-xs font-bold text-slate-800 tracking-tight leading-none">RT/RW Digital</h1>
            <p className="text-[9px] font-semibold text-slate-400 mt-1 leading-none uppercase tracking-wider">Layanan Warga</p>
          </div>
        </div>
      </div>

      {/* Grouped Navigation */}
      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4 max-h-[calc(100vh-140px)]">
        {groups.map((group) => {
          const itemsInGroup = filteredNav.filter((item) => group.endpoints.includes(item.href))
          if (itemsInGroup.length === 0) return null

          return (
            <div key={group.title} className="space-y-1.5">
              <span className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest px-3 mb-1.5">
                {group.title}
              </span>
              <div className="space-y-0.5">
                {itemsInGroup.map((item) => {
                  const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href + '/'))
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all relative ${
                        isActive
                          ? theme.activeBg
                          : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                      }`}
                    >
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? theme.activeText : 'text-slate-400'}`} />
                      <span>{item.label}</span>
                      
                      {/* Modern active right border indicator line */}
                      {isActive && (
                        <span className={`absolute right-0 top-1/2 -translate-y-1/2 w-[3px] h-4 ${theme.activeIndicator} rounded-l-md`} />
                      )}
                    </Link>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {/* Profile Footer Section */}
      {user && (
        <div className="p-4 border-t border-slate-100 bg-[#f5f7fb]/25 flex items-center justify-between">
          <div className="flex items-center space-x-2 min-w-0 flex-1">
            <div className={`w-8 h-8 rounded-full ${theme.avatarBg} ${theme.avatarText} flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs`}>
              {user.fullName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold text-slate-800 truncate leading-tight">{user.fullName}</p>
              <span className={`inline-flex items-center mt-0.5 px-1.5 py-0.5 rounded-full text-[8px] font-extrabold tracking-wide uppercase leading-none ${roleBadge.color}`}>
                {roleBadge.label}
              </span>
            </div>
          </div>
          <div className="flex items-center ml-1.5 shrink-0">
            <NotificationBell />
            <button
              onClick={handleLogout}
              className="w-7 h-7 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center border border-transparent hover:border-rose-100 transition-colors ml-1"
              title="Keluar"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </aside>
  )
}
