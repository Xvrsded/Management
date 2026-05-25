import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

if (process.env.NODE_ENV === 'development') {
  if (!supabaseUrl || supabaseUrl.includes('placeholder-project')) {
    console.warn('⚠️ Warning: NEXT_PUBLIC_SUPABASE_URL is not set or is using placeholder. Supabase operations may fail.')
  }
  if (!supabaseKey || supabaseKey.includes('dummy-anon-key')) {
    console.warn('⚠️ Warning: NEXT_PUBLIC_SUPABASE_ANON_KEY is not set or is using placeholder. Supabase operations may fail.')
  }
}

export function createClient() {
  return createBrowserClient(
    supabaseUrl || 'https://placeholder-project.supabase.co',
    supabaseKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummy-anon-key'
  )
}
