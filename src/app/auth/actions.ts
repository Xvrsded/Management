'use server'

import { createClient } from '@/services/supabase/server'
import { revalidatePath } from 'next/cache'

export interface AuthResponse {
  success: boolean
  message?: string
  error?: string
  sessionExists?: boolean
}

function connectionError(): AuthResponse {
  return {
    success: false,
    error: 'Koneksi ke server gagal. Periksa internet Anda lalu coba lagi.',
  }
}

/** @deprecated Prefer client signInWithPassword on login page for lower latency */
export async function signIn(formData: {
  email: string
  password: string
}): Promise<AuthResponse> {
  try {
    const supabase = await createClient()
    const { error } = await supabase.auth.signInWithPassword({
      email: formData.email,
      password: formData.password,
    })

    if (error) {
      if (error.message.includes('Invalid login credentials') || error.status === 400) {
        return { success: false, error: 'Email atau password salah' }
      }
      return { success: false, error: error.message }
    }

    revalidatePath('/', 'layout')
    return { success: true }
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : ''
    if (errMsg.includes('fetch failed')) return connectionError()
    return { success: false, error: errMsg || 'Terjadi kesalahan sistem' }
  }
}

/** Public registration — warga only. Staff roles are created by admin. */
export async function signUp(formData: {
  email: string
  password: string
  fullName: string
}): Promise<AuthResponse> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/callback`,
        data: {
          role: 'warga',
          full_name: formData.fullName,
        },
      },
    })

    if (error) {
      return { success: false, error: error.message }
    }

    const sessionExists = !!data?.session
    return {
      success: true,
      sessionExists,
      message: sessionExists
        ? 'Akun berhasil dibuat.'
        : 'Akun berhasil dibuat. Silakan cek email untuk verifikasi.',
    }
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : ''
    if (errMsg.includes('fetch failed')) return connectionError()
    return { success: false, error: errMsg || 'Terjadi kesalahan sistem' }
  }
}

export async function signOut(): Promise<AuthResponse> {
  try {
    const supabase = await createClient()
    const { error } = await supabase.auth.signOut()
    if (error) {
      return { success: false, error: error.message }
    }
    revalidatePath('/', 'layout')
    return { success: true }
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : ''
    return { success: false, error: errMsg || 'Terjadi kesalahan sistem' }
  }
}

export async function loginAction(formData: { email: string; password: string }) {
  return signIn(formData)
}

export async function signUpAction(formData: {
  email: string
  password: string
  fullName: string
}) {
  return signUp(formData)
}

export async function logoutAction() {
  await signOut()
}
