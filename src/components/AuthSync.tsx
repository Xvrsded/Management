'use client'

import { useEffect, useRef } from 'react'
import { createClient } from '@/services/supabase/client'
import { useAuthStore } from '@/store/useAuthStore'
import { userFromSupabaseUser } from '@/lib/auth/session'

/** Hydrates Zustand once on protected routes — skipped on login/register/landing. */
export default function AuthSync({ children }: { children: React.ReactNode }) {
  const started = useRef(false)

  useEffect(() => {
    if (started.current) return
    started.current = true

    const { setUser, setLoading } = useAuthStore.getState()
    setLoading(true)

    const supabase = createClient()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (
        event !== 'INITIAL_SESSION' &&
        event !== 'SIGNED_IN' &&
        event !== 'SIGNED_OUT' &&
        event !== 'TOKEN_REFRESHED'
      ) {
        return
      }

      if (session?.user) {
        setUser(userFromSupabaseUser(session.user))
      } else {
        setUser(null)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  return <>{children}</>
}
