import { Inbox, FileText } from 'lucide-react'
import Link from 'next/link'

interface LetterEmptyStateProps {
  isWarga: boolean
}

export default function LetterEmptyState({ isWarga }: LetterEmptyStateProps) {
  return (
    <div className="bg-white border border-slate-100 rounded-3xl p-10 text-center flex flex-col items-center justify-center space-y-4 shadow-sm">
      <div className="w-14 h-14 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center text-slate-400">
        <Inbox className="w-7 h-7" />
      </div>

      <div className="space-y-1.5 max-w-sm">
        <h3 className="text-sm font-black text-slate-700">Belum Ada Pengajuan Surat</h3>
        <p className="text-xs font-semibold text-slate-400 leading-relaxed">
          {isWarga
            ? 'Anda belum memiliki riwayat pengajuan surat resmi. Buat surat baru untuk memulai proses surat menyurat.'
            : 'Saat ini belum ada warga yang mengajukan permohonan surat menyurat di wilayah Anda.'}
        </p>
      </div>

      {isWarga && (
        <Link
          href="/surat/buat"
          className="flex items-center space-x-1.5 px-5 py-3 rounded-2xl bg-primary hover:bg-primary/95 text-white font-black text-xs shadow-sm transition-all hover:translate-y-[-1px] active:translate-y-[0px]"
        >
          <FileText className="w-4 h-4" />
          <span>Buat Pengajuan Surat</span>
        </Link>
      )}
    </div>
  )
}
