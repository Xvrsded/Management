'use client'

import Link from 'next/link'
import { getNavigationForRole } from '@/utils/navigationConfig'

interface QuickActionsProps {
  role: string
}

const EXCLUDED_ROUTES = ['/dashboard', '/surat', '/iuran', '/kegiatan', '/forum', '/profile']

export default function QuickActions({ role }: QuickActionsProps) {
  // Fetch available routes for the current role
  const roleNavItems = getNavigationForRole(role)
  
  // Filter out items that are already in the Bottom Navigation
  const quickActions = roleNavItems.filter(item => !EXCLUDED_ROUTES.includes(item.href))

  if (quickActions.length === 0) return null

  return (
    <div className="mb-6 select-none">
      <h2 className="text-sm font-semibold text-slate-500 mb-3">Aksi Cepat</h2>
      <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
        {quickActions.map((action, idx) => {
          const Icon = action.icon
          return (
            <Link
              key={idx}
              href={action.href}
              className="flex flex-col items-center justify-center bg-white border border-purple-50 rounded-xl p-2.5 sm:p-3 shadow-sm hover:shadow-md transition-all hover:border-purple-200 active:scale-95 group h-[72px] sm:h-20"
            >
              <Icon className="w-5 h-5 text-purple-600 mb-1.5 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] md:text-xs font-medium text-center text-slate-700 leading-tight">
                {action.label}
              </span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
