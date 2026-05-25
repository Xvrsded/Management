import { createClient as createSupabaseClient } from '@supabase/supabase-js'

/**
 * Server-only admin client for landing fallbacks when RPC is unavailable.
 * Never import this from client components.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceKey) {
    return null
  }

  return createSupabaseClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
