'use client'

import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import {
  ArrowLeft,
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
  Calendar,
  User,
  ExternalLink,
  Info
} from 'lucide-react'
import { duesService } from '@/services/duesService'
import { paymentService } from '@/services/payment/paymentService'
import UploadProofForm from './UploadProofForm'
import VerifyActionGroup from './VerifyActionGroup'
import { DuePayment } from '@/types/dues'
import { toast } from 'sonner'

interface DueDetailClientProps {
  initialDue: DuePayment
  userId: string
  role: string
}

export default function DueDetailClient({ initialDue, userId, role }: DueDetailClientProps) {
  const queryClient = useQueryClient()
  const [fullscreenImage, setFullscreenImage] = useState<boolean>(false)
  
  // Checkout selection states
  const [paymentMethod, setPaymentMethod] = useState<'manual_transfer' | 'qris'>('manual_transfer')
  const [activeTrx, setActiveTrx] = useState<any | null>(null)
  const [generatingTrx, setGeneratingTrx] = useState(false)

  const isCitizen = role === 'warga'
  const isStaff = ['rt', 'rw', 'admin', 'superadmin'].includes(role)

  // Stream live data updates with TanStack Query
  const { data: queryDue, refetch } = useQuery({
    queryKey: ['due', initialDue.id],
    queryFn: () => duesService.getDueById(initialDue.id),
    initialData: initialDue,
    staleTime: 5000
  })

  const due = queryDue || initialDue

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(value)
  }

  // Format full date time
  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handleUploadSuccess = () => {
    refetch()
    queryClient.invalidateQueries(['dues'])
  }

  const handleVerificationResult = () => {
    refetch()
    queryClient.invalidateQueries(['dues'])
  }

  const handleCreateTransaction = async () => {
    setGeneratingTrx(true)
    try {
      const res = await paymentService.getGateway().createTransaction({
        paymentId: due.id,
        profileId: userId,
        amount: due.amount,
        paymentMethod: paymentMethod
      })
      if (res.success) {
        setActiveTrx(res)
        toast.success('Kode transaksi berhasil dibuat!')
      } else {
        toast.error('Gagal membuat kode transaksi digital')
      }
    } catch (e) {
      toast.error('Gagal menghubungi billing payment')
    } finally {
      setGeneratingTrx(false)
    }
  }

  // Define status details
  const statusConfig = {
    unpaid: {
      color: 'text-rose-700 bg-rose-50 border-rose-100',
      icon: AlertTriangle,
      label: 'Belum Dibayar',
      desc: 'Silakan pilih metode pembayaran dan kirimkan bukti transfer Anda.'
    },
    pending_verification: {
      color: 'text-amber-700 bg-amber-50 border-amber-100',
      icon: Clock,
      label: 'Menunggu Verifikasi',
      desc: 'Bukti transfer sedang ditinjau oleh pengurus RT/RW.'
    },
    verified: {
      color: 'text-emerald-700 bg-emerald-50 border-emerald-100',
      icon: CheckCircle2,
      label: 'Pembayaran Lunas',
      desc: 'Pembayaran iuran bulanan Anda telah berhasil diverifikasi dan disetujui.'
    },
    rejected: {
      color: 'text-slate-700 bg-slate-100 border-slate-200',
      icon: XCircle,
      label: 'Bukti Ditolak',
      desc: 'Pembayaran ditolak. Silakan ajukan ulang transfer bukti yang valid.'
    }
  }

  const status = statusConfig[due.status as keyof typeof statusConfig] || statusConfig.unpaid
  const StatusIcon = status.icon

  return (
    <div className="max-w-md mx-auto space-y-6 pb-20 select-none">
      {/* Top back navigation header */}
      <div className="flex items-center space-x-3 px-1">
        <Link
          href="/iuran"
          className="w-9 h-9 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h2 className="text-base font-bold text-slate-800 leading-tight">Detail Tagihan</h2>
          <p className="text-3xs font-medium text-slate-400 mt-0.5">Kode Tagihan: {due.id.slice(0, 8).toUpperCase()}</p>
        </div>
      </div>

      {/* 1. Due Breakdown Card */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-5 space-y-4">
          <div className="flex justify-between items-start">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-3xs font-bold uppercase tracking-wider ${status.color}`}>
              <StatusIcon className="w-3 h-3 mr-1" />
              {status.label}
            </span>
          </div>

          <div className="space-y-1">
            <p className="text-3xs font-bold text-slate-400 uppercase tracking-wider">Judul Tagihan</p>
            <h3 className="text-base font-bold text-slate-800 leading-snug">{due.title}</h3>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-1">
            <div>
              <p className="text-3xs font-bold text-slate-400 uppercase tracking-wider">Jumlah Tagihan</p>
              <p className="text-lg font-black text-slate-800 tracking-tight mt-0.5">{formatCurrency(due.amount)}</p>
            </div>
            <div>
              <p className="text-3xs font-bold text-slate-400 uppercase tracking-wider">Batas Waktu</p>
              <p className="text-sm font-bold text-slate-700 mt-1 flex items-center">
                <Calendar className="w-4 h-4 mr-1 text-slate-400" />
                {new Date(due.due_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
            </div>
          </div>

          {due.profiles && (
            <div className="pt-3 border-t border-slate-50 flex items-center space-x-3">
              <div className="w-8 h-8 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400">
                <User className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-3xs font-bold text-slate-400 uppercase tracking-wider">Pemilik Tagihan</p>
                <p className="text-xs font-bold text-slate-700 truncate leading-snug">
                  {due.profiles.full_name} <span className="font-medium text-slate-400 text-3xs">({due.profiles.email})</span>
                </p>
              </div>
            </div>
          )}

          {/* Description status banner */}
          <p className="text-2xs text-slate-500 bg-slate-50 p-3 rounded-2xl border border-slate-100 flex items-start leading-relaxed">
            <Info className="w-4 h-4 mr-1.5 text-slate-400 flex-shrink-0 mt-0.5" />
            <span>{status.desc}</span>
          </p>
        </div>
      </div>

      {/* Rejection notice block */}
      {due.status === 'rejected' && due.rejection_reason && (
        <div className="bg-rose-50/50 border border-rose-100 rounded-3xl p-5 shadow-sm space-y-2">
          <div className="flex items-center space-x-2 text-rose-700">
            <AlertTriangle className="w-4.5 h-4.5" />
            <h4 className="text-xs font-bold uppercase tracking-wider">Alasan Penolakan</h4>
          </div>
          <p className="text-xs font-semibold text-rose-800 bg-white border border-rose-100 p-3.5 rounded-2xl leading-relaxed">
            "{due.rejection_reason}"
          </p>
        </div>
      )}

      {/* 2. Interactive Payment Proof Container */}
      {due.proof_url && (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5 space-y-3.5">
          <div className="flex justify-between items-center">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Dokumen Bukti Transfer</h4>
            <button
              onClick={() => setFullscreenImage(true)}
              className="text-2xs font-bold text-blue-600 flex items-center hover:underline"
            >
              Perbesar Bukti <ExternalLink className="w-3.5 h-3.5 ml-0.5" />
            </button>
          </div>
          <div
            onClick={() => setFullscreenImage(true)}
            className="w-full h-48 rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 flex items-center justify-center cursor-pointer hover:opacity-95 transition-opacity"
          >
            <img
              src={due.proof_url}
              alt="Bukti pembayaran"
              className="object-contain w-full h-48"
            />
          </div>
        </div>
      )}

      {/* 3. Timeline History Logs */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5 space-y-4">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Riwayat Status Pembayaran</h4>
        <div className="relative border-l border-slate-100 pl-5.5 ml-2.5 space-y-5 py-1">
          {/* Step 1: Created */}
          <div className="relative">
            <span className="absolute -left-[30px] top-0.5 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-slate-100 text-slate-400 ring-4 ring-white border border-slate-200">
              <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
            </span>
            <div className="space-y-0.5 text-xs">
              <p className="font-bold text-slate-700">Tagihan Bulanan Dibuat</p>
              <p className="text-3xs font-medium text-slate-400">
                {formatDateTime(due.created_at)}
              </p>
            </div>
          </div>

          {/* Step 2: Proof Uploaded */}
          {due.proof_url && (
            <div className="relative">
              <span className={`absolute -left-[30px] top-0.5 flex h-4.5 w-4.5 items-center justify-center rounded-full ring-4 ring-white border ${
                due.status === 'rejected' 
                  ? 'bg-rose-50 text-rose-500 border-rose-200' 
                  : 'bg-amber-50 text-amber-500 border-amber-200'
              }`}>
                <span className={`h-1.5 w-1.5 rounded-full ${due.status === 'rejected' ? 'bg-rose-500' : 'bg-amber-500'}`} />
              </span>
              <div className="space-y-0.5 text-xs">
                <p className="font-bold text-slate-700">Bukti Pembayaran Diunggah</p>
                <p className="text-3xs font-medium text-slate-400">
                  {due.updated_at ? formatDateTime(due.updated_at) : 'Menunggu update'}
                </p>
              </div>
            </div>
          )}

          {/* Step 3: Verification */}
          {due.verified_at && (
            <div className="relative">
              <span className={`absolute -left-[30px] top-0.5 flex h-4.5 w-4.5 items-center justify-center rounded-full ring-4 ring-white border ${
                due.status === 'verified'
                  ? 'bg-emerald-50 text-emerald-500 border-emerald-200'
                  : 'bg-rose-50 text-rose-500 border-rose-200'
              }`}>
                <span className={`h-1.5 w-1.5 rounded-full ${due.status === 'verified' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
              </span>
              <div className="space-y-0.5 text-xs">
                <p className="font-bold text-slate-700">
                  {due.status === 'verified' ? 'Disetujui Pengurus RT' : 'Ditolak Pengurus RT'}
                </p>
                <p className="text-3xs font-medium text-slate-400">
                  {formatDateTime(due.verified_at)}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 4. Action Area */}
      {isCitizen && (due.status === 'unpaid' || due.status === 'rejected') && (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5 space-y-4">
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            {activeTrx ? 'Selesaikan Pembayaran' : 'Pilih Metode Pembayaran'}
          </h4>
          
          {!activeTrx ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {/* Manual Bank */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod('manual_transfer')}
                  className={`p-3.5 rounded-2xl border text-center flex flex-col items-center justify-center transition-all ${
                    paymentMethod === 'manual_transfer'
                      ? 'border-blue-600 bg-blue-50/20 text-blue-600 font-bold'
                      : 'border-slate-150 hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  <span className="text-xs">Transfer Bank</span>
                  <span className="text-[8px] text-slate-400 mt-1">Manual Verifikasi</span>
                </button>

                {/* QRIS */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod('qris')}
                  className={`p-3.5 rounded-2xl border text-center flex flex-col items-center justify-center transition-all ${
                    paymentMethod === 'qris'
                      ? 'border-blue-600 bg-blue-50/20 text-blue-600 font-bold'
                      : 'border-slate-150 hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  <span className="text-xs">QRIS Digital</span>
                  <span className="text-[8px] text-slate-400 mt-1">Instant Scan</span>
                </button>
              </div>

              <button
                type="button"
                onClick={handleCreateTransaction}
                disabled={generatingTrx}
                className="w-full bg-slate-900 hover:bg-slate-850 disabled:bg-slate-700 text-white rounded-2xl py-3.5 text-xs font-black uppercase tracking-widest transition-all inline-flex items-center justify-center font-sans"
              >
                {generatingTrx ? 'Membuat Tagihan...' : 'Pilih & Lanjutkan Pembayaran'}
              </button>
            </div>
          ) : (
            <UploadProofForm 
              dueId={due.id} 
              transactionCode={activeTrx.transactionCode}
              paymentMethod={activeTrx.paymentMethod}
              amount={activeTrx.amount}
              qrCodeUrl={activeTrx.qrCodeUrl}
              bankTransferDetails={activeTrx.bankTransferDetails}
              userId={userId} 
              onUploadSuccess={handleUploadSuccess} 
            />
          )}
        </div>
      )}

      {isStaff && due.status === 'pending_verification' && (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5 space-y-4">
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Verifikasi Pembayaran</h4>
          <VerifyActionGroup dueId={due.id} verifierId={userId} onVerificationResult={handleVerificationResult} />
        </div>
      )}

      {/* Lightbox receipt preview */}
      {fullscreenImage && due.proof_url && (
        <div
          onClick={() => setFullscreenImage(false)}
          className="fixed inset-0 bg-slate-900/90 backdrop-blur-sm z-50 flex items-center justify-center p-4 cursor-zoom-out transition-all animate-in fade-in"
        >
          <div className="relative max-w-full max-h-[85vh] w-auto h-auto flex items-center justify-center">
            <img
              src={due.proof_url}
              alt="Bukti pembayaran penuh"
              className="object-contain max-h-[85vh] rounded-xl shadow-2xl bg-white"
            />
          </div>
        </div>
      )}
    </div>
  )
}
