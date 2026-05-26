'use client'

import { useState } from 'react'
import Link from 'next/link'
import { 
  Users, 
  Settings, 
  Activity, 
  ShieldAlert, 
  Database, 
  RefreshCw, 
  Cpu, 
  ToggleLeft, 
  ToggleRight, 
  ShieldCheck, 
  Download,
  AlertCircle
} from 'lucide-react'
import { toast } from 'sonner'
import RightInfoPanel, { NotificationItem } from '../RightInfoPanel'
import QuickActions from '../QuickActions'

interface SuperadminDashboardProps {
  fullName: string
  wargaCount: number
  notifications: NotificationItem[]
}

export default function SuperadminDashboard({
  fullName,
  wargaCount,
  notifications
}: SuperadminDashboardProps) {
  const [backingUp, setBackingUp] = useState(false)
  
  // Feature Toggles state
  const [features, setFeatures] = useState({
    geolocation: true,
    qrAttendance: true,
    digitalCard: true,
    autoReminder: false
  })

  // System Health details
  const cpuLoad = 24
  const memoryUsage = 48
  const dbLatency = 12 // ms

  const handleBackup = () => {
    setBackingUp(true)
    setTimeout(() => {
      setBackingUp(false)
      toast.success('Pencadangan database Supabase selesai! File: rt_rw_backup_20260523.sql')
    }, 2000)
  }

  const toggleFeature = (key: keyof typeof features) => {
    setFeatures(prev => {
      const next = { ...prev, [key]: !prev[key] }
      toast.success(`Fitur ${key.toUpperCase()} berhasil ${next[key] ? 'DIAKTIFKAN' : 'DINONAKTIFKAN'}`)
      return next
    })
  }

  return (
    <div className="space-y-6 pb-20 select-none">
      {/* 1. Greeting Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-2 bg-transparent">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight leading-none">
            Konsol Master, <span className="text-indigo-600 font-black">{fullName}</span> 👑
          </h1>
          <p className="text-xs font-semibold text-slate-450 mt-1.5">
            Super Admin Controller • Dark-Purple Premium System
          </p>
        </div>

        <button 
          onClick={handleBackup}
          disabled={backingUp}
          className="flex items-center space-x-1.5 px-3 py-2 bg-zinc-900 text-white hover:bg-zinc-800 border border-zinc-800 rounded-xl shadow-xs transition-all hover:scale-105 active:scale-95 text-xs font-bold shrink-0 disabled:opacity-50"
        >
          <Download className={`w-4 h-4 text-purple-400 shrink-0 ${backingUp ? 'animate-bounce' : ''}`} />
          <span>{backingUp ? 'Pencadangan...' : 'Cadangkan DB'}</span>
        </button>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Columns (Feeds) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* 0. Quick Actions (Aksi Cepat) */}
          <QuickActions role="superadmin" />

          {/* A. System Health Meters (CSS Animated) */}
          <div className="bg-white rounded-3xl border border-slate-100 p-5 space-y-4 shadow-xs">
            <div className="flex items-center space-x-2 border-b border-slate-50 pb-3">
              <Cpu className="w-4 h-4 text-purple-600 shrink-0" />
              <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest leading-none">
                Status Pemantauan & Kesehatan Server
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 pt-1">
              
              {/* CPU Load Gauge */}
              <div className="space-y-2">
                <div className="flex justify-between items-baseline text-xs">
                  <span className="font-bold text-slate-500">Beban CPU</span>
                  <span className="font-black text-slate-800">{cpuLoad}%</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-purple-500 h-full rounded-full transition-all duration-500" 
                    style={{ width: `${cpuLoad}%` }}
                  />
                </div>
              </div>

              {/* Memory Usage Gauge */}
              <div className="space-y-2">
                <div className="flex justify-between items-baseline text-xs">
                  <span className="font-bold text-slate-500">Penggunaan RAM</span>
                  <span className="font-black text-slate-800">{memoryUsage}%</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-indigo-500 h-full rounded-full transition-all duration-500" 
                    style={{ width: `${memoryUsage}%` }}
                  />
                </div>
              </div>

              {/* DB Latency Ping Indicator */}
              <div className="bg-slate-50/50 rounded-2xl border border-slate-100 p-3 flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="text-[8px] font-extrabold text-slate-450 uppercase tracking-widest leading-none block">
                    DB Latency Ping
                  </span>
                  <h3 className="text-xs font-black text-slate-800 pt-1 leading-none">
                    {dbLatency} ms
                  </h3>
                </div>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[8px] font-extrabold bg-emerald-50 text-emerald-600 border border-emerald-100 uppercase tracking-wider leading-none">
                  Stable
                </span>
              </div>

            </div>
          </div>

          {/* B. Feature Toggles Console */}
          <div className="bg-white rounded-3xl border border-slate-100 p-5 space-y-4 shadow-xs">
            <div className="flex items-center space-x-2 border-b border-slate-50 pb-3">
              <ShieldCheck className="w-4 h-4 text-purple-600 shrink-0" />
              <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest leading-none">
                Sakelar Fitur Aplikasi (Feature Flags)
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Geolocation flag */}
              <div className="flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
                <div>
                  <h5 className="text-xs font-bold text-slate-800 leading-tight">Fitur Geolocation</h5>
                  <p className="text-[9px] text-slate-450 font-semibold mt-1 leading-none">
                    Lacak lokasi absensi & kegiatan warga
                  </p>
                </div>
                <button onClick={() => toggleFeature('geolocation')}>
                  {features.geolocation ? (
                    <ToggleRight className="w-9 h-9 text-purple-600" />
                  ) : (
                    <ToggleLeft className="w-9 h-9 text-slate-300" />
                  )}
                </button>
              </div>

              {/* QR Attendance flag */}
              <div className="flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
                <div>
                  <h5 className="text-xs font-bold text-slate-800 leading-tight">Absensi QR Code</h5>
                  <p className="text-[9px] text-slate-450 font-semibold mt-1 leading-none">
                    Scanner kehadiran digital warga
                  </p>
                </div>
                <button onClick={() => toggleFeature('qrAttendance')}>
                  {features.qrAttendance ? (
                    <ToggleRight className="w-9 h-9 text-purple-600" />
                  ) : (
                    <ToggleLeft className="w-9 h-9 text-slate-300" />
                  )}
                </button>
              </div>

              {/* Digital Card flag */}
              <div className="flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
                <div>
                  <h5 className="text-xs font-bold text-slate-800 leading-tight">Kartu Warga Digital</h5>
                  <p className="text-[9px] text-slate-450 font-semibold mt-1 leading-none">
                    Bukti digital verified kependudukan
                  </p>
                </div>
                <button onClick={() => toggleFeature('digitalCard')}>
                  {features.digitalCard ? (
                    <ToggleRight className="w-9 h-9 text-purple-600" />
                  ) : (
                    <ToggleLeft className="w-9 h-9 text-slate-300" />
                  )}
                </button>
              </div>

              {/* Auto Dues Reminder flag */}
              <div className="flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
                <div>
                  <h5 className="text-xs font-bold text-slate-800 leading-tight">Reminder Iuran Otomatis</h5>
                  <p className="text-[9px] text-slate-450 font-semibold mt-1 leading-none">
                    Kirim notifikasi jatuh tempo otomatis
                  </p>
                </div>
                <button onClick={() => toggleFeature('autoReminder')}>
                  {features.autoReminder ? (
                    <ToggleRight className="w-9 h-9 text-purple-600" />
                  ) : (
                    <ToggleLeft className="w-9 h-9 text-slate-300" />
                  )}
                </button>
              </div>

            </div>
          </div>

          {/* C. System Override Audit timeline logs */}
          <div className="bg-white rounded-3xl border border-slate-100 p-5 space-y-4 shadow-xs">
            <div className="flex items-center space-x-2 border-b border-slate-50 pb-3">
              <ShieldAlert className="w-4 h-4 text-purple-600 shrink-0" />
              <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest leading-none">
                Logs Intervensi Konsol Super Admin
              </h4>
            </div>

            <div className="space-y-3.5 pl-1.5 text-xs text-slate-500 font-semibold">
              <div className="relative pl-4 border-l border-purple-100">
                <span className="absolute -left-[5.5px] top-1.5 w-2.5 h-2.5 rounded-full bg-purple-600 ring-4 ring-white shrink-0" />
                <div className="flex justify-between items-baseline gap-2">
                  <p className="font-bold text-slate-800 leading-tight">Database Backup Triggered (Manual)</p>
                  <span className="text-[9px] text-slate-400 font-semibold font-mono shrink-0">Baru saja</span>
                </div>
              </div>

              <div className="relative pl-4 border-l border-purple-100">
                <span className="absolute -left-[5.5px] top-1.5 w-2.5 h-2.5 rounded-full bg-slate-300 ring-4 ring-white shrink-0" />
                <div className="flex justify-between items-baseline gap-2">
                  <p className="font-bold text-slate-700 leading-tight">Toggle Feature "autoReminder" Updated</p>
                  <span className="text-[9px] text-slate-400 font-semibold font-mono shrink-0">1 jam lalu</span>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Right Info Column */}
        <div className="space-y-6">
          
          {/* A. System Counter status panel */}
          <div className="bg-gradient-to-br from-zinc-900 to-purple-950 text-white rounded-2xl p-5 shadow-md shadow-zinc-950/15 relative overflow-hidden shrink-0">
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none" />
            
            <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-purple-100 mb-4">
              Pusat Kendali Utama
            </h4>

            <div className="space-y-4 relative z-10">
              <div className="flex items-center space-x-3.5">
                <div className="w-9 h-9 rounded-xl bg-white/15 text-white flex items-center justify-center shrink-0 border border-white/5 shadow-inner">
                  <Database className="w-4.5 h-4.5" />
                </div>
                <div>
                  <p className="text-[9px] font-bold text-purple-100 uppercase tracking-wide leading-none">Database Status</p>
                  <h5 className="text-sm font-extrabold leading-none mt-1.5">SECURE & BACKED UP</h5>
                </div>
              </div>

              <div className="flex items-center space-x-3.5">
                <div className="w-9 h-9 rounded-xl bg-white/15 text-white flex items-center justify-center shrink-0 border border-white/5 shadow-inner">
                  <Activity className="w-4.5 h-4.5" />
                </div>
                <div>
                  <p className="text-[9px] font-bold text-purple-100 uppercase tracking-wide leading-none">Active Connections</p>
                  <h5 className="text-sm font-extrabold leading-none mt-1.5">4 NODES OPERATIONAL</h5>
                </div>
              </div>
            </div>
          </div>

          {/* B. Administrative Quick Tools Actions */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-xs p-5 space-y-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-purple-600 shrink-0" />
              <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest leading-none">
                Bantuan & Pemulihan
              </h4>
            </div>

            <div className="space-y-2">
              <button 
                onClick={() => toast.success('Pemulihan database (restore) berjalan... Sistem dipulihkan ke kondisi 23 Mei 2026.')}
                className="w-full text-left p-3.5 bg-slate-50/50 hover:bg-rose-50 border border-slate-100 hover:border-rose-200 rounded-xl transition-all font-bold text-xs text-slate-700 hover:text-rose-950 flex items-center"
              >
                <RefreshCw className="w-4 h-4 text-rose-500 mr-2 shrink-0 animate-spin" />
                Trigger Pemulihan Sistem (Restore)
              </button>
            </div>
          </div>

          {/* C. Right notifications timeline feed */}
          <RightInfoPanel 
            role="superadmin"
            notifications={notifications}
          />
        </div>
      </div>
    </div>
  )
}
