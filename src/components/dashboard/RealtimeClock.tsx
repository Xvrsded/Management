'use client'

import { useState, useEffect } from 'react'

export default function RealtimeClock() {
  const [timeStr, setTimeStr] = useState('')

  useEffect(() => {
    // Initial set
    const updateTime = () => {
      const now = new Date()
      // e.g. "Senin, 19 Mei 2026 • 21:48:15"
      const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
      const months = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
      ]
      
      const dayName = days[now.getDay()]
      const day = now.getDate()
      const monthName = months[now.getMonth()]
      const year = now.getFullYear()
      
      const hh = String(now.getHours()).padStart(2, '0')
      const mm = String(now.getMinutes()).padStart(2, '0')
      const ss = String(now.getSeconds()).padStart(2, '0')

      setTimeStr(`${dayName}, ${day} ${monthName} ${year} • ${hh}:${mm}:${ss}`)
    }
    
    updateTime()
    const timerId = setInterval(updateTime, 1000)
    return () => clearInterval(timerId)
  }, [])

  return (
    <span className="font-mono tabular-nums">
      {timeStr || 'Memuat waktu...'}
    </span>
  )
}
