'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/services/supabase/client'
import type { LandingRealtimeMetrics } from '@/services/landingService.server'

type Props = {
  initial: LandingRealtimeMetrics
}

export default function LiveRealtimeCounters({ initial }: Props) {
  const [metrics, setMetrics] = useState(initial)

  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel('landing-public-metrics')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'landing_public_metrics' },
        (payload) => {
          const row = payload.new as {
            letters_in_process?: number
            notifications_recent?: number
            updated_at?: string
          }
          setMetrics((prev) => ({
            lettersInProcess:
              row.letters_in_process != null
                ? Number(row.letters_in_process)
                : prev.lettersInProcess,
            notificationsRecent:
              row.notifications_recent != null
                ? Number(row.notifications_recent)
                : prev.notificationsRecent,
            updatedAt: row.updated_at ?? prev.updatedAt,
          }))
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  return (
    <div
      className="absolute -bottom-3 -left-3 hidden max-w-[14rem] rounded-2xl border border-white/80 bg-white px-3 py-2 shadow-lg sm:block"
      aria-live="polite"
    >
      <p className="text-xs font-medium text-slate-600">
        {metrics.notificationsRecent > 0
          ? `${metrics.notificationsRecent} notifikasi minggu ini`
          : 'Tidak ada notifikasi baru'}
      </p>
      <p className="text-2xs text-slate-400">
        {metrics.lettersInProcess} surat diproses
      </p>
    </div>
  )
}
