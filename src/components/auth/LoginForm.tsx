'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2, Lock, Mail, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/services/supabase/client'
import { useAuthStore } from '@/store/useAuthStore'
import { userFromSupabaseUser } from '@/lib/auth/session'
import { cn } from '@/lib/utils'

const loginSchema = z.object({
  email: z.string().min(1, 'Email wajib diisi').email('Format email tidak valid'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
})

type LoginFormValues = z.infer<typeof loginSchema>

function mapLoginError(message: string): string {
  const lower = message.toLowerCase()
  if (
    lower.includes('invalid login') ||
    lower.includes('email atau password') ||
    lower.includes('credentials')
  ) {
    return 'Email atau password salah'
  }
  if (
    lower.includes('fetch failed') ||
    lower.includes('network') ||
    lower.includes('koneksi')
  ) {
    return 'Koneksi ke server gagal. Periksa internet Anda lalu coba lagi.'
  }
  return message || 'Terjadi kesalahan. Silakan coba lagi.'
}

const inputClass = (hasError: boolean) =>
  cn(
    'w-full rounded-xl border bg-white py-3 pl-10 pr-4 text-base sm:text-sm',
    'transition-colors duration-150 focus:outline-none focus:ring-2',
    hasError
      ? 'border-rose-300 focus:border-rose-400 focus:ring-rose-100'
      : 'border-slate-200 focus:border-blue-500 focus:ring-blue-500/15'
  )

export default function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectUrl = searchParams.get('redirect') || '/dashboard'
  const errorParam = searchParams.get('error')

  const [error, setError] = useState<string | null>(
    errorParam ? mapLoginError(errorParam) : null
  )
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  const onSubmit = async (values: LoginFormValues) => {
    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: values.email.trim(),
        password: values.password,
      })

      if (authError) {
        const errorMsg = mapLoginError(authError.message)
        setError(errorMsg)
        toast.error(errorMsg)
        setLoading(false)
        return
      }

      if (data.user) {
        useAuthStore.getState().setUser(userFromSupabaseUser(data.user))
      }

      toast.success('Berhasil masuk!')
      router.replace(redirectUrl)
    } catch (err: unknown) {
      const raw = err instanceof Error ? err.message : 'Terjadi kesalahan sistem'
      const errorMsg = mapLoginError(raw)
      setError(errorMsg)
      toast.error(errorMsg)
      setLoading(false)
    }
  }

  return (
    <div className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm sm:p-7">
      <h2 className="text-center text-base font-semibold text-slate-800">Masuk ke Akun</h2>
      <p className="mt-1 text-center text-xs text-slate-500">Gunakan email dan password terdaftar</p>

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
          <label htmlFor="login-email" className="block text-sm font-medium text-slate-700">
            Email
          </label>
          <div className="relative">
            <Mail
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              aria-hidden
            />
            <input
              id="login-email"
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
          <label htmlFor="login-password" className="block text-sm font-medium text-slate-700">
            Password
          </label>
          <div className="relative">
            <Lock
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              aria-hidden
            />
            <input
              id="login-password"
              {...register('password')}
              type="password"
              autoComplete="current-password"
              placeholder="Masukkan password"
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
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2',
            'disabled:cursor-not-allowed disabled:opacity-50'
          )}
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              <span>Memproses...</span>
            </>
          ) : (
            <span>Masuk</span>
          )}
        </button>
      </form>

      <p className="mt-5 border-t border-slate-100 pt-4 text-center text-sm text-slate-600">
        Belum punya akun?{' '}
        <Link
          href="/register"
          className="font-semibold text-blue-600 underline-offset-2 hover:underline"
        >
          Daftar
        </Link>
      </p>
    </div>
  )
}
