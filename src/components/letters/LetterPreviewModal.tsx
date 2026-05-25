import { X, ZoomIn, ExternalLink } from 'lucide-react'

interface LetterPreviewModalProps {
  url?: string
  isOpen: boolean
  onClose: () => void
}

export default function LetterPreviewModal({ url, isOpen, onClose }: LetterPreviewModalProps) {
  if (!isOpen || !url) return null

  const isPdf = url.toLowerCase().endsWith('.pdf')

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 bg-slate-900/90 backdrop-blur-sm z-50 flex items-center justify-center p-4 cursor-zoom-out animate-in fade-in transition-all"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative max-w-4xl w-full bg-white rounded-3xl overflow-hidden shadow-2xl p-5 space-y-4 cursor-default animate-in zoom-in-95 duration-200"
      >
        {/* Header bar */}
        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center">
            <ZoomIn className="w-4 h-4 mr-1 text-slate-400" />
            Pratinjau Dokumen Lampiran
          </h4>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content viewer */}
        <div className="w-full h-[60vh] bg-slate-50 border border-slate-100 rounded-2xl overflow-hidden flex items-center justify-center">
          {isPdf ? (
            <iframe src={url} className="w-full h-full" title="PDF preview" />
          ) : (
            <img src={url} alt="Dokumen lampiran" className="object-contain max-w-full max-h-full" />
          )}
        </div>

        {/* Action bar */}
        <div className="flex justify-end">
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-1.5 px-4.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-bold transition-all"
          >
            <span>Buka di Tab Baru</span>
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>
    </div>
  )
}
