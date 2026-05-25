'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/services/supabase/client'
import { useAuthStore } from '@/store/useAuthStore'
import { useGeolocation } from '@/components/location/useGeolocation'
import LocationButton from '@/components/location/LocationButton'
import LocationPreview from '@/components/location/LocationPreview'
import LocationMapLink from '@/components/location/LocationMapLink'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { toast } from 'sonner'
import { Loader2, Plus, AlertTriangle, MapPin, User, Info, Inbox } from 'lucide-react'
import ImageUploader from '@/components/citizen/ImageUploader'
import { STORAGE_BUCKETS } from '@/lib/storage/buckets'
import { reportsService } from '@/services/reportsService'

// Define schema
const reportSchema = z.object({
  category: z.string().min(1, 'Kategori aduan wajib dipilih'),
  title: z.string().min(1, 'Judul laporan aduan wajib diisi'),
  description: z.string().min(1, 'Rincian laporan aduan wajib diisi'),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional()
})

type ReportFormValues = z.infer<typeof reportSchema>

interface ReportItem {
  id: string
  category: string
  title: string
  description: string
  status: string
  latitude: number | null
  longitude: number | null
  photo_url?: string
  created_at: string
  profiles: {
    full_name: string
  } | null
}

export default function LaporanPage() {
  const { user } = useAuthStore()

  const [reports, setReports] = useState<ReportItem[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [uploadedPhotoUrl, setUploadedPhotoUrl] = useState<string>('')

  const supabase = createClient()
  const { latitude, longitude, loading: geoLoading, error: geoError, getPosition, clearLocation } = useGeolocation()

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors }
  } = useForm<ReportFormValues>({
    resolver: zodResolver(reportSchema),
    defaultValues: {
      category: '',
      title: '',
      description: '',
      latitude: null,
      longitude: null
    }
  })

  const formLat = watch('latitude')
  const formLng = watch('longitude')

  // Fetch reports list
  const fetchReports = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('reports')
        .select(`
          id, 
          category,
          title, 
          description, 
          status,
          latitude, 
          longitude, 
          photo_url,
          created_at, 
          profiles (full_name)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      setReports((data as any) || [])
    } catch (err: any) {
      console.error('Error fetching reports:', err)
      toast.error('Gagal mengambil data laporan aduan')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user) {
      fetchReports()
    }
  }, [user])

  // Geolocation trigger
  const handleGetLocation = async () => {
    try {
      const pos = await getPosition()
      setValue('latitude', pos.latitude)
      setValue('longitude', pos.longitude)
      toast.success('Lokasi aduan berhasil direkam!')
    } catch (err: any) {
      toast.error(err.message || 'Gagal mengambil lokasi')
    }
  }

  // Handle submit form
  const onSubmit = async (values: ReportFormValues) => {
    if (!user) return
    setSubmitting(true)
    try {
      const { error } = await supabase.from('reports').insert({
        profile_id: user.id,
        category: values.category,
        title: values.title,
        description: values.description,
        latitude: values.latitude || null,
        longitude: values.longitude || null,
        photo_url: uploadedPhotoUrl || null,
        is_public: false
      })

      if (error) throw error

      toast.success('Laporan aduan baru berhasil dikirim!')
      reset()
      setUploadedPhotoUrl('')
      clearLocation()
      setShowAddForm(false)
      fetchReports()
    } catch (err: any) {
      console.error('Error adding report:', err)
      toast.error(err.message || 'Gagal mengirim aduan')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 select-none">
      {/* Header section */}
      <div className="flex items-center justify-between px-1">
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight flex items-center">
            <AlertTriangle className="w-6 h-6 mr-2 text-blue-600 shrink-0" />
            Laporan Aduan Warga
          </h1>
          <p className="text-xs text-slate-450 mt-1">Aduan kerusakan, keamanan, dan fasilitas wilayah RT 03 / RW 05</p>
        </div>
        <button
          onClick={() => {
            setShowAddForm(!showAddForm)
            reset()
            setUploadedPhotoUrl('')
            clearLocation()
          }}
          className="flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-2.5 px-4.5 text-xs font-bold transition-all hover:scale-[1.02] active:scale-[0.98] shadow-xs shrink-0"
        >
          <Plus className="w-4 h-4 shrink-0" />
          <span>{showAddForm ? 'Batal' : 'Buat Aduan'}</span>
        </button>
      </div>

      {/* Add Report Form */}
      {showAddForm && (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-xs p-5 space-y-4">
          <h3 className="text-sm font-bold text-slate-800">Kirim Laporan Aduan Baru</h3>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Category */}
            <div className="space-y-1">
              <label className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-widest leading-none">Kategori Aduan</label>
              <select
                {...register('category')}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 font-semibold text-slate-850"
              >
                <option value="">-- Pilih Kategori --</option>
                <option value="Fasilitas Umum">Fasilitas Umum (Jalan, Lampu, dll)</option>
                <option value="Keamanan">Keamanan & Ketertiban</option>
                <option value="Kebersihan">Kebersihan & Lingkungan</option>
                <option value="Administrasi">Pelayanan Administrasi RT</option>
                <option value="Lainnya">Lainnya</option>
              </select>
              {errors.category && (
                <p className="text-[10px] font-semibold text-rose-500">{errors.category.message}</p>
              )}
            </div>

            {/* Title */}
            <div className="space-y-1">
              <label className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-widest leading-none">Judul Laporan</label>
              <input
                {...register('title')}
                placeholder="Tulis topik atau judul aduan..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 font-semibold text-slate-850"
              />
              {errors.title && (
                <p className="text-[10px] font-semibold text-rose-500">{errors.title.message}</p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-1">
              <label className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-widest leading-none">Detail Aduan</label>
              <textarea
                {...register('description')}
                rows={4}
                placeholder="Rincian informasi kronologi aduan dan keluhan wilayah..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 resize-none leading-relaxed"
              />
              {errors.description && (
                <p className="text-[10px] font-semibold text-rose-500">{errors.description.message}</p>
              )}
            </div>

            {/* Photo Upload */}
            <div className="border border-slate-100 rounded-2xl p-4 bg-slate-50/50 space-y-3">
              <ImageUploader 
                label="Foto Bukti Kejadian (Opsional)" 
                bucketName={STORAGE_BUCKETS.REPORT_IMAGES}
                pathPrefix="reports"
                onUploadSuccess={(url) => setUploadedPhotoUrl(url)}
                onUploadError={(err) => toast.error(err)}
              />
            </div>

            {/* Geolocation Section */}
            <div className="border border-slate-100 rounded-2xl p-4 bg-slate-50/50 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-700">Lampirkan Geolocation Kejadian</h4>
                  <p className="text-[9px] text-slate-400 mt-1 font-semibold leading-none">Lampirkan titik koordinat lokasi kejadian agar mempermudah investigasi RT</p>
                </div>
                <LocationButton onClick={handleGetLocation} loading={geoLoading} />
              </div>

              {geoError && (
                <p className="text-[10px] font-bold text-rose-500 bg-rose-50 border border-rose-100 rounded-lg px-2.5 py-1.5">{geoError}</p>
              )}

              {(formLat || formLng) && (
                <div className="space-y-2">
                  <LocationPreview latitude={formLat || null} longitude={formLng || null} />
                  <LocationMapLink latitude={formLat || null} longitude={formLng || null} />
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-3 px-4 font-bold text-xs transition-all flex items-center justify-center space-x-2 disabled:opacity-50 active:scale-[0.99]"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                  <span>Mengirimkan...</span>
                </>
              ) : (
                <span>Kirim Aduan Warga</span>
              )}
            </button>
          </form>
        </div>
      )}

      {/* Reports Feed List */}
      {loading ? (
        <div className="text-center py-10 flex flex-col items-center justify-center space-y-2">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Memuat aduan warga...</p>
        </div>
      ) : reports.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {reports.map((item) => (
            <div key={item.id} className="bg-white rounded-3xl border border-slate-100 shadow-xs p-5 flex flex-col justify-between space-y-4 hover:border-slate-200/50 transition-colors">
              <div className="space-y-3">
                <div className="flex items-start space-x-3.5 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center shrink-0 shadow-3xs">
                    <AlertTriangle className="w-4.5 h-4.5 shrink-0" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-1.5 flex-wrap">
                      <h4 className="text-xs font-bold text-slate-800 leading-tight truncate">{item.title}</h4>
                      <span className="text-[9px] font-extrabold text-slate-400 shrink-0 leading-none uppercase tracking-wide">
                        {new Date(item.created_at).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short'
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[9px] font-extrabold uppercase tracking-widest border leading-none ${
                        item.status === 'submitted' ? 'bg-slate-50 text-slate-500 border-slate-200' :
                        item.status === 'reviewing' ? 'bg-amber-50 text-amber-600 border-amber-200' :
                        item.status === 'in_progress' ? 'bg-blue-50 text-blue-600 border-blue-200' :
                        item.status === 'resolved' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                        'bg-rose-50 text-rose-600 border-rose-200'
                      }`}>
                        {item.status === 'submitted' && 'Terkirim'}
                        {item.status === 'reviewing' && 'Ditinjau'}
                        {item.status === 'in_progress' && 'Diproses'}
                        {item.status === 'resolved' && 'Selesai'}
                        {item.status === 'rejected' && 'Ditolak'}
                      </span>
                      <span className="text-[9px] font-bold text-blue-600 uppercase tracking-widest leading-none">
                        KATEGORI: {item.category || 'LAINNYa'}
                      </span>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed font-semibold line-clamp-3 pl-0.5">{item.description}</p>
                {item.photo_url && (
                  <div className="mt-3 w-full h-32 rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
                    <img src={item.photo_url} alt="Foto Laporan" loading="lazy" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>

              {item.latitude && item.longitude ? (
                <div className="pt-3 border-t border-slate-50 flex items-center justify-between gap-2.5">
                  <div className="flex items-center text-[9px] font-bold text-slate-400 tracking-wide uppercase leading-none">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 mr-1" />
                    <span>Area Kejadian Terpetakan</span>
                  </div>
                  <LocationMapLink latitude={item.latitude} longitude={item.longitude} label="Buka Titik Lokasi" />
                </div>
              ) : (
                <div className="pt-3 border-t border-slate-50 flex items-center text-[9px] font-bold text-slate-400 tracking-wide uppercase leading-none pl-0.5">
                  <span>Lokasi aduan tidak terpetakan</span>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center bg-white rounded-3xl border border-slate-100/80 shadow-xs p-10">
          <div className="w-12 h-12 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center mx-auto mb-3">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <p className="text-sm text-slate-500 font-bold">Belum ada aduan warga diserahkan</p>
          <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto leading-relaxed">
            Semua pengaduan, keluhan, dan permohonan fasilitas umum di wilayah akan terdaftar secara transparan di sini.
          </p>
        </div>
      )}
    </div>
  )
}
