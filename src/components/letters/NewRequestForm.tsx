'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { lettersService, getSimulatedCitizenProfiles } from '@/services/lettersService'
import LetterUploadZone from './LetterUploadZone'
import RealtimeCivicClock from './RealtimeCivicClock'
import { toast } from 'sonner'
import { FileText, Loader2, Info, X, User, Heart, Star, CheckCircle } from 'lucide-react'
import { displayRT, displayRW } from '@/lib/region-format'

// Zod Validation Schema supporting both standard and extended fields
const formSchema = z.object({
  letter_type: z.string({
    required_error: 'Pilih jenis surat yang ingin diajukan.'
  }),
  purpose: z.string().min(10, {
    message: 'Keperluan harus diisi minimal 10 karakter.'
  }),
  // Dynamic custom fields for default letter categories
  keterangan: z.string().optional(),
  alamat_tetap: z.string().optional(),
  lama_tinggal: z.string().optional(),
  nama_usaha: z.string().optional(),
  jenis_usaha: z.string().optional(),
  alamat_usaha: z.string().optional(),
  nama_rumah_sakit: z.string().optional(),
  nama_pasien: z.string().optional(),
  alamat_asal: z.string().optional(),
  tujuan_tinggal: z.string().optional(),
  nama_bayi: z.string().optional(),
  tanggal_lahir_bayi: z.string().optional(),
  nama_ayah: z.string().optional(),
  nama_ibu: z.string().optional(),
  nama_mendiang: z.string().optional(),
  tanggal_wafat: z.string().optional(),
  penyebab_wafat: z.string().optional(),
  nama_acara: z.string().optional(),
  tanggal_acara: z.string().optional(),
  lokasi_acara: z.string().optional(),
  nama_pasangan: z.string().optional(),
  nik_pasangan: z.string().optional(),
  tanggal_pernikahan: z.string().optional(),
  alamat_tujuan: z.string().optional(),
  alasan_pindah: z.string().optional(),
  jumlah_pengikut: z.string().optional(),
  deskripsi_kebutuhan: z.string().optional()
})

type FormValues = z.infer<typeof formSchema>

interface NewRequestFormProps {
  userId: string
  onSuccess: () => void
  onCancel: () => void
}

