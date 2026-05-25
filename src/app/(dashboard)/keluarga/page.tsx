'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/services/supabase/client'
import { useAuthStore } from '@/store/useAuthStore'
import { toast } from 'sonner'
import { Loader2, Users, FolderOpen, MapPin, Phone, ShieldAlert, Award, FileSpreadsheet, User } from 'lucide-react'
import Link from 'next/link'

interface CitizenProfile {
  id: string
  nik: string
  kk: string
  phone: string | null
  address: string
  rt: string
  rw: string
  gender: 'L' | 'P' | null
  place_of_birth: string | null
  date_of_birth: string | null
  religion: string | null
  occupation: string | null
  marital_status: string | null
  nationality: string
  profiles: {
    full_name: string
    email: string
  } | null
}

interface FamilyGroup {
  kkNumber: string
  address: string
  rt: string
  rw: string
  members: CitizenProfile[]
}

export default function KeluargaPage() {
  const { user } = useAuthStore()
  const isStaff = ['rt', 'rw', 'admin', 'superadmin'].includes(user?.role || '')

  const [loading, setLoading] = useState(true)
  const [families, setFamilies] = useState<FamilyGroup[]>([])
  const [myProfile, setMyProfile] = useState<CitizenProfile | null>(null)

  const supabase = createClient()

  const fetchData = async () => {
    if (!user) return
    setLoading(true)
    try {
      if (isStaff) {
        // Staff queries all citizen profiles
        const { data, error } = await supabase
          .from('citizen_profiles')
          .select('*, profiles:id (full_name, email)')
          .order('kk', { ascending: true })

        if (error) throw error

        // Group by KK number on the client side
        const grouped = (data as any[] || []).reduce<Record<string, FamilyGroup>>((acc, item) => {
          const kkNum = item.kk || 'Belum Terdaftar'
          if (!acc[kkNum]) {
            acc[kkNum] = {
              kkNumber: kkNum,
              address: item.address,
              rt: item.rt,
              rw: item.rw,
              members: []
            }
          }
          acc[kkNum].members.push(item)
          return acc
        }, {})

        setFamilies(Object.values(grouped))
      } else {
        // Citizen queries their own demographic profile
        const { data, error } = await supabase
          .from('citizen_profiles')
          .select('*, profiles:id (full_name, email)')
          .eq('id', user.id)
          .maybeSingle()

        if (error) throw error
        setMyProfile(data as any)
      }
    } catch (err: any) {
      console.error('Error fetching keluarga data:', err)
      toast.error('Gagal memuat data keluarga')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user) {
      fetchData()
    }
  }, [user])

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 select-none">
      {/* Header section */}
      <div>
        <h1 className="text-xl font-bold text-slate-800 tracking-tight flex items-center">
          <FolderOpen className="w-6 h-6 mr-2 text-blue-600 shrink-0" />
          {isStaff ? 'Data Keluarga Wilayah' : 'Informasi Keluarga Saya'}
        </h1>
        <p className="text-xs text-slate-450 mt-1">
          {isStaff 
            ? 'Kelola kependudukan terkelompok berdasarkan Kartu Keluarga (KK)' 
            : 'Detail rekapitulasi data kependudukan dan Kartu Keluarga Anda'}
        </p>
      </div>

      {loading ? (
        <div className="text-center py-12 flex flex-col items-center justify-center space-y-2.5">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Memuat data kependudukan...</p>
        </div>
      ) : isStaff ? (
        /* ==================== STAFF VIEW: Grouped families list ==================== */
        families.length > 0 ? (
          <div className="space-y-4">
            {families.map((family) => (
              <div 
                key={family.kkNumber}
                className="bg-white rounded-3xl border border-slate-100/80 shadow-xs p-5 sm:p-6 space-y-4 hover:border-slate-200/60 transition-colors"
              >
                {/* Family card Header */}
                <div className="flex justify-between items-start gap-2.5 flex-wrap border-b border-slate-50 pb-3.5">
                  <div className="space-y-1">
                    <span className="text-[9px] font-extrabold text-blue-600 uppercase tracking-widest leading-none block">
                      Nomor Kartu Keluarga (KK)
                    </span>
                    <h3 className="text-base font-extrabold text-slate-800 tracking-tight">
                      {family.kkNumber}
                    </h3>
                  </div>
                  <span className="inline-flex items-center text-[10px] font-extrabold px-3 py-1.5 rounded-full border border-blue-100 text-blue-700 bg-blue-50/50 shadow-3xs uppercase tracking-wide">
                    <Users className="w-3.5 h-3.5 mr-1" />
                    {family.members.length} Anggota Warga
                  </span>
                </div>

                {/* Family address info */}
                <div className="flex flex-wrap gap-x-6 gap-y-2.5 text-xs text-slate-500 font-semibold pl-1">
                  <span className="flex items-center">
                    <MapPin className="w-4 h-4 text-slate-400 mr-1.5 shrink-0" />
                    {family.address} (RT {family.rt} / RW {family.rw})
                  </span>
                </div>

                {/* Family members list table */}
                <div className="overflow-x-auto border border-slate-50 rounded-2xl">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-[9px] font-extrabold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                        <th className="py-2.5 px-4">Nama Lengkap</th>
                        <th className="py-2.5 px-4">NIK</th>
                        <th className="py-2.5 px-4">Hubungan</th>
                        <th className="py-2.5 px-4">Kontak</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 text-xs">
                      {family.members.map((member, idx) => (
                        <tr key={member.id} className="hover:bg-slate-50/40 transition-colors font-medium">
                          <td className="py-3 px-4 text-slate-800 font-bold flex items-center">
                            <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center font-bold text-[10px] mr-2 shrink-0">
                              {member.profiles?.full_name?.charAt(0).toUpperCase() || 'W'}
                            </span>
                            {member.profiles?.full_name || 'Warga'}
                          </td>
                          <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">{member.nik}</td>
                          <td className="py-3 px-4">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase leading-none ${
                              idx === 0
                                ? 'bg-blue-50 text-blue-600 border border-blue-100'
                                : 'bg-slate-50 text-slate-500 border border-slate-100'
                            }`}>
                              {idx === 0 ? 'Kepala Keluarga' : 'Anggota'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-500">
                            {member.phone ? (
                              <span className="flex items-center font-semibold text-[11px]">
                                <Phone className="w-3 h-3 text-slate-450 mr-1" />
                                {member.phone}
                              </span>
                            ) : (
                              <span className="text-slate-350 font-semibold">-</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center bg-white rounded-3xl border border-slate-100 p-10">
            <div className="w-12 h-12 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <Users className="w-6 h-6" />
            </div>
            <p className="text-sm text-slate-500 font-bold">Belum ada data warga terdaftar</p>
            <p className="text-xs text-slate-400 mt-1.5">Hubungi warga agar segera mengisi kelengkapan berkas profil kependudukannya.</p>
          </div>
        )
      ) : (
        /* ==================== CITIZEN VIEW: Personal digital Kartu Keluarga ==================== */
        myProfile ? (
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 sm:p-8 space-y-6 relative overflow-hidden">
            {/* Elegant top color band */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-500 to-indigo-600" />
            
            <div className="flex justify-between items-start gap-4 flex-wrap border-b border-slate-100 pb-5">
              <div className="space-y-1">
                <span className="text-[10px] font-extrabold text-blue-600 uppercase tracking-widest block leading-none">
                  Sistem Administrasi Kependudukan
                </span>
                <h2 className="text-lg sm:text-xl font-black text-slate-800 tracking-tight mt-1 leading-none">
                  KARTU KELUARGA DIGITAL
                </h2>
              </div>
              <div className="flex items-center space-x-1.5 text-[9px] font-extrabold text-emerald-600 bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-full uppercase tracking-wide leading-none shadow-3xs shrink-0">
                <Award className="w-3.5 h-3.5 shrink-0" />
                <span>Terverifikasi RT/RW</span>
              </div>
            </div>

            {/* Two Column Grid displaying Demographics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5 font-semibold text-xs text-slate-600 pl-1">
              {/* KK Number */}
              <div className="space-y-1">
                <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest leading-none block">Nomor Kartu Keluarga (KK)</span>
                <p className="text-slate-800 font-bold text-sm tracking-tight">{myProfile.kk}</p>
              </div>

              {/* NIK */}
              <div className="space-y-1">
                <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest leading-none block">Nomor Induk Kependudukan (NIK)</span>
                <p className="text-slate-800 font-bold text-sm tracking-tight font-mono">{myProfile.nik}</p>
              </div>

              {/* Full Name */}
              <div className="space-y-1">
                <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest leading-none block">Nama Lengkap Warga</span>
                <p className="text-slate-800 font-bold text-sm">{myProfile.profiles?.full_name || 'Warga'}</p>
              </div>

              {/* Email */}
              <div className="space-y-1">
                <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest leading-none block">Alamat Email</span>
                <p className="text-slate-800 font-bold text-sm">{myProfile.profiles?.email || '-'}</p>
              </div>

              {/* Tempat/Tanggal Lahir */}
              <div className="space-y-1">
                <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest leading-none block">Tempat & Tanggal Lahir</span>
                <p className="text-slate-800 font-bold text-sm">
                  {myProfile.place_of_birth || '-'},{' '}
                  {myProfile.date_of_birth 
                    ? new Date(myProfile.date_of_birth).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
                    : '-'}
                </p>
              </div>

              {/* Gender */}
              <div className="space-y-1">
                <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest leading-none block">Jenis Kelamin</span>
                <p className="text-slate-800 font-bold text-sm">
                  {myProfile.gender === 'L' ? 'Laki-Laki' : myProfile.gender === 'P' ? 'Perempuan' : '-'}
                </p>
              </div>

              {/* Religion */}
              <div className="space-y-1">
                <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest leading-none block">Agama</span>
                <p className="text-slate-800 font-bold text-sm">{myProfile.religion || '-'}</p>
              </div>

              {/* Occupation */}
              <div className="space-y-1">
                <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest leading-none block">Pekerjaan</span>
                <p className="text-slate-800 font-bold text-sm">{myProfile.occupation || '-'}</p>
              </div>

              {/* Marital Status */}
              <div className="space-y-1">
                <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest leading-none block">Status Pernikahan</span>
                <p className="text-slate-800 font-bold text-sm">{myProfile.marital_status || '-'}</p>
              </div>

              {/* Nationality */}
              <div className="space-y-1">
                <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest leading-none block">Kewarganegaraan</span>
                <p className="text-slate-800 font-bold text-sm">{myProfile.nationality}</p>
              </div>

              {/* Address */}
              <div className="space-y-1 md:col-span-2 border-t border-slate-50 pt-4.5 mt-2 flex flex-col sm:flex-row sm:justify-between gap-3 font-semibold text-slate-500">
                <span className="flex items-start">
                  <MapPin className="w-4.5 h-4.5 text-slate-450 mr-2 shrink-0 mt-0.5" />
                  <span>
                    Alamat Tempat Tinggal:{' '}
                    <span className="text-slate-800 font-bold">
                      {myProfile.address} (RT {myProfile.rt} / RW {myProfile.rw})
                    </span>
                  </span>
                </span>
                
                {myProfile.phone && (
                  <span className="flex items-center font-bold text-slate-800">
                    <Phone className="w-4.5 h-4.5 text-slate-450 mr-2 shrink-0" />
                    {myProfile.phone}
                  </span>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center bg-white rounded-3xl border border-slate-100 p-10 space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mx-auto">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div className="space-y-1 max-w-sm mx-auto">
              <p className="text-sm text-slate-800 font-bold">Profil Kependudukan Belum Lengkap</p>
              <p className="text-xs text-slate-400 leading-relaxed font-medium">
                Sistem tidak mendeteksi berkas Kartu Keluarga (KK) yang terverifikasi untuk akun Anda.
              </p>
            </div>
            <Link
              href="/profile"
              className="inline-flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-2.5 px-5 text-xs font-bold transition-all hover:scale-[1.02] active:scale-[0.98] shadow-xs"
            >
              <User className="w-4 h-4 shrink-0" />
              <span>Lengkapi Profil Kependudukan</span>
            </Link>
          </div>
        )
      )}
    </div>
  )
}
