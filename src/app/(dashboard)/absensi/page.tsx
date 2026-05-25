'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/services/supabase/client'
import { useAuthStore } from '@/store/useAuthStore'
import { useGeolocation } from '@/components/location/useGeolocation'
import LocationButton from '@/components/location/LocationButton'
import LocationPreview from '@/components/location/LocationPreview'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { toast } from 'sonner'
import { Loader2, CheckSquare, Calendar, MapPin, AlertTriangle, CheckCircle2, Inbox } from 'lucide-react'

// Define schema
const attendanceSchema = z.object({
  activityId: z.string().min(1, 'Pilih kegiatan yang ingin diikuti'),
  latitude: z.number({ required_error: 'Ambil lokasi Anda terlebih dahulu' }),
  longitude: z.number({ required_error: 'Ambil lokasi Anda terlebih dahulu' })
})

type AttendanceFormValues = z.infer<typeof attendanceSchema>

interface ActivityItem {
  id: string
  title: string
  activity_date: string
  latitude: number | null
  longitude: number | null
}

interface AttendanceItem {
  id: string
  created_at: string
  distance_meters: number
  profiles: {
    full_name: string
  } | null
  activities: {
    title: string
    activity_date: string
  } | null
}

// Haversine formula to calculate distance in meters between two coordinates
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3 // Earth's radius in meters
  const phi1 = (lat1 * Math.PI) / 180
  const phi2 = (lat2 * Math.PI) / 180
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return R * c // returns distance in meters
}

