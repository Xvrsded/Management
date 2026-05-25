import { createClient } from './supabase/client'
import { storageUtils } from '@/lib/storage/storage-utils'
import { STORAGE_BUCKETS } from '@/lib/storage/buckets'

export type ReportStatus = 'submitted' | 'reviewing' | 'in_progress' | 'resolved' | 'rejected'

export interface Report {
  id: string
  profile_id: string
  category: string
  title: string
  description: string
  status: ReportStatus
  photo_url?: string
  latitude?: number
  longitude?: number
  admin_notes?: string
  is_public: boolean
  resolved_by?: string
  resolved_at?: string
  created_at: string
  updated_at: string
  profiles?: {
    full_name: string
    avatar_url: string
  }
}

export const reportsService = {
  // Get all reports for a specific citizen (or public ones)
  async getCitizenReports(profileId: string): Promise<Report[]> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('reports')
      .select(`
        *,
        profiles:profile_id (full_name, avatar_url)
      `)
      .or(`profile_id.eq.${profileId},is_public.eq.true`)
      .order('created_at', { ascending: false })

    if (error) throw new Error(error.message)
    return data as Report[]
  },

  // Get all reports for Admin/RT/RW
  async getAllReports(): Promise<Report[]> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('reports')
      .select(`
        *,
        profiles:profile_id (full_name, avatar_url)
      `)
      .order('created_at', { ascending: false })

    if (error) throw new Error(error.message)
    return data as Report[]
  },

  // Create a new report
  async createReport(
    profileId: string,
    payload: {
      category: string
      title: string
      description: string
      latitude?: number
      longitude?: number
      is_public?: boolean
    },
    photoFile?: File
  ): Promise<{ success: boolean; data?: Report; error?: string }> {
    const supabase = createClient()

    try {
      let photo_url = null

      // Upload photo if exists
      if (photoFile) {
        const uploadRes = await storageUtils.uploadFile(
          STORAGE_BUCKETS.REPORT_IMAGES,
          `${profileId}/reports`,
          photoFile
        )

        if (!uploadRes.success || !uploadRes.url) {
          throw new Error(uploadRes.error || 'Gagal mengunggah gambar keluhan')
        }

        photo_url = uploadRes.url
      }

      const { data, error } = await supabase
        .from('reports')
        .insert({
          profile_id: profileId,
          category: payload.category,
          title: payload.title,
          description: payload.description,
          latitude: payload.latitude,
          longitude: payload.longitude,
          photo_url,
          is_public: payload.is_public || false
        })
        .select()
        .single()

      if (error) throw error

      // Log activity
      await supabase.from('activity_logs').insert({
        profile_id: profileId,
        action: 'Laporan Masuk',
        description: `Warga membuat laporan baru: ${payload.title}`
      })

      return { success: true, data: data as Report }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  },

  // Update report status (Admin)
  async updateStatus(
    reportId: string,
    adminId: string,
    status: ReportStatus,
    notes?: string
  ): Promise<{ success: boolean; error?: string }> {
    const supabase = createClient()
    try {
      const updateData: any = { status, admin_notes: notes }
      if (status === 'resolved') {
        updateData.resolved_by = adminId
        updateData.resolved_at = new Date().toISOString()
      }

      const { error } = await supabase
        .from('reports')
        .update(updateData)
        .eq('id', reportId)

      if (error) throw error

      // Add to timeline
      await supabase.from('report_timeline').insert({
        report_id: reportId,
        profile_id: adminId,
        action: `Status diubah menjadi: ${status}`,
        notes: notes
      })

      // Send notification via API trigger (usually handled by edge function or separate logic)
      // We will do a direct DB insert for notifications here to keep it lightweight
      const { data: report } = await supabase.from('reports').select('profile_id, title').eq('id', reportId).single()
      if (report) {
         await supabase.from('notifications').insert({
           profile_id: report.profile_id,
           title: 'Status Laporan Diperbarui',
           message: `Laporan "${report.title}" kini berstatus: ${status}.`,
           type: status === 'resolved' ? 'success' : 'info',
           link_url: '/laporan'
         })
      }

      return { success: true }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  }
}