export default function NewRequestForm({ userId, onSuccess, onCancel }: NewRequestFormProps) {
  const [loading, setLoading] = useState<boolean>(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [citizen, setCitizen] = useState<any>(null)
  const [categories, setCategories] = useState<any[]>([])
  
  // Load citizen profile and master categories
  useEffect(() => {
    async function loadData() {
      try {
        const profile = await lettersService.getCitizenProfile(userId)
        setCitizen(profile || getSimulatedCitizenProfiles()[userId] || getSimulatedCitizenProfiles()['user-warga'])
        
        const cats = await lettersService.getLetterCategories()
        setCategories(cats)
      } catch (err) {
        setCitizen(getSimulatedCitizenProfiles()['user-warga'])
      }
    }
    loadData()
  }, [userId])

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      letter_type: 'surat_pengantar',
      purpose: ''
    }
  })

  const activeType = watch('letter_type')
  const activeCategory = categories.find(c => c.code === activeType)

  const onSubmit = async (values: FormValues) => {
    if (!selectedFile) {
      toast.error('Gagal: Harap unggah berkas pendukung (scan KTP/KK).')
      return
    }

    setLoading(true)
    try {
      // 1. Upload Supporting Document
      toast.info('Mengunggah berkas pendukung...')
      const uploadRes = await lettersService.uploadDocument(userId, selectedFile)
      
      if (!uploadRes.success || !uploadRes.url) {
        throw new Error(uploadRes.error || 'Gagal mengunggah lampiran berkas.')
      }

      // 2. Compile custom fields dynamically from category definitions
      const customFields: Record<string, any> = {}
      if (activeCategory && activeCategory.form_fields) {
        activeCategory.form_fields.forEach((field: any) => {
          const val = (values as any)[field.name]
          if (val !== undefined && val !== '') {
            customFields[field.name] = val
          }
        })
      }

      // 3. Create Letter Request
      toast.info('Mengirim data pengajuan...')
      const createRes = await lettersService.createLetterRequest(
        userId,
        values.letter_type as any,
        values.purpose,
        customFields,
        uploadRes.url
      )

      if (createRes.success) {
        toast.success('Pengajuan Surat Berhasil Dikirim!')
        onSuccess()
      } else {
        throw new Error(createRes.error || 'Gagal menyimpan pengajuan.')
      }
    } catch (err: any) {
      toast.error(err.message || 'Terjadi kesalahan sistem.')
    } finally {
      setLoading(false)
    }
  }

  if (!citizen || categories.length === 0) {
    return (
      <div className="p-8 text-center flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <p className="text-xs text-slate-400 font-semibold">Menyiapkan Form Kependudukan Digital...</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden max-h-[85vh] flex flex-col w-full max-w-lg select-none">
      
      {/* 1. Modal Header Title Bar */}
      <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
            <FileText className="w-4.5 h-4.5" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-800 leading-none">Buat Pengajuan Surat</h3>
            <p className="text-[10px] font-semibold text-slate-400 mt-1">Layanan Administrasi RT/RW Mandiri</p>
          </div>
        </div>
        
        <button
          onClick={onCancel}
          disabled={loading}
          className="w-8 h-8 rounded-xl hover:bg-slate-150 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors border border-transparent hover:border-slate-200"
        >
          <X className="w-4.5 h-4.5" />
        </button>
      </div>

      {/* Scrollable Form Body Container */}
      <div className="p-5 overflow-y-auto space-y-5 flex-1 min-h-0 bg-slate-50/30">
        
        {/* Dynamic ticking clock */}
        <div className="text-center">
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1.5">Waktu Server Pengajuan</p>
          <RealtimeCivicClock />
        </div>

        {/* 2. Auto-Filled Citizen Demographic Profile details */}
        <div className="bg-gradient-to-br from-blue-50/50 to-slate-50/70 border border-blue-100/50 rounded-2xl p-4.5 space-y-3">
          <div className="flex items-center space-x-2 text-slate-700">
            <User className="w-4 h-4 text-blue-600 flex-shrink-0" />
            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-800 leading-none">Identitas Pemohon (Auto-Filled)</h4>
          </div>
          <p className="text-[9px] text-slate-400 font-semibold leading-relaxed">
            Data kependudukan Anda terdaftar di bawah akan disematkan secara resmi ke dalam draf surat:
          </p>
          <div className="grid grid-cols-[105px_1fr] gap-x-3 gap-y-2 text-2xs font-medium text-slate-500 pt-1.5 border-t border-slate-100/40">
            <span>Nama Pemohon</span>
            <span className="text-slate-800 font-bold uppercase">{citizen.full_name || 'BUDI SANTOSO'}</span>
            <span>NIK Penduduk</span>
            <span className="text-slate-700 font-bold font-mono tracking-wide">{citizen.nik || '3273012304950002'}</span>
            <span>No. KK Warga</span>
            <span className="text-slate-700 font-bold font-mono tracking-wide">{citizen.kk || '3273012304951113'}</span>
            <span>Alamat Domisili</span>
            <span className="text-slate-800 font-semibold leading-relaxed">
              {citizen.address || 'Jl. Kebon Jeruk No. 24'} ({displayRT(citizen.rt || '03')} / {displayRW(citizen.rw || '05')})
            </span>
          </div>
        </div>

        {/* 3. Interactive Inputs */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          
          {/* Select Category */}
          <div className="space-y-1.5">
            <label className="text-2xs font-bold text-slate-400 uppercase tracking-wider block">
              Pilih Kategori Layanan Surat
            </label>
            <select
              {...register('letter_type')}
              className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all cursor-pointer leading-snug"
            >
              {categories.map((cat) => (
                <option key={cat.code} value={cat.code}>
                  {cat.name}
                </option>
              ))}
            </select>
            {activeCategory?.description && (
              <p className="text-[10px] text-slate-450 italic font-medium leading-relaxed pl-1">
                {activeCategory.description}
              </p>
            )}
          </div>

          {/* Dynamic Form Field Injection based on category definitions */}
          {activeCategory?.form_fields && activeCategory.form_fields.length > 0 && (
            <div className="bg-white border border-slate-100 rounded-xl p-3.5 space-y-3 shadow-2xs">
              <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest block leading-none mb-1">Kelengkapan Data Khusus</span>
              {activeCategory.form_fields.map((field: any) => (
                <div key={field.name} className="space-y-1.5 animate-in fade-in duration-200">
                  <label className="text-2xs font-bold text-slate-500 uppercase tracking-wider block">
                    {field.label} {field.required && <span className="text-rose-500">*</span>}
                  </label>
                  {field.type === 'date' ? (
                    <input
                      type="date"
                      {...register(field.name as any)}
                      required={field.required}
                      className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all bg-white"
                    />
                  ) : field.type === 'number' ? (
                    <input
                      type="number"
                      {...register(field.name as any)}
                      placeholder={field.placeholder || ''}
                      required={field.required}
                      className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all bg-white"
                    />
                  ) : (
                    <input
                      type="text"
                      {...register(field.name as any)}
                      placeholder={field.placeholder || ''}
                      required={field.required}
                      className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all bg-white"
                    />
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Purpose */}
          <div className="space-y-1.5">
            <label className="text-2xs font-bold text-slate-400 uppercase tracking-wider block">
              Maksud Keperluan Pengajuan (Min. 10 Karakter)
            </label>
            <textarea
              {...register('purpose')}
              placeholder="Contoh: Mengurus pendaftaran Kredit Usaha Rakyat (KUR) Mandiri..."
              rows={3}
              className="w-full text-xs font-semibold p-3 rounded-xl border border-slate-200 bg-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all leading-relaxed"
            />
            {errors.purpose && (
              <p className="text-3xs font-semibold text-rose-500 pl-1">{errors.purpose.message}</p>
            )}
          </div>

          {/* KK/KTP Upload Zone */}
          <div className="bg-white border border-slate-100 rounded-xl p-3.5 shadow-2xs">
            <LetterUploadZone onFileSelected={setSelectedFile} selectedFile={selectedFile} />
          </div>

          {/* Submit Actions */}
          <div className="pt-3 border-t border-slate-100 flex gap-3">
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold transition-all active:scale-[0.99]"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-2 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-xs font-black uppercase tracking-widest flex items-center justify-center space-x-2 transition-all shadow-sm shadow-blue-600/10 active:scale-[0.99]"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                  <span>Mengirim...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 shrink-0" />
                  <span>Kirim Surat</span>
                </>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  )
}
