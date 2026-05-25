'use client'

import { useEffect, useState } from 'react'

export default function RealtimeCivicClock() {
  const [time, setTime] = useState<Date | null>(null)

  useEffect(() => {
    // Set initial date on client to avoid hydration mismatch
    setTime(new Date())

    const timer = setInterval(() => {
      setTime(new Date())
    }, 1000)

    return () => {
      clearInterval(timer)
    }
  }, [])

  if (!time) {
    return (
      <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-2xl bg-white border border-slate-100/50 shadow-2xs text-[10px] font-bold text-slate-400 select-none animate-pulse">
        <span className="w-1.5 h-1.5 rounded-full bg-slate-350" />
        <span>Sinkronisasi Waktu...</span>
      </div>
    )
  }

  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ]

  const dayName = days[time.getDay()]
  const dateNum = time.getDate()
  const monthName = months[time.getMonth()]
  const yearNum = time.getFullYear()

  const hh = String(time.getHours()).padStart(2, '0')
  const mm = String(time.getMinutes()).padStart(2, '0')
  const ss = String(time.getSeconds()).padStart(2, '0')

  return (
    <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-2xl bg-white/80 backdrop-blur-xs border border-slate-100/50 shadow-3xs text-[10px] font-extrabold text-slate-500 select-none hover:border-blue-100 hover:text-blue-600 transition-colors duration-200">
      <span className="relative flex h-1.5 w-1.5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
      </span>
      <span className="font-sans leading-none uppercase tracking-wider flex items-center">
        {dayName}, {dateNum} {monthName} {yearNum}
        <span className="mx-1.5 text-slate-300 font-normal">|</span>
        <span className="font-mono text-xs font-black tracking-widest text-slate-800 tabular-nums">
          {hh}:{mm}:{ss}
        </span>
        <span className="ml-1 text-[8px] font-black text-slate-400">WIB</span>
      </span>
    </div>
  )
}
