'use client'

import Link from 'next/link'
import { 
  Users, 
  Home, 
  FolderOpen, 
  AlertTriangle, 
  CheckCircle2, 
  FileText, 
  PlusCircle, 
  Calendar, 
  UserCheck, 
  ShieldAlert, 
  ChevronRight, 
  Settings 
} from 'lucide-react'
import DuesSummaryWidget, { DuePayment } from '../DuesSummaryWidget'
import AnnouncementsWidget, { Announcement } from '../AnnouncementsWidget'
import RightInfoPanel, { NotificationItem } from '../RightInfoPanel'
import ShortcutGrid from '../ShortcutGrid'

interface RtDashboardProps {
  fullName: string
  wargaCount: number
  rumahCount: number
  keluargaCount: number
  totalRegionalDues: number
  regionalCount: number
  announcements: Announcement[]
  notifications: NotificationItem[]
  dues: DuePayment[] // staff view or fallback
}

export default function RtDashboard({
  fullName,
  wargaCount,
  rumahCount,
  keluargaCount,
  totalRegionalDues,
  regionalCount,
  announcements,
  notifications,
  dues
}: RtDashboardProps) {

  // Mock pending actions count for RT dashboard
  const pendingLettersCount = 3
  const pendingDuesVerification = regionalCount

  return (
    <div className="space-y-6 pb-20 select-none">
      {/* 1. Top Greeting Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-2 bg-transparent">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight leading-none">
            Selamat Datang, <span className="text-emerald-600 font-black">{fullName}</span> 👋
          </h1>
          <p className="text-xs font-semibold text-slate-450 mt-1.5">
            Konsol Pengurus RT 03 / RW 05 • Emerald Theme
          </p>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <Link 
            href="/settings"
            className="flex items-center space-x-1.5 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-100 rounded-xl shadow-xs transition-all hover:scale-105 active:scale-95 text-xs font-bold text-slate-700"
          >
            <Settings className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Pengaturan</span>
          </Link>
        </div>
      </div>

      {/* Grid structure */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left/Middle Column (Flexible main feed) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* A. Aggregate Regional Outstanding Dues */}
          <DuesSummaryWidget 
            role="rt" 
            totalRegionalDues={totalRegionalDues} 
            regionalCount={regionalCount} 
          />

          {/* B. Pending Approvals Grid Alerts */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Letter Approvals */}
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100 rounded-3xl p-5 flex flex-col justify-between h-40 relative overflow-hidden group">
              <div className="absolute right-4 -bottom-4 text-amber-500/10 pointer-events-none transform group-hover:scale-110 transition-transform duration-500">
                <FileText className="w-24 h-24" />
              </div>
              <div className="space-y-1.5">
                <span className="px-2 py-0.5 text-[8px] font-extrabold uppercase rounded-full bg-amber-100 text-amber-700 border border-amber-200 tracking-wider">
                  Menunggu Persetujuan
                </span>
                <h3 className="text-base font-black text-slate-800 mt-2">Persetujuan Surat Pengantar</h3>
                <p className="text-[10px] text-slate-450 font-semibold leading-relaxed">
                  Terdapat {pendingLettersCount} surat pengantar diajukan warga yang butuh ttd digital Anda.
                </p>
              </div>
              <Link 
                href="/surat"
                className="mt-3 inline-flex items-center text-xs font-bold text-amber-700 hover:text-amber-800 hover:translate-x-0.5 transition-all"
              >
                Proses Surat &rarr;
              </Link>
            </div>

            {/* Dues Verifications */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-3xl p-5 flex flex-col justify-between h-40 relative overflow-hidden group">
              <div className="absolute right-4 -bottom-4 text-blue-500/10 pointer-events-none transform group-hover:scale-110 transition-transform duration-500">
                <CheckCircle2 className="w-24 h-24" />
              </div>
              <div className="space-y-1.5">
                <span className="px-2 py-0.5 text-[8px] font-extrabold uppercase rounded-full bg-blue-100 text-blue-700 border border-blue-200 tracking-wider">
                  Verifikasi Pembayaran
                </span>
                <h3 className="text-base font-black text-slate-800 mt-2">Konfirmasi Kas Iuran</h3>
                <p className="text-[10px] text-slate-450 font-semibold leading-relaxed">
                  Terdapat {pendingDuesVerification} konfirmasi transfer iuran bulanan dari warga wilayah RT.
                </p>
              </div>
              <Link 
                href="/iuran"
                className="mt-3 inline-flex items-center text-xs font-bold text-blue-700 hover:text-blue-800 hover:translate-x-0.5 transition-all"
              >
                Verifikasi &rarr;
              </Link>
            </div>

          </div>

          {/* C. Service Shortcuts */}
          <ShortcutGrid role="rt" />

          {/* D. Warga Terbaru Register list */}
          <div className="bg-white rounded-3xl border border-slate-100/80 shadow-xs p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-50 pb-3">
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4 text-emerald-600 shrink-0" />
                <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest leading-none">
                  Anggota Warga Terdaftar Terbaru
                </h4>
              </div>
              <Link href="/warga" className="text-[10px] font-extrabold text-emerald-600 hover:text-emerald-700 uppercase tracking-wider">
                Kelola Semua &rarr;
              </Link>
            </div>

            <div className="divide-y divide-slate-50 space-y-3">
              <div className="flex items-center justify-between pt-3 first:pt-0">
                <div className="flex items-center space-x-3.5 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs shrink-0 border border-emerald-100/50">
                    A
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-800 leading-tight">Ahmad Subardjo</p>
                    <p className="text-[9px] font-semibold text-slate-400 mt-1 leading-none font-mono">NIK: 327608120584****</p>
                  </div>
                </div>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[8px] font-extrabold tracking-wide uppercase bg-emerald-50 text-emerald-600 border border-emerald-100 leading-none">
                  <UserCheck className="w-2.5 h-2.5 mr-0.5" /> Aktif
                </span>
              </div>

              <div className="flex items-center justify-between pt-3">
                <div className="flex items-center space-x-3.5 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs shrink-0 border border-emerald-100/50">
                    N
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-800 leading-tight">Nurul Hidayah</p>
                    <p className="text-[9px] font-semibold text-slate-400 mt-1 leading-none font-mono">NIK: 327609240892****</p>
                  </div>
                </div>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[8px] font-extrabold tracking-wide uppercase bg-emerald-50 text-emerald-600 border border-emerald-100 leading-none">
                  <UserCheck className="w-2.5 h-2.5 mr-0.5" /> Aktif
                </span>
              </div>
            </div>
          </div>

          {/* E. Announcements Feed */}
          <AnnouncementsWidget announcements={announcements} />
        </div>

        {/* Right Info Column */}
        <div className="space-y-6">
          
          {/* A. Statistics Widgets (RT counts) */}
          <div className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white rounded-2xl p-5 shadow-md shadow-emerald-600/15 relative overflow-hidden shrink-0">
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none" />
            
            <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-100 mb-4">
              Statistik Kependudukan RT
            </h4>

            <div className="space-y-4 relative z-10">
              {/* Total Warga */}
              <div className="flex items-center space-x-3.5">
                <div className="w-9 h-9 rounded-xl bg-white/15 text-white flex items-center justify-center shrink-0 border border-white/5 shadow-inner">
                  <Users className="w-4.5 h-4.5" />
                </div>
                <div>
                  <p className="text-[9px] font-bold text-emerald-100 uppercase tracking-wide leading-none">Warga Terdaftar</p>
                  <h5 className="text-sm font-extrabold leading-none mt-1.5">{wargaCount} Jiwa</h5>
                </div>
              </div>

              {/* Rumah Terdaftar */}
              <div className="flex items-center space-x-3.5">
                <div className="w-9 h-9 rounded-xl bg-white/15 text-white flex items-center justify-center shrink-0 border border-white/5 shadow-inner">
                  <Home className="w-4.5 h-4.5" />
                </div>
                <div>
                  <p className="text-[9px] font-bold text-emerald-100 uppercase tracking-wide leading-none">Rumah Terdaftar</p>
                  <h5 className="text-sm font-extrabold leading-none mt-1.5">{rumahCount} Unit</h5>
                </div>
              </div>

              {/* Jumlah Keluarga */}
              <div className="flex items-center space-x-3.5">
                <div className="w-9 h-9 rounded-xl bg-white/15 text-white flex items-center justify-center shrink-0 border border-white/5 shadow-inner">
                  <FolderOpen className="w-4.5 h-4.5" />
                </div>
                <div>
                  <p className="text-[9px] font-bold text-emerald-100 uppercase tracking-wide leading-none">Jumlah Keluarga (KK)</p>
                  <h5 className="text-sm font-extrabold leading-none mt-1.5">{keluargaCount} KK</h5>
                </div>
              </div>
            </div>
          </div>

          {/* B. Administrative Quick Tools Actions */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-xs p-5 space-y-4">
            <div className="flex items-center space-x-2">
              <ShieldAlert className="w-4 h-4 text-emerald-600 shrink-0" />
              <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest leading-none">
                Peralatan Kilat Pengurus
              </h4>
            </div>

            <div className="grid grid-cols-2 gap-3.5">
              <Link 
                href="/pengumuman"
                className="flex flex-col items-center justify-center p-4 bg-slate-50/50 hover:bg-emerald-50 border border-slate-100 hover:border-emerald-200 rounded-2xl transition-colors text-center group"
              >
                <PlusCircle className="w-5 h-5 text-emerald-600 group-hover:scale-110 transition-transform mb-1.5" />
                <span className="text-[10px] font-bold text-slate-700 group-hover:text-emerald-950">Buat Info Baru</span>
              </Link>

              <Link 
                href="/kegiatan"
                className="flex flex-col items-center justify-center p-4 bg-slate-50/50 hover:bg-teal-50 border border-slate-100 hover:border-teal-200 rounded-2xl transition-colors text-center group"
              >
                <Calendar className="w-5 h-5 text-teal-600 group-hover:scale-110 transition-transform mb-1.5" />
                <span className="text-[10px] font-bold text-slate-700 group-hover:text-teal-950">Jadwal Agenda</span>
              </Link>
            </div>
          </div>

          {/* C. Right notifications timeline feed */}
          <RightInfoPanel 
            role="rt"
            wargaCount={wargaCount}
            rumahCount={rumahCount}
            keluargaCount={keluargaCount}
            notifications={notifications}
          />
        </div>
      </div>
    </div>
  )
}
