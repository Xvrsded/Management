import { createClient } from '@/services/supabase/server'
import { redirect } from 'next/navigation'
import DuesListClient from '@/components/dues/DuesListClient'

export const revalidate = 0 // Enforce dynamic server-side rendering for real-time accuracy

export default async function IuranPage() {
  const supabase = await createClient()

  // 1. Authenticate user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  // 2. Fetch role securely from single source of truth profiles table
  let role = 'warga' // Fallback
  let userId = user.id

  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role) {
      role = profile.role
    } else {
      role = user.user_metadata?.role || 'warga'
    }
  } catch (err) {
    console.warn('Failed to fetch role in iuran index, utilizing metadata fallback:', err)
    role = user.user_metadata?.role || 'warga'
  }

  return (
    <section className="px-4 py-6 md:py-8">
      <DuesListClient userId={userId} role={role} />
    </section>
  )
}
