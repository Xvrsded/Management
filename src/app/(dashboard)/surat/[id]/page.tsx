import { createClient } from '@/services/supabase/server'
import { redirect } from 'next/navigation'
import { lettersServiceServer } from '@/services/lettersService.server'
import LetterDetailClient from '@/components/letters/LetterDetailClient'

interface PageProps {
  params: Promise<{ id: string }>
}

export const revalidate = 0 // Enforce dynamic server-side rendering for real-time accuracy

export default async function LetterDetailPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  // 1. Authenticate user session
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  // 2. Fetch role securely from public.profiles
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
    console.warn('Failed to fetch role in surat detail, utilizing metadata fallback:', err)
    role = user.user_metadata?.role || 'warga'
  }

  // 3. Fetch initial letter request data on the server
  const letter = await lettersServiceServer.getLetterRequestById(id)
  if (!letter) {
    redirect('/surat')
  }

  return (
    <section className="px-4 py-6 md:py-8">
      <LetterDetailClient initialLetter={letter} userId={userId} role={role} />
    </section>
  )
}
