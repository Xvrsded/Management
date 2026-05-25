import { createClient } from '@/services/supabase/client'
import { StorageBucket } from './buckets'
import { validateUpload } from './validate-upload'

export interface UploadResult {
  success: boolean
  url?: string
  error?: string
}

export const storageUtils = {
  /**
   * Safely generates a unique file name.
   */
  generateSafeFileName(file: File): string {
    const fileExt = file.name.split('.').pop()?.toLowerCase() || 'unknown'
    return `${crypto.randomUUID()}.${fileExt}`
  },

  /**
   * Universal upload handler
   * Handles validation, exact bucket targeting, and graceful error catching.
   */
  async uploadFile(
    bucket: StorageBucket,
    pathPrefix: string,
    file: File
  ): Promise<UploadResult> {
    // 1. Validation
    const validationError = validateUpload(file)
    if (validationError) {
      return { success: false, error: validationError }
    }

    const supabase = createClient()
    const fileName = this.generateSafeFileName(file)
    const filePath = `${pathPrefix}/${fileName}`

    try {
      // 2. Upload file
      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, { cacheControl: '3600', upsert: true })

      if (uploadError) {
        console.error('Storage Upload Error Detail:', uploadError)
        return { success: false, error: 'Gagal upload file (Masalah Jaringan/Storage)' }
      }

      // 3. Retrieve public URL
      const { data: publicUrlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath)
        
      if (!publicUrlData || !publicUrlData.publicUrl) {
        return { success: false, error: 'Gagal mengambil tautan file.' }
      }

      return { success: true, url: publicUrlData.publicUrl }
    } catch (err: any) {
      console.error('Storage Upload Exception:', err)
      return { success: false, error: 'Terjadi kesalahan sistem saat upload file' }
    }
  }
}
