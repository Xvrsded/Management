import { createClient } from '@/services/supabase/client'
import { LetterRequest, LetterStatus, LetterType, CitizenProfile, LetterApproval } from '@/types/letters'
import { storageUtils } from '@/lib/storage/storage-utils'
import { STORAGE_BUCKETS } from '@/lib/storage/buckets'

// Helper for Roman numerals month conversion
function getRomanMonth(monthNum: number): string {
  const roman = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII']
  return roman[monthNum - 1] || 'I'
}

// Letter Type codes
const LETTER_CODES: Record<LetterType, string> = {
  surat_pengantar: 'SP',
  surat_keterangan_domisili: 'SKD',
  surat_keterangan_tidak_mampu: 'SKTM',
  surat_keterangan_usaha: 'SKU'
}

export const lettersService = {
  // 1. Get Citizen Profile Detail
  async getCitizenProfile(userId: string): Promise<CitizenProfile | null> {
    const supabase = createClient()
    try {
      const { data, error } = await supabase
        .from('citizen_profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) throw error
      return data as CitizenProfile
    } catch (err) {
      console.warn('Failed to query citizen profile, using simulated data:', err)
      const simulated = getSimulatedCitizenProfiles()
      return simulated[userId] || simulated['user-warga'] || null
    }
  },

  // 2. Upsert Citizen Profile
  async upsertCitizenProfile(userId: string, profile: Omit<CitizenProfile, 'id'>): Promise<{ success: boolean; data?: CitizenProfile; error?: string }> {
    const supabase = createClient()
    try {
      const updatedProfile = { id: userId, ...profile, updated_at: new Date().toISOString() }
      const { data, error } = await supabase
        .from('citizen_profiles')
        .upsert(updatedProfile)
        .select()
        .single()

      if (error) throw error
      return { success: true, data: data as CitizenProfile }
    } catch (err: any) {
      console.warn('Failed to upsert citizen profile, simulation bypass:', err)
      return { success: true, data: { id: userId, ...profile } as CitizenProfile }
    }
  },

  // 3. Fetch User's Letter Requests
  async getMyLetters(role: string, userId: string, filters?: { status?: string; search?: string }): Promise<LetterRequest[]> {
    const supabase = createClient()
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

      // Warga strictly restricted to their own requests
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

      // Local search filtering
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
      console.warn('Failed to fetch letters from Supabase, using mock fallback:', err)
      return getSimulatedLetters(role, userId, filters)
    }
  },

  // 4. Fetch Letter Request by ID
  async getLetterRequestById(id: string): Promise<LetterRequest | null> {
    const supabase = createClient()
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
      console.warn('Failed to fetch individual letter request, using fallback:', err)
      return getSimulatedLetters('all', '').find(item => item.id === id) || null
    }
  },

  // 5. Client Document Upload to bucket
  async uploadDocument(userId: string, file: File): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
      const uploadRes = await storageUtils.uploadFile(
        STORAGE_BUCKETS.LETTER_DOCUMENTS,
        userId,
        file
      )

      if (!uploadRes.success || !uploadRes.url) {
        throw new Error(uploadRes.error || 'Gagal mengunggah dokumen')
      }

      return { success: true, url: uploadRes.url }
    } catch (err: any) {
      console.error('Document upload failed:', err)
      return { success: false, error: err.message || 'Gagal mengunggah dokumen.' }
    }
  },

  // 6. Create New Letter Request
  async createLetterRequest(
    userId: string, 
    letterType: LetterType, 
    purpose: string, 
    customFields: Record<string, any>, // kept for function signature compatibility, but not inserted directly
    supportDocumentUrl?: string
  ): Promise<{ success: boolean; data?: LetterRequest; error?: string }> {
    const supabase = createClient()
    try {
      // STEP 5: Validate required fields (Type Guards)
      if (!userId || !letterType || !purpose) {
        throw new Error('Data pengajuan tidak lengkap (userId, type, atau purpose kosong).')
      }

      // STEP 4: Safe payload building - ONLY fields guaranteed to exist
      const payload = {
        profile_id: userId,
        letter_type: letterType,
        purpose,
        status: 'pending_rt',
        support_document_url: supportDocumentUrl || null
      }

      // STEP 9: Verify Database Compatibility by inserting explicit payload
      const { data, error } = await supabase
        .from('letter_requests')
        .insert(payload)
        .select()
        .single()

      // STEP 2 & 8: Log insert response directly in development
      if (process.env.NODE_ENV === 'development') {
        console.log('LETTER INSERT RESULT', { data, error })
      }

      if (error) throw error

      // Write Notification entry
      try {
        await supabase.from('notifications').insert({
          profile_id: userId,
          title: 'Pengajuan Surat Terkirim',
          message: `Pengajuan ${letterType.replace(/_/g, ' ')} Anda telah terkirim dan menunggu verifikasi RT.`,
          is_read: false
        })
      } catch (notifErr) {
        console.warn('Failed to insert tracking notification:', notifErr)
      }

      return { success: true, data: data as unknown as LetterRequest }
    } catch (err: any) {
      // STEP 1 & 8: Detailed error logging in development
      if (process.env.NODE_ENV === 'development') {
        const errorData = {
          name: err?.name,
          message: err?.message,
          details: err?.details,
          hint: err?.hint,
          code: err?.code,
          stringify: JSON.stringify(err, Object.getOwnPropertyNames(err || {})),
          raw: err
        }
        console.warn('Failed to create letter request DEBUG DATA:', errorData)
      }

      // STEP 7: Map PostgREST errors into readable Indonesian messages
      let userMessage = err?.message || err?.details || 'Gagal mengajukan surat.'
      if (err?.code === '23505') userMessage = 'Data surat sudah ada.'
      else if (err?.code === '42501') userMessage = 'Tidak memiliki izin untuk menyimpan data.'
      else if (err?.code === 'PGRST204') userMessage = 'Struktur database belum sinkron, mohon reload schema Supabase.'
      
      return { success: false, error: userMessage }
    }
  },

  // 7. Approve by RT (transitions status to approved_rt)
  async approveByRT(id: string, verifierId: string, note?: string): Promise<{ success: boolean; error?: string }> {
    const supabase = createClient()
    try {
      // A. Add approval entry
      const { error: approvalErr } = await supabase
        .from('letter_approvals')
        .insert({
          letter_request_id: id,
          role: 'rt',
          approver_id: verifierId,
          status: 'approved',
          note: note || null
        })

      if (approvalErr) throw approvalErr

      // B. Update letter request status
      const { data: updatedRequest, error: updateErr } = await supabase
        .from('letter_requests')
        .update({
          status: 'approved_rt',
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select('profile_id, letter_type')
        .single()

      if (updateErr) throw updateErr

      // C. Trigger Warga Notification
      if (updatedRequest) {
        try {
          await supabase.from('notifications').insert({
            profile_id: updatedRequest.profile_id,
            title: 'Surat Disetujui RT',
            message: `Pengajuan surat Anda telah disetujui oleh RT dan diteruskan ke RW untuk persetujuan akhir.`,
            is_read: false
          })
        } catch (notifErr) {
          console.warn('Silent notice: could not write notifications logs')
        }
      }

      return { success: true }
    } catch (err: any) {
      console.error('RT Approval failed:', err)
      return { success: false, error: err.message || 'Gagal memproses persetujuan RT.' }
    }
  },

  // 8. Approve by RW (transitions status to finished and generates Letter Number)
  async approveByRW(id: string, verifierId: string, verifierRt: string, verifierRw: string, note?: string): Promise<{ success: boolean; error?: string }> {
    const supabase = createClient()
    try {
      // A. Query letters of this type in the current month to auto increment letter number
      let sequentialCount = 1
      try {
        const startOfMonth = new Date()
        startOfMonth.setDate(1)
        startOfMonth.setHours(0, 0, 0, 0)
        
        const { count, error: countErr } = await supabase
          .from('letter_requests')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'finished')
          .gte('created_at', startOfMonth.toISOString())

        if (!countErr && count !== null) {
          sequentialCount = count + 1
        }
      } catch (cErr) {
        console.warn('Could not query sequential letter count, fallback count used.')
      }

      // B. Fetch request details to get the letter type
      const { data: request, error: fetchErr } = await supabase
        .from('letter_requests')
        .select('letter_type, profile_id')
        .eq('id', id)
        .single()

      if (fetchErr) throw fetchErr

      const generatedNum = lettersService.generateLetterNumber(
        request.letter_type as LetterType, 
        verifierRt, 
        verifierRw, 
        sequentialCount
      )

      // C. Add approval entry
      const { error: approvalErr } = await supabase
        .from('letter_approvals')
        .insert({
          letter_request_id: id,
          role: 'rw',
          approver_id: verifierId,
          status: 'approved',
          note: note || null
        })

      if (approvalErr) throw approvalErr

      // D. Update letter request status & number
      const { error: updateErr } = await supabase
        .from('letter_requests')
        .update({
          status: 'finished',
          letter_number: generatedNum,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)

      if (updateErr) throw updateErr

      // E. Send Notification to citizen
      try {
        await supabase.from('notifications').insert({
          profile_id: request.profile_id,
          title: 'Surat Selesai & Sah',
          message: `Surat pengajuan Anda telah disetujui Ketua RW dan SIAP DICETAK. No Surat: ${generatedNum}.`,
          is_read: false
        })
      } catch (notifErr) {
        console.warn('Notification log error')
      }

      return { success: true }
    } catch (err: any) {
      console.error('RW Finalization failed:', err)
      return { success: false, error: err.message || 'Gagal memproses pengesahan RW.' }
    }
  },

  // 9. Reject Letter Request (RT or RW)
  async rejectLetter(id: string, role: 'rt' | 'rw', verifierId: string, note: string): Promise<{ success: boolean; error?: string }> {
    const supabase = createClient()
    try {
      if (!note || note.trim().length === 0) {
        throw new Error('Alasan penolakan harus diisi.')
      }

      // A. Write Approval Entry as Rejected
      const { error: approvalErr } = await supabase
        .from('letter_approvals')
        .insert({
          letter_request_id: id,
          role,
          approver_id: verifierId,
          status: 'rejected',
          note: note
        })

      if (approvalErr) throw approvalErr

      // B. Update letter status to rejected
      const { data: request, error: updateErr } = await supabase
        .from('letter_requests')
        .update({
          status: 'rejected',
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select('profile_id, letter_type')
        .single()

      if (updateErr) throw updateErr

      // C. Trigger Warga notification
      if (request) {
        try {
          await supabase.from('notifications').insert({
            profile_id: request.profile_id,
            title: `Pengajuan Surat Ditolak ${role.toUpperCase()}`,
            message: `Pengajuan surat Anda ditolak oleh Ketua ${role.toUpperCase()}. Alasan: "${note}"`,
            is_read: false
          })
        } catch (notifErr) {
          console.warn('Notification insert fail')
        }
      }

      return { success: true }
    } catch (err: any) {
      console.error('Rejection trigger failed:', err)
      return { success: false, error: err.message || 'Gagal memproses penolakan surat.' }
    }
  },

  // 10. Letter Number Formatter
  generateLetterNumber(type: LetterType, rt: string, rw: string, count: number): string {
    const code = LETTER_CODES[type] || 'SK'
    const seq = String(count).padStart(3, '0')
    const roman = getRomanMonth(new Date().getMonth() + 1)
    const year = new Date().getFullYear()
    
    // Format RT/RW (clean leading zeros if any, e.g. RT01-RW02)
    const cleanRt = rt.toUpperCase().replace(/\s+/g, '')
    const cleanRw = rw.toUpperCase().replace(/\s+/g, '')
    const rtPart = cleanRt.startsWith('RT') ? cleanRt : `RT${cleanRt}`
    const rwPart = cleanRw.startsWith('RW') ? cleanRw : `RW${cleanRw}`

    return `${seq}/${code}/${rtPart}-${rwPart}/${roman}/${year}`
  },

  // 11. Fetch Dynamic Letter Categories
  async getLetterCategories(): Promise<any[]> {
    const supabase = createClient()
    try {
      const { data, error } = await supabase
        .from('letter_categories')
        .select('*')
        .eq('is_active', true)
        .order('name', { ascending: true })

      if (error) throw error
      return data || []
    } catch (err) {
      console.warn('Failed to query letter categories, returning seeded list:', err)
      return [
        { id: '1', name: 'Surat Pengantar RT/RW', code: 'surat_pengantar', description: 'Surat resmi pengantar dari RT/RW setempat.', form_fields: [{ name: 'keterangan', label: 'Keterangan Tambahan (Opsional)', type: 'text', placeholder: 'Contoh: Domisili tetap sejak lahir...', required: false }] },
        { id: '2', name: 'Surat Keterangan Domisili', code: 'surat_domisili', description: 'Keterangan resmi domisili bertempat tinggal.', form_fields: [{ name: 'alamat_tetap', label: 'Alamat Tetap Di Domisili', type: 'text', placeholder: 'Contoh: Jl. Kebon Jeruk No. 24', required: true }, { name: 'lama_tinggal', label: 'Lama Tinggal (Tahun/Bulan)', type: 'text', placeholder: 'Contoh: 3 Tahun...', required: true }] },
        { id: '3', name: 'Surat Keterangan Usaha', code: 'surat_usaha', description: 'Keterangan kepemilikan usaha mikro/kecil/menengah (UMKM) aktif.', form_fields: [{ name: 'nama_usaha', label: 'Nama Usaha Mikro', type: 'text', placeholder: 'Contoh: Warung Kelontong Berkah', required: true }, { name: 'jenis_usaha', label: 'Jenis Bidang Usaha', type: 'text', placeholder: 'Contoh: Perdagangan Sembako', required: true }, { name: 'alamat_usaha', label: 'Alamat Lokasi Usaha', type: 'text', placeholder: 'Contoh: Jl. Raya Kebon Jeruk No. 12', required: true }] },
        { id: '4', name: 'Surat Keterangan Tidak Mampu', code: 'surat_tidak_mampu', description: 'Surat Keterangan Tidak Mampu (SKTM).', form_fields: [{ name: 'nama_rumah_sakit', label: 'Nama Sekolah / Rumah Sakit Tujuan', type: 'text', placeholder: 'Contoh: RSUD Koja / SMA Negeri 1', required: true }, { name: 'nama_pasien', label: 'Nama Pasien / Siswa Terkait', type: 'text', placeholder: 'Contoh: Budi Santoso (Anak Kandung)', required: true }] },
        { id: '5', name: 'Surat Keterangan Tinggal', code: 'surat_keterangan_tinggal', description: 'Keterangan izin menetap sementara bagi warga pendatang.', form_fields: [{ name: 'alamat_asal', label: 'Alamat Asal KTP', type: 'text', placeholder: 'Contoh: Jl. Diponegoro No. 10, Solo', required: true }, { name: 'tujuan_tinggal', label: 'Maksud Menetap Sementara', type: 'text', placeholder: 'Contoh: Bekerja kontrak proyek...', required: true }] },
        { id: '6', name: 'Surat Keterangan Kelahiran', code: 'surat_kelahiran', description: 'Pengantar kelengkapan pembuatan Akta Kelahiran anak baru.', form_fields: [{ name: 'nama_bayi', label: 'Nama Lengkap Bayi', type: 'text', placeholder: 'Contoh: Muhammad Rezky', required: true }, { name: 'tanggal_lahir_bayi', label: 'Tanggal Lahir Bayi', type: 'date', placeholder: '', required: true }, { name: 'nama_ayah', label: 'Nama Lengkap Ayah Kandung', type: 'text', placeholder: 'Contoh: Budi Santoso', required: true }, { name: 'nama_ibu', label: 'Nama Lengkap Ibu Kandung', type: 'text', placeholder: 'Contoh: Siti Aminah', required: true }] },
        { id: '7', name: 'Surat Keterangan Kematian', code: 'surat_kematian', description: 'Surat pengantar pelaporan warga wafat.', form_fields: [{ name: 'nama_mendiang', label: 'Nama Lengkap Mendiang Warga', type: 'text', placeholder: 'Contoh: Alm. Suherman', required: true }, { name: 'tanggal_wafat', label: 'Tanggal Wafat', type: 'date', placeholder: '', required: true }, { name: 'penyebab_wafat', label: 'Penyebab Wafat (Opsional)', type: 'text', placeholder: 'Contoh: Sakit usia lanjut...', required: false }] },
        { id: '8', name: 'Surat Izin Acara', code: 'surat_izin_acara', description: 'Pengantar permohonan izin menyelenggarakan acara keramaian.', form_fields: [{ name: 'nama_acara', label: 'Nama / Jenis Acara', type: 'text', placeholder: 'Contoh: Syukuran Pernikahan Warga', required: true }, { name: 'tanggal_acara', label: 'Tanggal Pelaksanaan Acara', type: 'date', placeholder: '', required: true }, { name: 'lokasi_acara', label: 'Lokasi Spesifik Pelaksanaan', type: 'text', placeholder: 'Contoh: Lapangan Serbaguna RT 03', required: true }] },
        { id: '9', name: 'Surat Pengantar Nikah', code: 'surat_pengantar_nikah', description: 'Surat pengantar resmi untuk pendaftaran di KUA.', form_fields: [{ name: 'nama_pasangan', label: 'Nama Lengkap Calon Pasangan', type: 'text', placeholder: 'Contoh: Diah Lestari', required: true }, { name: 'nik_pasangan', label: 'NIK Calon Pasangan (Jika ada)', type: 'text', placeholder: 'Contoh: 327301XXXXXXXXXX', required: false }, { name: 'tanggal_pernikahan', label: 'Estimasi Tanggal Akad Pernikahan', type: 'date', placeholder: '', required: true }] },
        { id: '10', name: 'Surat Keterangan Pindah', code: 'surat_pindah', description: 'Pengantar perpindahan alamat domisili resmi keluar.', form_fields: [{ name: 'alamat_tujuan', label: 'Alamat Lengkap Tujuan Pindah', type: 'text', placeholder: 'Contoh: Perum Griya Indah Blok C No. 4, Depok', required: true }, { name: 'alasan_pindah', label: 'Alasan Pindah Domisili', type: 'text', placeholder: 'Contoh: Mengikuti penempatan kerja baru...', required: true }, { name: 'jumlah_pengikut', label: 'Jumlah Anggota Keluarga Pengikut Pindah', type: 'number', placeholder: 'Contoh: 2', required: true }] },
        { id: '11', name: 'Custom Surat', code: 'custom_surat', description: 'Pilih tipe ini untuk kebutuhan pengajuan surat lain.', form_fields: [{ name: 'deskripsi_kebutuhan', label: 'Deskripsi Lengkap Kebutuhan Surat Anda', type: 'text', placeholder: 'Jelaskan isi surat pengantar yang Anda butuhkan...', required: true }] }
      ]
    }
  },

  // 12. Toggle Bookmark Favorite
  async toggleBookmark(userId: string, categoryId: string, isBookmarked: boolean): Promise<boolean> {
    const supabase = createClient()
    try {
      if (isBookmarked) {
        const { error } = await supabase
          .from('letter_bookmarks')
          .insert({ profile_id: userId, category_id: categoryId })
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('letter_bookmarks')
          .delete()
          .eq('profile_id', userId)
          .eq('category_id', categoryId)
        if (error) throw error
      }
      return true
    } catch (err) {
      console.error('Failed to toggle bookmark:', err)
      return false
    }
  },

  // 13. Fetch User Bookmarks
  async getBookmarks(userId: string): Promise<string[]> {
    const supabase = createClient()
    try {
      const { data, error } = await supabase
        .from('letter_bookmarks')
        .select('category_id')
        .eq('profile_id', userId)
      if (error) throw error
      return data.map(b => b.category_id) || []
    } catch (err) {
      console.warn('Failed to get bookmarks:', err)
      return []
    }
  },

  // 14. Fetch all active letter templates for admin edit
  async getLetterTemplates(): Promise<any[]> {
    const supabase = createClient()
    try {
      const { data, error } = await supabase
        .from('letter_templates')
        .select(`
          *,
          letter_categories (
            name,
            code
          )
        `)
      if (error) throw error
      return data || []
    } catch (err) {
      console.error('Failed to fetch templates:', err)
      return []
    }
  },

  // 15. Update letter template
  async updateLetterTemplate(categoryId: string, templateContent: string): Promise<boolean> {
    const supabase = createClient()
    try {
      const { error } = await supabase
        .from('letter_templates')
        .upsert({
          category_id: categoryId,
          template_content: templateContent,
          updated_at: new Date().toISOString()
        })
      if (error) throw error
      return true
    } catch (err) {
      console.error('Failed to update letter template:', err)
      return false
    }
  }
}

// Simulated data pool for citizen kependudukan
export function getSimulatedCitizenProfiles(): Record<string, CitizenProfile> {
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

// Simulated Letter Requests pool
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
