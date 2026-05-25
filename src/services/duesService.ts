import { createClient } from '@/services/supabase/client'
import { DuePayment, PaymentStatus } from '@/types/dues'

export const duesService = {
  // 1. Client-side fetch dues
  async getDues(role: string, userId: string, filters?: { status?: string; search?: string }) {
    const supabase = createClient()
    
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
            title,
            due_date
          )
        `)
      
      // Citizens can strictly only see their own dues
      if (role === 'warga') {
        query = query.eq('profile_id', userId)
      }

      // Filter by status if specified and not 'all'
      if (filters?.status && filters.status !== 'all') {
        query = query.eq('status', filters.status)
      }

      query = query.order('created_at', { ascending: false })
      const { data, error } = await query

      if (error) throw error

      let result = (data || []) as unknown as DuePayment[]

      // Map status codes for legacy/backward compatibility
      result = result.map(item => {
        let mappedStatus: PaymentStatus = item.status
        if ((item.status as string) === 'pending') mappedStatus = 'pending_verification'
        if ((item.status as string) === 'paid') mappedStatus = 'verified'
        return { 
          ...item, 
          status: mappedStatus,
          title: (item as any).dues?.title || item.title || 'Iuran', // Fallback to item.title for mock data
          due_date: (item as any).dues?.due_date || item.due_date // Map due_date from relation
        }
      })

      // Searching filter
      if (role !== 'warga' && filters?.search) {
        const searchLower = filters.search.toLowerCase()
        result = result.filter(item => 
          item.profiles?.full_name.toLowerCase().includes(searchLower) ||
          item.title.toLowerCase().includes(searchLower)
        )
      }

      return result
    } catch (err) {
      console.warn('Failed to query Supabase dues client-side, using simulated local state:', err)
      return getSimulatedDues(role, userId, filters)
    }
  },

  // 2. Client-side fetch individual due detail
  async getDueById(id: string) {
    const supabase = createClient()
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
            title,
            due_date
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
        title: (item as any).dues?.title || item.title || 'Iuran',
        due_date: (item as any).dues?.due_date || item.due_date
      }
    } catch (err) {
      console.warn('Failed to fetch due details client-side, using fallback details:', err)
      return getSimulatedDues('all', '').find(item => item.id === id) || null
    }
  },

  // 3. Upload Transfer Proof (executed client-side)
  async uploadPaymentProof(dueId: string, userId: string, file: File) {
    const supabase = createClient()
    
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${dueId}_${Date.now()}.${fileExt}`
      const filePath = `${userId}/${dueId}/${fileName}`

      // A. Upload receipt image to storage bucket
      const { error: uploadError } = await supabase.storage
        .from('payment-proofs')
        .upload(filePath, file, { cacheControl: '3600', upsert: true })

      if (uploadError) throw uploadError

      // B. Fetch public serving URL
      const { data: { publicUrl } } = supabase.storage
        .from('payment-proofs')
        .getPublicUrl(filePath)

      // C. Transition status inside DB to pending_verification
      const { error: dbError } = await supabase
        .from('due_payments')
        .update({
          status: 'pending_verification',
          proof_url: publicUrl,
          rejection_reason: null, // Clear any previous rejection
          updated_at: new Date().toISOString()
        })
        .eq('id', dueId)

      if (dbError) throw dbError

      // D. Insert notification for tracing
      try {
        await supabase.from('notifications').insert({
          profile_id: userId,
          title: 'Bukti Pembayaran Diunggah',
          message: `Bukti transfer untuk iuran Anda telah berhasil diunggah dan sedang dalam proses verifikasi.`,
          is_read: false
        })
      } catch (e) {
        console.warn('Silent notice: could not write notifications logs')
      }

      return { success: true, proofUrl: publicUrl }
    } catch (err: any) {
      console.error('Failed to complete upload workflow:', err)
      return { success: false, error: err.message || 'Gagal mengunggah bukti pembayaran.' }
    }
  },

  // 4. Client-side verification action (used in case client component triggers it directly)
  async verifyPayment(dueId: string, status: 'verified' | 'rejected', verifierId: string, rejectionReason?: string) {
    const supabase = createClient()
    
    try {
      const updateData: any = {
        status,
        verified_by: verifierId,
        verified_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      if (status === 'rejected' && rejectionReason) {
        updateData.rejection_reason = rejectionReason
      } else {
        updateData.rejection_reason = null
      }

      const { data: updatedDue, error: dbError } = await supabase
        .from('due_payments')
        .update(updateData)
        .eq('id', dueId)
        .select('profile_id, dues(title)')
        .single()

      if (dbError) throw dbError

      // Create a status change notification for the Warga
      if (updatedDue) {
        const title = status === 'verified' ? 'Iuran Berhasil Diverifikasi' : 'Pembayaran Iuran Ditolak'
        const message = status === 'verified' 
          ? `Pembayaran untuk iuran "${(updatedDue as any).dues?.title || 'Iuran'}" Anda telah berhasil disetujui oleh pengurus RT/RW.`
          : `Bukti transfer untuk "${(updatedDue as any).dues?.title || 'Iuran'}" Anda ditolak. Alasan: "${rejectionReason || 'Bukti kurang jelas'}"`
        
        try {
          await supabase.from('notifications').insert({
            profile_id: updatedDue.profile_id,
            title,
            message,
            is_read: false
          })
        } catch (notifErr) {
          console.warn('Failed to insert tracking notification:', notifErr)
        }
      }

      return { success: true }
    } catch (err: any) {
      console.error('Failed to verify payment:', err)
      return { success: false, error: err.message || 'Gagal mengubah status verifikasi.' }
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
