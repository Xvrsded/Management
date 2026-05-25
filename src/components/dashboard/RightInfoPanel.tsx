import { Users, Home, FolderOpen, Bell, MapPin, Award, ShieldCheck } from 'lucide-react'
import Link from 'next/link'
import { displayRT, displayRW } from '@/lib/region-format'


export interface NotificationItem {
  id: string
  title: string
  message: string
  created_at: string
  is_read: boolean
}

interface RightInfoPanelProps {
  role: string
  wargaCount?: number
  rumahCount?: number
  keluargaCount?: number
  citizenDemographics?: {
    nik: string
    kk: string
    address: string
    rt: string
    rw: string
  } | null
  notifications: NotificationItem[]
}

export default function RightInfoPanel({ 
  role, 
  wargaCount = 0, 
  rumahCount = 0, 
  keluargaCount = 0, 
  citizenDemographics = null, 
  notifications 
}: RightInfoPanelProps) {
  const isCitizen = role === 'warga'

  // Mask NIK for security
  const maskText = (text: string) => {
    if (!text) return '-'
    if (text.length < 8) return text
    return text.slice(0, 6) + '**********'
  }

  return (
    <aside className="w-full space-y-6 select-none">
      {/* 1. Conditional top widget based on role */}
      {isCitizen ? (
        /* CITIZEN WIDGET: Personal demographics */
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-2xl p-5 shadow-md shadow-blue-600/15 relative overflow-hidden shrink-0">
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none" />
          
          <div className="flex items-center justify-between mb-3.5 border-b border-white/10 pb-2">
            <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-blue-100">
              Profil Kependudukan Anda
            </h4>
            <span className="inline-flex items-center text-[8px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-500 text-white leading-none border border-emerald-400">
              <ShieldCheck className="w-2.5 h-2.5 mr-0.5" />
              Aktif
            </span>
          </div>

          <div className="space-y-3 relative z-10 text-xs">
            {citizenDemographics ? (
              <>
                <div>
                  <span className="text-[8px] font-bold text-blue-200 uppercase tracking-wider block">Nomor Induk Kependudukan (NIK)</span>
                  <p className="font-extrabold text-[13px] tracking-wider mt-0.5 font-mono">{maskText(citizenDemographics.nik)}</p>
                </div>
                <div>
                  <span className="text-[8px] font-bold text-blue-200 uppercase tracking-wider block">Nomor Kartu Keluarga (KK)</span>
                  <p className="font-extrabold text-[13px] tracking-wider mt-0.5 font-mono">{maskText(citizenDemographics.kk)}</p>
                </div>
                <div className="flex items-start pt-2 border-t border-white/15">
                  <MapPin className="w-3.5 h-3.5 text-blue-200 mr-1.5 shrink-0 mt-0.5" />
                  <p className="text-[10px] font-semibold text-blue-100 leading-normal">
                    {citizenDemographics.address} ({displayRT(citizenDemographics.rt)} / {displayRW(citizenDemographics.rw)})
                  </p>
                </div>
              </>
            ) : (
              <div className="py-2 text-center space-y-2">
                <p className="text-[10px] text-blue-100 font-semibold leading-relaxed">
                  Berkas Kartu Keluarga digital Anda belum terverifikasi di RT.
                </p>
                <Link 
                  href="/keluarga" 
                  className="inline-block text-[9px] font-extrabold text-white uppercase tracking-wider bg-white/15 px-3 py-1.5 rounded-xl border border-white/10 hover:bg-white/25 transition-colors"
                >
                  Lengkapi Berkas &rarr;
                </Link>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* STAFF WIDGET: Regional RT admin statistics */
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-2xl p-5 shadow-md shadow-blue-600/15 relative overflow-hidden shrink-0">
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none" />
          
          <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-blue-100 mb-4">
            Statistik Administrasi RT
          </h4>

          <div className="space-y-4 relative z-10">
            {/* Total Warga */}
            <div className="flex items-center space-x-3.5">
              <div className="w-9 h-9 rounded-xl bg-white/15 text-white flex items-center justify-center shrink-0 border border-white/5 shadow-inner">
                <Users className="w-4.5 h-4.5" />
              </div>
              <div>
                <p className="text-[9px] font-bold text-blue-100 uppercase tracking-wide leading-none">Warga Terdaftar</p>
                <h5 className="text-sm font-extrabold leading-none mt-1.5">{wargaCount} Jiwa</h5>
              </div>
            </div>

            {/* Rumah Terdaftar */}
            <div className="flex items-center space-x-3.5">
              <div className="w-9 h-9 rounded-xl bg-white/15 text-white flex items-center justify-center shrink-0 border border-white/5 shadow-inner">
                <Home className="w-4.5 h-4.5" />
              </div>
              <div>
                <p className="text-[9px] font-bold text-blue-100 uppercase tracking-wide leading-none">Rumah Terdaftar</p>
                <h5 className="text-sm font-extrabold leading-none mt-1.5">{rumahCount} Unit</h5>
              </div>
            </div>

            {/* Jumlah Keluarga */}
            <div className="flex items-center space-x-3.5">
              <div className="w-9 h-9 rounded-xl bg-white/15 text-white flex items-center justify-center shrink-0 border border-white/5 shadow-inner">
                <FolderOpen className="w-4.5 h-4.5" />
              </div>
              <div>
                <p className="text-[9px] font-bold text-blue-100 uppercase tracking-wide leading-none">Jumlah Keluarga (KK)</p>
                <h5 className="text-sm font-extrabold leading-none mt-1.5">{keluargaCount} KK</h5>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. Notifikasi Aktivitas Widget (Compact Activity Feed) */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Bell className="w-4 h-4 text-blue-600 shrink-0" />
            <h4 className="text-[10px] font-extrabold text-slate-800 uppercase tracking-widest leading-none">
              {isCitizen ? 'Notifikasi Akun Anda' : 'Aktivitas Terkini'}
            </h4>
          </div>
        </div>

        {notifications.length > 0 ? (
          <div className="relative pl-3 border-l border-slate-100 space-y-4">
            {notifications.map((item) => (
              <div key={item.id} className="relative text-xs leading-relaxed">
                {/* Micro Bullet indicator */}
                <span className={`absolute -left-[15.5px] top-1.5 w-1.5 h-1.5 rounded-full ring-4 ring-white shrink-0 ${
                  item.is_read ? 'bg-slate-300' : 'bg-blue-600'
                }`} />
                
                <div>
                  <div className="flex justify-between items-baseline gap-2">
                    <p className="font-bold text-slate-800 leading-tight">{item.title}</p>
                    <span className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider shrink-0">
                      {new Date(item.created_at).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short'
                      })}
                    </span>
                  </div>
                  <p className="text-[9px] text-slate-500 mt-1 font-medium leading-normal">{item.message}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-5">
            <div className="w-8 h-8 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center mx-auto mb-2">
              <Bell className="w-4 h-4" />
            </div>
            <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest">Belum ada aktivitas baru.</p>
          </div>
        )}
      </div>
    </aside>
  )
}
