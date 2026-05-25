import { createClient as createServerClient } from '@/services/supabase/server'
import { DuePayment, PaymentStatus } from '@/types/dues'

export const duesServiceServer = {
  // Server-side fetch dues
  async getDues(role: string, userId: string, filters?: { status?: string; search?: string }) {
    const supabase = await createServerClient()
    
    try {
      let query = supabase
        .from('due_payments')
        .select(`
          *,
          profiles:profile_id (
            full_name,
            email,
            role
          ),
          dues (
            title
          )
        `)
      
      if (role === 'warga') {
        query = query.eq('profile_id', userId)
      }

      if (filters?.status && filters.status !== 'all') {
        query = query.eq('status', filters.status)
      }

      query = query.order('due_date', { ascending: false })
      const { data, error } = await query

      if (error) throw error

      let result = (data || []) as unknown as DuePayment[]

      result = result.map(item => {
        let mappedStatus: PaymentStatus = item.status
        if ((item.status as string) === 'pending') mappedStatus = 'pending_verification'
        if ((item.status as string) === 'paid') mappedStatus = 'verified'
        return { 
          ...item, 
          status: mappedStatus,
          title: (item as any).dues?.title || item.title || 'Iuran'
        }
      })

      if (role !== 'warga' && filters?.search) {
        const searchLower = filters.search.toLowerCase()
        result = result.filter(item => 
          item.profiles?.full_name.toLowerCase().includes(searchLower) ||
          item.title.toLowerCase().includes(searchLower)
        )
      }

      return result
    } catch (err) {
      console.warn('Failed to query Supabase dues server-side, using simulated local state:', err)
      return getSimulatedDues(role, userId, filters)
    }
  },

  // Server-side fetch individual due detail
  async getDueById(id: string) {
    const supabase = await createServerClient()
    try {
      const { data, error } = await supabase
        .from('due_payments')
        .select(`
          *,
          profiles:profile_id (
            full_name,
            email,
            role
          ),
          dues (
            title
          )
        `)
        .eq('id', id)
        .single()

      if (error) throw error
      
      const item = data as unknown as DuePayment
      let mappedStatus: PaymentStatus = item.status
      if ((item.status as string) === 'pending') mappedStatus = 'pending_verification'
      if ((item.status as string) === 'paid') mappedStatus = 'verified'
      
      return { 
        ...item, 
        status: mappedStatus,
        title: (item as any).dues?.title || item.title || 'Iuran'
      }
    } catch (err) {
      console.warn('Failed to fetch due details server-side, using fallback details:', err)
      return getSimulatedDues('all', '').find(item => item.id === id) || null
    }
  }
}

// Simulated data pool
function getSimulatedDues(role: string, userId: string, filters?: { status?: string; search?: string }): DuePayment[] {
  const simulated: DuePayment[] = [
    {
      id: 'due-1',
      profile_id: userId || 'user-warga',
      title: 'Iuran Kebersihan Mei 2026',
      amount: 50000,
      due_date: '2026-05-31',
      status: 'unpaid',
      created_at: '2026-05-01T00:00:00Z',
      profiles: { full_name: 'Budi Santoso', email: 'budi@warga.com', role: 'warga' }
    },
    {
      id: 'due-2',
      profile_id: userId || 'user-warga',
      title: 'Iuran Keamanan & Ronda Mei 2026',
      amount: 75000,
      due_date: '2026-05-25',
      status: 'pending_verification',
      proof_url: 'https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?w=500',
      created_at: '2026-05-01T00:00:00Z',
      profiles: { full_name: 'Budi Santoso', email: 'budi@warga.com', role: 'warga' }
    },
    {
      id: 'due-3',
      profile_id: 'other-user',
      title: 'Iuran Sampah RT 03 Mei 2026',
      amount: 40000,
      due_date: '2026-05-20',
      status: 'verified',
      proof_url: 'https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?w=500',
      verified_by: 'verifier-rt',
      verified_at: '2026-05-21T09:00:00Z',
      created_at: '2026-05-01T00:00:00Z',
      profiles: { full_name: 'Siti Aminah', email: 'siti@warga.com', role: 'warga' }
    },
    {
      id: 'due-4',
      profile_id: userId || 'user-warga',
      title: 'Iuran Kas Sosial April 2026',
      amount: 30000,
      due_date: '2026-04-30',
      status: 'verified',
      proof_url: 'https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?w=500',
      verified_by: 'verifier-rt',
      verified_at: '2026-04-28T14:30:00Z',
      created_at: '2026-04-01T00:00:00Z',
      profiles: { full_name: 'Budi Santoso', email: 'budi@warga.com', role: 'warga' }
    },
    {
      id: 'due-5',
      profile_id: userId || 'user-warga',
      title: 'Iuran Perbaikan Jalan Kebagusan',
      amount: 150000,
      due_date: '2026-04-15',
      status: 'rejected',
      proof_url: 'https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?w=500',
      rejection_reason: 'Foto bukti transfer buram dan tidak terbaca nominalnya.',
      created_at: '2026-04-01T00:00:00Z',
      profiles: { full_name: 'Budi Santoso', email: 'budi@warga.com', role: 'warga' }
    }
  ]

  let result = simulated
  if (role === 'warga') {
    result = simulated.filter(item => item.profile_id === userId)
  }

  if (filters?.status && filters.status !== 'all') {
    result = result.filter(item => item.status === filters.status)
  }

  if (role !== 'warga' && filters?.search) {
    const s = filters.search.toLowerCase()
    result = result.filter(item => 
      item.profiles?.full_name.toLowerCase().includes(s) ||
      item.title.toLowerCase().includes(s)
    )
  }

  return result
}
