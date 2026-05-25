import { createClient } from '@/services/supabase/server'
import { redirect } from 'next/navigation'
import { lettersServiceServer } from '@/services/lettersService.server'
import LetterPrintLayout from '@/components/letters/LetterPrintLayout'

interface PageProps {
  params: Promise<{ id: string }>
}

export const revalidate = 0

export default async function PrintLetterPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  // 1. Authenticate user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  // 2. Query letter details
  const letter = await lettersServiceServer.getLetterRequestById(id)
  if (!letter || letter.status !== 'finished') {
    redirect(`/surat/${id}`)
  }

  const citizen = await lettersServiceServer.getCitizenProfile(letter.profile_id)
  const fallbackCitizen = {
    id: letter.profile_id,
    nik: '3273012304950002',
    kk: '3273012304951113',
    address: 'Jl. Kebon Jeruk No. 24, RT 03 / RW 05',
    rt: '03',
    rw: '05'
  }

  return (
    <div className="bg-slate-100 min-h-screen py-10 print:bg-white print:py-0">
      <LetterPrintLayout letter={letter} citizen={citizen || fallbackCitizen} />
    </div>
  )
}
