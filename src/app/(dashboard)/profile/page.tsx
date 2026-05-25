import { createClient } from '@/services/supabase/server'
import { redirect } from 'next/navigation'
import { logoutAction } from '@/app/auth/actions'
import { User, Mail, Shield, Calendar, LogOut, MapPin, Award, CheckCircle2, ShieldAlert } from 'lucide-react'
import Link from 'next/link'

export const revalidate = 0

export default async function ProfilePage() {
  const supabase = await createClient()

  // 1. Get authenticated user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  // 2. Fetch profile & citizen demographics securely
  let userProfile = {
    fullName: user.user_metadata?.full_name || 'Warga',
    role: user.user_metadata?.role || 'warga',
    email: user.email || '',
    createdAt: user.created_at,
    nik: '',
    kk: '',
    address: ''
  }

  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('*, citizen_profiles (nik, kk, address)')
      .eq('id', user.id)
      .single()
    
    if (profile) {
      userProfile = {
        fullName: profile.full_name,
        role: profile.role,
        email: profile.email,
        createdAt: profile.created_at,
        nik: (profile.citizen_profiles as any)?.nik || '',
        kk: (profile.citizen_profiles as any)?.kk || '',
        address: (profile.citizen_profiles as any)?.address || ''
      }
    }
  } catch (err) {
    console.warn('Failed to query profiles in ProfilePage, using metadata fallback:', err)
  }

  const roleLabels: Record<string, { label: string; desc: string; badge: string }> = {
    warga: { label: 'Warga', desc: 'Anggota masyarakat/warga wilayah RT', badge: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
    rt: { label: 'Ketua RT', desc: 'Ketua Rukun Tetangga setempat', badge: 'bg-blue-50 text-blue-700 border-blue-100' },
    rw: { label: 'Ketua RW', desc: 'Ketua Rukun Warga', badge: 'bg-indigo-50 text-indigo-700 border-indigo-100' },
    admin: { label: 'Admin', desc: 'Administrator administratif wilayah', badge: 'bg-purple-50 text-purple-700 border-purple-100' },
    superadmin: { label: 'Super Admin', desc: 'Developer / Akses Penuh Sistem', badge: 'bg-rose-50 text-rose-700 border-rose-100' }
  }

  const roleInfo = roleLabels[userProfile.role] || roleLabels.warga

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 select-none">
      {/* Header */}
      <div className="px-1">
        <h1 className="text-xl font-bold text-slate-800 tracking-tight flex items-center">
          <User className="w-6 h-6 mr-2 text-blue-600 shrink-0" />
          Profil Pengguna
        </h1>
        <p className="text-xs text-slate-455 mt-1">Detail data akun dan informasi peran kependudukan Anda</p>
      </div>

      {/* Grid Layout splits Profile card & metadata details */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Side: Avatar Card */}
        <div className="md:col-span-1 bg-white rounded-3xl border border-slate-100/80 shadow-xs p-6 text-center flex flex-col justify-center items-center space-y-4">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-100 text-blue-600 flex items-center justify-center font-extrabold text-2xl shadow-3xs">
            {userProfile.fullName.charAt(0).toUpperCase()}
          </div>
          <div className="space-y-1.5">
            <h2 className="text-base font-bold text-slate-800 leading-snug">{userProfile.fullName}</h2>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-extrabold tracking-wide uppercase border leading-none shadow-3xs ${roleInfo.badge}`}>
              {roleInfo.label}
            </span>
          </div>
          <p className="text-xs text-slate-450 leading-relaxed font-semibold">
            {roleInfo.desc}
          </p>
        </div>

        {/* Right Side: Details forms lists */}
        <div className="md:col-span-2 space-y-6">
          {/* Section 1: Account Core Metadata */}
          <div className="bg-white rounded-3xl border border-slate-100/80 shadow-xs p-5 sm:p-6 space-y-4">
            <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest leading-none border-b border-slate-50 pb-3">Informasi Akun</h3>
            
            <div className="space-y-4 font-semibold text-xs text-slate-600 pl-0.5">
              {/* Email Row */}
              <div className="flex items-center space-x-3.5">
                <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-100 text-slate-400 flex items-center justify-center shrink-0 shadow-3xs">
                  <Mail className="w-4.5 h-4.5" />
                </div>
                <div>
                  <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wide leading-none">Alamat Email</p>
                  <p className="text-xs font-bold text-slate-700 mt-1.5 leading-none">{userProfile.email}</p>
                </div>
              </div>

              {/* Role Row */}
              <div className="flex items-center space-x-3.5">
                <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-100 text-slate-400 flex items-center justify-center shrink-0 shadow-3xs">
                  <Shield className="w-4.5 h-4.5" />
                </div>
                <div>
                  <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wide leading-none">Tingkat Hak Akses</p>
                  <p className="text-xs font-bold text-slate-700 mt-1.5 leading-none">{roleInfo.label}</p>
                </div>
              </div>

              {/* Date Joined Row */}
              <div className="flex items-center space-x-3.5">
                <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-100 text-slate-400 flex items-center justify-center shrink-0 shadow-3xs">
                  <Calendar className="w-4.5 h-4.5" />
                </div>
                <div>
                  <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wide leading-none">Mulai Bergabung</p>
                  <p className="text-xs font-bold text-slate-700 mt-1.5 leading-none">
                    {new Date(userProfile.createdAt).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Verified Demographics status */}
          <div className="bg-white rounded-3xl border border-slate-100/80 shadow-xs p-5 sm:p-6 space-y-4">
            <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest leading-none border-b border-slate-50 pb-3">Status Kependudukan</h3>
            
            {userProfile.nik && userProfile.kk ? (
              <div className="space-y-4">
                <div className="flex items-center space-x-2 text-[10px] font-extrabold text-emerald-600 bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-full uppercase tracking-wide leading-none shadow-3xs w-fit">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>Profil Demografis Terverifikasi</span>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold text-slate-650 pl-0.5">
                  <div>
                    <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest leading-none block">Nomor Induk Kependudukan (NIK)</span>
                    <p className="text-slate-800 font-bold text-[13px] mt-1.5 font-mono tracking-tight">{userProfile.nik}</p>
                  </div>
                  <div>
                    <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest leading-none block">Nomor Kartu Keluarga (KK)</span>
                    <p className="text-slate-800 font-bold text-[13px] mt-1.5 font-mono tracking-tight">{userProfile.kk}</p>
                  </div>
                  <div className="sm:col-span-2 flex items-start mt-1 pt-3 border-t border-slate-50">
                    <MapPin className="w-4 h-4 text-slate-400 mr-2 shrink-0 mt-0.5" />
                    <span>
                      Alamat Terdaftar:{' '}
                      <span className="text-slate-800 font-bold">{userProfile.address}</span>
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3.5">
                <div className="flex items-center space-x-2 text-[10px] font-extrabold text-rose-600 bg-rose-50 border border-rose-100 px-3 py-1.5 rounded-full uppercase tracking-wide leading-none shadow-3xs w-fit">
                  <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                  <span>Berkas Kependudukan Belum Lengkap</span>
                </div>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  Kartu Keluarga (KK) dan NIK Anda belum terdaftar di dalam basis data wilayah digital kami. Silakan lengkapi berkas untuk mempermudah pelayanan surat.
                </p>
                <Link
                  href="/keluarga"
                  className="inline-flex items-center space-x-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline leading-none pt-1"
                >
                  Lengkapi Berkas Demografi Sekarang &rarr;
                </Link>
              </div>
            )}
          </div>

          {/* Logout Action */}
          <form action={logoutAction}>
            <button
              type="submit"
              className="w-full bg-rose-50 border border-rose-100 text-rose-600 hover:bg-rose-100 rounded-2xl py-3.5 px-6 font-bold text-xs transition-all focus:outline-none focus:ring-4 focus:ring-rose-50 flex items-center justify-center space-x-2 active:scale-[0.99]"
            >
              <LogOut className="w-4 h-4 shrink-0" />
              <span>Keluar dari Akun RT/RW Digital</span>
            </button>
          </form>

        </div>

      </div>
    </div>
  )
}
