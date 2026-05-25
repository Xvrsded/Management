import type { PostgrestError } from '@supabase/supabase-js'

export function isPostgrestError(error: unknown): error is PostgrestError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as PostgrestError).message === 'string'
  )
}

/** Structured logging — avoids silent `{}` in console. */
export function logSupabaseError(context: string, error: unknown): void {
  if (isPostgrestError(error)) {
    console.error(`[Supabase] ${context}`, {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code,
    })
    return
  }

  if (error instanceof Error) {
    console.error(`[Supabase] ${context}`, {
      message: error.message,
      name: error.name,
      stack: error.stack,
    })
    return
  }

  console.error(`[Supabase] ${context}`, {
    message: String(error),
    full: error,
  })
}

/** Human-readable message for toast UI. */
export function handleSupabaseError(error: unknown): string {
  if (!error) return 'Gagal mengambil data'

  const message = isPostgrestError(error)
    ? error.message
  : error instanceof Error
    ? error.message
    : String(error)

  const code = isPostgrestError(error) ? error.code : ''
  const lower = message.toLowerCase()

  if (
    code === 'PGRST301' ||
    lower.includes('jwt') ||
    lower.includes('not authenticated') ||
    lower.includes('session')
  ) {
    return 'Session login berakhir. Silakan masuk kembali.'
  }

  if (
    code === '42P01' ||
    lower.includes('does not exist') ||
    lower.includes('schema cache') ||
    lower.includes('could not find the table')
  ) {
    return 'Tabel database belum tersedia. Hubungi administrator.'
  }

  if (
    code === '42501' ||
    lower.includes('permission denied') ||
    lower.includes('policy') ||
    lower.includes('row-level security')
  ) {
    return 'Akses ditolak. Anda tidak memiliki izin untuk data ini.'
  }

  if (lower.includes('fetch failed') || lower.includes('network')) {
    return 'Koneksi gagal. Periksa internet Anda.'
  }

  return message || 'Gagal mengambil data'
}
