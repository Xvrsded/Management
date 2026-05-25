'use client'

import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { lettersService, getSimulatedCitizenProfiles } from '@/services/lettersService'
import { LetterRequest, CitizenProfile } from '@/types/letters'
import LetterStatusBadge from './LetterStatusBadge'
import LetterTimeline from './LetterTimeline'
import LetterApprovalActions from './LetterApprovalActions'
import LetterPreviewModal from './LetterPreviewModal'
import LetterPrintLayout from './LetterPrintLayout'
import Link from 'next/link'
import { ArrowLeft, FileText, Calendar, User, Eye, Printer, AlertTriangle, Info } from 'lucide-react'

interface LetterDetailClientProps {
  initialLetter: LetterRequest
  userId: string
  role: string
}

const TYPE_LABELS: Record<string, string> = {
  surat_pengantar: 'Surat Pengantar RT/RW',
  surat_keterangan_domisili: 'Surat Keterangan Domisili',
  surat_keterangan_tidak_mampu: 'Surat Keterangan Tidak Mampu (SKTM)',
  surat_keterangan_usaha: 'Surat Keterangan Usaha (SKU)'
}

export default function LetterDetailClient({ initialLetter, userId, role }: LetterDetailClientProps) {
  const queryClient = useQueryClient()
  const [isPreviewOpen, setIsPreviewOpen] = useState<boolean>(false)

  const isWarga = role === 'warga'
  const isRT = role === 'rt'
  const isRW = role === 'rw'
  const isStaff = ['rt', 'rw', 'admin', 'superadmin'].includes(role)

  // 1. Query for live updates
  const { data: queryLetter, refetch } = useQuery({
    queryKey: ['letter', initialLetter.id],
    queryFn: () => lettersService.getLetterRequestById(initialLetter.id),
    initialData: initialLetter,
    staleTime: 5000
  })

  const letter = queryLetter || initialLetter

  // 2. Fetch citizen details for the print layout
  const citizen = getSimulatedCitizenProfiles()[letter.profile_id] || getSimulatedCitizenProfiles()['user-warga']

  const handleActionComplete = () => {
    refetch()
    queryClient.invalidateQueries(['letters'])
  }

  const label = TYPE_LABELS[letter.letter_type] || letter.letter_type
  const activeApproval = letter.letter_approvals?.find(a => a.role === (isRW ? 'rw' : 'rt'))

  // Check if this user needs to take action
  const needsAction = 
    (isRT && letter.status === 'pending_rt') ||
    (isRW && letter.status === 'approved_rt')

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  return (
    <>
      {/* A. Print-Only Container (Visible strictly inside window.print()) */}
      <div className="hidden print:block">
        <LetterPrintLayout letter={letter} citizen={citizen} />
      </div>

      {/* B. Screen-Only Dashboard Container */}
      <div className="max-w-md mx-auto space-y-6 pb-20 print:hidden animate-in fade-in duration-200">
        
        {/* Navigation Header */}
        <div className="flex items-center space-x-3 px-1">
          <Link
            href="/surat"
            className="w-9 h-9 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h2 className="text-base font-bold text-slate-800 leading-tight">Detail Pengajuan</h2>
            <p className="text-3xs font-medium text-slate-400 mt-0.5">ID: {letter.id.slice(0, 18).toUpperCase()}</p>
          </div>
        </div>

        {/* 1. Letter Info Card */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5 space-y-4">
          <div className="flex justify-between items-start gap-2 flex-wrap">
            <LetterStatusBadge status={letter.status} />
            <span className="text-3xs font-semibold text-slate-400 flex items-center bg-slate-50 px-2 py-1 rounded-xl">
              <Calendar className="w-3.5 h-3.5 mr-1" />
              {formatDate(letter.created_at)}
            </span>
          </div>

          <div className="space-y-1">
            <span className="text-3xs font-bold text-slate-400 uppercase tracking-wider block">Jenis Pengajuan</span>
            <h3 className="text-sm font-black text-slate-800 flex items-center leading-snug">
              <FileText className="w-4.5 h-4.5 mr-1.5 text-primary" />
              {label}
            </h3>
          </div>

          <div className="space-y-1.5 pt-2.5 border-t border-slate-50">
            <span className="text-3xs font-bold text-slate-400 uppercase tracking-wider block">Maksud Keperluan</span>
            <p className="text-xs font-semibold text-slate-600 leading-relaxed bg-slate-50/50 p-3.5 rounded-2xl border border-slate-100">
              "{letter.purpose}"
            </p>
          </div>

          {/* If there are custom fields, render them */}
          {letter.custom_fields && Object.keys(letter.custom_fields).length > 0 && (
            <div className="space-y-2 pt-2.5 border-t border-slate-50 text-2xs font-semibold text-slate-500">
              <span className="text-3xs font-bold text-slate-400 uppercase tracking-wider block">Data Lampiran Form:</span>
              <div className="bg-slate-50/50 border border-slate-100 p-3 rounded-2xl space-y-1.5">
                {Object.entries(letter.custom_fields).map(([key, val]) => (
                  <div key={key} className="grid grid-cols-[110px_1fr] gap-x-2">
                    <span className="capitalize text-slate-400">{key.replace(/_/g, ' ')}</span>
                    <span className="text-slate-700 font-bold">{val}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Citizen Details (for Staff) */}
          {isStaff && letter.profiles && (
            <div className="pt-3 border-t border-slate-50 flex items-center space-x-3">
              <div className="w-8 h-8 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400">
                <User className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-3xs font-bold text-slate-400 uppercase tracking-wider">Warga Pemohon</p>
                <p className="text-xs font-bold text-slate-700 truncate leading-snug">
                  {letter.profiles.full_name} <span className="font-medium text-slate-400 text-3xs">({letter.profiles.email})</span>
                </p>
              </div>
            </div>
          )}
        </div>

        {/* 2. Print trigger layout (If finalized) */}
        {letter.status === 'finished' && (
          <div className="bg-emerald-50 border border-emerald-100 rounded-3xl p-5 shadow-sm space-y-3.5 animate-in zoom-in-95">
            <div className="flex items-center space-x-2 text-emerald-800">
              <Info className="w-4.5 h-4.5 text-emerald-600" />
              <h4 className="text-xs font-black uppercase tracking-wider">Surat Siap Dicetak</h4>
            </div>
            <p className="text-2xs text-emerald-700 leading-relaxed font-semibold">
              Surat resmi Anda telah ditandatangani dan disahkan oleh Ketua RW. Silakan klik tombol cetak di bawah untuk mencetak atau menyimpan dokumen sebagai PDF.
            </p>
            <button
              onClick={() => window.print()}
              className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center space-x-2 shadow-sm transition-all"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Surat Resmi</span>
            </button>
          </div>
        )}

        {/* 3. Supporting Document preview box */}
        {letter.support_document_url && (
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5 space-y-3.5">
            <div className="flex justify-between items-center">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Lampiran Berkas Pendukung</h4>
              <button
                onClick={() => setIsPreviewOpen(true)}
                className="text-2xs font-bold text-primary flex items-center hover:underline"
              >
                Pratinjau <Eye className="w-3.5 h-3.5 ml-0.5" />
              </button>
            </div>
            <div
              onClick={() => setIsPreviewOpen(true)}
              className="w-full h-36 rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 flex items-center justify-center cursor-pointer hover:opacity-95 transition-opacity"
            >
              {letter.support_document_url.toLowerCase().endsWith('.pdf') ? (
                <div className="text-center space-y-1">
                  <FileText className="w-8 h-8 mx-auto text-slate-400" />
                  <span className="text-3xs font-bold text-slate-500 uppercase tracking-wider block">Scan PDF KK/KTP</span>
                </div>
              ) : (
                <img
                  src={letter.support_document_url}
                  alt="Dokumen pendukung"
                  className="object-contain w-full h-36"
                />
              )}
            </div>
          </div>
        )}

        {/* 4. Timeline logs */}
        <LetterTimeline letter={letter} />

        {/* 5. Approval Action Dashboard (Staff only) */}
        {needsAction && (
          <LetterApprovalActions
            letterId={letter.id}
            role={role}
            userId={userId}
            onActionComplete={handleActionComplete}
          />
        )}

        {/* Lightbox previews */}
        <LetterPreviewModal
          url={letter.support_document_url}
          isOpen={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
        />

      </div>
    </>
  )
}