export default function AbsensiPage() {
  const { user } = useAuthStore()
  
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceItem[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const supabase = createClient()
  const { latitude, longitude, loading: geoLoading, error: geoError, getPosition, clearLocation } = useGeolocation()

  const {
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors }
  } = useForm<AttendanceFormValues>({
    resolver: zodResolver(attendanceSchema)
  })

  const selectedActivityId = watch('activityId')
  const formLat = watch('latitude')
  const formLng = watch('longitude')

  const selectedActivity = activities.find((a) => a.id === selectedActivityId)

  // Fetch activities and attendance logs
  const fetchData = async () => {
    setLoading(true)
    try {
      // 1. Get activities
      const { data: actData } = await supabase
        .from('activities')
        .select('id, title, activity_date, latitude, longitude')
        .order('activity_date', { ascending: false })
      
      setActivities(actData || [])

      // 2. Get attendance logs
      const { data: attData } = await supabase
        .from('attendance')
        .select(`
          id, 
          distance_meters,
          created_at,
          profiles (full_name),
          activities (title, activity_date)
        `)
        .order('created_at', { ascending: false })
      
      setAttendanceRecords((attData as any) || [])
    } catch (err: any) {
      console.error('Error fetching data:', err)
      toast.error('Gagal mengambil data absensi')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user) {
      fetchData()
    }
  }, [user])

  // Geolocation lookup
  const handleGetLocation = async () => {
    try {
      const pos = await getPosition()
      setValue('latitude', pos.latitude)
      setValue('longitude', pos.longitude)
      toast.success('Lokasi absensi berhasil diambil!')
    } catch (err: any) {
      toast.error(err.message || 'Gagal mengambil lokasi')
    }
  }

  // Handle submit form (performs radius check)
  const onSubmit = async (values: AttendanceFormValues) => {
    if (!selectedActivity) {
      toast.error('Pilih kegiatan terlebih dahulu!')
      return
    }

    if (selectedActivity.latitude === null || selectedActivity.longitude === null) {
      toast.error('Kegiatan ini tidak memiliki koordinat terdaftar. Hubungi Ketua RT.')
      return
    }

    setSubmitting(true)

    // Calculate distance in meters using Haversine
    const distance = calculateDistance(
      values.latitude,
      values.longitude,
      selectedActivity.latitude,
      selectedActivity.longitude
    )

    // Radius validation: 100 meters
    if (distance > 100) {
      toast.error(`Anda berada di luar area absensi (Jarak Anda: ${distance.toFixed(1)}m, batas: 100m)`)
      setSubmitting(false)
      return
    }

    try {
      const { error } = await supabase.from('attendance').insert({
        profile_id: user?.id,
        activity_id: values.activityId,
        latitude: values.latitude,
        longitude: values.longitude,
        distance_meters: distance
      })

      if (error) {
        if (error.message.includes('unique_attendance')) {
          throw new Error('Anda sudah melakukan absensi untuk kegiatan ini!')
        }
        throw error
      }

      toast.success('Absensi berhasil direkam! Terima kasih atas kehadiran Anda.')
      reset()
      clearLocation()
      fetchData()
    } catch (err: any) {
      console.error('Error recording attendance:', err)
      toast.error(err.message || 'Gagal merekam absensi')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 select-none">
      {/* Header section */}
      <div className="px-1">
        <h1 className="text-xl font-bold text-slate-800 tracking-tight flex items-center">
          <CheckSquare className="w-6 h-6 mr-2 text-blue-600 shrink-0" />
          Presensi Kehadiran Warga
        </h1>
        <p className="text-xs text-slate-455 mt-1">Catat kehadiran Anda pada kegiatan warga secara mandiri</p>
      </div>

      {/* Attendance Form */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-xs p-5 space-y-4">
        <h3 className="text-sm font-bold text-slate-800 flex items-center">
          Isi Presensi Mandiri
        </h3>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Select Activity */}
          <div className="space-y-1">
            <label className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-widest leading-none">Pilih Kegiatan</label>
            <select
              onChange={(e) => {
                setValue('activityId', e.target.value)
                setValue('latitude', undefined as any)
                setValue('longitude', undefined as any)
                clearLocation()
              }}
              defaultValue=""
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 bg-white font-semibold text-slate-800"
            >
              <option value="" disabled>-- Pilih Agenda Kegiatan --</option>
              {activities.map((act) => (
                <option key={act.id} value={act.id}>
                  {act.title} ({new Date(act.activity_date).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  })})
                </option>
              ))}
            </select>
            {errors.activityId && (
              <p className="text-[10px] font-semibold text-rose-500">{errors.activityId.message}</p>
            )}
          </div>

          {/* Activity Coordinates Info */}
          {selectedActivity && (
            <div className="text-xs bg-slate-50 border border-slate-100 rounded-xl p-3.5 flex items-start space-x-2.5">
              <Calendar className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
              <div>
                <p className="font-bold text-slate-700">{selectedActivity.title}</p>
                {selectedActivity.latitude && selectedActivity.longitude ? (
                  <p className="text-slate-500 mt-1 font-medium flex items-center">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 mr-1 shrink-0" />
                    Koordinat lokasi kegiatan terdaftar. Absensi hanya valid dalam <strong className="text-blue-600 pl-1 font-extrabold">radius 100 meter</strong>.
                  </p>
                ) : (
                  <p className="text-rose-500 font-bold mt-1 flex items-center">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-500 mr-1 shrink-0" />
                    Kegiatan ini belum memiliki koordinat terdaftar di sistem. Hubungi RT.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Geolocation validation */}
          {selectedActivity && selectedActivity.latitude && selectedActivity.longitude && (
            <div className="border border-slate-100 rounded-2xl p-4 bg-slate-50/50 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-700">Verifikasi Lokasi Absen</h4>
                  <p className="text-[9px] text-slate-400 mt-1 font-semibold leading-none">Ambil posisi GPS Anda saat ini untuk memverifikasi kehadiran</p>
                </div>
                <LocationButton onClick={handleGetLocation} loading={geoLoading} />
              </div>

              {geoError && (
                <p className="text-[10px] font-bold text-rose-500 bg-rose-50 border border-rose-100 rounded-lg px-2.5 py-1.5">{geoError}</p>
              )}

              {formLat && formLng && (
                <div className="space-y-2">
                  <LocationPreview latitude={formLat} longitude={formLng} />
                  {/* Distance Preview */}
                  <div className="bg-blue-50/40 border border-blue-100 rounded-xl px-4 py-2.5 flex items-center justify-between">
                    <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-widest leading-none">Jarak dari Titik Kegiatan:</span>
                    <span className={`text-xs font-extrabold ${
                      calculateDistance(formLat, formLng, selectedActivity.latitude || 0, selectedActivity.longitude || 0) <= 100
                        ? 'text-emerald-600'
                        : 'text-rose-500'
                    }`}>
                      {calculateDistance(formLat, formLng, selectedActivity.latitude || 0, selectedActivity.longitude || 0).toFixed(1)} meter
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting || !selectedActivity || !selectedActivity.latitude || !formLat}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-3 px-4 font-bold text-xs transition-all flex items-center justify-center space-x-2 disabled:opacity-50 active:scale-[0.99]"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                <span>Merekam Kehadiran...</span>
              </>
            ) : (
              <span>Absen Sekarang</span>
            )}
          </button>
        </form>
      </div>

      {/* Attendance Log List */}
      <div>
        <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-3.5 px-1 leading-none">
          Riwayat Kehadiran Terbaru
        </h4>

        {loading ? (
          <div className="text-center py-10 flex flex-col items-center justify-center space-y-2 bg-white rounded-2xl border border-slate-100">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Memuat riwayat...</p>
          </div>
        ) : attendanceRecords.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {attendanceRecords.map((rec) => (
              <div key={rec.id} className="bg-white rounded-3xl border border-slate-100 shadow-xs p-5 flex items-center justify-between hover:border-slate-200/40 transition-all">
                <div className="flex items-center space-x-3.5 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100 shadow-3xs">
                    <CheckCircle2 className="w-4.5 h-4.5 shrink-0" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-slate-800 truncate leading-tight">
                      {rec.profiles?.full_name || 'Warga'}
                    </h4>
                    <p className="text-[9px] text-slate-450 mt-1.5 font-bold truncate leading-none uppercase tracking-wide">
                      {rec.activities?.title || 'Kegiatan'}
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wide leading-none block">
                    Jarak: {Number(rec.distance_meters).toFixed(1)}m
                  </span>
                  <p className="text-[9px] text-slate-400 mt-1.5 font-bold leading-none uppercase">
                    {new Date(rec.created_at).toLocaleTimeString('id-ID', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center bg-white rounded-3xl border border-slate-100/80 shadow-xs p-10">
            <div className="w-12 h-12 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <Inbox className="w-6 h-6" />
            </div>
            <p className="text-sm text-slate-500 font-bold">Belum ada riwayat kehadiran terdaftar</p>
            <p className="text-xs text-slate-400 mt-1.5 max-w-xs mx-auto leading-relaxed">
              Hadiri kegiatan warga dan lakukan absensi di lokasi acara.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
