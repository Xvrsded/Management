'use client'

import React, { useState, useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { 
  User, Home, FileText, CheckCircle, 
  MapPin, Loader2, ChevronRight, ChevronLeft, Map
} from 'lucide-react'
import ImageUploader from './ImageUploader'
import { createClient } from '@/services/supabase/client'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

const onboardingSchema = z.object({
  nik: z.string().length(16, "NIK wajib 16 digit angka"),
  kk: z.string().length(16, "KK wajib 16 digit angka"),
  fullName: z.string().min(1, "Nama lengkap wajib diisi"),
  placeOfBirth: z.string().min(1, "Tempat lahir wajib diisi"),
  dateOfBirth: z.string().min(1, "Tanggal lahir wajib diisi"),
  gender: z.enum(['L', 'P'], { required_error: "Jenis kelamin wajib dipilih" }),
  religion: z.string().min(1, "Agama wajib diisi"),
  maritalStatus: z.string().min(1, "Status pernikahan wajib diisi"),
  occupation: z.string().min(1, "Pekerjaan wajib diisi"),
  phone: z.string().min(10, "Nomor HP tidak valid"),
  
  rwNumber: z.string().min(1, "RW wajib diisi (misal: 01)"),
  rtNumber: z.string().min(1, "RT wajib diisi (misal: 01)"),
  houseNumber: z.string().min(1, "Nomor rumah wajib diisi"),
  address: z.string().min(1, "Alamat lengkap wajib diisi"),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
  ktpUrl: z.string().optional(),
  kkUrl: z.string().optional(),
  houseUrl: z.string().optional()
})

type OnboardingData = z.infer<typeof onboardingSchema>

export default function CitizenOnboardingWizard() {
  const [step, setStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [gpsLoading, setGpsLoading] = useState(false)
  const [isVisible, setIsVisible] = useState(true)
  const router = useRouter()
  
  const { register, handleSubmit, control, watch, setValue, trigger, formState: { errors } } = useForm<OnboardingData>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      latitude: null,
      longitude: null,
      rwNumber: '',
      rtNumber: ''
    }
  })

  const formValues = watch()

  const handleNext = async () => {
    let fieldsToValidate: any[] = []
    if (step === 1) {
      fieldsToValidate = ['nik', 'kk', 'fullName', 'placeOfBirth', 'dateOfBirth', 'gender', 'religion', 'maritalStatus', 'occupation', 'phone']
    } else if (step === 2) {
      fieldsToValidate = ['rwNumber', 'rtNumber', 'houseNumber', 'address']
    }

    const isValid = await trigger(fieldsToValidate)
    if (isValid) setStep(s => s + 1)
  }

  const handlePrev = () => setStep(s => s - 1)

  const onSubmit = async (data: OnboardingData) => {
    setIsSubmitting(true)
    try {
      const payload = {
        ...data,
        documents: {
          ktpUrl: data.ktpUrl,
          kkUrl: data.kkUrl,
          houseUrl: data.houseUrl
        }
      }
      
      const res = await fetch('/api/citizen/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Terjadi kesalahan')
      }

      toast.success('Data berhasil disimpan! Menunggu verifikasi admin.')
      setIsVisible(false) // Hide modal
      router.refresh()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const getLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Browser tidak mendukung Geolocation')
      return
    }
    setGpsLoading(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setValue('latitude', position.coords.latitude)
        setValue('longitude', position.coords.longitude)
        setGpsLoading(false)
        toast.success('Lokasi berhasil diambil')
      },
      (error) => {
        setGpsLoading(false)
        toast.error('Gagal mengambil lokasi GPS. Pastikan izin lokasi aktif.')
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  if (!isVisible) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl relative flex flex-col">
        {/* Header / Progress */}
        <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md px-6 py-4 border-b border-slate-100 rounded-t-3xl">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Lengkapi Data Warga
            </h2>
          </div>
          
          <div className="flex items-center justify-between relative">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-100 rounded-full -z-10" />
            <div 
              className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-blue-500 rounded-full transition-all duration-300 -z-10" 
              style={{ width: `${((step - 1) / 2) * 100}%` }} 
            />
            
            {[
              { num: 1, icon: User, label: 'Pribadi' },
              { num: 2, icon: Home, label: 'Rumah' },
              { num: 3, icon: CheckCircle, label: 'Review' }
            ].map((s) => (
              <div key={s.num} className="flex flex-col items-center gap-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors shadow-sm
                  ${step >= s.num ? 'bg-blue-600 text-white' : 'bg-white border-2 border-slate-200 text-slate-400'}`}>
                  <s.icon className="w-4 h-4" />
                </div>
                <span className={`text-[10px] font-medium hidden sm:block ${step >= s.num ? 'text-blue-600' : 'text-slate-400'}`}>
                  {s.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 flex-1">
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-700">NIK</label>
                  <input {...register('nik')} className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="16 Digit NIK" />
                  {errors.nik && <p className="text-xs text-red-500 mt-1">{errors.nik.message}</p>}
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">Nomor KK</label>
                  <input {...register('kk')} className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="16 Digit KK" />
                  {errors.kk && <p className="text-xs text-red-500 mt-1">{errors.kk.message}</p>}
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-slate-700">Nama Lengkap</label>
                  <input {...register('fullName')} className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Sesuai KTP" />
                  {errors.fullName && <p className="text-xs text-red-500 mt-1">{errors.fullName.message}</p>}
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">Tempat Lahir</label>
                  <input {...register('placeOfBirth')} className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none" />
                  {errors.placeOfBirth && <p className="text-xs text-red-500 mt-1">{errors.placeOfBirth.message}</p>}
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">Tanggal Lahir</label>
                  <input type="date" {...register('dateOfBirth')} className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none" />
                  {errors.dateOfBirth && <p className="text-xs text-red-500 mt-1">{errors.dateOfBirth.message}</p>}
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">Jenis Kelamin</label>
                  <select {...register('gender')} className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                    <option value="">Pilih</option>
                    <option value="L">Laki-laki</option>
                    <option value="P">Perempuan</option>
                  </select>
                  {errors.gender && <p className="text-xs text-red-500 mt-1">{errors.gender.message}</p>}
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">Agama</label>
                  <select {...register('religion')} className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                    <option value="">Pilih</option>
                    <option value="Islam">Islam</option>
                    <option value="Kristen">Kristen</option>
                    <option value="Katolik">Katolik</option>
                    <option value="Hindu">Hindu</option>
                    <option value="Buddha">Buddha</option>
                    <option value="Konghucu">Konghucu</option>
                  </select>
                  {errors.religion && <p className="text-xs text-red-500 mt-1">{errors.religion.message}</p>}
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">Status Pernikahan</label>
                  <select {...register('maritalStatus')} className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                    <option value="">Pilih</option>
                    <option value="Belum Kawin">Belum Kawin</option>
                    <option value="Kawin">Kawin</option>
                    <option value="Cerai Hidup">Cerai Hidup</option>
                    <option value="Cerai Mati">Cerai Mati</option>
                  </select>
                  {errors.maritalStatus && <p className="text-xs text-red-500 mt-1">{errors.maritalStatus.message}</p>}
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">Pekerjaan</label>
                  <input {...register('occupation')} className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none" />
                  {errors.occupation && <p className="text-xs text-red-500 mt-1">{errors.occupation.message}</p>}
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-slate-700">Nomor HP</label>
                  <input {...register('phone')} type="tel" className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="08..." />
                  {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone.message}</p>}
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-700">RW</label>
                  <select {...register('rwNumber')} className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                    <option value="">Pilih RW</option>
                    {Array.from({ length: 10 }, (_, i) => {
                      const val = String(i + 1).padStart(3, '0')
                      return <option key={val} value={val}>RW {val}</option>
                    })}
                  </select>
                  {errors.rwNumber && <p className="text-xs text-red-500 mt-1">{errors.rwNumber.message}</p>}
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">RT</label>
                  <select {...register('rtNumber')} className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                    <option value="">Pilih RT</option>
                    {Array.from({ length: 15 }, (_, i) => {
                      const val = String(i + 1).padStart(3, '0')
                      return <option key={val} value={val}>RT {val}</option>
                    })}
                  </select>
                  {errors.rtNumber && <p className="text-xs text-red-500 mt-1">{errors.rtNumber.message}</p>}
                </div>
                <div className="col-span-2">
                  <label className="text-sm font-medium text-slate-700">Nomor Rumah / Blok</label>
                  <input {...register('houseNumber')} className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="A-10" />
                  {errors.houseNumber && <p className="text-xs text-red-500 mt-1">{errors.houseNumber.message}</p>}
                </div>
                <div className="col-span-2">
                  <label className="text-sm font-medium text-slate-700">Alamat Lengkap</label>
                  <textarea {...register('address')} rows={3} className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none resize-none" placeholder="Nama Jalan, Patokan, dll" />
                  {errors.address && <p className="text-xs text-red-500 mt-1">{errors.address.message}</p>}
                </div>
              </div>

              {/* Geolocation Section */}
              <div className="mt-4 p-4 bg-slate-50 border border-slate-200 rounded-xl">
                <h3 className="text-sm font-semibold text-slate-800 mb-2 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-blue-500" /> Lokasi GPS Rumah
                </h3>
                <p className="text-xs text-slate-500 mb-3">Izinkan akses lokasi untuk mendata koordinat rumah.</p>
                
                {formValues.latitude && formValues.longitude ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-emerald-600 bg-emerald-50 p-2 rounded-lg border border-emerald-100">
                      <CheckCircle className="w-4 h-4" /> Lokasi berhasil diambil
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button 
                        type="button"
                        onClick={getLocation}
                        className="text-xs px-3 py-1.5 bg-white border border-slate-200 rounded-lg shadow-sm hover:bg-slate-50 font-medium"
                      >
                        Perbarui Lokasi
                      </button>
                      <a 
                        href={`https://maps.google.com/?q=${formValues.latitude},${formValues.longitude}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs px-3 py-1.5 bg-blue-50 text-blue-600 border border-blue-100 rounded-lg shadow-sm hover:bg-blue-100 font-medium flex items-center gap-1"
                      >
                        <Map className="w-3 h-3" /> Buka di Maps
                      </a>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={getLocation}
                    disabled={gpsLoading}
                    className="w-full py-2.5 bg-white border border-slate-200 rounded-xl shadow-sm hover:bg-slate-50 text-sm font-medium text-slate-700 flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                  >
                    {gpsLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4" />}
                    Gunakan Lokasi Saya
                  </button>
                )}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <h3 className="font-semibold text-slate-800 mb-3 text-sm border-b pb-2">Data Pribadi</h3>
                <dl className="grid grid-cols-2 gap-y-2 text-sm">
                  <dt className="text-slate-500">Nama Lengkap</dt><dd className="font-medium">{formValues.fullName}</dd>
                  <dt className="text-slate-500">NIK</dt><dd className="font-medium">{formValues.nik}</dd>
                  <dt className="text-slate-500">No. HP</dt><dd className="font-medium">{formValues.phone}</dd>
                </dl>
              </div>

              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <h3 className="font-semibold text-slate-800 mb-3 text-sm border-b pb-2">Data Rumah</h3>
                <dl className="grid grid-cols-2 gap-y-2 text-sm">
                  <dt className="text-slate-500">RT / RW</dt><dd className="font-medium">{formValues.rtNumber} / {formValues.rwNumber}</dd>
                  <dt className="text-slate-500">No. Rumah</dt><dd className="font-medium">{formValues.houseNumber}</dd>
                  <dt className="text-slate-500">GPS Status</dt>
                  <dd className="font-medium">
                    {formValues.latitude ? <span className="text-emerald-600">Terlampir</span> : <span className="text-amber-600">Tidak ada</span>}
                  </dd>
                </dl>
              </div>
              
              <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                <p className="text-xs text-blue-800 text-center">
                  Dengan menyimpan data ini, saya menyatakan bahwa data yang diisi adalah benar dan dapat dipertanggungjawabkan.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer / Actions */}
        <div className="sticky bottom-0 bg-white/80 backdrop-blur-md px-6 py-4 border-t border-slate-100 rounded-b-3xl flex justify-between gap-3">
          {step > 1 ? (
            <button
              type="button"
              onClick={handlePrev}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-medium text-sm flex items-center gap-1 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" /> Kembali
            </button>
          ) : <div />}

          {step < 3 ? (
            <button
              type="button"
              onClick={handleNext}
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm flex items-center gap-1 transition-colors shadow-lg shadow-blue-500/30"
            >
              Lanjut <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit(onSubmit)}
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium text-sm flex items-center gap-2 transition-all shadow-lg shadow-blue-500/30 disabled:opacity-70"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              Simpan Data Warga
            </button>
          )}
        </div>
        
        <div className="mt-4 bg-slate-900 text-green-400 p-4 rounded-xl text-xs overflow-auto max-h-64">
          <pre>{JSON.stringify({ rw: formValues.rwNumber, rt: formValues.rtNumber }, null, 2)}</pre>
        </div>
      </div>
    </div>
  )
}
