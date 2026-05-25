'use client'

import Link from 'next/link'
import { 
  Users, 
  Home, 
  FolderOpen, 
  TrendingUp, 
  MapPin, 
  Calendar, 
  ShieldCheck, 
  FileText, 
  BarChart2, 
  ChevronRight 
} from 'lucide-react'
import AnnouncementsWidget, { Announcement } from '../AnnouncementsWidget'
import RightInfoPanel, { NotificationItem } from '../RightInfoPanel'

interface RwDashboardProps {
  fullName: string
  wargaCount: number // aggregate
  rumahCount: number // aggregate
  keluargaCount: number // aggregate
  announcements: Announcement[]
  notifications: NotificationItem[]
}

export default function RwDashboard({
  fullName,
  wargaCount,
  rumahCount,
  keluargaCount,
  announcements,
  notifications
}: RwDashboardProps) {

  // RT breakdown under RW 05 jurisdiction
  const rtBreakdowns = [
    { name: 'RT 01', warga: 120, kk: 32, rumah: 30, rate: '85%' },
    { name: 'RT 02', warga: 98, kk: 26, rumah: 24, rate: '78%' },
    { name: 'RT 03', warga: wargaCount || 142, kk: keluargaCount || 45, rumah: rumahCount || 38, rate: '92%' },
    { name: 'RT 04', warga: 110, kk: 30, rumah: 28, rate: '81%' }
  ]

  // Rank RTs by dues payment rates
  const sortedRankings = [...rtBreakdowns].sort((a, b) => parseInt(b.rate) - parseInt(a.rate))

  const totalWargaRW = rtBreakdowns.reduce((sum, item) => sum + item.warga, 0)
  const totalKKRW = rtBreakdowns.reduce((sum, item) => sum + item.kk, 0)
  const totalRumahRW = rtBreakdowns.reduce((sum, item) => sum + item.rumah, 0)

  return (
    <div className="space-y-6 pb-20 select-none">
      {/* 1. Greeting Top Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-2 bg-transparent">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight leading-none">
            Selamat Datang, <span className="text-purple-600 font-black">{fullName}</span> 👋
          </h1>
          <p className="text-xs font-semibold text-slate-450 mt-1.5">
            Konsol Pengurus RW 05 • Purple Theme
          </p>
        </div>
      </div>

      {/* Grid panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left/Middle Column (Flexible main feed) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* A. Dynamic RT performance rankings */}
          <div className="bg-white rounded-3xl border border-slate-100 p-5 space-y-4 shadow-xs">
            <div className="flex items-center space-x-2 border-b border-slate-50 pb-3">
              <BarChart2 className="w-4 h-4 text-purple-600 shrink-0" />
              <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest leading-none">
                Peringkat Kepatuhan Pembayaran Iuran RT
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {sortedRankings.map((rt, index) => (
                <div 
                  key={rt.name} 
                  className="bg-slate-50/50 rounded-2xl border border-slate-100 p-4 flex items-center justify-between transition-all hover:scale-[1.01]"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-7 h-7 rounded-xl bg-purple-50 text-purple-600 border border-purple-100/50 flex items-center justify-center font-extrabold text-xs shrink-0">
                      {index + 1}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800 leading-tight">{rt.name}</p>
                      <p className="text-[9px] font-semibold text-slate-400 mt-1 leading-none">
                        Collection Rate
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-slate-800 leading-none">{rt.rate}</p>
                    <span className="text-[8px] font-extrabold text-emerald-600 uppercase tracking-wide leading-none mt-1 inline-block">
                      Tinggi
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* B. Inter-RT Statistics Grid Table */}
          <div className="bg-white rounded-3xl border border-slate-100 p-5 space-y-4 shadow-xs">
            <div className="flex items-center space-x-2 border-b border-slate-50 pb-3">
              <TrendingUp className="w-4 h-4 text-purple-600 shrink-0" />
              <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest leading-none">
                Data Perbandingan RT Binaan (RW 05)
              </h4>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-slate-400 border-b border-slate-50">
                    <th className="pb-2.5 font-bold uppercase tracking-wider text-[9px]">Nama Wilayah</th>
                    <th className="pb-2.5 font-bold uppercase tracking-wider text-[9px] text-center">Warga (Jiwa)</th>
                    <th className="pb-2.5 font-bold uppercase tracking-wider text-[9px] text-center">Keluarga (KK)</th>
                    <th className="pb-2.5 font-bold uppercase tracking-wider text-[9px] text-center">Rumah (Unit)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {rtBreakdowns.map((rt) => (
                    <tr key={rt.name} className="hover:bg-slate-50/30 transition-colors">
                      <td className="py-3 font-bold text-slate-700">{rt.name}</td>
                      <td className="py-3 font-bold text-slate-600 text-center">{rt.warga} Jiwa</td>
                      <td className="py-3 font-bold text-slate-600 text-center">{rt.kk} KK</td>
                      <td className="py-3 font-bold text-slate-600 text-center">{rt.rumah} Unit</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* C. Announcements Feed */}
          <AnnouncementsWidget announcements={announcements} />
        </div>

        {/* Right Info Column */}
        <div className="space-y-6">
          
          {/* A. Statistics Widgets (RW aggregate counts) */}
          <div className="bg-gradient-to-br from-purple-600 to-indigo-700 text-white rounded-2xl p-5 shadow-md shadow-purple-600/15 relative overflow-hidden shrink-0">
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none" />
            
            <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-purple-100 mb-4">
              Statistik Akumulatif RW 05
            </h4>

            <div className="space-y-4 relative z-10">
              {/* Total Warga */}
              <div className="flex items-center space-x-3.5">
                <div className="w-9 h-9 rounded-xl bg-white/15 text-white flex items-center justify-center shrink-0 border border-white/5 shadow-inner">
                  <Users className="w-4.5 h-4.5" />
                </div>
                <div>
                  <p className="text-[9px] font-bold text-purple-100 uppercase tracking-wide leading-none">Total Warga Binaan</p>
                  <h5 className="text-sm font-extrabold leading-none mt-1.5">{totalWargaRW} Jiwa</h5>
                </div>
              </div>

              {/* Rumah Terdaftar */}
              <div className="flex items-center space-x-3.5">
                <div className="w-9 h-9 rounded-xl bg-white/15 text-white flex items-center justify-center shrink-0 border border-white/5 shadow-inner">
                  <Home className="w-4.5 h-4.5" />
                </div>
                <div>
                  <p className="text-[9px] font-bold text-purple-100 uppercase tracking-wide leading-none">Total Rumah Terdaftar</p>
                  <h5 className="text-sm font-extrabold leading-none mt-1.5">{totalRumahRW} Unit</h5>
                </div>
              </div>

              {/* Jumlah Keluarga */}
              <div className="flex items-center space-x-3.5">
                <div className="w-9 h-9 rounded-xl bg-white/15 text-white flex items-center justify-center shrink-0 border border-white/5 shadow-inner">
                  <FolderOpen className="w-4.5 h-4.5" />
                </div>
                <div>
                  <p className="text-[9px] font-bold text-purple-100 uppercase tracking-wide leading-none">Total Keluarga (KK)</p>
                  <h5 className="text-sm font-extrabold leading-none mt-1.5">{totalKKRW} KK</h5>
                </div>
              </div>
            </div>
          </div>

          {/* B. Joint Programs Timeline */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-xs p-5 space-y-4">
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-purple-600 shrink-0" />
              <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest leading-none">
                Agenda Rencana Kerja Antar RT
              </h4>
            </div>

            <div className="space-y-4 pl-1">
              <div className="relative pl-4 border-l border-purple-100">
                <span className="absolute -left-[5.5px] top-1.5 w-2.5 h-2.5 rounded-full bg-purple-600 ring-4 ring-white shrink-0" />
                <div>
                  <p className="text-xs font-bold text-slate-800 leading-tight">Posko Imunisasi Balita RW 05</p>
                  <p className="text-[9px] font-semibold text-slate-400 mt-1 leading-none">
                    Minggu, 24 Mei • Balai RW 05
                  </p>
                </div>
              </div>

              <div className="relative pl-4 border-l border-purple-100">
                <span className="absolute -left-[5.5px] top-1.5 w-2.5 h-2.5 rounded-full bg-purple-300 ring-4 ring-white shrink-0" />
                <div>
                  <p className="text-xs font-bold text-slate-700 leading-tight">Festival Kebersihan Antar RT</p>
                  <p className="text-[9px] font-semibold text-slate-400 mt-1 leading-none">
                    Sabtu, 6 Juni • Seluruh RT 01-04
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* C. Right notifications timeline feed */}
          <RightInfoPanel 
            role="rw"
            wargaCount={totalWargaRW}
            rumahCount={totalRumahRW}
            keluargaCount={totalKKRW}
            notifications={notifications}
          />
        </div>
      </div>
    </div>
  )
}
