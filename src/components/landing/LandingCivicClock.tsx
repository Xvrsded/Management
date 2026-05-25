'use client'

import { useEffect, useState } from 'react'

const DAYS = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
const MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
]

export default function LandingCivicClock() {
  const [time, setTime] = useState<Date | null>(null)

  useEffect(() => {
    setTime(new Date())
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  if (!time) {
    return (
      <div className="h-10 w-48 animate-pulse rounded-xl bg-slate-100" aria-hidden />
    )
  }

  const dayName = DAYS[time.getDay()]
  const dateLine = `${dayName}, ${time.getDate()} ${MONTHS[time.getMonth()]} ${time.getFullYear()}`
  const hh = String(time.getHours()).padStart(2, '0')
  const mm = String(time.getMinutes()).padStart(2, '0')
  const ss = String(time.getSeconds()).padStart(2, '0')

  return (
    <div className="text-right">
      <p className="text-xs font-medium text-slate-500">{dateLine}</p>
      <p className="font-mono text-sm font-bold tabular-nums text-slate-800">
        {hh}:{mm}:{ss}{' '}
        <span className="text-xs font-semibold text-slate-400">WIB</span>
      </p>
    </div>
  )
}
