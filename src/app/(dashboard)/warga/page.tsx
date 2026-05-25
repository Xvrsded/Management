'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/services/supabase/client'
import { useAuthStore } from '@/store/useAuthStore'
import { toast } from 'sonner'
import { Loader2, Users, UserCheck, Search, ChevronRight, Phone, MapPin, Inbox, AlertCircle, FileText, CheckCircle, XCircle } from 'lucide-react'
import Link from 'next/link'

interface CitizenItem {
  id: string
  fullName: string
  email: string
  nik: string
  address: string
  phone: string
  rt: string
  rw: string
  verificationStatus: string
  verificationNotes: string
  documents: any
}

export default function WargaPage() {
  const { user } = useAuthStore()
  const [citizens, setCitizens] = useState<CitizenItem[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [selectedCitizen, setSelectedCitizen] = useState<CitizenItem | null>(null)
  const [verifying, setVerifying] = useState(false)
  const [notes, setNotes] = useState('')

  const supabase = createClient()

  const canVerify = user?.role === 'admin' || user?.role === 'superadmin' || user?.role === 'rt' || user?.role === 'rw'

  const fetchCitizens = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          full_name,
          email,
          citizen_profiles (
            nik,
            address,
            phone,
            rt,
            rw,
            verification_status,
            verification_notes,
            documents
          )
        `)
        .eq('role', 'warga')
        .order('full_name', { ascending: true })

      if (error) throw error

      const mapped: CitizenItem[] = (data as any[] || []).map((item) => {
        const cp = item.citizen_profiles
        return {
          id: item.id,
          fullName: item.full_name,
          email: item.email || '',
          nik: cp?.nik || 'Belum Mengisi NIK',
          address: cp?.address || 'Alamat Belum Dilengkapi',
          phone: cp?.phone || '',
          rt: cp?.rt || '-',
          rw: cp?.rw || '-',
          verificationStatus: cp?.verification_status || 'unregistered',
          verificationNotes: cp?.verification_notes || '',
          documents: cp?.documents || {}
        }
      })

      setCitizens(mapped)
    } catch (err: any) {
      console.error('Error fetching citizens:', err)
      toast.error('Gagal mengambil data warga')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user) {
      fetchCitizens()
    }
  }, [user])

  const handleVerify = async (status: 'verified' | 'rejected') => {
    if (!selectedCitizen) return
    if (status === 'rejected' && !notes) {
      toast.error('Catatan revisi wajib diisi jika menolak')
      return
    }

    setVerifying(true)
    try {
      const { error } = await supabase
        .from('citizen_profiles')
        .update({
          verification_status: status,
          verification_notes: status === 'rejected' ? notes : null
        })
        .eq('id', selectedCitizen.id)

      if (error) throw error

      toast.success(`Berhasil ${status === 'verified' ? 'verifikasi' : 'tolak'} data warga`)
      setSelectedCitizen(null)
      setNotes('')
      fetchCitizens()
    } catch (err: any) {
      toast.error('Gagal memperbarui status verifikasi')
    } finally {
      setVerifying(false)
    }
  }

  const filteredCitizens = citizens.filter((c) =>
    c.fullName.toLowerCase().includes(search.toLowerCase()) ||
    c.nik.includes(search) ||
    c.address.toLowerCase().includes(search.toLowerCase())
  )

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[8px] font-extrabold tracking-wide uppercase bg-emerald-50 text-emerald-600 border border-emerald-100 shrink-0"><UserCheck className="w-2.5 h-2.5 mr-0.5" /> Terverifikasi</span>
      case 'pending':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[8px] font-extrabold tracking-wide uppercase bg-amber-50 text-amber-600 border border-amber-100 shrink-0"><AlertCircle className="w-2.5 h-2.5 mr-0.5" /> Menunggu</span>
      case 'rejected':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[8px] font-extrabold tracking-wide uppercase bg-red-50 text-red-600 border border-red-100 shrink-0"><XCircle className="w-2.5 h-2.5 mr-0.5" /> Ditolak</span>
      default:
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[8px] font-extrabold tracking-wide uppercase bg-slate-50 text-slate-500 border border-slate-200 shrink-0">Belum Daftar</span>
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 select-none">
      <div className="flex items-center justify-between px-1">
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight flex items-center">
            <Users className="w-6 h-6 mr-2 text-blue-600 shrink-0" />
            Data Kependudukan Warga
          </h1>
          <p className="text-xs text-slate-450 mt-1">
            Daftar profil kependudukan warga terdaftar di sistem wilayah
          </p>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-xs p-5 flex items-center justify-between">
        <div className="flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-full bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center shrink-0 shadow-3xs">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest leading-none">Total Warga Terdaftar</p>
            <p className="text-xs text-slate-500 font-semibold mt-1 leading-none">Warga Wilayah RT</p>
          </div>
        </div>
        <span className="text-lg sm:text-xl font-black text-slate-800 tracking-tight shrink-0">{citizens.length} Jiwa</span>
      </div>

      <div className="relative">
        <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400 pointer-events-none">
          <Search className="w-4 h-4" />
        </span>
        <input
          type="text"
          placeholder="Cari nama warga, NIK, atau alamat..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-11 pr-4 py-3 rounded-2xl border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 bg-white placeholder-slate-400 shadow-xs"
        />
      </div>

      {loading ? (
        <div className="text-center py-12 flex flex-col items-center justify-center space-y-2.5">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Memuat data kependudukan...</p>
        </div>
      ) : filteredCitizens.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filteredCitizens.map((citizen) => (
            <div
              key={citizen.id}
              className="bg-white rounded-3xl border border-slate-100 shadow-xs p-5 space-y-4 hover:border-slate-200/50 transition-colors cursor-pointer"
              onClick={() => {
                if (canVerify && citizen.verificationStatus !== 'unregistered') {
                  setSelectedCitizen(citizen)
                }
              }}
            >
              <div className="flex items-start space-x-3.5 min-w-0">
                <div className="w-9 h-9 rounded-full bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center font-extrabold text-sm shrink-0 shadow-3xs">
                  {citizen.fullName.charAt(0).toUpperCase()}
                </div>
                
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-baseline justify-between gap-1.5 flex-wrap">
                    <h4 className="text-xs font-bold text-slate-800 leading-tight truncate">
                      {citizen.fullName}
                    </h4>
                    {getStatusBadge(citizen.verificationStatus)}
                  </div>
                  
                  <p className="text-[10px] text-slate-450 font-bold uppercase tracking-wider font-mono">
                    NIK: {citizen.nik}
                  </p>
                </div>
              </div>

              <div className="pt-3.5 border-t border-slate-50 text-xs text-slate-500 font-semibold space-y-2 pl-0.5">
                <span className="flex items-start">
                  <MapPin className="w-4 h-4 text-slate-400 mr-2 shrink-0 mt-0.5" />
                  <span className="line-clamp-2">
                    {citizen.address}{' '}
                    {citizen.rt !== '-' && `(RT ${citizen.rt} / RW ${citizen.rw})`}
                  </span>
                </span>
                
                {citizen.phone && (
                  <span className="flex items-center font-bold text-slate-700">
                    <Phone className="w-4 h-4 text-slate-450 mr-2 shrink-0" />
                    <span className="font-mono text-[11px]">{citizen.phone}</span>
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center bg-white rounded-3xl border border-slate-100/80 shadow-xs p-10">
          <div className="w-12 h-12 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center mx-auto mb-3">
            <Inbox className="w-6 h-6" />
          </div>
          <p className="text-sm text-slate-500 font-bold">Warga tidak ditemukan</p>
        </div>
      )}

      {/* Verification Modal */}
      {selectedCitizen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-lg font-bold text-slate-800">Verifikasi Warga</h2>
              <button onClick={() => setSelectedCitizen(null)} className="text-slate-400 hover:text-slate-600">
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[60vh] space-y-4 text-sm">
              <div className="space-y-2">
                <p className="text-slate-500">Nama Lengkap</p>
                <p className="font-semibold">{selectedCitizen.fullName}</p>
              </div>
              <div className="space-y-2">
                <p className="text-slate-500">NIK</p>
                <p className="font-semibold">{selectedCitizen.nik}</p>
              </div>
              <div className="space-y-2">
                <p className="text-slate-500">Alamat</p>
                <p className="font-semibold">{selectedCitizen.address}</p>
              </div>
              
              <div className="border-t border-slate-100 pt-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2"><FileText className="w-4 h-4"/> Dokumen Lampiran</h3>
                <div className="grid grid-cols-2 gap-3">
                  {selectedCitizen.documents?.ktpUrl ? (
                    <a href={selectedCitizen.documents.ktpUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 p-2 bg-blue-50 text-blue-600 rounded-lg text-xs font-semibold hover:bg-blue-100 transition-colors">
                      KTP Terlampir
                    </a>
                  ) : <span className="text-xs text-red-500">KTP Tidak Ada</span>}
                  
                  {selectedCitizen.documents?.kkUrl ? (
                    <a href={selectedCitizen.documents.kkUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 p-2 bg-blue-50 text-blue-600 rounded-lg text-xs font-semibold hover:bg-blue-100 transition-colors">
                      KK Terlampir
                    </a>
                  ) : <span className="text-xs text-red-500">KK Tidak Ada</span>}
                </div>
              </div>

              {selectedCitizen.verificationStatus === 'pending' && (
                <div className="border-t border-slate-100 pt-4">
                  <label className="block text-xs font-semibold text-slate-700 mb-2">Catatan (Wajib jika menolak)</label>
                  <textarea 
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Tulis alasan jika menolak data ini..."
                    className="w-full p-3 rounded-xl border border-slate-200 focus:ring-blue-500 outline-none resize-none text-xs"
                    rows={3}
                  />
                </div>
              )}
            </div>

            {selectedCitizen.verificationStatus === 'pending' && (
              <div className="px-6 py-4 border-t border-slate-100 flex gap-3 bg-slate-50">
                <button
                  onClick={() => handleVerify('rejected')}
                  disabled={verifying}
                  className="flex-1 py-2.5 rounded-xl bg-red-50 text-red-600 font-semibold text-sm hover:bg-red-100 transition-colors"
                >
                  Tolak Data
                </button>
                <button
                  onClick={() => handleVerify('verified')}
                  disabled={verifying}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white font-semibold text-sm hover:bg-emerald-700 transition-colors"
                >
                  {verifying ? 'Memproses...' : 'Approve Data'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
