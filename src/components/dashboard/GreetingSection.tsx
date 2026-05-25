'use client'

import { useEffect, useState } from 'react'
import { Bell } from 'lucide-react'
import Link from 'next/link'

interface GreetingSectionProps {
  fullName: string
  role: string
}

export default function GreetingSection({ fullName, role }: GreetingSectionProps) {
  const [greeting, setGreeting] = useState('Selamat pagi')
  const [currentDate, setCurrentDate] = useState('')

  useEffect(() => {
    const getGreetingByTime = () => {
      const hours = new Date().getHours()
      if (hours >= 4 && hours < 11) {
        return 'Selamat pagi'
      } else if (hours >= 11 && hours < 15) {
        return 'Selamat siang'
      } else if (hours >= 15 && hours < 18) {
        return 'Selamat sore'
      } else {
        return 'Selamat malam'
      }
    }
    setGreeting(getGreetingByTime())

    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }
    setCurrentDate(new Date().toLocaleDateString('id-ID', options))
  }, [])

  const roleBadges: Record<string, { bg: string; label: string }> = {
    warga: { bg: 'bg-emerald-50 text-emerald-600 border-emerald-100', label: 'Warga' },
    rt: { bg: 'bg-blue-50 text-blue-600 border-blue-100', label: 'Ketua RT' },
    rw: { bg: 'bg-indigo-50 text-indigo-600 border-indigo-100', label: 'Ketua RW' },
    admin: { bg: 'bg-purple-50 text-purple-600 border-purple-100', label: 'Admin' },
    superadmin: { bg: 'bg-rose-50 text-rose-600 border-rose-100', label: 'Super Admin' }
  }

  const badge = roleBadges[role] || roleBadges.warga

  return (
    <div className="flex items-center justify-between py-2 bg-transparent select-none">
      <div>
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="text-base sm:text-lg font-bold text-slate-800 leading-tight tracking-tight">
            {greeting}, <span className="font-extrabold text-blue-600 hover:text-blue-700 transition-colors">{fullName}</span> 👋
          </h1>
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-extrabold tracking-wide uppercase border leading-none ${badge.bg} shadow-2xs`}>
            {badge.label}
          </span>
        </div>
        <p className="text-[10px] sm:text-xs font-semibold text-slate-400 mt-1 uppercase tracking-wider">
          {currentDate || 'RT 03 / RW 05'}
        </p>
      </div>

      <div className="flex items-center space-x-2.5 shrink-0">
        {/* Notification Bell Shortcut */}
        <div className="relative group">
          <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
          <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-rose-500" />
          <button className="w-9 h-9 rounded-xl bg-white border border-slate-100 shadow-xs hover:bg-slate-50 flex items-center justify-center transition-all hover:scale-105 active:scale-95 group-hover:border-slate-200">
            <Bell className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
          </button>
        </div>

        {/* Profile Avatar Shortcut */}
        <Link 
          href="/profile"
          className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 hover:from-blue-100 hover:to-indigo-100 text-blue-600 flex items-center justify-center font-extrabold text-xs transition-all hover:scale-105 active:scale-95 shadow-xs shrink-0"
        >
          {fullName.charAt(0).toUpperCase()}
        </Link>
      </div>
    </div>
  )
}
