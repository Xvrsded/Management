'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { 
  Users, 
  Wallet, 
  AlertOctagon, 
  BellRing, 
  FileText, 
  CheckCircle2, 
  UserPlus, 
  Activity,
  Loader2
} from 'lucide-react'
import { Announcement } from '../AnnouncementsWidget'
import { NotificationItem } from '../RightInfoPanel'
import { DuePayment } from '../DuesSummaryWidget'
import QuickActions from '../QuickActions'
import { createClient } from '@/services/supabase/client'

interface RtDashboardProps {
  fullName: string
  wargaCount: number
  rumahCount: number
  keluargaCount: number
  totalRegionalDues: number
  regionalCount: number
  announcements: Announcement[]
  notifications: NotificationItem[]
  dues: DuePayment[]
}

export default function RtDashboard({
  fullName,
  wargaCount: initialWargaCount,
  totalRegionalDues,
}: RtDashboardProps) {

  const [loading, setLoading] = useState(true)
  const [data, setData] = useState({
    wargaCount: initialWargaCount,
    kasBulanIni: totalRegionalDues || 0,
    wargaMenunggak: 0,
    perluTindakan: 0,
    suratMenunggu: [] as any[],
    iuranMenunggu: [] as any[]
  })

  useEffect(() => {
    async function fetchRealtimeData() {
      const supabase = createClient()
      try {
        const { data: sessionData } = await supabase.auth.getSession()
        if (!sessionData.session?.user) return
        const userId = sessionData.session.user.id

        // Get RT info for this user
        const { data: citizenProfile } = await supabase.from('citizen_profiles').select('rt').eq('id', userId).maybeSingle()
        const myRt = citizenProfile?.rt || '01' // fallback

        // Parallel Fetch
        const [wargaRes, lettersRes, duesRes, unpaidDuesRes, reportsRes] = await Promise.all([
          supabase.from('citizen_profiles').select('id, profiles(full_name)').eq('rt', myRt),
          supabase.from('letter_requests').select('id, letter_type, status, created_at, profiles(full_name)').eq('status', 'pending_rt').order('created_at', { ascending: false }).limit(3),
          supabase.from('due_payments').select('id, amount, status, created_at, profiles(full_name)').eq('status', 'pending_verification').order('created_at', { ascending: false }).limit(3),
          supabase.from('due_payments').select('id, profile_id').eq('status', 'unpaid'),
          supabase.from('reports').select('id').in('status', ['submitted', 'reviewing'])
        ])

        const warga = wargaRes.data || []
        const letters = lettersRes.data || []
        const duesVerification = duesRes.data || []
        const unpaidDues = unpaidDuesRes.data || []
        const reports = reportsRes.data || []

        // Calculate unique KK/Profiles with unpaid dues
        const menunggakSet = new Set(unpaidDues.map(d => d.profile_id))
        
        // Format lists
        const formatTimeAgo = (dateString: string) => {
          const date = new Date(dateString)
          const diff = Math.floor((new Date().getTime() - date.getTime()) / 1000)
          if (diff < 60) return 'Baru saja'
          if (diff < 3600) return `${Math.floor(diff / 60)} mnt lalu`
          if (diff < 86400) return `${Math.floor(diff / 3600)} jam lalu`
          return `${Math.floor(diff / 86400)} hr lalu`
        }

        const suratList = letters.map(l => ({
          id: l.id,
          nama: (l.profiles as any)?.full_name || 'Warga',
          jenis: l.letter_type,
          waktu: formatTimeAgo(l.created_at)
        }))

        const iuranList = duesVerification.map(d => ({
          id: d.id,
          nama: (d.profiles as any)?.full_name || 'Warga',
          nominal: d.amount,
          waktu: formatTimeAgo(d.created_at)
        }))

        setData({
          wargaCount: warga.length > 0 ? warga.length : initialWargaCount,
          kasBulanIni: totalRegionalDues || 0, // In reality, this requires summing 'paid' dues for this month
          wargaMenunggak: menunggakSet.size,
          perluTindakan: letters.length + duesVerification.length + reports.length,
          suratMenunggu: suratList,
          iuranMenunggu: iuranList
        })

      } catch (err) {
        console.warn('Failed to fetch RT dashboard data:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchRealtimeData()
  }, [initialWargaCount, totalRegionalDues])

  const formatRupiah = (num: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num)

  return (
    <div className="bg-slate-50 min-h-screen p-4 sm:p-6 lg:p-8 -m-4 sm:-m-6 lg:-m-8 rounded-none sm:rounded-tl-3xl transition-all">
      <div className="max-w-7xl mx-auto space-y-8 select-none pb-20">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight leading-tight flex items-center gap-2">
              <Activity className="w-7 h-7 text-purple-600" />
              Konsol Operasional <span className="text-purple-600">RT</span>
            </h1>
            <p className="text-sm font-medium text-slate-500 mt-1 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              Sistem siap. Selamat bertugas, Bapak/Ibu {fullName}.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin mb-4 text-purple-600" />
            <p className="text-sm font-medium">Memuat data operasional realtime...</p>
          </div>
        ) : (
          <>
            {/* 0. Quick Actions (Aksi Cepat) */}
            <QuickActions role="rt" />

            {/* 1. Statistik Operasional (Grid 4 Kolom) */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              
              <div className="bg-white rounded-xl md:rounded-2xl p-4 md:p-5 shadow-sm shadow-purple-100/40 border border-purple-50 flex flex-col justify-between transition-transform hover:-translate-y-1">
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <Users className="w-4 h-4 md:w-5 md:h-5" />
                  </div>
                </div>
                <div className="mt-3 md:mt-4">
                  <h3 className="text-2xl md:text-3xl font-black text-slate-800">{data.wargaCount}</h3>
                  <p className="text-[9px] md:text-xs font-semibold text-slate-500 mt-1 uppercase tracking-wider md:tracking-wide">Total Warga RT</p>
                </div>
              </div>

              <div className="bg-white rounded-xl md:rounded-2xl p-4 md:p-5 shadow-sm shadow-purple-100/40 border border-purple-50 flex flex-col justify-between transition-transform hover:-translate-y-1">
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <Wallet className="w-4 h-4 md:w-5 md:h-5" />
                  </div>
                </div>
                <div className="mt-3 md:mt-4">
                  <h3 className="text-lg md:text-xl font-black text-slate-800 truncate">{formatRupiah(data.kasBulanIni)}</h3>
                  <p className="text-[9px] md:text-xs font-semibold text-slate-500 mt-1 uppercase tracking-wider md:tracking-wide">Tagihan Aktif</p>
                </div>
              </div>

              <div className="bg-white rounded-xl md:rounded-2xl p-4 md:p-5 shadow-sm shadow-purple-100/40 border border-purple-50 flex flex-col justify-between transition-transform hover:-translate-y-1">
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                    <AlertOctagon className="w-4 h-4 md:w-5 md:h-5" />
                  </div>
                </div>
                <div className="mt-3 md:mt-4">
                  <h3 className="text-2xl md:text-3xl font-black text-slate-800">{data.wargaMenunggak} <span className="text-sm text-slate-500 font-bold">KK</span></h3>
                  <p className="text-[9px] md:text-xs font-semibold text-slate-500 mt-1 uppercase tracking-wider md:tracking-wide">Warga Menunggak</p>
                </div>
              </div>

              <div className="bg-white rounded-xl md:rounded-2xl p-4 md:p-5 shadow-sm shadow-purple-100/40 border border-purple-50 flex flex-col justify-between transition-transform hover:-translate-y-1">
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                    <BellRing className="w-4 h-4 md:w-5 md:h-5" />
                  </div>
                  {data.perluTindakan > 0 && (
                    <span className="text-[10px] md:text-xs font-bold text-white bg-rose-500 px-2 py-0.5 md:py-1 rounded-full animate-pulse shadow-sm shadow-rose-200">
                      Segera
                    </span>
                  )}
                </div>
                <div className="mt-3 md:mt-4">
                  <h3 className="text-2xl md:text-3xl font-black text-rose-600">{data.perluTindakan}</h3>
                  <p className="text-[9px] md:text-xs font-semibold text-slate-500 mt-1 uppercase tracking-wider md:tracking-wide">Perlu Tindakan</p>
                </div>
              </div>

            </div>

            {/* 2. Aksi Cepat */}
            <div>
              <h2 className="text-sm font-semibold text-slate-500 mb-3">Jalan Pintas</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
                <Link href="/surat" className="flex items-center gap-3 bg-white p-4 rounded-xl border border-purple-50 shadow-sm shadow-purple-100/40 hover:shadow-md hover:border-purple-200 transition-all group">
                  <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-colors shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <span className="text-sm font-bold text-slate-700 group-hover:text-purple-700 transition-colors">Verifikasi Surat</span>
                </Link>

                <Link href="/iuran" className="flex items-center gap-3 bg-white p-4 rounded-xl border border-purple-50 shadow-sm shadow-purple-100/40 hover:shadow-md hover:border-purple-200 transition-all group">
                  <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-colors shrink-0">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <span className="text-sm font-bold text-slate-700 group-hover:text-purple-700 transition-colors">Verifikasi Iuran</span>
                </Link>

                <Link href="/warga" className="flex items-center gap-3 bg-white p-4 rounded-xl border border-purple-50 shadow-sm shadow-purple-100/40 hover:shadow-md hover:border-purple-200 transition-all group">
                  <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-colors shrink-0">
                    <UserPlus className="w-5 h-5" />
                  </div>
                  <span className="text-sm font-bold text-slate-700 group-hover:text-purple-700 transition-colors">Tambah Data Warga</span>
                </Link>
              </div>
            </div>

            {/* 3. Panel Antrean Tugas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Kolom Kiri: Surat Menunggu Persetujuan */}
              <div className="bg-white rounded-2xl p-6 shadow-sm shadow-purple-100/40 border border-purple-50 flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-purple-600" /> Surat Menunggu Persetujuan
                  </h2>
                </div>
                
                <div className="flex-1 space-y-3">
                  {data.suratMenunggu.length > 0 ? data.suratMenunggu.map((surat) => (
                    <div key={surat.id} className="flex items-center justify-between p-3.5 bg-slate-50/80 rounded-xl border border-slate-100 hover:border-purple-100 transition-colors">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-800">{surat.nama}</span>
                        <span className="text-xs font-medium text-slate-500 mt-0.5">{surat.jenis} • <span className="text-amber-600">{surat.waktu}</span></span>
                      </div>
                      <Link href="/surat" className="px-3 py-1.5 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors shadow-sm shadow-purple-200">
                        Cek
                      </Link>
                    </div>
                  )) : (
                    <div className="text-center py-6 text-slate-400 text-sm font-medium border border-dashed border-slate-200 rounded-xl">
                      Tidak ada antrean surat.
                    </div>
                  )}
                </div>
                <Link href="/surat" className="mt-5 text-center text-xs font-bold text-purple-600 hover:text-purple-700 transition-colors">Lihat Semua Surat &rarr;</Link>
              </div>

              {/* Kolom Kanan: Iuran Menunggu Verifikasi */}
              <div className="bg-white rounded-2xl p-6 shadow-sm shadow-purple-100/40 border border-purple-50 flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                    <Wallet className="w-5 h-5 text-purple-600" /> Iuran Menunggu Verifikasi
                  </h2>
                </div>
                
                <div className="flex-1 space-y-3">
                  {data.iuranMenunggu.length > 0 ? data.iuranMenunggu.map((iuran) => (
                    <div key={iuran.id} className="flex items-center justify-between p-3.5 bg-slate-50/80 rounded-xl border border-slate-100 hover:border-purple-100 transition-colors">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-800">{iuran.nama}</span>
                        <span className="text-xs font-medium text-slate-500 mt-0.5">{formatRupiah(iuran.nominal)} • <span className="text-blue-600">{iuran.waktu}</span></span>
                      </div>
                      <Link href="/iuran" className="px-3 py-1.5 text-xs font-bold text-purple-600 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg transition-colors">
                        Cek Bukti
                      </Link>
                    </div>
                  )) : (
                    <div className="text-center py-6 text-slate-400 text-sm font-medium border border-dashed border-slate-200 rounded-xl">
                      Tidak ada antrean iuran.
                    </div>
                  )}
                </div>
                <Link href="/iuran" className="mt-5 text-center text-xs font-bold text-purple-600 hover:text-purple-700 transition-colors">Rekap Kas RT &rarr;</Link>
              </div>

            </div>
          </>
        )}

      </div>
    </div>
  )
}
