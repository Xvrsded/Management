'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuthStore } from '@/store/useAuthStore'
import { LogOut } from 'lucide-react'
import { logoutAction } from '@/app/auth/actions'
import { NAVIGATION_ITEMS } from '@/utils/navigationConfig'
import NotificationBell from './NotificationBell'

// Dynamic HSL and Tailwind accent styling configurations depending on user roles
const ROLE_THEMES: Record<string, {
  brandBg: string
  activeText: string
  avatarBg: string
  avatarText: string
}> = {
  warga: {
    brandBg: 'bg-gradient-to-br from-blue-600 to-indigo-700 shadow-sm',
    activeText: 'text-blue-600',
    avatarBg: 'bg-blue-50 border-blue-100',
    avatarText: 'text-blue-600'
  },
  rt: {
    brandBg: 'bg-gradient-to-br from-emerald-600 to-teal-700 shadow-sm',
    activeText: 'text-emerald-600',
    avatarBg: 'bg-emerald-50 border-emerald-100',
    avatarText: 'text-emerald-600'
  },
  rw: {
    brandBg: 'bg-gradient-to-br from-purple-600 to-indigo-700 shadow-sm',
    activeText: 'text-purple-600',
    avatarBg: 'bg-purple-50 border-purple-100',
    avatarText: 'text-purple-600'
  },
  admin: {
    brandBg: 'bg-gradient-to-br from-slate-800 to-cyan-800 shadow-sm',
    activeText: 'text-slate-800',
    avatarBg: 'bg-slate-100 border-slate-200',
    avatarText: 'text-slate-800'
  },
  superadmin: {
    brandBg: 'bg-gradient-to-br from-zinc-900 to-purple-950 shadow-sm',
    activeText: 'text-indigo-950',
    avatarBg: 'bg-indigo-50 border-indigo-100',
    avatarText: 'text-indigo-950'
  }
}

export default function MobileNav() {
  const pathname = usePathname()
  const { user } = useAuthStore()

  const userRole = user?.role || 'warga'
  const theme = ROLE_THEMES[userRole] || ROLE_THEMES.warga

  const handleLogout = async () => {
    await logoutAction()
    window.location.href = '/login'
  }

  // 6-item mobile bottom nav
  const bottomNavEndpoints = ['/dashboard', '/surat', '/iuran', '/kegiatan', '/forum', '/profile']
  
  // Custom shorter labels in Indonesian
  const bottomLabels: Record<string, string> = {
    '/dashboard': 'Beranda',
    '/surat': 'Surat',
    '/iuran': 'Iuran',
    '/kegiatan': 'Kegiatan',
    '/forum': 'Forum',
    '/profile': 'Profil'
  }

  const bottomNavItems = bottomNavEndpoints.map((endpoint) => {
    const item = NAVIGATION_ITEMS.find((n) => n.href === endpoint)
    return {
      href: endpoint,
      label: bottomLabels[endpoint] || '',
      icon: item?.icon
    }
  }).filter((item) => item.icon !== undefined)

  return (
    <>
      {/* Top Mobile Bar */}
      <div className="md:hidden bg-white/95 backdrop-blur-md border-b border-slate-100 px-4 py-2.5 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center space-x-2.5">
          <div className={`w-7 h-7 rounded-xl ${theme.brandBg} text-white flex items-center justify-center font-black text-xs shrink-0`}>
            RT
          </div>
          <div>
            <h2 className="text-[10px] font-extrabold text-slate-800 tracking-tight leading-none">RT/RW Digital</h2>
            <p className="text-[8px] font-semibold text-slate-400 mt-0.5 leading-none uppercase tracking-wider">Layanan Warga</p>
          </div>
        </div>

        {user && (
          <div className="flex items-center space-x-2">
            <Link
              href="/profile"
              className={`w-7 h-7 rounded-full ${theme.avatarBg} ${theme.avatarText} flex items-center justify-center font-bold text-xs shrink-0`}
            >
               {user.fullName.charAt(0).toUpperCase()}
            </Link>
            <div className="shrink-0 -mr-1">
              <NotificationBell />
            </div>
            <button
              onClick={handleLogout}
              className="w-7 h-7 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 flex items-center justify-center border border-slate-100 hover:border-rose-100 transition-colors shrink-0"
              title="Keluar"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Bottom Mobile Bar */}
      <nav 
        className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-100 grid grid-cols-6 items-center pt-2 px-1 z-40 shadow-[0_-4px_16px_-4px_rgba(0,0,0,0.03)] rounded-t-2xl"
        style={{ paddingBottom: 'calc(8px + env(safe-area-inset-bottom, 0px))' }}
      >
        {bottomNavItems.map((item) => {
          if (!item.icon) return null
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href + '/'))
          const Icon = item.icon
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center w-full py-1 transition-all ${
                isActive ? `${theme.activeText} font-bold` : 'text-slate-400 font-semibold'
              }`}
            >
              <Icon className={`w-5 h-5 mb-0.5 transition-transform ${isActive ? `scale-105 ${theme.activeText}` : 'text-slate-400'}`} />
              <span className="text-[10px] tracking-wide">{item.label}</span>
            </Link>
          )
        })}
      </nav>
    </>
  )
}
