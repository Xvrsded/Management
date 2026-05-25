import { LetterRequest, LetterApproval } from '@/types/letters'
import { Check, Clock, X, FileText, User, Tag } from 'lucide-react'

interface LetterTimelineProps {
  letter: LetterRequest
}

export default function LetterTimeline({ letter }: LetterTimelineProps) {
  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const rtApproval = letter.letter_approvals?.find(a => a.role === 'rt')
  const rwApproval = letter.letter_approvals?.find(a => a.role === 'rw')

  const isRejected = letter.status === 'rejected'
  const isFinished = letter.status === 'finished'

  return (
    <div className="bg-white rounded-3xl border border-slate-100 p-5 shadow-sm space-y-5">
      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Linimasa Persetujuan</h4>
      
      <div className="relative border-l border-slate-100 pl-6 ml-2.5 space-y-6 py-1">
        {/* Step 1: Created */}
        <div className="relative">
          <span className="absolute -left-[31px] top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-50 text-emerald-500 ring-4 ring-white border border-emerald-200">
            <Check className="w-3 h-3" />
          </span>
          <div className="space-y-0.5">
            <p className="text-xs font-bold text-slate-700">Pengajuan Surat Diajukan</p>
            <p className="text-3xs font-medium text-slate-400">
              {formatDateTime(letter.created_at)}
            </p>
            <p className="text-2xs text-slate-500 font-medium mt-1">
              Oleh: {letter.profiles?.full_name || 'Warga'}
            </p>
          </div>
        </div>

        {/* Step 2: RT Approval */}
        <div className="relative">
          {/* Node Icon */}
          {rtApproval ? (
            rtApproval.status === 'approved' ? (
              <span className="absolute -left-[31px] top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-50 text-emerald-500 ring-4 ring-white border border-emerald-200">
                <Check className="w-3 h-3" />
              </span>
            ) : (
              <span className="absolute -left-[31px] top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-rose-50 text-rose-500 ring-4 ring-white border border-rose-200">
                <X className="w-3 h-3" />
              </span>
            )
          ) : letter.status === 'pending_rt' ? (
            <span className="absolute -left-[31px] top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-amber-50 text-amber-500 ring-4 ring-white border border-amber-200 animate-pulse">
              <Clock className="w-3 h-3" />
            </span>
          ) : (
            <span className="absolute -left-[31px] top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-slate-50 text-slate-300 ring-4 ring-white border border-slate-200">
              <Clock className="w-3 h-3" />
            </span>
          )}

          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-700">
              {rtApproval
                ? rtApproval.status === 'approved'
                  ? 'Disetujui Ketua RT'
                  : 'Ditolak Ketua RT'
                : 'Verifikasi Ketua RT'}
            </p>
            
            {rtApproval ? (
              <>
                <p className="text-3xs font-medium text-slate-400">
                  {formatDateTime(rtApproval.created_at)}
                </p>
                {rtApproval.profiles && (
                  <p className="text-3xs font-semibold text-slate-500 flex items-center">
                    <User className="w-3 h-3 mr-0.5 text-slate-400" />
                    {rtApproval.profiles.full_name}
                  </p>
                )}
                {rtApproval.note && (
                  <p className={`text-2xs font-semibold p-2.5 rounded-xl border mt-1 leading-relaxed ${
                    rtApproval.status === 'approved' 
                      ? 'bg-slate-50 border-slate-100 text-slate-600'
                      : 'bg-rose-50/50 border-rose-100 text-rose-700'
                  }`}>
                    "{rtApproval.note}"
                  </p>
                )}
              </>
            ) : (
              <p className="text-2xs text-slate-400 font-medium">
                {letter.status === 'pending_rt' 
                  ? 'Sedang dalam peninjauan berkas oleh Ketua RT.'
                  : 'Menunggu antrean verifikasi RT.'}
              </p>
            )}
          </div>
        </div>

        {/* Step 3: RW Approval */}
        <div className="relative">
          {/* Node Icon */}
          {rwApproval ? (
            rwApproval.status === 'approved' ? (
              <span className="absolute -left-[31px] top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-50 text-emerald-500 ring-4 ring-white border border-emerald-200">
                <Check className="w-3 h-3" />
              </span>
            ) : (
              <span className="absolute -left-[31px] top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-rose-50 text-rose-500 ring-4 ring-white border border-rose-200">
                <X className="w-3 h-3" />
              </span>
            )
          ) : letter.status === 'approved_rt' ? (
            <span className="absolute -left-[31px] top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-amber-50 text-amber-500 ring-4 ring-white border border-amber-200 animate-pulse">
              <Clock className="w-3 h-3" />
            </span>
          ) : (
            <span className="absolute -left-[31px] top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-slate-50 text-slate-300 ring-4 ring-white border border-slate-200">
              <Clock className="w-3 h-3" />
            </span>
          )}

          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-700">
              {rwApproval
                ? rwApproval.status === 'approved'
                  ? 'Disetujui Ketua RW (Selesai & Sah)'
                  : 'Ditolak Ketua RW'
                : 'Persetujuan Final Ketua RW'}
            </p>

            {rwApproval ? (
              <>
                <p className="text-3xs font-medium text-slate-400">
                  {formatDateTime(rwApproval.created_at)}
                </p>
                {rwApproval.profiles && (
                  <p className="text-3xs font-semibold text-slate-500 flex items-center">
                    <User className="w-3 h-3 mr-0.5 text-slate-400" />
                    {rwApproval.profiles.full_name}
                  </p>
                )}
                {rwApproval.note && (
                  <p className={`text-2xs font-semibold p-2.5 rounded-xl border mt-1 leading-relaxed ${
                    rwApproval.status === 'approved'
                      ? 'bg-slate-50 border-slate-100 text-slate-600'
                      : 'bg-rose-50/50 border-rose-100 text-rose-700'
                  }`}>
                    "{rwApproval.note}"
                  </p>
                )}
                {isFinished && letter.letter_number && (
                  <p className="text-2xs text-primary font-black mt-2 flex items-center bg-primary/5 px-2.5 py-1.5 rounded-xl border border-primary/10 w-fit">
                    <Tag className="w-3.5 h-3.5 mr-1" />
                    No Surat: {letter.letter_number}
                  </p>
                )}
              </>
            ) : (
              <p className="text-2xs text-slate-400 font-medium">
                {letter.status === 'approved_rt'
                  ? 'Telah diteruskan ke RW. Sedang menunggu pengesahan final.'
                  : 'Akan aktif setelah persetujuan Ketua RT.'}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
