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
import { Loader2, Plus, Calendar, MapPin, Inbox } from 'lucide-react'

// Define schema
const activitySchema = z.object({
  title: z.string().min(1, 'Judul kegiatan wajib diisi'),
  description: z.string().min(1, 'Deskripsi kegiatan wajib diisi'),
  eventDate: z.string().min(1, 'Tanggal kegiatan wajib diisi'),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional()
})

type ActivityFormValues = z.infer<typeof activitySchema>

interface ActivityItem {
  id: string
  title: string
  description: string
  activity_date: string
  latitude: number | null
  longitude: number | null
  created_at: string
  creator?: {
    full_name: string
  }
}

export default function KegiatanPage() {
  const { user } = useAuthStore()
  const isStaff = ['rt', 'rw', 'admin', 'superadmin'].includes(user?.role || '')

  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)

  const supabase = createClient()
  const { latitude, longitude, loading: geoLoading, error: geoError, getPosition, clearLocation } = useGeolocation()

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors }
  } = useForm<ActivityFormValues>({
    resolver: zodResolver(activitySchema),
    defaultValues: {
      title: '',
      description: '',
      eventDate: '',
      latitude: null,
      longitude: null
    }
  })

  const formLat = watch('latitude')
  const formLng = watch('longitude')

  // Fetch activities
  const fetchActivities = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('activities')
        .select('*, creator:profiles!created_by(full_name)')
        .order('activity_date', { ascending: false })

      if (error) {
        console.error('Supabase Error Details:', JSON.stringify(error, null, 2))
        throw new Error(error.message || JSON.stringify(error))
      }
      
      setActivities((data as unknown as ActivityItem[]) || [])
    } catch (err: any) {
      console.error('Error fetching activities:', err instanceof Error ? err.message : JSON.stringify(err))
      toast.error(err.message || 'Gagal mengambil data kegiatan')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user) {
      fetchActivities()
    }
  }, [user])

  // Geolocation trigger
  const handleGetLocation = async () => {
    try {
      const pos = await getPosition()
      setValue('latitude', pos.latitude)
      setValue('longitude', pos.longitude)
      toast.success('Lokasi kegiatan berhasil diambil!')
    } catch (err: any) {
      toast.error(err.message || 'Gagal mengambil lokasi')
    }
  }

  // Handle submit form
  const onSubmit = async (values: ActivityFormValues) => {
    setSubmitting(true)
    try {
      // Siapkan payload dengan menambahkan pembuat data
      const payload: any = {
        title: values.title,
        description: values.description,
        latitude: values.latitude || null,
        longitude: values.longitude || null,
        activity_date: values.eventDate,
        created_by: user?.id,
        profile_id: user?.id // Mengisi 2 FK yang sebelumnya dicatat (created_by & profile_id)
      }

      const { error } = await supabase.from('activities').insert(payload)

      if (error) {
        console.error('Supabase Insert Error:', JSON.stringify(error, null, 2))
        throw new Error(error.message || JSON.stringify(error))
      }

      toast.success('Kegiatan baru berhasil ditambahkan!')
      reset()
      clearLocation()
      setShowAddForm(false)
      fetchActivities()
    } catch (err: any) {
      console.error('Error adding activity:', err instanceof Error ? err.message : JSON.stringify(err))
      toast.error(err.message || 'Gagal menambahkan kegiatan')
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
            <Calendar className="w-6 h-6 mr-2 text-blue-600 shrink-0" />
            Agenda Kegiatan Warga
          </h1>
          <p className="text-xs text-slate-455 mt-1">Daftar agenda & rapat pengurus RT 03 / RW 05</p>
        </div>
        {isStaff && (
          <button
            onClick={() => {
              setShowAddForm(!showAddForm)
              reset()
              clearLocation()
            }}
            className="flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-2.5 px-4.5 text-xs font-bold transition-all hover:scale-[1.02] active:scale-[0.98] shadow-xs shrink-0"
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span>{showAddForm ? 'Batal' : 'Tambah Agenda'}</span>
          </button>
        )}
      </div>

      {/* Add Activity Form */}
      {showAddForm && isStaff && (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-xs p-5 space-y-4">
          <h3 className="text-sm font-bold text-slate-800">Tambah Agenda Kegiatan Baru</h3>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-3.5">
              {/* Activity Title */}
              <div className="space-y-1">
                <label className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-widest leading-none">Nama Kegiatan</label>
                <input
                  {...register('title')}
                  placeholder="Nama kegiatan / acara"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 font-semibold text-slate-850"
                />
                {errors.title && (
                  <p className="text-[10px] font-semibold text-rose-500">{errors.title.message}</p>
                )}
              </div>

              {/* Event Date */}
              <div className="space-y-1">
                <label className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-widest leading-none">Tanggal Pelaksanaan</label>
                <input
                  {...register('eventDate')}
                  type="date"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 font-semibold text-slate-850"
                />
                {errors.eventDate && (
                  <p className="text-[10px] font-semibold text-rose-500">{errors.eventDate.message}</p>
                )}
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1">
              <label className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-widest leading-none">Rincian Kegiatan</label>
              <textarea
                {...register('description')}
                rows={3}
                placeholder="Rincian informasi agenda kegiatan..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 resize-none leading-relaxed"
              />
              {errors.description && (
                <p className="text-[10px] font-semibold text-rose-500">{errors.description.message}</p>
              )}
            </div>

            {/* Geolocation Section */}
            <div className="border border-slate-100 rounded-2xl p-4 bg-slate-50/50 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-700">Titik Koordinat Lokasi Kegiatan</h4>
                  <p className="text-[9px] text-slate-400 mt-1 font-semibold leading-none">Petakan koordinat pusat kegiatan untuk validasi absensi warga</p>
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
                  <span>Menyimpan...</span>
                </>
              ) : (
                <span>Simpan Kegiatan Baru</span>
              )}
            </button>
          </form>
        </div>
      )}

      {/* Activities Grid / List */}
      {loading ? (
        <div className="text-center py-10 flex flex-col items-center justify-center space-y-2">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Memuat data agenda...</p>
        </div>
      ) : activities.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {activities.map((item) => (
            <div key={item.id} className="bg-white rounded-3xl border border-slate-100 shadow-xs p-5 flex flex-col justify-between space-y-4 hover:border-slate-200/50 transition-colors">
              <div className="space-y-3.5">
                <div className="flex items-start space-x-3.5 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-purple-50 text-purple-650 flex items-center justify-center shrink-0 border border-purple-100 shadow-3xs">
                    <Calendar className="w-4.5 h-4.5 shrink-0" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-1.5 flex-wrap">
                      <h4 className="text-xs font-bold text-slate-800 leading-tight truncate">{item.title}</h4>
                      {item.activity_date && (
                        <span className="text-[9px] font-extrabold text-purple-700 bg-purple-50 border border-purple-100 px-2.5 py-0.5 rounded-full shrink-0 leading-none">
                          {new Date(item.activity_date).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </span>
                      )}
                    </div>
                    {item.creator?.full_name && (
                      <p className="text-[9px] font-semibold text-slate-400 mt-0.5">
                        Dibuat oleh: {item.creator.full_name}
                      </p>
                    )}
                  </div>
                </div>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed font-semibold line-clamp-3 pl-0.5">{item.description}</p>
              </div>

              {item.latitude && item.longitude ? (
                <div className="pt-3 border-t border-slate-50 flex items-center justify-between gap-2.5">
                  <div className="flex items-center text-[9px] font-bold text-slate-400 tracking-wide uppercase leading-none pl-0.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 mr-1" />
                    <span>Lokasi Kegiatan Terdaftar</span>
                  </div>
                  <LocationMapLink latitude={item.latitude} longitude={item.longitude} label="Buka Peta Lokasi" />
                </div>
              ) : (
                <div className="pt-3 border-t border-slate-50 flex items-center text-[9px] font-bold text-slate-400 tracking-wide uppercase leading-none pl-0.5">
                  <span>Tempat kegiatan belum terpetakan</span>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center bg-white rounded-3xl border border-slate-100/80 shadow-xs p-10">
          <div className="w-12 h-12 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center mx-auto mb-3">
            <Calendar className="w-6 h-6" />
          </div>
          <p className="text-sm text-slate-500 font-bold">Belum ada agenda kegiatan warga</p>
          <p className="text-xs text-slate-400 mt-1.5 max-w-xs mx-auto leading-relaxed">
            Silakan tambahkan data agenda warga baru jika Anda adalah RT/RW.
          </p>
        </div>
      )}
    </div>
  )
}
