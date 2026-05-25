'use client'

import { useState, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { lettersService, getSimulatedCitizenProfiles } from '@/services/lettersService'
import { LetterRequest, LetterStatus } from '@/types/letters'
import LetterStatusBadge from './LetterStatusBadge'
import RealtimeCivicClock from './RealtimeCivicClock'
import LetterTimeline from './LetterTimeline'
import LetterPreviewModal from './LetterPreviewModal'
import { 
  Search, CheckCircle2, XCircle, AlertTriangle, Clock, RefreshCw, FileText, 
  User, Shield, Phone, Home, Mail, FileCheck, HelpCircle, Eye, Check, X, 
  ArrowLeft, Archive, Signature, Upload, Inbox
} from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/services/supabase/client'
import { displayRT, displayRW } from '@/lib/region-format'
import { storageUtils } from '@/lib/storage/storage-utils'
import { STORAGE_BUCKETS } from '@/lib/storage/buckets'

interface AdminLettersDashboardProps {
  userId: string
  role: string
}

export default function AdminLettersDashboard({ userId, role }: AdminLettersDashboardProps) {
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedLetterId, setSelectedLetterId] = useState<string | null>(null)
  
  // Auditing Action States
  const [note, setNote] = useState<string>('')
  const [isAuditing, setIsAuditing] = useState<boolean>(false)
  const [isPreviewOpen, setIsPreviewOpen] = useState<boolean>(false)
  
  // Digital signature PNG state
  const [selectedSigFile, setSelectedSigFile] = useState<File | null>(null)
  const [uploadingSig, setUploadingSig] = useState<boolean>(false)
  const [currentSignatureUrl, setCurrentSignatureUrl] = useState<string | null>(null)

  const isRT = role === 'rt'
  const isRW = role === 'rw'

  // Load current signature URL on mount
  useEffect(() => {
    async function loadSignature() {
      const supabase = createClient()
      const { data } = await supabase
        .from('profiles')
        .select('signature_url')
        .eq('id', userId)
        .single()
      if (data?.signature_url) {
        setCurrentSignatureUrl(data.signature_url)
      }
    }
    loadSignature()
  }, [userId])

  // Fetch admin letter requests
  const { data: letters = [], refetch, isLoading, isFetching } = useQuery({
    queryKey: ['admin-letters', role, userId, statusFilter, searchTerm],
    queryFn: () => lettersService.getMyLetters(role, userId, { status: statusFilter, search: searchTerm }),
    staleTime: 5000
  })

  // Auto-select the first letter if nothing is selected and we have items
  useEffect(() => {
    if (letters.length > 0 && !selectedLetterId) {
      setSelectedLetterId(letters[0].id)
    }
  }, [letters, selectedLetterId])

  const selectedLetter = letters.find(l => l.id === selectedLetterId)

  // Fetch the target citizen kependudukan profile details
  const targetCitizen = selectedLetter 
    ? getSimulatedCitizenProfiles()[selectedLetter.profile_id] || getSimulatedCitizenProfiles()['user-warga']
    : null

  // Calculate statistics metrics
  const totalCount = letters.length
  const pendingRtCount = letters.filter(l => l.status === 'pending_rt').length
  const pendingRwCount = letters.filter(l => l.status === 'approved_rt').length
  const finishedCount = letters.filter(l => l.status === 'finished').length
  const rejectedCount = letters.filter(l => l.status === 'rejected').length

  const handleSignatureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Ukuran file tanda tangan maksimal adalah 2MB.')
        return
      }
      if (file.type !== 'image/png') {
        toast.error('Format tanda tangan harus PNG transparan.')
        return
      }

      setUploadingSig(true)
      try {
        const uploadRes = await storageUtils.uploadFile(
          STORAGE_BUCKETS.LETTER_DOCUMENTS,
          `${userId}/signature`,
          file
        )

        if (!uploadRes.success || !uploadRes.url) {
          throw new Error(uploadRes.error || 'Gagal mengunggah tanda tangan')
        }

        const publicUrl = uploadRes.url
        const supabase = createClient()

        // Update profile
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ signature_url: publicUrl })
          .eq('id', userId)

        if (updateError) throw updateError

        setCurrentSignatureUrl(publicUrl)
        toast.success('Tanda tangan digital berhasil diunggah!')
      } catch (err: any) {
        toast.error(err.message || 'Gagal mengunggah tanda tangan.')
      } finally {
        setUploadingSig(false)
      }
    }
  }

  const handleAuditAction = async (action: 'approve' | 'reject' | 'revision') => {
    if (!selectedLetterId) return
    setIsAuditing(true)

    try {
      if (action === 'approve') {
        let res
        if (isRT) {
          res = await lettersService.approveByRT(selectedLetterId, userId, note)
        } else {
          // RW needs to pass their RT/RW values to format letter numbers
          res = await lettersService.approveByRW(selectedLetterId, userId, '03', '05', note)
        }

        if (res.success) {
          toast.success('Pengajuan berhasil DISETUJUI & disahkan!')
          setNote('')
          refetch()
          queryClient.invalidateQueries(['letters'])
        } else {
          throw new Error(res.error)
        }
      } else if (action === 'reject') {
        if (!note.trim()) {
          toast.error('Alasan penolakan (catatan audit) wajib diisi untuk penolakan.');
          setIsAuditing(false)
          return
        }
        const res = await lettersService.rejectLetter(selectedLetterId, isRT ? 'rt' : 'rw', userId, note)
        if (res.success) {
          toast.success('Pengajuan berhasil DITOLAK.');
          setNote('')
          refetch()
          queryClient.invalidateQueries(['letters'])
        } else {
          throw new Error(res.error)
        }
      } else if (action === 'revision') {
        if (!note.trim()) {
          toast.error('Catatan instruksi revisi wajib diisi agar warga tahu apa yang perlu diperbaiki.');
          setIsAuditing(false)
          return
        }
        const res = await lettersService.rejectLetter(selectedLetterId, isRT ? 'rt' : 'rw', userId, `Instruksi Revisi: ${note}`)
        if (res.success) {
          toast.success('Status diubah ke permintaan revisi berkas.');
          setNote('')
          refetch()
          queryClient.invalidateQueries(['letters'])
        } else {
          throw new Error(res.error)
        }
      }
    } catch (err: any) {
      toast.error(err.message || 'Gagal memproses aksi audit.')
    } finally {
      setIsAuditing(false)
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 select-none animate-in fade-in duration-200">
      
      {/* Header Panel */}
      <div className="flex justify-between items-center gap-4 flex-wrap px-1">
        <div>
          <h1 className="text-xl font-black text-slate-800 tracking-tight flex items-center leading-none">
            <Shield className="w-5.5 h-5.5 mr-2 text-blue-600" />
            Layanan Surat Warga <span className="ml-2 px-2.5 py-0.5 rounded-full bg-blue-50 text-[10px] font-black text-blue-600 border border-blue-100 uppercase">{role} Console</span>
          </h1>
          <p className="text-xs font-semibold text-slate-450 mt-1.5">
            Kelola, setujui, revisi, dan arsipkan permohonan surat administrasi warga
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <RealtimeCivicClock />
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="w-8.5 h-8.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center border border-slate-100 transition-colors bg-white shadow-3xs"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* 1. Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
        {[
          { label: 'Total Antrean', count: totalCount, icon: FileText, color: 'text-slate-600 bg-slate-50 border-slate-100' },
          { label: 'Antrean RT', count: pendingRtCount, icon: Clock, color: 'text-amber-600 bg-amber-50 border-amber-100' },
          { label: 'Antrean RW', count: pendingRwCount, icon: Clock, color: 'text-indigo-600 bg-indigo-50 border-indigo-100' },
          { label: 'Surat Selesai', count: finishedCount, icon: CheckCircle2, color: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
          { label: 'Ditolak', count: rejectedCount, icon: XCircle, color: 'text-rose-600 bg-rose-50 border-rose-100' }
        ].map((m, i) => {
          const Icon = m.icon
          return (
            <div key={i} className={`rounded-2xl border p-4 flex flex-col justify-between shadow-3xs bg-white ${m.color}`}>
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">{m.label}</span>
                <Icon className="w-4 h-4 shrink-0 opacity-70" />
              </div>
              <h3 className="text-xl font-black tracking-tight leading-none mt-3.5">{m.count} <span className="text-2xs font-bold text-slate-400">berkas</span></h3>
            </div>
          )
        })}
      </div>

      {/* 2. Unified Inbox Split-Screen Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 min-h-[60vh] items-stretch">
        
        {/* Left Side: Interactive Inbox list (40% width) */}
        <div className="lg:col-span-5 flex flex-col space-y-4">
          
          {/* Filters Header Bar */}
          <div className="bg-white border border-slate-150/70 rounded-3xl p-4.5 space-y-3 shadow-sm">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cari warga, keperluan, kode..."
                className="w-full text-xs font-semibold pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 placeholder-slate-450 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
              />
            </div>
            
            <div className="flex bg-slate-50 p-1 rounded-xl space-x-1 border border-slate-100">
              {[
                { id: 'all', label: 'Semua' },
                { id: isRT ? 'pending_rt' : 'approved_rt', label: 'Perlu Tindakan' },
                { id: 'finished', label: 'Selesai' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setStatusFilter(tab.id)}
                  className={`flex-1 text-center py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                    statusFilter === tab.id
                      ? 'bg-white text-blue-600 shadow-3xs'
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Inbox Scrollable cards list */}
          <div className="flex-1 overflow-y-auto max-h-[50vh] lg:max-h-[65vh] space-y-2.5 pr-1 scrollbar-thin">
            {isLoading ? (
              <div className="bg-white border border-slate-100 rounded-3xl p-5 space-y-3 animate-pulse">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex justify-between items-center pt-2">
                    <div className="h-4 w-28 bg-slate-200 rounded-md" />
                    <div className="h-4 w-12 bg-slate-100 rounded-md" />
                  </div>
                ))}
              </div>
            ) : letters.length === 0 ? (
              <div className="bg-white border border-slate-100 rounded-3xl p-8 text-center flex flex-col items-center justify-center shadow-3xs">
                <Archive className="w-10 h-10 text-slate-350 mb-2.5" />
                <h5 className="text-xs font-bold text-slate-700">Antrean Kosong</h5>
                <p className="text-[10px] text-slate-400 mt-1 max-w-[200px] leading-relaxed">
                  Tidak ada pengajuan surat dalam antrean tindakan saat ini.
                </p>
              </div>
            ) : (
              letters.map((letter) => {
                const isActive = letter.id === selectedLetterId
                const timeStr = new Date(letter.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
                const isActionNeeded = (isRT && letter.status === 'pending_rt') || (isRW && letter.status === 'approved_rt')
                
                return (
                  <div
                    key={letter.id}
                    onClick={() => setSelectedLetterId(letter.id)}
                    className={`border rounded-2.5xl p-4.5 cursor-pointer shadow-3xs transition-all relative overflow-hidden active:scale-[0.99] flex gap-3.5 items-start ${
                      isActive 
                        ? 'border-blue-600 bg-blue-50/20 text-slate-800' 
                        : 'border-slate-100 bg-white hover:border-slate-200'
                    }`}
                  >
                    {isActionNeeded && (
                      <span className="absolute top-0 left-0 w-1.5 h-full bg-blue-600" />
                    )}
                    
                    {/* User Avatar Circle */}
                    <div className="w-10 h-10 rounded-full bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center font-black text-xs uppercase shrink-0">
                      {letter.profiles?.full_name?.slice(0, 2) || 'WA'}
                    </div>

                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex justify-between items-baseline gap-2">
                        <h4 className="text-xs font-black text-slate-800 truncate">
                          {letter.profiles?.full_name || 'Budi Santoso'}
                        </h4>
                        <span className="text-[9px] font-extrabold text-slate-400 font-mono tracking-wider shrink-0">{timeStr} WIB</span>
                      </div>
                      
                      <p className="text-[10px] font-extrabold text-slate-500 truncate uppercase tracking-wide leading-none pt-0.5">
                        {letter.letter_type.replace(/_/g, ' ')}
                      </p>
                      
                      <p className="text-3xs font-semibold text-slate-400 line-clamp-1">
                        Keperluan: {letter.purpose}
                      </p>

                      <div className="flex justify-between items-center pt-2.5">
                        <LetterStatusBadge status={letter.status} />
                        <span className="text-[8px] font-black text-slate-400 font-mono tracking-widest leading-none uppercase">
                          {letter.request_code}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* 3. Tanda Tangan Digital Uploader Stamp (RT/RW signature setup) */}
          <div className="bg-white border border-slate-150/70 rounded-3xl p-4.5 space-y-3.5 shadow-sm">
            <div className="flex items-center space-x-2 text-slate-700">
              <Signature className="w-4.5 h-4.5 text-blue-600" />
              <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-800 leading-none">Tanda Tangan Digital</h4>
            </div>

            {currentSignatureUrl ? (
              <div className="flex items-center space-x-3.5 bg-slate-50 border border-slate-200 p-3 rounded-2xl">
                <div className="w-16 h-12 rounded-xl bg-white border border-slate-100 flex items-center justify-center p-1.5 shrink-0">
                  <img src={currentSignatureUrl} alt="Signature Stamp" className="w-full h-full object-contain" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-3xs font-black text-slate-450 uppercase tracking-widest">Ttd Aktif</p>
                  <p className="text-[10px] font-extrabold text-emerald-600 mt-1">SIAP DIATAS KOP SURAT</p>
                </div>
              </div>
            ) : (
              <p className="text-[9px] text-slate-400 font-semibold leading-relaxed">
                Anda belum mengunggah stempel tanda tangan. Silakan unggah berkas stempel PNG transparan agar otomatis disematkan ke PDF surat resmi warga.
              </p>
            )}

            <label className="w-full py-2.5 rounded-xl border border-dashed border-slate-350 hover:bg-slate-50 cursor-pointer flex items-center justify-center space-x-2 text-3xs font-black uppercase tracking-widest text-slate-600 transition-colors">
              <Upload className="w-3.5 h-3.5 text-slate-400" />
              <span>{uploadingSig ? 'Mengunggah...' : 'Unggah Stempel Ttd (PNG)'}</span>
              <input
                type="file"
                accept=".png"
                onChange={handleSignatureUpload}
                disabled={uploadingSig}
                className="hidden"
              />
            </label>
          </div>

        </div>

        {/* Right Side: Detailed citizen data & administrative actions (60% width) */}
        <div className="lg:col-span-7 flex flex-col">
          {selectedLetter ? (
            <div className="bg-white border border-slate-150/70 rounded-3xl p-5 sm:p-6 shadow-sm space-y-5 flex flex-col h-full min-h-0">
              
              {/* Split Header details */}
              <div className="flex justify-between items-start gap-3 flex-wrap border-b border-slate-100 pb-4">
                <div className="space-y-1.5">
                  <div className="flex items-center space-x-2">
                    <LetterStatusBadge status={selectedLetter.status} />
                    <span className="text-[9px] font-extrabold text-slate-400 font-mono tracking-widest bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-lg leading-none">
                      {selectedLetter.request_code}
                    </span>
                  </div>
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-wide leading-snug">
                    {selectedLetter.letter_type.replace(/_/g, ' ')}
                  </h3>
                  <p className="text-[10px] font-semibold text-slate-400 flex items-center leading-none">
                    Diterima: {formatDate(selectedLetter.created_at)}
                  </p>
                </div>

                <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-100 leading-none">
                  ESTIMASI SELESAI: 1-2 HARI
                </span>
              </div>

              {/* Scrollable details panel */}
              <div className="space-y-5 overflow-y-auto max-h-[55vh] lg:max-h-[60vh] pr-1 scrollbar-thin">
                
                {/* A. Citizen Demographic Card (Detailed Citizen Data) */}
                <div className="bg-gradient-to-br from-slate-50 to-blue-50/20 border border-slate-100 rounded-2xl p-4.5 space-y-3.5">
                  <div className="flex items-center space-x-2 text-slate-700">
                    <User className="w-4 h-4 text-blue-600 flex-shrink-0" />
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-800 leading-none">Informasi Lengkap Pemohon</h4>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-2xs font-semibold text-slate-500 pt-1 border-t border-slate-100">
                    <div className="flex flex-col space-y-0.5">
                      <span className="text-slate-400 text-3xs font-bold uppercase tracking-wider">Nama Warga</span>
                      <span className="text-slate-800 font-black uppercase">{selectedLetter.profiles?.full_name || 'Budi Santoso'}</span>
                    </div>
                    <div className="flex flex-col space-y-0.5">
                      <span className="text-slate-400 text-3xs font-bold uppercase tracking-wider">NIK Kependudukan</span>
                      <span className="text-slate-800 font-bold font-mono tracking-wider">{targetCitizen?.nik || '3273012304950002'}</span>
                    </div>
                    <div className="flex flex-col space-y-0.5">
                      <span className="text-slate-400 text-3xs font-bold uppercase tracking-wider">Nomor Kartu Keluarga</span>
                      <span className="text-slate-800 font-bold font-mono tracking-wider">{targetCitizen?.kk || '3273012304951113'}</span>
                    </div>
                    <div className="flex flex-col space-y-0.5">
                      <span className="text-slate-400 text-3xs font-bold uppercase tracking-wider">Wilayah RT/RW</span>
                      <span className="text-slate-800 font-bold">{displayRT(targetCitizen?.rt || '03')} / {displayRW(targetCitizen?.rw || '05')}</span>
                    </div>
                    <div className="flex flex-col space-y-0.5">
                      <span className="text-slate-400 text-3xs font-bold uppercase tracking-wider">Nomor Handphone</span>
                      <span className="text-slate-800 font-bold flex items-center font-sans tracking-wide">
                        <Phone className="w-3 h-3 mr-1 text-slate-450 shrink-0" />
                        {targetCitizen?.phone || '081234567890'}
                      </span>
                    </div>
                    <div className="flex flex-col space-y-0.5">
                      <span className="text-slate-400 text-3xs font-bold uppercase tracking-wider">Alamat Terdaftar</span>
                      <span className="text-slate-800 font-bold leading-snug">
                        {targetCitizen?.address || 'Jl. Kebon Jeruk No. 24'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* B. Specific Request Details */}
                <div className="space-y-4">
                  <div className="space-y-1">
                    <span className="text-3xs font-bold text-slate-400 uppercase tracking-wider block">Maksud Keperluan</span>
                    <p className="text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-100 p-3.5 rounded-2xl leading-relaxed">
                      "{selectedLetter.purpose}"
                    </p>
                  </div>

                  {/* Attached Custom Fields */}
                  {selectedLetter.custom_fields && Object.keys(selectedLetter.custom_fields).length > 0 && (
                    <div className="space-y-2 text-2xs font-semibold text-slate-500">
                      <span className="text-3xs font-bold text-slate-400 uppercase tracking-wider block">Data Pelengkap Formulir:</span>
                      <div className="bg-slate-50/50 border border-slate-100 p-3 rounded-2xl space-y-1.5 shadow-3xs">
                        {Object.entries(selectedLetter.custom_fields).map(([key, val]) => (
                          <div key={key} className="grid grid-cols-[120px_1fr] gap-x-2">
                            <span className="capitalize text-slate-400 font-bold">{key.replace(/_/g, ' ')}</span>
                            <span className="text-slate-850 font-black">{val}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Attachment document preview */}
                  {selectedLetter.support_document_url && (
                    <div className="bg-white rounded-2xl border border-slate-150 p-4.5 space-y-3 shadow-3xs">
                      <div className="flex justify-between items-center">
                        <span className="text-3xs font-bold text-slate-400 uppercase tracking-wider">Lampiran Dokumen Warga</span>
                        <button
                          onClick={() => setIsPreviewOpen(true)}
                          className="text-3xs font-black text-blue-600 uppercase tracking-widest flex items-center hover:underline"
                        >
                          Pratinjau Lampiran <Eye className="w-3.5 h-3.5 ml-0.5 shrink-0" />
                        </button>
                      </div>

                      <div
                        onClick={() => setIsPreviewOpen(true)}
                        className="w-full h-32 rounded-xl overflow-hidden border border-slate-150 bg-slate-50 flex items-center justify-center cursor-pointer hover:opacity-95 transition-opacity"
                      >
                        {selectedLetter.support_document_url.toLowerCase().endsWith('.pdf') ? (
                          <div className="text-center space-y-1">
                            <FileText className="w-7 h-7 mx-auto text-slate-400" />
                            <span className="text-3xs font-bold text-slate-500 uppercase tracking-widest block">Format Dokumen PDF</span>
                          </div>
                        ) : (
                          <img
                            src={selectedLetter.support_document_url}
                            alt="Warga doc attachment"
                            className="object-contain w-full h-32"
                          />
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* C. Letter Log Timelines */}
                <LetterTimeline letter={selectedLetter} />

                {/* D. Administrative Auditing Panel controls (Approve/Reject actions) */}
                {((isRT && selectedLetter.status === 'pending_rt') || 
                  (isRW && selectedLetter.status === 'approved_rt')) && (
                  <div className="bg-slate-50/50 border border-slate-150 p-4.5 rounded-3xl space-y-4 shadow-3xs">
                    <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest block leading-none">Panel Kontrol Verifikator</span>
                    
                    <div className="space-y-1.5">
                      <label className="text-2xs font-bold text-slate-450 uppercase tracking-wider block">Catatan Verifikasi / Alasan Penolakan</label>
                      <textarea
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="Contoh: Berkas KK/KTP warga lengkap dan valid..."
                        rows={2}
                        className="w-full text-xs font-semibold p-3 rounded-xl border border-slate-200 bg-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div className="flex gap-2 flex-wrap sm:flex-nowrap">
                      {/* Revision */}
                      <button
                        type="button"
                        onClick={() => handleAuditAction('revision')}
                        disabled={isAuditing}
                        className="flex-1 py-3 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-100 text-amber-700 text-2xs font-extrabold uppercase tracking-wider transition-colors disabled:opacity-50"
                      >
                        Minta Revisi
                      </button>

                      {/* Reject */}
                      <button
                        type="button"
                        onClick={() => handleAuditAction('reject')}
                        disabled={isAuditing}
                        className="flex-1 py-3 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-100 text-rose-700 text-2xs font-extrabold uppercase tracking-wider transition-colors disabled:opacity-50"
                      >
                        Tolak Berkas
                      </button>

                      {/* Approve */}
                      <button
                        type="button"
                        onClick={() => handleAuditAction('approve')}
                        disabled={isAuditing}
                        className="flex-2 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-2xs font-black uppercase tracking-widest flex items-center justify-center space-x-1.5 shadow-sm disabled:opacity-50"
                      >
                        <Check className="w-3.5 h-3.5 shrink-0" />
                        <span>Verifikasi Sah</span>
                      </button>
                    </div>
                  </div>
                )}

              </div>

              {/* Lightbox attachment preview modal */}
              <LetterPreviewModal
                url={selectedLetter.support_document_url}
                isOpen={isPreviewOpen}
                onClose={() => setIsPreviewOpen(false)}
              />

            </div>
          ) : (
            <div className="bg-white border border-slate-150/70 rounded-3xl p-10 text-center flex flex-col items-center justify-center h-full min-h-[50vh] shadow-sm">
              <Inbox className="w-12 h-12 text-slate-350 mb-3" />
              <h5 className="text-xs font-black text-slate-700 uppercase tracking-wider">Silakan Pilih Antrean</h5>
              <p className="text-[10px] text-slate-400 mt-1.5 max-w-[220px] leading-relaxed">
                Pilih salah satu surat warga dari antrean sebelah kiri untuk meninjau identitas warga dan memberikan pengesahan.
              </p>
            </div>
          )}
        </div>

      </div>

    </div>
  )
}
