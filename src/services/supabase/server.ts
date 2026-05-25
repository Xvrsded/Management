import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

if (process.env.NODE_ENV === 'development') {
  if (!supabaseUrl || supabaseUrl.includes('placeholder-project')) {
    console.warn('⚠️ Warning: NEXT_PUBLIC_SUPABASE_URL is not set on server. Supabase operations may fail.')
  }
  if (!supabaseKey || supabaseKey.includes('dummy-anon-key')) {
    console.warn('⚠️ Warning: NEXT_PUBLIC_SUPABASE_ANON_KEY is not set on server. Supabase operations may fail.')
  }
}

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    supabaseUrl || 'https://placeholder-project.supabase.co',
    supabaseKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummy-anon-key',
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            // Safe to ignore in Server Components
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch (error) {
            // Safe to ignore in Server Components
          }
        },
      },
    }
  )
}
