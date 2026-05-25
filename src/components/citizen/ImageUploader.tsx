'use client'

import React, { useState, useRef } from 'react'
import { UploadCloud, Image as ImageIcon, CheckCircle2, Loader2, X } from 'lucide-react'
import { createClient } from '@/services/supabase/client'
import { storageUtils } from '@/lib/storage/storage-utils'
import { validateUpload } from '@/lib/storage/validate-upload'
import { StorageBucket } from '@/lib/storage/buckets'

interface ImageUploaderProps {
  label: string
  onUploadSuccess: (url: string) => void
  onUploadError?: (error: string) => void
  bucketName: StorageBucket
  pathPrefix?: string
}

export default function ImageUploader({ 
  label, 
  onUploadSuccess, 
  onUploadError,
  bucketName,
  pathPrefix = 'uploads'
}: ImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const validationError = validateUpload(file)
    if (validationError) {
      if (onUploadError) onUploadError(validationError)
      return
    }

    try {
      setIsUploading(true)
      
      // Setup temporary local preview (lightweight)
      const objectUrl = URL.createObjectURL(file)
      setPreviewUrl(objectUrl)

      // Get user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Sesi tidak valid')

      // Upload via unified utility
      const uploadRes = await storageUtils.uploadFile(
        bucketName,
        `${user.id}/${pathPrefix}`,
        file
      )

      if (!uploadRes.success || !uploadRes.url) {
        throw new Error(uploadRes.error || 'Gagal mengunggah gambar.')
      }

      onUploadSuccess(uploadRes.url)
    } catch (err: any) {

      console.error('Upload Error:', err)
      setPreviewUrl(null)
      if (onUploadError) onUploadError(err.message || 'Gagal mengunggah gambar.')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium text-slate-700">{label}</label>
      <div 
        className={`relative border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center text-center transition-colors
          ${previewUrl ? 'border-emerald-500 bg-emerald-50/50' : 'border-slate-300 hover:border-blue-500 hover:bg-blue-50/50'}
        `}
        onClick={() => !isUploading && fileInputRef.current?.click()}
      >
        <input 
          type="file" 
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/jpeg, image/png, image/webp"
          className="hidden" 
        />
        
        {isUploading ? (
          <div className="flex flex-col items-center py-4">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-2" />
            <p className="text-sm text-slate-500">Memproses & Mengunggah...</p>
          </div>
        ) : previewUrl ? (
          <div className="w-full flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-slate-100 overflow-hidden flex-shrink-0">
                <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
              </div>
              <div className="text-left flex flex-col">
                <span className="text-sm font-semibold text-slate-700 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  Berhasil diunggah
                </span>
                <span className="text-xs text-slate-500">Klik untuk mengubah foto</span>
              </div>
            </div>
            <button 
              type="button"
              className="p-2 text-slate-400 hover:text-red-500 transition-colors"
              onClick={(e) => {
                e.stopPropagation()
                setPreviewUrl(null)
                // Need to notify parent that upload is cleared
                onUploadSuccess('') 
                if (fileInputRef.current) fileInputRef.current.value = ''
              }}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center py-4 cursor-pointer">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-3">
              <UploadCloud className="w-6 h-6 text-blue-600" />
            </div>
            <p className="text-sm font-medium text-slate-700">Tap untuk upload</p>
            <p className="text-xs text-slate-500 mt-1">JPG, PNG, WEBP, PDF (Max 5MB)</p>
          </div>
        )}
      </div>
    </div>
  )
}
