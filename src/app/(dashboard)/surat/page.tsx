import { createClient } from '@/services/supabase/server'
import { redirect } from 'next/navigation'
import { lettersServiceServer } from '@/services/lettersService.server'
import LettersListClient from '@/components/letters/LettersListClient'
import { FileText } from 'lucide-react'

export const revalidate = 0 // Enforce dynamic server-side rendering for real-time accuracy

export default async function SuratPage() {
  const supabase = await createClient()

  // 1. Authenticate user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  // 2. Fetch role securely from public.profiles
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
    console.warn('Failed to fetch role, utilizing metadata fallback:', err)
    role = user.user_metadata?.role || 'warga'
  }

  // 3. Pre-fetch initial letters list on the server side
  const initialLetters = await lettersServiceServer.getMyLetters(role, userId)

  return (
    <section className="px-4 py-6 md:py-8 max-w-4xl mx-auto space-y-6">
      {/* Dynamic Time & Greeting Header */}
      <div className="space-y-1">
        <h1 className="text-xl font-black text-slate-800 tracking-tight flex items-center">
          <FileText className="w-6 h-6 mr-2 text-primary" />
          Layanan Surat Warga
        </h1>
        <p className="text-2xs font-semibold text-slate-400">
          Kelola permohonan, pengesahan, dan cetak dokumen resmi mandiri RT/RW.
        </p>
      </div>

      {/* Reactive list container */}
      <LettersListClient initialLetters={initialLetters} userId={userId} role={role} />
    </section>
  )
}
