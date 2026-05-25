'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Image, UploadCloud, Info, CheckCircle2, AlertTriangle, RefreshCw, XCircle, FileText } from 'lucide-react'
import { paymentService } from '@/services/payment/paymentService'
import { validateUpload } from '@/lib/storage/validate-upload'

const uploadSchema = z.object({
  file: z
    .any()
    .refine((files) => files?.length === 1, 'Harap pilih satu berkas bukti transfer.')
    .refine((files) => {
      if (!files?.[0]) return false
      return validateUpload(files[0]) === null
    }, (files) => ({ message: files?.[0] ? validateUpload(files[0]) || 'Invalid file' : 'File diperlukan' }))
})

type UploadSchemaType = z.infer<typeof uploadSchema>

interface UploadProofFormProps {
  dueId: string
  transactionCode: string
  paymentMethod: string
  userId: string
  amount: number
  qrCodeUrl?: string
  bankTransferDetails?: {
    bankName: string
    accountNumber: string
    accountHolder: string
  }
  onUploadSuccess: (proofUrl: string) => void
}

export default function UploadProofForm({ 
  dueId, 
  transactionCode,
  paymentMethod,
  userId, 
  amount,
  qrCodeUrl,
  bankTransferDetails,
  onUploadSuccess 
}: UploadProofFormProps) {
  const [dragActive, setDragActive] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isPdf, setIsPdf] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const {
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    reset
  } = useForm<UploadSchemaType>({
    resolver: zodResolver(uploadSchema)
  })

  const selectedFile = watch('file')

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(value)
  }

  const handleFileChange = (file: File) => {
    setErrorMsg(null)
    setIsPdf(file.type === 'application/pdf')

    if (file.type === 'application/pdf') {
      setImagePreview(null)
      return
    }

    const reader = new FileReader()
    reader.onloadend = () => {
      setImagePreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const onFileSelectChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setValue('file', e.target.files)
      handleFileChange(e.target.files[0])
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0]
      const validationError = validateUpload(file)
      if (validationError) {
        setErrorMsg(validationError)
        return
      }

      const dt = new DataTransfer()
      dt.items.add(file)
      setValue('file', dt.files)
      handleFileChange(file)
    }
  }

  const onSubmit = async (data: UploadSchemaType) => {
    setUploading(true)
    setErrorMsg(null)
    setUploadProgress(15)
    const file = data.file[0] as File

    const progressInterval = setInterval(() => {
      setUploadProgress(prev => (prev >= 85 ? prev : prev + 15))
    }, 150)

    const result = await paymentService.uploadProof(dueId, transactionCode, file, userId)
    
    clearInterval(progressInterval)
    setUploadProgress(100)
    
    setTimeout(() => {
      setUploading(false)
      if (result.success && result.proofUrl) {
        onUploadSuccess(result.proofUrl)
      } else {
        setErrorMsg(result.error || 'Gagal mengunggah bukti pembayaran. Silakan coba kembali.')
      }
    }, 300)
  }

  const handleReset = () => {
    setImagePreview(null)
    setIsPdf(false)
    setErrorMsg(null)
    setUploadProgress(0)
    reset()
  }

  return (
    <div className="space-y-5 select-none">
      {/* 1. Payment Instructions & Target Bank Accounts */}
      <div className="bg-blue-50/70 rounded-2xl p-4 border border-blue-100/50">
        <div className="flex items-start space-x-3 text-xs">
          <Info className="w-4.5 h-4.5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-slate-600 leading-relaxed font-medium w-full">
            <p className="font-bold text-slate-800 text-xs mb-1.5">Petunjuk Pembayaran Anda</p>
            <p>Silakan selesaikan pembayaran sebesar <span className="font-black text-slate-800">{formatCurrency(amount)}</span> menggunakan metode yang Anda pilih:</p>
            
            {paymentMethod === 'qris' && qrCodeUrl && (
              <div className="my-3 text-center">
                <p className="text-[10px] text-slate-450 font-bold mb-2">SCAN DUMMY QRIS DI BAWAH</p>
                <div className="w-40 h-40 bg-white p-2 rounded-2xl border border-slate-100 shadow-inner mx-auto">
                  <img src={qrCodeUrl} alt="Dummy QRIS" className="w-full h-full object-contain" />
                </div>
                <p className="text-[9px] text-slate-400 mt-2">QRIS: KAS RT 03 GUNTUR</p>
              </div>
            )}

            {paymentMethod === 'manual_transfer' && bankTransferDetails && (
              <div className="my-3 bg-white rounded-xl p-3 border border-blue-100 flex flex-col space-y-1.5 text-slate-800 text-[10px]">
                <div className="flex justify-between">
                  <span className="text-slate-400">Bank Penerima:</span>
                  <span className="font-extrabold">{bankTransferDetails.bankName}</span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="text-slate-400">Nomor Rekening:</span>
                  <span className="font-mono font-black text-sm tracking-wider select-all text-blue-600">
                    {bankTransferDetails.accountNumber}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Atas Nama:</span>
                  <span className="font-extrabold">{bankTransferDetails.accountHolder}</span>
                </div>
              </div>
            )}

            <div className="bg-white/50 p-2.5 rounded-xl border border-blue-100/30 text-[9px] text-slate-500 flex justify-between items-center mt-2.5">
              <span>KODE TRANSAKSI:</span>
              <span className="font-mono font-black text-slate-800">{transactionCode}</span>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* 2. Drag & Drop Upload Block */}
        {!imagePreview && !isPdf ? (
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-3xl p-6.5 text-center flex flex-col items-center justify-center transition-all ${
              dragActive
                ? 'border-blue-600 bg-blue-50/40'
                : 'border-slate-200 hover:border-slate-350 hover:bg-slate-50/50'
            }`}
          >
            <div className="w-10 h-10 rounded-full bg-slate-50 text-slate-450 flex items-center justify-center mb-2.5">
              <UploadCloud className="w-5 h-5" />
            </div>
            <h5 className="text-xs font-bold text-slate-700">Unggah Bukti Transfer Anda</h5>
            <p className="text-[10px] text-slate-400 mt-1 max-w-[200px] leading-relaxed">
              Seret file gambar bukti ke sini, atau klik tombol di bawah.
            </p>
            <p className="text-[9px] text-slate-400 italic mt-0.5">Maks. 5MB (JPG, PNG, PDF)</p>
            
            <label className="mt-4 bg-blue-600 hover:bg-blue-700 text-white py-2.5 px-4.5 rounded-xl text-[10px] font-extrabold uppercase tracking-widest cursor-pointer shadow-sm shadow-blue-600/10 transition-all hover:scale-105 active:scale-95 inline-flex items-center">
              Pilih Berkas
              <input
                type="file"
                className="hidden"
                accept=".jpg,.jpeg,.png,.pdf,.webp"
                onChange={onFileSelectChange}
              />
            </label>
          </div>
        ) : (
          /* 3. Upload File Preview Block */
          <div className="bg-slate-50 rounded-3xl border border-slate-100 p-4 flex flex-col items-center">
            {isPdf ? (
              <div className="w-full h-32 rounded-2xl border border-slate-200 bg-white flex flex-col items-center justify-center text-slate-400">
                <FileText className="w-10 h-10 text-red-500 mb-1" />
                <span className="text-xs font-bold text-slate-700">Dokumen PDF Terpilih</span>
              </div>
            ) : (
              <div className="relative w-full max-h-52 rounded-2xl overflow-hidden border border-slate-200 bg-white flex items-center justify-center">
                <img
                  src={imagePreview || ''}
                  alt="Payment proof preview"
                  className="object-contain max-h-52 w-full"
                />
              </div>
            )}
            
            <div className="mt-3.5 flex items-center space-x-2.5 w-full justify-between pl-1">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-slate-800 truncate">
                  {selectedFile?.[0]?.name || 'bukti_transfer.png'}
                </p>
                <p className="text-[10px] font-semibold text-slate-400 mt-0.5">
                  {((selectedFile?.[0]?.size || 0) / (1024 * 1024)).toFixed(2)} MB
                </p>
              </div>
              <button
                type="button"
                onClick={handleReset}
                disabled={uploading}
                className="text-[10px] font-bold text-rose-500 bg-rose-50 hover:bg-rose-100 py-1.5 px-3 rounded-lg transition-colors border border-rose-100 disabled:opacity-50 shrink-0"
              >
                Hapus
              </button>
            </div>
          </div>
        )}

        {/* Upload progress indicator */}
        {uploading && (
          <div className="space-y-1.5 bg-slate-50 p-3 rounded-2xl border border-slate-100">
            <div className="flex justify-between text-[9px] font-extrabold text-slate-450 uppercase tracking-wider leading-none">
              <span>Mengunggah Berkas...</span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
              <div className="bg-blue-600 h-full rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
            </div>
          </div>
        )}

        {/* Error reporting */}
        {(errors.file?.message || errorMsg) && (
          <div className="bg-rose-50 text-rose-700 text-xs rounded-xl p-3 border border-rose-100 flex items-start space-x-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span className="font-semibold leading-relaxed">
              {(errors.file?.message as string) || errorMsg}
            </span>
          </div>
        )}

        {/* Submit Actions */}
        {(imagePreview || isPdf) && !uploading && (
          <button
            type="submit"
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-3.5 px-4 rounded-2xl text-xs uppercase tracking-widest transition-all shadow-sm shadow-emerald-600/10 flex items-center justify-center space-x-2 touch-target-large active:scale-[0.99]"
          >
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Kirim Bukti Pembayaran</span>
          </button>
        )}
      </form>
    </div>
  )
}
