import { createClient } from '@/services/supabase/server'
import { redirect } from 'next/navigation'
import WargaLaporan from './WargaLaporan'
import AdminLaporan from './AdminLaporan'

export const revalidate = 0

export default async function LaporanRoute() {
  const supabase = await createClient()

  // 1. Get authenticated user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  // 2. Fetch role
  let role = 'warga'
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    if (profile) role = profile.role
  } catch (err) {}

  if (role === 'warga') {
    return <WargaLaporan />
  } else {
    return <AdminLaporan />
  }
}
