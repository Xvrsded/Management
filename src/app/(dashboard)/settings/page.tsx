'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/services/supabase/client'
import { useAuthStore } from '@/store/useAuthStore'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { toast } from 'sonner'
import { Loader2, Settings, User, Shield, Info, Check } from 'lucide-react'

// Profile schema Zod validation
const profileSchema = z.object({
  fullName: z.string().min(2, 'Nama minimal terdiri dari 2 karakter')
})

// Password schema Zod validation
const passwordSchema = z.object({
  password: z.string().min(6, 'Password minimal terdiri dari 6 karakter'),
  confirmPassword: z.string().min(6, 'Konfirmasi password minimal 6 karakter')
}).refine(data => data.password === data.confirmPassword, {
  message: 'Konfirmasi password tidak cocok',
  path: ['confirmPassword']
})

type ProfileFormValues = z.infer<typeof profileSchema>
type PasswordFormValues = z.infer<typeof passwordSchema>

export default function SettingsPage() {
  const { user, setUser } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [passwordLoading, setPasswordLoading] = useState(false)

  const supabase = createClient()

  // Form profile
  const {
    register: registerProfile,
    handleSubmit: handleSubmitProfile,
    setValue: setProfileValue,
    formState: { errors: profileErrors }
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema)
  })

  // Form password
  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    reset: resetPasswordForm,
    formState: { errors: passwordErrors }
  } = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema)
  })

  // Synchronize input fields when user loads
  useEffect(() => {
    if (user?.fullName) {
      setProfileValue('fullName', user.fullName)
    }
  }, [user, setProfileValue])

  // Handle profile details update
  const onUpdateProfile = async (values: ProfileFormValues) => {
    if (!user) return
    setLoading(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: values.fullName
        })
        .eq('id', user.id)

      if (error) throw error

      // Update local Zustand store
      setUser({
        ...user,
        fullName: values.fullName
      })

      toast.success('Profil Anda berhasil diperbarui!')
    } catch (err: any) {
      console.error('Error updating profile:', err)
      toast.error(err.message || 'Gagal memperbarui profil')
    } finally {
      setLoading(false)
    }
  }

  // Handle password update
  const onUpdatePassword = async (values: PasswordFormValues) => {
    setPasswordLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({
        password: values.password
      })

      if (error) throw error

      toast.success('Password Akun berhasil diperbarui!')
      resetPasswordForm({
        password: '',
        confirmPassword: ''
      })
    } catch (err: any) {
      console.error('Error updating password:', err)
      toast.error(err.message || 'Gagal memperbarui password')
    } finally {
      setPasswordLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 select-none">
      {/* Header section */}
      <div>
        <h1 className="text-xl font-bold text-slate-800 tracking-tight flex items-center">
          <Settings className="w-6 h-6 mr-2 text-blue-600 shrink-0" />
          Pengaturan Akun
        </h1>
        <p className="text-xs text-slate-450 mt-1">
          Kelola preferensi profil warga dan keamanan autentikasi akun Anda
        </p>
      </div>

      {/* Settings layout grid split in two sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Section 1: Profil Details Card */}
        <div className="bg-white rounded-3xl border border-slate-100/80 shadow-xs p-5 sm:p-6 space-y-4">
          <div className="flex items-center space-x-2 border-b border-slate-50 pb-3">
            <User className="w-4.5 h-4.5 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-800">Detail Informasi Profil</h3>
          </div>

          <form onSubmit={handleSubmitProfile(onUpdateProfile)} className="space-y-4">
            {/* Full Name */}
            <div className="space-y-1">
              <label className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-widest leading-none">Nama Lengkap Anda</label>
              <input
                {...registerProfile('fullName')}
                placeholder="Tulis nama lengkap Anda..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 font-semibold text-slate-800"
              />
              {profileErrors.fullName && (
                <p className="text-[10px] font-semibold text-rose-500">{profileErrors.fullName.message}</p>
              )}
            </div>

            {/* Email (Read Only representation) */}
            <div className="space-y-1">
              <label className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-widest leading-none">Alamat Email (Akun)</label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-100 bg-slate-50/50 text-xs font-semibold text-slate-450 cursor-not-allowed"
              />
              <p className="text-[9px] text-slate-400 font-medium leading-none pt-1">
                * Email digunakan untuk autentikasi dan tidak dapat diubah secara mandiri.
              </p>
            </div>

            {/* Submit Profile */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-3 px-4 font-bold text-xs transition-all flex items-center justify-center space-x-2 disabled:opacity-50 active:scale-[0.99]"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 shrink-0" />
                  <span>Simpan Perubahan Profil</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Section 2: Account Security / Change Password */}
        <div className="bg-white rounded-3xl border border-slate-100/80 shadow-xs p-5 sm:p-6 space-y-4">
          <div className="flex items-center space-x-2 border-b border-slate-50 pb-3">
            <Shield className="w-4.5 h-4.5 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-800">Keamanan & Ubah Password</h3>
          </div>

          <form onSubmit={handleSubmitPassword(onUpdatePassword)} className="space-y-4">
            {/* New Password */}
            <div className="space-y-1">
              <label className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-widest leading-none">Password Baru</label>
              <input
                {...registerPassword('password')}
                type="password"
                placeholder="Tulis password baru (min. 6 karakter)..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 font-semibold text-slate-800"
              />
              {passwordErrors.password && (
                <p className="text-[10px] font-semibold text-rose-500">{passwordErrors.password.message}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-1">
              <label className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-widest leading-none">Konfirmasi Password Baru</label>
              <input
                {...registerPassword('confirmPassword')}
                type="password"
                placeholder="Ulangi menulis password baru..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 font-semibold text-slate-800"
              />
              {passwordErrors.confirmPassword && (
                <p className="text-[10px] font-semibold text-rose-500">{passwordErrors.confirmPassword.message}</p>
              )}
            </div>

            {/* Submit Password */}
            <button
              type="submit"
              disabled={passwordLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-3 px-4 font-bold text-xs transition-all flex items-center justify-center space-x-2 disabled:opacity-50 active:scale-[0.99]"
            >
              {passwordLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                  <span>Mengubah Password...</span>
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4 shrink-0" />
                  <span>Perbarui Password Akun</span>
                </>
              )}
            </button>
          </form>
        </div>

      </div>
    </div>
  )
}
