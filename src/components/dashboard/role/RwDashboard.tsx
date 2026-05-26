'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Users,
  MapPin,
  TrendingUp,
  FileText,
  BarChart2,
  PieChart,
  ChevronRight,
  AlertOctagon,
  Clock,
  Loader2,
  CheckCircle2,
  XCircle,
  Activity,
  ShieldAlert,
  MailWarning
} from 'lucide-react'
import { Announcement } from '../AnnouncementsWidget'
import { NotificationItem } from '../RightInfoPanel'
import QuickActions from '../QuickActions'
import { createClient } from '@/services/supabase/client'

interface RwDashboardProps {
  fullName: string
  wargaCount: number
  rumahCount: number
  keluargaCount: number
  announcements: Announcement[]
  notifications: NotificationItem[]
}

export default function RwDashboard({
  fullName,
  wargaCount: initialWargaCount,
  rumahCount,
  keluargaCount,
}: RwDashboardProps) {

  const [loading, setLoading] = useState(true)
  const [data, setData] = useState({
    rtBreakdowns: [] as any[],
    totalWarga: initialWargaCount,
    avgRate: 0,
    pendingSuratList: [] as any[],
    pendingSuratCount: 0,
    emergencyReports: [] as any[]
  })

  useEffect(() => {
    async function fetchRealtimeData() {
      const supabase = createClient()
      try {
        // Fetch raw data in parallel for performance
        const [cpRes, lettersRes, reportsRes, duesRes] = await Promise.all([
          // 1. Citizen Profiles (for RT Demographics)
          supabase.from('citizen_profiles').select('id, rt, kk'),
          // 2. Letters pending RW approval
          supabase.from('letter_requests').select('id, letter_type, status, created_at, profile_id').eq('status', 'pending_rw').order('created_at', { ascending: false }).limit(4),
          // 3. Emergency Reports (Prioritas Tinggi)
          supabase.from('reports').select('id, title, description, category, status, created_at, profile_id').in('status', ['submitted', 'reviewing', 'in_progress']).order('created_at', { ascending: false }).limit(4),
          // 4. Dues Payments
          supabase.from('due_payments').select('id, status, profile_id')
        ])

        // Safe extraction
        const citizens = cpRes.data || []
        const letters = lettersRes.data || []
        const reports = reportsRes.data || []
        const dues = duesRes.data || []

        // Extract related profiles to get Full Names and RT mappings for Letters and Reports
        // Since we need to join profile names and RTs, we can fetch all related profiles
        const profileIdsToFetch = new Set<string>()
        letters.forEach(l => l.profile_id && profileIdsToFetch.add(l.profile_id))
        reports.forEach(r => r.profile_id && profileIdsToFetch.add(r.profile_id))

        let profilesMap: Record<string, { full_name: string, rt: string }> = {}
        if (profileIdsToFetch.size > 0) {
          const { data: profs } = await supabase.from('profiles').select('id, full_name').in('id', Array.from(profileIdsToFetch))
          const { data: cProfiles } = await supabase.from('citizen_profiles').select('id, rt').in('id', Array.from(profileIdsToFetch))

          profs?.forEach(p => {
            const cp = cProfiles?.find(c => c.id === p.id)
            profilesMap[p.id] = { full_name: p.full_name, rt: cp?.rt || 'Unknown' }
          })
        }

        // --- 1. Process RT Breakdowns ---
        const rtMap: Record<string, { warga: number, kk: Set<string>, duesTotal: number, duesPaid: number }> = {}

        // Count Demographics
        citizens.forEach(c => {
          const rt = c.rt || '01' // fallback
          if (!rtMap[rt]) rtMap[rt] = { warga: 0, kk: new Set(), duesTotal: 0, duesPaid: 0 }
          rtMap[rt].warga += 1
          if (c.kk) rtMap[rt].kk.add(c.kk)
        })

        // Process Dues Rates (Mapping profile_id to RT via citizens array)
        const citizenRtMap = new Map(citizens.map(c => [c.id, c.rt || '01']))
        dues.forEach(d => {
          const rt = citizenRtMap.get(d.profile_id)
          if (rt && rtMap[rt]) {
            rtMap[rt].duesTotal += 1
            if (d.status === 'paid' || d.status === 'verified') rtMap[rt].duesPaid += 1
          }
        })

        const colors = [
          { color: 'bg-blue-500', fill: '#3b82f6' },
          { color: 'bg-indigo-500', fill: '#6366f1' },
          { color: 'bg-cyan-500', fill: '#06b6d4' },
          { color: 'bg-sky-500', fill: '#0ea5e9' },
          { color: 'bg-slate-500', fill: '#64748b' }
        ]

        const processedBreakdowns = Object.keys(rtMap).sort().map((rt, i) => {
          const item = rtMap[rt]
          const rate = item.duesTotal > 0 ? Math.round((item.duesPaid / item.duesTotal) * 100) : 0
          const colorObj = colors[i % colors.length]
          return {
            name: `RT ${rt.padStart(2, '0')}`,
            warga: item.warga,
            kk: item.kk.size,
            rate: rate,
            color: colorObj.color,
            fill: colorObj.fill
          }
        })

        // Averages
        const totalWarga = processedBreakdowns.reduce((s, i) => s + i.warga, 0) || initialWargaCount
        const avgRate = processedBreakdowns.length > 0
          ? Math.round(processedBreakdowns.reduce((s, i) => s + i.rate, 0) / processedBreakdowns.length)
          : 0

        // Process Letters
        const mappedLetters = letters.map(l => ({
          id: l.id,
          type: l.letter_type,
          name: profilesMap[l.profile_id]?.full_name || 'Warga',
          rt: `RT ${profilesMap[l.profile_id]?.rt?.padStart(2, '0') || '01'}`,
          date: new Date(l.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
        }))

        // Process Reports (Map to emergency style)
        const mappedReports = reports.map(r => ({
          id: r.id,
          title: r.title,
          desc: r.description,
          rt: `RT ${profilesMap[r.profile_id]?.rt?.padStart(2, '0') || '01'}`,
          priority: 'Tinggi', // All mapped here are considered emergency
          time: new Date(r.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
        }))

        setData({
          rtBreakdowns: processedBreakdowns,
          totalWarga,
          avgRate,
          pendingSuratList: mappedLetters,
          pendingSuratCount: lettersRes.count || mappedLetters.length,
          emergencyReports: mappedReports
        })
      } catch (error) {
        console.error('Failed to fetch realtime data', error)
      } finally {
        setLoading(false)
      }
    }

    fetchRealtimeData()
  }, [initialWargaCount])

  if (loading) {
    return (
      <div className="relative bg-slate-100 min-h-screen p-8 -m-8 flex flex-col items-center justify-center space-y-4 overflow-hidden z-0">
        {/* Wave Background for Loading */}
        <div className="absolute top-0 left-0 w-full h-auto pointer-events-none -z-10 opacity-100">
          <svg viewBox="0 0 1440 320" preserveAspectRatio="none" className="w-full h-[300px] md:h-[400px]">
            <defs>
              <linearGradient id="wave-grad-loading" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#2563eb" /> {/* blue-600 */}
                <stop offset="100%" stopColor="#3b82f6" /> {/* blue-500 */}
              </linearGradient>
            </defs>
            <path fill="url(#wave-grad-loading)" d="M0,192L48,197.3C96,203,192,213,288,229.3C384,245,480,267,576,250.7C672,235,768,181,864,181.3C960,181,1056,235,1152,234.7C1248,235,1344,181,1392,154.7L1440,128L1440,0L1392,0C1344,0,1248,0,1152,0C1056,0,960,0,864,0C768,0,672,0,576,0C480,0,384,0,288,0C192,0,96,0,48,0L0,0Z"></path>
          </svg>
        </div>
        <Loader2 className="w-8 h-8 text-white animate-spin relative z-10" />
        <p className="text-sm font-bold text-blue-100 animate-pulse relative z-10">Menyiapkan Konsol Eksekutif...</p>
      </div>
    )
  }

  const { rtBreakdowns, totalWarga, avgRate, pendingSuratList, pendingSuratCount, emergencyReports } = data

  return (
    <div className="relative bg-slate-100 min-h-screen p-4 sm:p-6 lg:p-8 -m-4 sm:-m-6 lg:-m-8 rounded-none sm:rounded-tl-3xl transition-all overflow-hidden z-0">
      
      {/* Absolute Wave Background */}
      <div className="absolute top-0 left-0 w-full h-auto pointer-events-none -z-10 opacity-100">
        <svg viewBox="0 0 1440 320" preserveAspectRatio="none" className="w-full h-[300px] md:h-[400px]">
          <defs>
            <linearGradient id="wave-grad-main" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#2563eb" /> {/* blue-600 */}
              <stop offset="100%" stopColor="#3b82f6" /> {/* blue-500 */}
            </linearGradient>
          </defs>
          <path fill="url(#wave-grad-main)" d="M0,192L48,197.3C96,203,192,213,288,229.3C384,245,480,267,576,250.7C672,235,768,181,864,181.3C960,181,1056,235,1152,234.7C1248,235,1344,181,1392,154.7L1440,128L1440,0L1392,0C1344,0,1248,0,1152,0C1056,0,960,0,864,0C768,0,672,0,576,0C480,0,384,0,288,0C192,0,96,0,48,0L0,0Z"></path>
        </svg>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto space-y-8 select-none pb-20">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight leading-tight flex items-center gap-2">
              <Activity className="w-7 h-7 text-white" />
              Konsol Eksekutif <span className="text-blue-200">RW 05</span>
            </h1>
            <p className="text-sm font-medium text-blue-100 mt-1 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-300" />
              Sinkronisasi data wilayah realtime berhasil. Selamat bekerja, Bapak {fullName}.
            </p>
          </div>
        </div>

            {/* 0. Quick Actions (Aksi Cepat) */}
            <QuickActions role="rw" />

            {/* 1. Rangkuman Data Induk Wilayah (Grid 4 Kolom) */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {/* Card 1 */}
          <div className="bg-white rounded-xl md:rounded-2xl p-4 md:p-5 shadow-sm shadow-slate-200 border border-slate-100/80 flex flex-col justify-between transition-transform hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Users className="w-4 h-4 md:w-5 md:h-5" />
              </div>
              <span className="text-[10px] md:text-xs font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 md:px-2 md:py-1 rounded-full flex items-center gap-1">
                <TrendingUp className="w-3 h-3 hidden md:block" /> <span className="hidden md:inline">Live</span><span className="md:hidden">+4%</span>
              </span>
            </div>
            <div className="mt-3 md:mt-4">
              <h3 className="text-2xl md:text-3xl font-black text-slate-800">{totalWarga}</h3>
              <p className="text-[9px] md:text-xs font-semibold text-slate-500 mt-1 uppercase tracking-wider md:tracking-wide">Total Warga</p>
            </div>
          </div>

          {/* Card 2 */}
          <div className="bg-white rounded-xl md:rounded-2xl p-4 md:p-5 shadow-sm shadow-slate-200 border border-slate-100/80 flex flex-col justify-between transition-transform hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center">
                <MapPin className="w-4 h-4 md:w-5 md:h-5" />
              </div>
              <span className="text-[10px] md:text-xs font-bold text-slate-500 bg-slate-50 px-1.5 py-0.5 md:px-2 md:py-1 rounded-full">Aktif</span>
            </div>
            <div className="mt-3 md:mt-4">
              <h3 className="text-2xl md:text-3xl font-black text-slate-800">{rtBreakdowns.length}</h3>
              <p className="text-[9px] md:text-xs font-semibold text-slate-500 mt-1 uppercase tracking-wider md:tracking-wide">RT Aktif</p>
            </div>
          </div>

          {/* Card 3 */}
          <div className="bg-white rounded-xl md:rounded-2xl p-4 md:p-5 shadow-sm shadow-slate-200 border border-slate-100/80 flex flex-col justify-between transition-transform hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
                <PieChart className="w-4 h-4 md:w-5 md:h-5" />
              </div>
              <span className={`text-[10px] md:text-xs font-bold px-1.5 py-0.5 md:px-2 md:py-1 rounded-full flex items-center gap-1 ${avgRate >= 70 ? 'text-emerald-600 bg-emerald-50' : 'text-amber-600 bg-amber-50'}`}>
                {avgRate >= 70 ? <CheckCircle2 className="w-3 h-3 hidden md:block" /> : <AlertOctagon className="w-3 h-3 hidden md:block" />}
                {avgRate >= 70 ? 'Sehat' : 'Atensi'}
              </span>
            </div>
            <div className="mt-3 md:mt-4">
              <h3 className="text-2xl md:text-3xl font-black text-slate-800">{avgRate}%</h3>
              <p className="text-[9px] md:text-xs font-semibold text-slate-500 mt-1 uppercase tracking-wider md:tracking-wide">Iuran (Avg)</p>
            </div>
          </div>

          {/* Card 4 */}
          <div className="bg-white rounded-xl md:rounded-2xl p-4 md:p-5 shadow-sm shadow-slate-200 border border-slate-100/80 flex flex-col justify-between transition-transform hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                <MailWarning className="w-4 h-4 md:w-5 md:h-5" />
              </div>
              {pendingSuratCount > 0 ? (
                <span className="text-[10px] md:text-xs font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 md:px-2 md:py-1 rounded-full animate-pulse flex items-center gap-1">
                  <AlertOctagon className="w-3 h-3 hidden md:block" /> TTD
                </span>
              ) : (
                <span className="text-[10px] md:text-xs font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 md:px-2 md:py-1 rounded-full">
                  Tuntas
                </span>
              )}
            </div>
            <div className="mt-3 md:mt-4">
              <h3 className="text-2xl md:text-3xl font-black text-slate-800">{pendingSuratCount}</h3>
              <p className="text-[9px] md:text-xs font-semibold text-slate-500 mt-1 uppercase tracking-wider md:tracking-wide">Surat Tertunda</p>
            </div>
          </div>
        </div>

        {/* Aksi Cepat (Quick Actions) */}
        <div>
          <h2 className="text-sm font-semibold text-slate-500 mb-3">Aksi Cepat</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Link href="/surat" className="flex flex-col md:flex-row items-start md:items-center gap-2 md:gap-3 bg-white p-3 md:p-3.5 rounded-xl border border-slate-100 shadow-sm hover:shadow-md hover:border-blue-200 transition-all group">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors shrink-0">
                <FileText className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-slate-700 group-hover:text-blue-700 transition-colors">Verifikasi Surat</span>
            </Link>
            <Link href="/pengumuman" className="flex flex-col md:flex-row items-start md:items-center gap-2 md:gap-3 bg-white p-3 md:p-3.5 rounded-xl border border-slate-100 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all group">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors shrink-0">
                <Activity className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-slate-700 group-hover:text-indigo-700 transition-colors">Buat Pengumuman</span>
            </Link>
            <Link href="/iuran" className="flex flex-col md:flex-row items-start md:items-center gap-2 md:gap-3 bg-white p-3 md:p-3.5 rounded-xl border border-slate-100 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all group">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors shrink-0">
                <TrendingUp className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-slate-700 group-hover:text-emerald-700 transition-colors">Rekap Iuran</span>
            </Link>
            <Link href="/laporan" className="flex flex-col md:flex-row items-start md:items-center gap-2 md:gap-3 bg-white p-3 md:p-3.5 rounded-xl border border-slate-100 shadow-sm hover:shadow-md hover:border-rose-200 transition-all group">
              <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center group-hover:bg-rose-600 group-hover:text-white transition-colors shrink-0">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-slate-700 group-hover:text-rose-700 transition-colors">Pusat Aduan</span>
            </Link>
          </div>
        </div>

        {/* Row 2: Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Chart 1: Iuran RT */}
          <div className="bg-white rounded-2xl p-6 shadow-sm shadow-slate-200 border border-slate-100/80">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-blue-600" /> Capaian Iuran Antar RT
                </h2>
                <p className="text-xs text-slate-500 mt-1">Persentase warga yang telah melunasi iuran bulan ini.</p>
              </div>
            </div>

            <div className="relative w-full h-40 mt-8 mb-4">
              {rtBreakdowns.length > 0 ? (
                <>
                  {/* SVG Line Background */}
                  <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full overflow-visible pointer-events-none" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="line-gradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.2" />
                        <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <path
                      d={rtBreakdowns.length === 1 
                        ? `M0,100 L0,${100 - rtBreakdowns[0].rate} L100,${100 - rtBreakdowns[0].rate} L100,100 Z`
                        : `M0,100 ${rtBreakdowns.map((rt, i) => `L${(i / (rtBreakdowns.length - 1)) * 100},${100 - rt.rate}`).join(' ')} L100,100 Z`
                      }
                      fill="url(#line-gradient)"
                    />
                    <path
                      d={rtBreakdowns.length === 1
                        ? `M0,${100 - rtBreakdowns[0].rate} L100,${100 - rtBreakdowns[0].rate}`
                        : `M ${rtBreakdowns.map((rt, i) => `${(i / (rtBreakdowns.length - 1)) * 100},${100 - rt.rate}`).join(' L ')}`
                      }
                      fill="none"
                      stroke="#3b82f6"
                      strokeWidth="2"
                      vectorEffect="non-scaling-stroke"
                    />
                  </svg>

                  {/* Interactive Dots and Labels */}
                  {rtBreakdowns.map((rt, i) => (
                    <div 
                      key={rt.name} 
                      className="absolute group flex flex-col items-center justify-end" 
                      style={{ 
                        left: `${rtBreakdowns.length === 1 ? 50 : (i / (rtBreakdowns.length - 1)) * 100}%`,
                        bottom: 0,
                        top: 0,
                        width: '40px',
                        transform: 'translateX(-50%)'
                      }}
                    >
                      {/* Interactive area to trigger hover easily */}
                      <div className="absolute inset-0 w-full h-full z-0 cursor-pointer" />
                      
                      {/* The Dot */}
                      <div 
                        className="w-3.5 h-3.5 rounded-full bg-white border-2 border-blue-500 shadow-sm transition-transform group-hover:scale-150 group-hover:border-blue-600 absolute z-10 pointer-events-none"
                        style={{ bottom: `calc(${rt.rate}% - 7px)` }}
                      />
                      
                      {/* Tooltip */}
                      <div 
                        className="absolute opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-white text-xs font-bold py-1 px-2 rounded-lg pointer-events-none whitespace-nowrap z-20"
                        style={{ bottom: `calc(${rt.rate}% + 12px)` }}
                      >
                        {rt.rate}% Lunas
                      </div>
                      
                      {/* X-axis Label */}
                      <span className="text-[10px] font-bold text-slate-500 absolute -bottom-6 whitespace-nowrap pointer-events-none">{rt.name}</span>
                    </div>
                  ))}
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs font-medium">Belum ada data RT</div>
              )}
            </div>
          </div>

          {/* Chart 2: Distribusi Penduduk */}
          <div className="bg-white rounded-2xl p-6 shadow-sm shadow-slate-200 border border-slate-100/80">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-600" /> Distribusi Kepadatan Warga
                </h2>
                <p className="text-xs text-slate-500 mt-1">Proporsi populasi warga per wilayah RT.</p>
              </div>
            </div>

            <div className="flex flex-col justify-center h-48">
              {rtBreakdowns.length > 0 ? (
                <>
                  {/* Custom Horizontal Stacked Bar */}
                  <div className="w-full h-8 flex rounded-xl overflow-hidden shadow-sm border border-slate-100/50">
                    {rtBreakdowns.map(rt => (
                      <div
                        key={rt.name}
                        className={`${rt.color} h-full transition-all hover:brightness-110`}
                        style={{ width: `${(rt.warga / totalWarga) * 100}%` }}
                        title={`${rt.name}: ${rt.warga} Jiwa`}
                      />
                    ))}
                  </div>

                  {/* Legend */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8">
                    {rtBreakdowns.map(rt => (
                      <div key={rt.name} className="flex flex-col items-center p-3 bg-[#F4F6FA] rounded-xl border border-slate-100/50 hover:border-blue-200 transition-colors cursor-default">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`w-2.5 h-2.5 rounded-full ${rt.color} shadow-sm`} />
                          <span className="text-[10px] font-bold text-slate-500 uppercase">{rt.name}</span>
                        </div>
                        <span className="text-lg font-black text-slate-800">{rt.warga}</span>
                        <span className="text-[9px] font-semibold text-slate-400">Jiwa</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs font-medium">Belum ada data Distribusi</div>
              )}
            </div>
          </div>

        </div>

        {/* Row 3: Activity & Monitoring */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Antrean Surat */}
          <div className="bg-white rounded-2xl p-6 shadow-sm shadow-slate-200 border border-slate-100/80 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" /> Antrean Verifikasi Surat
              </h2>
              <Link href="/surat" className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center">
                Lihat Semua <ChevronRight className="w-3 h-3 ml-1" />
              </Link>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto">
              {pendingSuratList.length > 0 ? pendingSuratList.map((surat) => (
                <div key={surat.id} className="flex items-center justify-between p-3.5 bg-[#F4F6FA] rounded-xl border border-slate-100 hover:border-blue-200 transition-colors cursor-pointer group">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm shrink-0">
                      <FileText className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-800 group-hover:text-blue-700 transition-colors">{surat.type}</h4>
                      <p className="text-xs font-medium text-slate-500 mt-0.5">{surat.name} • <span className="font-bold text-slate-600">{surat.rt}</span></p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="inline-flex items-center text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-md">
                      <Clock className="w-3 h-3 mr-1" /> Menunggu
                    </span>
                    <p className="text-[9px] text-slate-400 mt-1 font-medium">{surat.date}</p>
                  </div>
                </div>
              )) : (
                <div className="flex flex-col items-center justify-center h-full text-slate-400 opacity-70">
                  <CheckCircle2 className="w-8 h-8 mb-2 text-emerald-400" />
                  <p className="text-xs font-medium">Semua surat telah diverifikasi</p>
                </div>
              )}
            </div>
          </div>

          {/* Feed Aduan Darurat */}
          <div className="bg-white rounded-2xl p-6 shadow-sm shadow-slate-200 border border-slate-100/80 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-500" /> Feed Aduan Warga
              </h2>
              <Link href="/laporan" className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center">
                Pusat Aduan <ChevronRight className="w-3 h-3 ml-1" />
              </Link>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto">
              {emergencyReports.length > 0 ? emergencyReports.map((aduan) => (
                <div key={aduan.id} className="flex gap-3 p-4 bg-[#F4F6FA] rounded-xl border border-slate-100 relative overflow-hidden">
                  <div className={`absolute left-0 top-0 bottom-0 w-1 bg-rose-500`} />
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-rose-100 text-rose-600`}>
                    <AlertOctagon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-sm font-bold text-slate-800 truncate">{aduan.title}</h4>
                      <span className="text-[9px] font-bold text-slate-400 shrink-0">{aduan.time}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1 truncate">{aduan.desc}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-[10px] font-bold bg-white text-slate-600 px-2 py-0.5 rounded shadow-sm border border-slate-100">{aduan.rt}</span>
                      <span className={`text-[9px] font-extrabold uppercase tracking-wider text-rose-600`}>
                        Prioritas {aduan.priority}
                      </span>
                    </div>
                  </div>
                </div>
              )) : (
                <div className="flex flex-col items-center justify-center h-full text-slate-400 opacity-70">
                  <ShieldAlert className="w-8 h-8 mb-2 text-slate-300" />
                  <p className="text-xs font-medium">Tidak ada aduan warga aktif</p>
                </div>
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  )
}
