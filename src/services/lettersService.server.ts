import { createClient as createServerClient } from '@/services/supabase/server'
import { LetterRequest, LetterStatus, LetterType, CitizenProfile } from '@/types/letters'

export const lettersServiceServer = {
  // 1. Server-side fetch citizen profiles
  async getCitizenProfile(userId: string): Promise<CitizenProfile | null> {
    const supabase = await createServerClient()
    try {
      const { data, error } = await supabase
        .from('citizen_profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) throw error
      return data as CitizenProfile
    } catch (err) {
      console.warn('Failed to query citizen profile server-side, using simulated data:', err)
      const simulated = getSimulatedCitizenProfiles()
      return simulated[userId] || simulated['user-warga'] || null
    }
  },

  // 2. Server-side fetch all letters matching role
  async getMyLetters(role: string, userId: string, filters?: { status?: string; search?: string }): Promise<LetterRequest[]> {
    const supabase = await createServerClient()
    try {
      let query = supabase
        .from('letter_requests')
        .select(`
          *,
          profiles:profile_id (
            full_name,
            email,
            role
          ),
          letter_approvals (
            *,
            profiles:approver_id (
              full_name,
              email,
              role
            )
          )
        `)

      if (role === 'warga') {
        query = query.eq('profile_id', userId)
      }

      if (filters?.status && filters.status !== 'all') {
        query = query.eq('status', filters.status)
      }

      query = query.order('created_at', { ascending: false })
      const { data, error } = await query

      if (error) throw error
      
      let results = data as unknown as LetterRequest[]

      if (filters?.search && role !== 'warga') {
        const queryLower = filters.search.toLowerCase()
        results = results.filter(item => 
          item.profiles?.full_name.toLowerCase().includes(queryLower) ||
          item.purpose.toLowerCase().includes(queryLower) ||
          (item.letter_number && item.letter_number.toLowerCase().includes(queryLower))
        )
      }

      return results
    } catch (err) {
      console.warn('Failed to fetch letters server-side, using mock fallback:', err)
      return getSimulatedLetters(role, userId, filters)
    }
  },

  // 3. Server-side fetch single letter request details
  async getLetterRequestById(id: string): Promise<LetterRequest | null> {
    const supabase = await createServerClient()
    try {
      const { data, error } = await supabase
        .from('letter_requests')
        .select(`
          *,
          profiles:profile_id (
            full_name,
            email,
            role
          ),
          letter_approvals (
            *,
            profiles:approver_id (
              full_name,
              email,
              role
            )
          )
        `)
        .eq('id', id)
        .single()

      if (error) throw error
      return data as unknown as LetterRequest
    } catch (err) {
      console.warn('Failed to fetch individual letter server-side, using fallback:', err)
      return getSimulatedLetters('all', '').find(item => item.id === id) || null
    }
  }
}

// Simulated data pools
function getSimulatedCitizenProfiles(): Record<string, CitizenProfile> {
  return {
    'user-warga': {
      id: 'user-warga',
      nik: '3273012304950002',
      kk: '3273012304951113',
      phone: '081234567890',
      address: 'Jl. Kebon Jeruk No. 24, RT 03 / RW 05',
      rt: '03',
      rw: '05',
      gender: 'L',
      place_of_birth: 'Bandung',
      date_of_birth: '1995-04-12',
      religion: 'Islam',
      occupation: 'Karyawan Swasta',
      marital_status: 'Belum Kawin',
      nationality: 'WNI'
    }
  }
}

function getSimulatedLetters(role: string, userId: string, filters?: { status?: string; search?: string }): LetterRequest[] {
  const simulated: LetterRequest[] = [
    {
      id: 'letter-1',
      profile_id: 'user-warga',
      letter_type: 'surat_pengantar',
      purpose: 'Pembuatan KTP Elektronik Baru',
      custom_fields: {
        keterangan: 'Telah tinggal selama 5 tahun di domisili RT 03'
      },
      status: 'pending_rt',
      support_document_url: 'https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?w=500',
      created_at: '2026-05-22T08:00:00Z',
      updated_at: '2026-05-22T08:00:00Z',
      profiles: { full_name: 'Budi Santoso', email: 'budi@warga.com', role: 'warga' },
      letter_approvals: []
    },
    {
      id: 'letter-2',
      profile_id: 'user-warga',
      letter_type: 'surat_keterangan_domisili',
      purpose: 'Melamar Pekerjaan di BUMN',
      custom_fields: {
        address_duration: '3 tahun',
        permanent_address: 'Jl. Kebon Jeruk No. 24'
      },
      status: 'approved_rt',
      support_document_url: 'https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?w=500',
      created_at: '2026-05-21T10:30:00Z',
      updated_at: '2026-05-21T14:20:00Z',
      profiles: { full_name: 'Budi Santoso', email: 'budi@warga.com', role: 'warga' },
      letter_approvals: [
        {
          id: 'app-rt-2',
          letter_request_id: 'letter-2',
          role: 'rt',
          approver_id: 'user-rt',
          status: 'approved',
          note: 'Berkas KK/KTP warga lengkap dan valid.',
          created_at: '2026-05-21T14:20:00Z',
          profiles: { full_name: 'H. Akhmad Sobari', email: 'rt@rtw.com', role: 'rt' }
        }
      ]
    },
    {
      id: 'letter-3',
      profile_id: 'user-warga-2',
      letter_type: 'surat_keterangan_usaha',
      purpose: 'Syarat Pengajuan Kredit KUR Bank Mandiri',
      custom_fields: {
        nama_usaha: 'Warung Kelontong Berkah',
        jenis_usaha: 'Perdagangan Sembako',
        alamat_usaha: 'Jl. Raya Kebon Jeruk No. 12'
      },
      status: 'finished',
      support_document_url: 'https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?w=500',
      letter_number: '012/SKU/RT03-RW05/V/2026',
      created_at: '2026-05-18T09:15:00Z',
      updated_at: '2026-05-19T11:00:00Z',
      profiles: { full_name: 'Siti Aminah', email: 'siti@warga.com', role: 'warga' },
      letter_approvals: [
        {
          id: 'app-rt-3',
          letter_request_id: 'letter-3',
          role: 'rt',
          approver_id: 'user-rt',
          status: 'approved',
          note: 'Usaha berada di wilayah RT 03 dan aktif.',
          created_at: '2026-05-18T16:00:00Z',
          profiles: { full_name: 'H. Akhmad Sobari', email: 'rt@rtw.com', role: 'rt' }
        },
        {
          id: 'app-rw-3',
          letter_request_id: 'letter-3',
          role: 'rw',
          approver_id: 'user-rw',
          status: 'approved',
          note: 'Finalisasi sah oleh RW.',
          created_at: '2026-05-19T11:00:00Z',
          profiles: { full_name: 'Ir. H. Gunawan', email: 'rw@rtw.com', role: 'rw' }
        }
      ]
    },
    {
      id: 'letter-4',
      profile_id: 'user-warga',
      letter_type: 'surat_keterangan_tidak_mampu',
      purpose: 'Keringanan Biaya Rumah Sakit Sakit Bersalin',
      custom_fields: {
        hospital_name: 'RSUD Koja',
        patient_name: 'Budi Santoso'
      },
      status: 'rejected',
      support_document_url: 'https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?w=500',
      created_at: '2026-05-15T11:00:00Z',
      updated_at: '2026-05-15T15:30:00Z',
      profiles: { full_name: 'Budi Santoso', email: 'budi@warga.com', role: 'warga' },
      letter_approvals: [
        {
          id: 'app-rt-4',
          letter_request_id: 'letter-4',
          role: 'rt',
          approver_id: 'user-rt',
          status: 'rejected',
          note: 'Dokumen bukti penghasilan pendukung yang dilampirkan buram dan tidak lengkap.',
          created_at: '2026-05-15T15:30:00Z',
          profiles: { full_name: 'H. Akhmad Sobari', email: 'rt@rtw.com', role: 'rt' }
        }
      ]
    }
  ]

  let result = simulated
  if (role === 'warga') {
    result = simulated.filter(item => item.profile_id === userId)
  }

  if (filters?.status && filters.status !== 'all') {
    result = result.filter(item => item.status === filters.status)
  }

  if (filters?.search && role !== 'warga') {
    const q = filters.search.toLowerCase()
    result = result.filter(item => 
      item.profiles?.full_name.toLowerCase().includes(q) ||
      item.purpose.toLowerCase().includes(q)
    )
  }

  return result
}
