'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { createClient } from '@/services/supabase/client'
import { useRequireSession } from '@/hooks/useRequireSession'
import { useGeolocation } from '@/components/location/useGeolocation'
import LocationButton from '@/components/location/LocationButton'
import LocationPreview from '@/components/location/LocationPreview'
import LocationMapLink from '@/components/location/LocationMapLink'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { toast } from 'sonner'
import { Loader2, Plus, Home, MapPin, Search } from 'lucide-react'
import { createHouse, fetchHouses, type HouseRow } from '@/services/housesService'
import { handleSupabaseError, logSupabaseError } from '@/lib/supabase/errors'

const houseSchema = z.object({
  ownerName: z.string().min(1, 'Nama pemilik wajib diisi'),
  houseNumber: z.string().min(1, 'Nomor rumah wajib diisi'),
  address: z.string().min(1, 'Alamat wajib diisi'),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
})

type HouseFormValues = z.infer<typeof houseSchema>

export default function RumahPage() {
  const { user, ready } = useRequireSession()
  const isStaff = ['rt', 'rw', 'admin', 'superadmin'].includes(user?.role || '')

  const [houses, setHouses] = useState<HouseRow[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)

  const loadingRef = useRef(false)
  const { loading: geoLoading, error: geoError, getPosition, clearLocation } = useGeolocation()

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<HouseFormValues>({
    resolver: zodResolver(houseSchema),
    defaultValues: {
      ownerName: '',
      houseNumber: '',
      address: '',
      latitude: null,
      longitude: null,
    },
  })

  const formLat = watch('latitude')
  const formLng = watch('longitude')

  const loadHouses = useCallback(async () => {
    if (loadingRef.current) return
    loadingRef.current = true
    setLoading(true)
    setFetchError(null)

    try {
      const supabase = createClient()
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        setFetchError('Session login berakhir')
        return
      }

      const data = await fetchHouses(supabase)
      setHouses(data)
    } catch (err: unknown) {
      logSupabaseError('fetchHouses', err)
      const message = handleSupabaseError(err)
      setFetchError(message)
      toast.error(message)
    } finally {
      setLoading(false)
      loadingRef.current = false
    }
  }, [])

  useEffect(() => {
    if (!ready) return
    loadHouses()
  }, [ready, loadHouses])

  const handleGetLocation = async () => {
    try {
      const pos = await getPosition()
      setValue('latitude', pos.latitude)
      setValue('longitude', pos.longitude)
      toast.success('Lokasi berhasil diambil!')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal mengambil lokasi'
      toast.error(msg)
    }
  }

  const onSubmit = async (values: HouseFormValues) => {
    setSubmitting(true)
    try {
      const supabase = createClient()
      await createHouse(supabase, {
        ownerName: values.ownerName.trim(),
        houseNumber: values.houseNumber.trim(),
        address: values.address.trim(),
        latitude: values.latitude ?? null,
        longitude: values.longitude ?? null,
        profileId: isStaff ? null : user?.id ?? null,
      })

      toast.success('Data rumah berhasil ditambahkan!')
      reset()
      clearLocation()
      setShowAddForm(false)
      await loadHouses()
    } catch (err: unknown) {
      logSupabaseError('createHouse', err)
      toast.error(handleSupabaseError(err))
    } finally {
      setSubmitting(false)
    }
  }

  const filteredHouses = houses.filter(
    (h) =>
      h.owner_name.toLowerCase().includes(search.toLowerCase()) ||
      h.house_number.toLowerCase().includes(search.toLowerCase()) ||
      h.address.toLowerCase().includes(search.toLowerCase())
  )

  const showEmpty = !loading && !fetchError && filteredHouses.length === 0
  const emptyMessage = search
    ? 'Tidak ada rumah yang cocok dengan pencarian'
    : isStaff
      ? 'Belum ada data rumah'
      : 'Belum ada data rumah terdaftar untuk akun Anda'

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-20 select-none">
      <div className="flex items-center justify-between px-1">
        <div>
          <h1 className="flex items-center text-xl font-bold tracking-tight text-slate-800">
            <Home className="mr-2 h-6 w-6 shrink-0 text-blue-600" />
            Pemetaan Rumah Warga
          </h1>
          <p className="mt-1 text-xs text-slate-500">Data tempat tinggal warga RT/RW</p>
        </div>
        {isStaff && (
          <button
            type="button"
            onClick={() => {
              setShowAddForm(!showAddForm)
              reset()
              clearLocation()
            }}
            className="flex shrink-0 items-center space-x-1.5 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 shrink-0" />
            <span>{showAddForm ? 'Batal' : 'Tambah Rumah'}</span>
          </button>
        )}
      </div>

      {showAddForm && isStaff && (
        <div className="space-y-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800">Tambah Rumah Baru</h3>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-600">Nama Pemilik</label>
                <input
                  {...register('ownerName')}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm"
                />
                {errors.ownerName && (
                  <p className="text-xs text-rose-500">{errors.ownerName.message}</p>
                )}
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-600">Nomor Rumah</label>
                <input
                  {...register('houseNumber')}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm"
                />
                {errors.houseNumber && (
                  <p className="text-xs text-rose-500">{errors.houseNumber.message}</p>
                )}
              </div>
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-600">Alamat</label>
              <textarea
                {...register('address')}
                rows={2}
                className="w-full resize-none rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm"
              />
              {errors.address && (
                <p className="text-xs text-rose-500">{errors.address.message}</p>
              )}
            </div>
            <div className="space-y-3 rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-bold text-slate-700">Koordinat GPS</p>
                <LocationButton onClick={handleGetLocation} loading={geoLoading} />
              </div>
              {geoError && (
                <p className="rounded-lg border border-rose-100 bg-rose-50 px-2 py-1 text-xs text-rose-600">
                  {geoError}
                </p>
              )}
              {(formLat != null || formLng != null) && (
                <>
                  <LocationPreview latitude={formLat ?? null} longitude={formLng ?? null} />
                  <LocationMapLink latitude={formLat ?? null} longitude={formLng ?? null} />
                </>
              )}
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-xs font-bold text-white disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                'Simpan Rumah'
              )}
            </button>
          </form>
        </div>
      )}

      <div className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="search"
          placeholder="Cari pemilik, nomor, atau alamat..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/10"
        />
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
          <p className="mt-2 text-xs text-slate-400">Memuat data rumah...</p>
        </div>
      ) : fetchError ? (
        <div className="rounded-2xl border border-rose-100 bg-rose-50 p-6 text-center">
          <p className="text-sm font-semibold text-rose-700">{fetchError}</p>
          <button
            type="button"
            onClick={loadHouses}
            className="mt-3 rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white"
          >
            Coba Lagi
          </button>
        </div>
      ) : filteredHouses.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {filteredHouses.map((house) => (
            <article
              key={house.id}
              className="flex flex-col justify-between space-y-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"
            >
              <div className="flex min-w-0 items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-blue-100 bg-blue-50 text-blue-600">
                  <Home className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline justify-between gap-1">
                    <h4 className="truncate text-sm font-bold text-slate-800">
                      {house.owner_name}
                    </h4>
                    <span className="shrink-0 rounded-full border border-blue-100 bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-600">
                      {house.house_number}
                    </span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs text-slate-500">{house.address}</p>
                </div>
              </div>
              {house.latitude != null && house.longitude != null ? (
                <div className="flex items-center justify-between border-t border-slate-50 pt-3">
                  <span className="flex items-center text-[10px] font-bold uppercase text-slate-400">
                    <MapPin className="mr-1 h-3.5 w-3.5" />
                    Terpetakan
                  </span>
                  <LocationMapLink latitude={house.latitude} longitude={house.longitude} />
                </div>
              ) : (
                <p className="border-t border-slate-50 pt-3 text-[10px] font-bold uppercase text-slate-400">
                  Lokasi belum dipetakan
                </p>
              )}
            </article>
          ))}
        </div>
      ) : showEmpty ? (
        <div className="rounded-2xl border border-slate-100 bg-white p-10 text-center shadow-sm">
          <Home className="mx-auto h-8 w-8 text-slate-300" />
          <p className="mt-3 text-sm font-bold text-slate-600">{emptyMessage}</p>
          {isStaff && !search && (
            <p className="mx-auto mt-1 max-w-xs text-xs text-slate-400">
              Tambahkan data rumah warga menggunakan tombol di atas.
            </p>
          )}
        </div>
      ) : null}
    </div>
  )
}
