import { useState, useRef } from 'react'
import { Upload, X, FileText, Image as ImageIcon, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'

interface LetterUploadZoneProps {
  onFileSelected: (file: File | null) => void
  selectedFile: File | null
}

export default function LetterUploadZone({ onFileSelected, selectedFile }: LetterUploadZoneProps) {
  const [isDragActive, setIsDragActive] = useState<boolean>(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFile = (file: File) => {
    // 1. Size Validation < 5MB
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Gagal: Ukuran file melebihi batas maksimal 5MB.')
      return
    }

    // 2. Format Validation
    const allowedExts = ['pdf', 'png', 'jpg', 'jpeg']
    const fileExt = file.name.split('.').pop()?.toLowerCase() || ''
    if (!allowedExts.includes(fileExt)) {
      toast.error('Gagal: Format file tidak didukung. Gunakan PDF, PNG, JPG, atau JPEG.')
      return
    }

    onFileSelected(file)

    // Generate Preview if Image
    if (['png', 'jpg', 'jpeg'].includes(fileExt)) {
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
    } else {
      setPreviewUrl(null)
    }

    toast.success(`Dokumen "${file.name}" berhasil dipilih!`)
  }

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragActive(true)
  }

  const onDragLeave = () => {
    setIsDragActive(false)
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0])
    }
  }

  const onFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0])
    }
  }

  const clearFile = () => {
    onFileSelected(null)
    setPreviewUrl(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="space-y-3.5">
      <label className="text-2xs font-bold text-slate-400 uppercase tracking-wider block">
        Dokumen Pendukung (KK/KTP Scan/Keterangan)
      </label>

      {selectedFile ? (
        // Selected File Card View
        <div className="bg-slate-50 border border-slate-200 rounded-3xl p-4 flex items-center justify-between space-x-3 transition-all animate-in fade-in slide-in-from-bottom-2">
          <div className="flex items-center space-x-3 min-w-0">
            {previewUrl ? (
              <div className="w-12 h-12 rounded-xl overflow-hidden border border-slate-200 bg-white flex-shrink-0">
                <img src={previewUrl} alt="File preview" className="object-cover w-full h-full" />
              </div>
            ) : (
              <div className="w-12 h-12 rounded-xl bg-primary/5 border border-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                <FileText className="w-5 h-5" />
              </div>
            )}

            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-700 truncate leading-snug">
                {selectedFile.name}
              </p>
              <p className="text-3xs font-semibold text-slate-400 mt-0.5">
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB • {selectedFile.name.split('.').pop()?.toUpperCase()}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={clearFile}
            className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-rose-500 hover:border-rose-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        // Unselected Interactive Drop Area
        <div
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-3xl p-7 text-center cursor-pointer transition-all flex flex-col items-center justify-center space-y-3 min-h-[140px] ${
            isDragActive 
              ? 'border-primary bg-primary/5 text-primary scale-[1.01]' 
              : 'border-slate-200 bg-white hover:border-primary/40 hover:bg-slate-50/50 text-slate-400'
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={onFileInputChange}
            accept=".pdf,.png,.jpg,.jpeg"
            className="hidden"
          />

          <div className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-colors ${
            isDragActive ? 'bg-primary/10 text-primary' : 'bg-slate-50 border border-slate-100 text-slate-400'
          }`}>
            <Upload className="w-5 h-5" />
          </div>

          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-700">Tarik berkas ke sini atau klik</p>
            <p className="text-3xs font-semibold text-slate-400">
              Mendukung PDF, PNG, JPG, JPEG (Maks. 5MB)
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
