import { LetterRequest } from '@/types/letters'
import LetterStatusBadge from './LetterStatusBadge'
import { FileText, Calendar, ChevronRight, Hash, User } from 'lucide-react'
import Link from 'next/link'

interface LetterCardProps {
  letter: LetterRequest
  currentRole: string
}

const TYPE_LABELS: Record<string, string> = {
  surat_pengantar: 'Surat Pengantar RT/RW',
  surat_keterangan_domisili: 'Surat Keterangan Domisili',
  surat_keterangan_tidak_mampu: 'Surat Keterangan Tidak Mampu (SKTM)',
  surat_keterangan_usaha: 'Surat Keterangan Usaha (SKU)'
}

export default function LetterCard({ letter, currentRole }: LetterCardProps) {
  const label = TYPE_LABELS[letter.letter_type] || letter.letter_type
  
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  return (
    <Link
      href={`/surat/${letter.id}`}
      className="block bg-white rounded-3xl border border-slate-100 p-5 shadow-sm hover:border-primary/20 hover:shadow-md transition-all active:scale-[0.99]"
    >
      <div className="flex flex-col space-y-4">
        {/* Header: Badge & Date */}
        <div className="flex justify-between items-start gap-2 flex-wrap">
          <LetterStatusBadge status={letter.status} />
          <span className="text-[9px] font-bold text-slate-400 flex items-center uppercase tracking-wide">
            <Calendar className="w-3.5 h-3.5 mr-1" />
            {formatDate(letter.created_at)}
          </span>
        </div>

        {/* Info */}
        <div className="space-y-1.5 min-w-0">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-primary flex-shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-black text-slate-800 truncate leading-snug">
              {label}
            </h3>
          </div>
          
          <p className="text-xs font-semibold text-slate-500 line-clamp-2 pl-9">
            Keperluan: {letter.purpose}
          </p>
        </div>

        {/* Bottom meta details */}
        <div className="pt-3 border-t border-slate-50 flex items-center justify-between text-2xs font-semibold text-slate-400 pl-1">
          {/* If RT/RW, show the citizens name */}
          {currentRole !== 'warga' && letter.profiles ? (
            <span className="flex items-center text-slate-500 font-bold max-w-[180px] truncate">
              <User className="w-3.5 h-3.5 mr-1 text-slate-400" />
              {letter.profiles.full_name}
            </span>
          ) : letter.letter_number ? (
            <span className="flex items-center text-primary font-bold">
              <Hash className="w-3.5 h-3.5 mr-0.5" />
              {letter.letter_number.split('/')[0]}/{letter.letter_number.split('/')[1]}
            </span>
          ) : (
            <span className="text-slate-400">Belum ada nomor surat</span>
          )}

          <span className="text-primary font-bold flex items-center text-[9px] uppercase tracking-wider">
            Detail <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
          </span>
        </div>
      </div>
    </Link>
  )
}
