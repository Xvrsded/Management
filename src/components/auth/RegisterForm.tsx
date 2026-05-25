'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Loader2, Mail, Lock, User, AlertCircle, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/services/supabase/client'
import { useAuthStore } from '@/store/useAuthStore'
import { userFromSupabaseUser } from '@/lib/auth/session'
import { cn } from '@/lib/utils'

const registerSchema = z.object({
  fullName: z.string().min(1, 'Nama lengkap wajib diisi').max(100, 'Nama terlalu panjang'),
  email: z.string().min(1, 'Email wajib diisi').email('Format email tidak valid'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
})

type RegisterFormValues = z.infer<typeof registerSchema>

const inputClass = (hasError: boolean) =>
  cn(
    'w-full rounded-xl border bg-white py-3 pl-10 pr-4 text-base sm:text-sm',
    'transition-colors duration-150 focus:outline-none focus:ring-2',
    hasError
      ? 'border-rose-300 focus:border-rose-400 focus:ring-rose-100'
      : 'border-slate-200 focus:border-blue-500 focus:ring-blue-500/15'
  )

function mapRegisterError(message: string): string {
  const lower = message.toLowerCase()
  if (lower.includes('already registered') || lower.includes('already exists')) {
    return 'Email sudah terdaftar. Silakan masuk.'
  }
  if (lower.includes('fetch failed') || lower.includes('network')) {
    return 'Koneksi ke server gagal. Periksa internet Anda.'
  }
  return message || 'Gagal mendaftar. Silakan coba lagi.'
}

export default function RegisterForm() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { fullName: '', email: '', password: '' },
  })

  const onSubmit = async (values: RegisterFormValues) => {
    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const { data, error: authError } = await supabase.auth.signUp({
        email: values.email.trim(),
        password: values.password,
        options: {
          data: {
            role: 'warga',
            full_name: values.fullName.trim(),
          },
        },
      })

      if (authError) {
        const errorMsg = mapRegisterError(authError.message)
        setError(errorMsg)
        toast.error(errorMsg)
        setLoading(false)
        return
      }

      if (data.session?.user) {
        useAuthStore.getState().setUser(userFromSupabaseUser(data.session.user))
        toast.success('Akun berhasil dibuat!')
        router.replace('/dashboard')
        return
      }

      setSuccess(true)
      toast.success('Akun berhasil dibuat. Cek email untuk verifikasi.')

      setTimeout(() => router.replace('/login'), 2000)
    } catch (err: unknown) {
      const raw = err instanceof Error ? err.message : 'Terjadi kesalahan sistem'
      const errorMsg = mapRegisterError(raw)
      setError(errorMsg)
      toast.error(errorMsg)
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="rounded-xl border border-slate-100 bg-white p-6 text-center shadow-sm sm:p-8">
        <CheckCircle className="mx-auto h-10 w-10 text-emerald-600" aria-hidden />
        <h3 className="mt-3 text-lg font-bold text-slate-800">Pendaftaran Berhasil</h3>
        <p className="mt-2 text-sm text-slate-600">
          Akun warga Anda telah dibuat. Silakan masuk untuk melanjutkan.
        </p>
        <Link
          href="/login"
          className="mt-6 inline-flex min-h-[44px] items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 to-indigo-500 px-6 py-2.5 text-sm font-semibold text-white"
        >
          Ke Halaman Masuk
        </Link>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm sm:p-7">
      <h2 className="text-center text-base font-semibold text-slate-800">Daftar Akun Warga</h2>
      <p className="mt-1 text-center text-xs text-slate-500">
        Pendaftaran terbuka untuk warga. Peran pengurus dibuat oleh admin.
      </p>

      {error && (
        <div
          role="alert"
          className="mt-4 flex items-start gap-2 rounded-xl border border-rose-100 bg-rose-50 px-3 py-2.5 text-sm text-rose-700"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="mt-5 space-y-4" noValidate>
        <div className="space-y-1.5">
          <label htmlFor="reg-name" className="block text-sm font-medium text-slate-700">
            Nama Lengkap
          </label>
          <div className="relative">
            <User
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              aria-hidden
            />
            <input
              id="reg-name"
              {...register('fullName')}
              type="text"
              autoComplete="name"
              placeholder="Sesuai KTP"
              className={inputClass(!!errors.fullName)}
              disabled={loading}
            />
          </div>
          {errors.fullName && (
            <p className="text-xs text-rose-600">{errors.fullName.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <label htmlFor="reg-email" className="block text-sm font-medium text-slate-700">
            Email
          </label>
          <div className="relative">
            <Mail
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              aria-hidden
            />
            <input
              id="reg-email"
              {...register('email')}
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="nama@email.com"
              className={inputClass(!!errors.email)}
              disabled={loading}
            />
          </div>
          {errors.email && <p className="text-xs text-rose-600">{errors.email.message}</p>}
        </div>

        <div className="space-y-1.5">
          <label htmlFor="reg-password" className="block text-sm font-medium text-slate-700">
            Password
          </label>
          <div className="relative">
            <Lock
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              aria-hidden
            />
            <input
              id="reg-password"
              {...register('password')}
              type="password"
              autoComplete="new-password"
              placeholder="Minimal 6 karakter"
              className={inputClass(!!errors.password)}
              disabled={loading}
            />
          </div>
          {errors.password && (
            <p className="text-xs text-rose-600">{errors.password.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className={cn(
            'flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl px-4 py-3',
            'bg-gradient-to-r from-blue-600 to-indigo-500 text-sm font-semibold text-white',
            'shadow-sm transition-opacity duration-150 hover:opacity-95',
            'disabled:cursor-not-allowed disabled:opacity-50'
          )}
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              <span>Memproses...</span>
            </>
          ) : (
            <span>Daftar Sekarang</span>
          )}
        </button>
      </form>

      <p className="mt-5 border-t border-slate-100 pt-4 text-center text-sm text-slate-600">
        Sudah punya akun?{' '}
        <Link
          href="/login"
          className="font-semibold text-blue-600 underline-offset-2 hover:underline"
        >
          Masuk
        </Link>
      </p>
    </div>
  )
}
