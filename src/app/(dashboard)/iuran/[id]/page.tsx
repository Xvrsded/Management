import { createClient } from '@/services/supabase/server'
import { redirect } from 'next/navigation'
import { duesServiceServer } from '@/services/duesService.server'
import DueDetailClient from '@/components/dues/DueDetailClient'

interface PageProps {
  params: Promise<{ id: string }>
}

export const revalidate = 0 // Enforce dynamic server-side rendering for real-time accuracy

export default async function DueDetailPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  // 1. Authenticate user session
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  // 2. Fetch role securely from single source of truth profiles table
  let role = 'warga'
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
    console.warn('Failed to fetch role in iuran detail, utilizing metadata fallback:', err)
    role = user.user_metadata?.role || 'warga'
  }

  // 3. Fetch initial due payment data on the server using edge-safe server service
  const due = await duesServiceServer.getDueById(id)
  if (!due) {
    redirect('/iuran')
  }


  return (
    <section className="px-4 py-6 md:py-8">
      <DueDetailClient initialDue={due} userId={userId} role={role} />
    </section>
  )
}
