'use client'

import { useState } from 'react'
import Link from 'next/link'
import { displayRT, displayRW } from '@/lib/region-format'
import { 
  CreditCard, 
  FileText, 
  Megaphone, 
  Calendar, 
  CheckSquare, 
  AlertTriangle, 
  User, 
  PhoneCall, 
  ShieldCheck, 
  QrCode, 
  Clock, 
  Heart, 
  MapPin, 
  TrendingUp,
  Activity,
  Eye,
  EyeOff,
  AlertOctagon
} from 'lucide-react'
import DuesSummaryWidget, { DuePayment } from '../DuesSummaryWidget'
import QuickActions from '../QuickActions'
import ShortcutGrid from '../ShortcutGrid'
import AnnouncementsWidget, { Announcement } from '../AnnouncementsWidget'
import RightInfoPanel, { NotificationItem } from '../RightInfoPanel'

interface WargaDashboardProps {
  fullName: string
  email: string
  dues: DuePayment[]
  announcements: Announcement[]
  notifications: NotificationItem[]
  citizenDemographics: any
}

export default function WargaDashboard({
  fullName,
  email,
  dues,
  announcements,
  notifications,
  citizenDemographics
}: WargaDashboardProps) {
  const [showQR, setShowQR] = useState(false)
  const [isFlipped, setIsFlipped] = useState(false)
  const [showNIK, setShowNIK] = useState(false)

  // Real data parsing
  const rt = citizenDemographics?.rt || '-'
  const rw = citizenDemographics?.rw || '-'
  const letters = citizenDemographics?.letters || []
  const activities = citizenDemographics?.activities || []
  const reports = citizenDemographics?.reports || []
  
  // Calculate profile completeness based on presence
  const fields = citizenDemographics ? [
    citizenDemographics.nik,
    citizenDemographics.kk,
    citizenDemographics.address,
    citizenDemographics.rt,
    citizenDemographics.rw,
    citizenDemographics.phone,
    citizenDemographics.gender,
    citizenDemographics.date_of_birth,
    citizenDemographics.family_id
  ] : []
  
  const completedFieldsCount = fields.filter(Boolean).length
  const completenessPercent = citizenDemographics ? Math.round((completedFieldsCount / 9) * 100) : 0

  const maskText = (text: string) => {
    if (!text) return '-'
    if (text.length < 8) return text
    return text.slice(0, 6) + '**********'
  }

  return (
    <div className="space-y-6 pb-20 select-none">
      {/* 1. Greeting Section & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-2 bg-transparent">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight leading-none">
            Halo, <span className="text-blue-600 font-black">{fullName}</span> 👋
          </h1>
          <p className="text-xs font-semibold text-slate-450 mt-1.5">
            Semoga harimu menyenangkan • {displayRT(rt)} / {displayRW(rw)}
          </p>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <button 
            onClick={() => setShowQR(true)}
            className="flex items-center space-x-1.5 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-100 rounded-xl shadow-xs transition-all hover:scale-105 active:scale-95 text-xs font-bold text-slate-700"
          >
            <QrCode className="w-4 h-4 text-blue-600 shrink-0" />
            <span>QR Absensi</span>
          </button>

          <Link 
            href="/profile"
            className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 text-blue-600 flex items-center justify-center font-extrabold text-xs shadow-xs"
          >
            {fullName.charAt(0).toUpperCase()}
          </Link>
        </div>
      </div>

      <QuickActions role="warga" />

      {/* Main Grid: Responsive desktop columns, stacking on mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Columns */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* A. Personalized Dues Summary Widget */}
          <DuesSummaryWidget role="warga" dues={dues} />

          {/* B. Profile Completeness Progress Tracker */}
          <div className="bg-white rounded-3xl border border-slate-100/80 shadow-xs p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100/50">
                  <TrendingUp className="w-4 h-4 shrink-0" />
                </div>
                <div>
                  <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest leading-none">
                    Kelengkapan Berkas Anda
                  </h4>
                  <h3 className="text-xs font-bold text-slate-800 mt-1 leading-none">
                    Kelengkapan Profil: {completenessPercent}%
                  </h3>
                </div>
              </div>
              <span className={`px-2 py-0.5 text-[9px] font-extrabold rounded-full border leading-none ${
                completenessPercent >= 80 
                  ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                  : 'bg-amber-50 text-amber-600 border-amber-100'
              }`}>
                {completenessPercent >= 80 ? 'Sudah Valid' : 'Belum Lengkap'}
              </span>
            </div>

            <div className="space-y-2">
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${completenessPercent >= 80 ? 'bg-emerald-500' : 'bg-amber-400'}`} 
                  style={{ width: `${completenessPercent}%` }}
                />
              </div>
              <p className="text-[10px] text-slate-450 leading-relaxed font-semibold">
                {completenessPercent >= 80 
                  ? 'Keren! Data kependudukan Anda sudah terisi lengkap dan terverifikasi oleh pengurus wilayah.'
                  : 'Lengkapi berkas kependudukan Anda (NIK, KK, tanggal lahir) agar pengajuan surat pengantar berjalan lancar.'
                }
              </p>
            </div>
          </div>

          {/* C. Shortcuts Services */}
          <ShortcutGrid role="warga" />

          {/* D. Letter Application Tracker */}
          <div className="bg-white rounded-3xl border border-slate-100/80 shadow-xs p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-blue-600 shrink-0" />
                <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest leading-none">
                  Status Pengajuan Surat Terbaru
                </h4>
              </div>
              <Link href="/surat" className="text-[10px] font-bold text-blue-600 hover:underline">
                Lihat Semua
              </Link>
            </div>

            <div className="space-y-3">
              {letters.length === 0 ? (
                <div className="bg-slate-50/50 rounded-2xl border border-slate-100 p-6 text-center">
                  <p className="text-xs text-slate-400 font-semibold">Belum ada pengajuan surat.</p>
                </div>
              ) : (
                letters.map((letter: any) => {
                  let badgeStyles = 'bg-slate-100 text-slate-600 border-slate-200'
                  let label = letter.status
                  if (['draft'].includes(letter.status)) { badgeStyles = 'bg-slate-50 text-slate-600 border-slate-200'; label = 'Draft' }
                  if (['pending_rt'].includes(letter.status)) { badgeStyles = 'bg-amber-50 text-amber-700 border-amber-100/80'; label = 'Menunggu RT' }
                  if (['approved_rt', 'approved_rw'].includes(letter.status)) { badgeStyles = 'bg-blue-50 text-blue-700 border-blue-100/80'; label = 'Diproses' }
                  if (['finished'].includes(letter.status)) { badgeStyles = 'bg-emerald-50 text-emerald-700 border-emerald-100/80'; label = 'Selesai' }
                  if (['rejected'].includes(letter.status)) { badgeStyles = 'bg-rose-50 text-rose-700 border-rose-100/80'; label = 'Ditolak' }

                  return (
                    <div key={letter.id} className="bg-slate-50/50 rounded-2xl border border-slate-100 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="space-y-1 min-w-0">
                        <span className="text-[9px] font-extrabold text-blue-600 uppercase tracking-widest leading-none block truncate">
                          {letter.letter_type || 'Surat Pengantar'}
                        </span>
                        <p className="text-xs font-bold text-slate-800 leading-snug truncate max-w-xs">
                          Keperluan: {letter.purpose}
                        </p>
                        <span className="text-[9px] text-slate-400 font-semibold block">
                          Diajukan: {new Date(letter.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </span>
                      </div>

                      <div className="flex items-center space-x-2 shrink-0">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-xl text-[10px] font-bold uppercase tracking-wider border leading-none ${badgeStyles}`}>
                          {label}
                        </span>
                        <Link 
                          href={`/surat/${letter.id}`}
                          className="w-7 h-7 rounded-lg bg-white border border-slate-100 hover:bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors"
                        >
                          <FileText className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>

          {/* E. Laporan Aduan Tracker */}
          <div className="bg-white rounded-3xl border border-slate-100/80 shadow-xs p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <AlertOctagon className="w-4 h-4 text-orange-600 shrink-0" />
                <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest leading-none">
                  Status Aduan & Laporan
                </h4>
              </div>
              <Link href="/laporan" className="text-[10px] font-bold text-orange-600 hover:underline">
                Lihat Semua
              </Link>
            </div>

            <div className="space-y-3">
              {reports.length === 0 ? (
                <div className="bg-slate-50/50 rounded-2xl border border-slate-100 p-6 text-center">
                  <p className="text-xs text-slate-400 font-semibold">Belum ada aduan masuk.</p>
                </div>
              ) : (
                reports.map((report: any) => {
                  let badgeStyles = 'bg-slate-100 text-slate-600 border-slate-200'
                  let label = report.status
                  if (['submitted'].includes(report.status)) { badgeStyles = 'bg-slate-50 text-slate-600 border-slate-200'; label = 'Terkirim' }
                  if (['reviewing'].includes(report.status)) { badgeStyles = 'bg-amber-50 text-amber-700 border-amber-100/80'; label = 'Ditinjau' }
                  if (['in_progress'].includes(report.status)) { badgeStyles = 'bg-blue-50 text-blue-700 border-blue-100/80'; label = 'Diproses' }
                  if (['resolved'].includes(report.status)) { badgeStyles = 'bg-emerald-50 text-emerald-700 border-emerald-100/80'; label = 'Selesai' }
                  if (['rejected'].includes(report.status)) { badgeStyles = 'bg-rose-50 text-rose-700 border-rose-100/80'; label = 'Ditolak' }

                  return (
                    <div key={report.id} className="bg-slate-50/50 rounded-2xl border border-slate-100 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="space-y-1 min-w-0">
                        <span className="text-[9px] font-extrabold text-orange-600 uppercase tracking-widest leading-none block truncate">
                          {report.category || 'Fasilitas Umum'}
                        </span>
                        <p className="text-xs font-bold text-slate-800 leading-snug truncate max-w-xs">
                          {report.title}
                        </p>
                        <span className="text-[9px] text-slate-400 font-semibold block">
                          Dilaporkan: {new Date(report.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </span>
                      </div>

                      <div className="flex items-center space-x-2 shrink-0">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-xl text-[10px] font-bold uppercase tracking-wider border leading-none ${badgeStyles}`}>
                          {label}
                        </span>
                        <Link 
                          href={`/laporan/${report.id}`}
                          className="w-7 h-7 rounded-lg bg-white border border-slate-100 hover:bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors"
                        >
                          <FileText className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>

          {/* F. Announcements Feed */}
          <AnnouncementsWidget announcements={announcements} />
        </div>

        {/* Right Info Column */}
        <div className="space-y-6">
          
          {/* A. Premium Interactive Digital Card */}
          <div 
            className="w-full h-48 rounded-2xl relative transition-transform duration-500 transform-style-3d hover:scale-[1.02] group"
            style={{ perspective: '1000px' }}
          >
            {/* Front Side of the Card */}
            <div className={`absolute inset-0 w-full h-full rounded-2xl shadow-md transition-all duration-500 backface-hidden p-5 text-white flex flex-col justify-between overflow-hidden ${
              isFlipped ? 'rotate-y-180 opacity-0 pointer-events-none' : 'opacity-100 bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-700'
            }`}>
              {/* Invisible clickable overlay to flip card, placed under buttons */}
              <div 
                className="absolute inset-0 cursor-pointer z-0" 
                onClick={() => setIsFlipped(true)}
              />
              
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl pointer-events-none z-0" />
              
              <div className="flex items-start justify-between border-b border-white/10 pb-2 relative z-10 pointer-events-none">
                <div>
                  <h3 className="text-xs font-black tracking-tight leading-none">KARTU DIGITAL WARGA</h3>
                  <p className="text-[8px] text-blue-200 uppercase tracking-widest font-semibold mt-1">{displayRT(rt)} / {displayRW(rw)} digital</p>
                </div>
                <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
              </div>

              <div className="space-y-1 relative z-10 pointer-events-auto">
                <div className="flex items-center justify-between">
                  <span className="text-[8px] text-blue-200 uppercase tracking-widest font-bold leading-none pointer-events-none">Nomor Induk Warga</span>
                  <button 
                    onClick={(e) => { 
                      e.preventDefault();
                      e.stopPropagation(); 
                      setShowNIK(!showNIK); 
                    }}
                    className="text-blue-200 hover:text-white transition-colors p-1.5 rounded-md hover:bg-white/10 relative z-20 cursor-pointer"
                    title={showNIK ? "Sembunyikan NIK" : "Tampilkan NIK"}
                  >
                    {showNIK ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <p className="text-sm font-extrabold tracking-wider font-mono leading-none pointer-events-none">
                  {citizenDemographics?.nik ? (showNIK ? citizenDemographics.nik : maskText(citizenDemographics.nik)) : 'Belum Terdaftar'}
                </p>
              </div>

              <div className="flex items-end justify-between relative z-10 pointer-events-none">
                <div>
                  <p className="text-xs font-extrabold leading-none">{fullName}</p>
                  <p className="text-[8px] text-blue-200 mt-1 uppercase font-semibold leading-none truncate max-w-[150px]">
                    {citizenDemographics?.address ? citizenDemographics.address : `Warga RT ${rt}`}
                  </p>
                </div>
                <span className="text-[8px] uppercase tracking-wider bg-white/15 px-2 py-1 rounded-lg border border-white/10 font-black shrink-0">
                  WARGA AKTIF
                </span>
              </div>
            </div>

            {/* Back Side of the Card */}
            <div 
              onClick={() => setIsFlipped(false)}
              className={`absolute inset-0 w-full h-full rounded-2xl shadow-md transition-all duration-500 backface-hidden p-5 text-white bg-slate-900 flex flex-col justify-between cursor-pointer ${
              isFlipped ? 'opacity-100 rotate-y-0 z-10' : 'rotate-y-180 opacity-0 pointer-events-none'
            }`}>
              <div className="flex justify-between items-center border-b border-white/10 pb-2">
                <span className="text-[9px] font-black uppercase tracking-wider">SK BUKTI KEANGGOTAAN</span>
                <span className="text-[8px] text-slate-400 font-semibold font-mono">CODE: RT{rt}-{new Date().getFullYear()}</span>
              </div>
              <div className="flex justify-center py-2">
                <div className="w-16 h-16 bg-white p-1 rounded-lg shrink-0">
                  {/* Mocked QR Code graphic */}
                  <svg viewBox="0 0 100 100" className="w-full h-full text-slate-900">
                    <rect width="25" height="25" />
                    <rect x="75" width="25" height="25" />
                    <rect y="75" width="25" height="25" />
                    <rect x="20" y="20" width="10" height="10" />
                    <rect x="50" y="30" width="15" height="15" />
                    <rect x="35" y="60" width="20" height="20" />
                    <rect x="70" y="70" width="15" height="15" />
                  </svg>
                </div>
              </div>
              <p className="text-[8px] text-center text-slate-400 font-semibold leading-relaxed">
                Gunakan QR Code ini untuk melakukan absensi kehadiran kegiatan kerja bakti atau rapat RT/RW setempat secara digital.
              </p>
            </div>
          </div>

          {/* B. Emergency Contacts & RT Online Status */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-xs p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-50 pb-3">
              <div className="flex items-center space-x-2">
                <PhoneCall className="w-4 h-4 text-rose-500 shrink-0" />
                <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest leading-none">
                  Layanan Kontak Darurat
                </h4>
              </div>
              
              {/* Online indicator */}
              <div className="flex items-center space-x-1.5 shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[8px] font-extrabold text-emerald-600 uppercase tracking-wider">
                  RT Sedang Online
                </span>
              </div>
            </div>

            <div className="space-y-2.5">
              <a 
                href="tel:081234567890" 
                className="flex items-center justify-between p-3.5 bg-slate-50/50 hover:bg-rose-50 border border-slate-100 hover:border-rose-100 rounded-2xl transition-all group"
              >
                <div className="flex items-center space-x-3 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-white border border-slate-100 text-rose-600 flex items-center justify-center shrink-0 shadow-2xs group-hover:bg-rose-500 group-hover:text-white transition-colors">
                    <Heart className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-800 leading-tight group-hover:text-rose-950">
                      Ketua RT {rt}
                    </p>
                    <p className="text-[9px] font-semibold text-slate-400 group-hover:text-rose-400 mt-1 leading-none">
                      Siaga Darurat Keamanan & Berkas
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-extrabold text-slate-400 group-hover:text-rose-600 transition-colors uppercase shrink-0">
                  Hubungi
                </span>
              </a>

              <a 
                href="tel:089876543210" 
                className="flex items-center justify-between p-3.5 bg-slate-50/50 hover:bg-blue-50 border border-slate-100 hover:border-blue-100 rounded-2xl transition-all group"
              >
                <div className="flex items-center space-x-3 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-white border border-slate-100 text-blue-600 flex items-center justify-center shrink-0 shadow-2xs group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <PhoneCall className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-800 leading-tight group-hover:text-blue-950">
                      Call Center Pos Satpam
                    </p>
                    <p className="text-[9px] font-semibold text-slate-400 group-hover:text-blue-400 mt-1 leading-none">
                      Layanan Siaga Kamtibmas 24 Jam
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-extrabold text-slate-400 group-hover:text-blue-600 transition-colors uppercase shrink-0">
                  Hubungi
                </span>
              </a>
            </div>
          </div>

          {/* C. Activity Events Widget (Replacing Calendar Events) */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-xs p-5 space-y-4">
            <div className="flex items-center space-x-2">
              <Activity className="w-4 h-4 text-purple-600 shrink-0" />
              <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest leading-none">
                Riwayat Aktivitas Terakhir
              </h4>
            </div>

            <div className="space-y-3.5">
              {activities.length === 0 ? (
                <p className="text-[10px] text-center text-slate-400 font-semibold">Belum ada aktivitas.</p>
              ) : (
                activities.slice(0, 3).map((act: any) => {
                  const actDate = new Date(act.created_at)
                  return (
                    <div key={act.id} className="flex items-start space-x-3">
                      <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex flex-col items-center justify-center shrink-0 border border-purple-100/50">
                        <span className="text-[8px] font-extrabold uppercase leading-none">
                          {actDate.toLocaleDateString('id-ID', { month: 'short' })}
                        </span>
                        <span className="text-xs font-black mt-1 leading-none">
                          {actDate.getDate()}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-slate-800 leading-tight truncate">
                          {act.action === 'citizen_onboarding_completed' && 'Pendaftaran Warga'}
                          {act.action === 'profile_updated' && 'Pembaruan Profil'}
                          {act.action.includes('letter') && 'Pengajuan Surat'}
                          {act.action.includes('payment') && 'Pembayaran Iuran'}
                          {!['citizen_onboarding_completed', 'profile_updated'].includes(act.action) && !act.action.includes('letter') && !act.action.includes('payment') && act.action}
                        </p>
                        <p className="text-[9px] font-semibold text-slate-400 mt-1 flex items-center leading-none">
                          <MapPin className="w-3 h-3 mr-0.5 text-purple-400 shrink-0" />
                          {actDate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                        </p>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
          
          {/* D. Right notifications feed */}
          <RightInfoPanel 
            role="warga"
            notifications={notifications}
          />
        </div>
      </div>

      {/* QR Absensi Modal View */}
      {showQR && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-100 max-w-sm w-full p-6 space-y-5 text-center shadow-lg relative animate-scale-up">
            <h3 className="text-sm font-black text-slate-800 tracking-tight uppercase leading-none">
              QR Code Absensi Warga
            </h3>
            <p className="text-xs text-slate-450 leading-relaxed font-semibold">
              Tunjukkan QR Code ini pada pengurus wilayah RT saat menghadiri rapat atau acara kerja bakti untuk pencatatan kehadiran digital otomatis.
            </p>

            <div className="w-48 h-48 bg-white p-2.5 rounded-2xl border border-slate-150 shadow-inner mx-auto flex items-center justify-center">
              {/* QR Code SVG */}
              <svg viewBox="0 0 100 100" className="w-full h-full text-slate-900">
                <rect width="25" height="25" />
                <rect x="75" width="25" height="25" />
                <rect y="75" width="25" height="25" />
                <rect x="20" y="20" width="10" height="10" />
                <rect x="50" y="30" width="15" height="15" />
                <rect x="35" y="60" width="20" height="20" />
                <rect x="70" y="70" width="15" height="15" />
              </svg>
            </div>

            <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100 text-left space-y-1">
              <span className="text-[8px] font-extrabold text-slate-400 uppercase tracking-widest leading-none block">
                Detail Kehadiran
              </span>
              <p className="text-xs font-bold text-slate-700 leading-tight">
                Nama: {fullName}
              </p>
              <p className="text-[10px] text-slate-450 font-bold font-mono leading-none">
                ID: {email.split('@')[0].toUpperCase()}
              </p>
            </div>

            <button 
              onClick={() => setShowQR(false)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-3 font-bold text-xs transition-colors shadow-md shadow-blue-600/10"
            >
              Tutup QR
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
