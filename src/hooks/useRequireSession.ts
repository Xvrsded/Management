'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/services/supabase/client'
import { useAuthStore } from '@/store/useAuthStore'
import { userFromSupabaseUser } from '@/lib/auth/session'

/**
 * Ensures a Supabase session exists before data fetch.
 * Returns ready=true when safe to fetch.
 */
export function useRequireSession() {
  const router = useRouter()
  const user = useAuthStore((state) => state.user)
  const setUser = useAuthStore((state) => state.setUser)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function check() {
      const supabase = createClient()
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (cancelled) return

      if (!session?.user) {
        router.replace('/login')
        return
      }

      if (!useAuthStore.getState().user) {
        setUser(userFromSupabaseUser(session.user))
      }

      setReady(true)
    }

    check()

    return () => {
      cancelled = true
    }
  }, [router, setUser])

  return { user, ready }
}
