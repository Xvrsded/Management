import { useState } from 'react'
import { CheckCircle2, XCircle, AlertTriangle, Send, Loader2 } from 'lucide-react'
import { lettersService } from '@/services/lettersService'
import { toast } from 'sonner'

interface LetterApprovalActionsProps {
  letterId: string
  role: string
  userId: string
  onActionComplete: () => void
}

export default function LetterApprovalActions({ letterId, role, userId, onActionComplete }: LetterApprovalActionsProps) {
  const [loading, setLoading] = useState<boolean>(false)
  const [showRejectForm, setShowRejectForm] = useState<boolean>(false)
  const [note, setNote] = useState<string>('')
  const [rejectReason, setRejectReason] = useState<string>('')

  const isRT = role === 'rt'
  const isRW = role === 'rw'
  const isStaff = ['rt', 'rw', 'admin', 'superadmin'].includes(role)

  if (!isStaff) return null

  // RT approval trigger
  const handleRTApprove = async () => {
    setLoading(true)
    try {
      const res = await lettersService.approveByRT(letterId, userId, note)
      if (res.success) {
        toast.success('Persetujuan RT Berhasil! Pengajuan surat diteruskan ke RW.')
        onActionComplete()
      } else {
        toast.error(res.error || 'Gagal memproses persetujuan.')
      }
    } catch (e) {
      toast.error('Terjadi kesalahan koneksi.')
    } finally {
      setLoading(false)
    }
  }

  // RW approval trigger
  const handleRWApprove = async () => {
    setLoading(true)
    try {
      // Mock values for RT/RW fields based on default verifiers
      const verifierRt = '03'
      const verifierRw = '05'
      
      const res = await lettersService.approveByRW(letterId, userId, verifierRt, verifierRw, note)
      if (res.success) {
        toast.success('Pengesahan RW Berhasil! Surat resmi diterbitkan dan siap dicetak.')
        onActionComplete()
      } else {
        toast.error(res.error || 'Gagal memproses pengesahan.')
      }
    } catch (e) {
      toast.error('Terjadi kesalahan koneksi.')
    } finally {
      setLoading(false)
    }
  }

  // General rejection trigger
  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!rejectReason || rejectReason.trim().length === 0) {
      toast.error('Alasan penolakan wajib diisi.')
      return
    }

    setLoading(true)
    try {
      const rejectRole = isRW ? 'rw' : 'rt'
      const res = await lettersService.rejectLetter(letterId, rejectRole, userId, rejectReason)
      if (res.success) {
        toast.success(`Pengajuan berhasil ditolak oleh Ketua ${rejectRole.toUpperCase()}.`)
        setShowRejectForm(false)
        onActionComplete()
      } else {
        toast.error(res.error || 'Gagal memproses penolakan.')
      }
    } catch (err) {
      toast.error('Terjadi kesalahan koneksi.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-3xl border border-slate-100 p-5 shadow-sm space-y-4">
      <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Tindakan Pengurus</h4>

      {showRejectForm ? (
        // Inline Rejection Form
        <form onSubmit={handleRejectSubmit} className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
          <div className="bg-rose-50/50 border border-rose-100 rounded-2xl p-4 space-y-2">
            <div className="flex items-center space-x-2 text-rose-700">
              <AlertTriangle className="w-4.5 h-4.5" />
              <h5 className="text-xs font-bold uppercase tracking-wider">Konfirmasi Penolakan</h5>
            </div>
            <p className="text-2xs text-rose-800 leading-relaxed font-semibold">
              Tindakan ini akan mengembalikan status pengajuan menjadi ditolak. Warga akan menerima pemberitahuan beserta alasannya.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-3xs font-bold text-slate-400 uppercase tracking-wider block">
              Alasan Penolakan (Wajib)
            </label>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Masukkan catatan penolakan berkas, contoh: Foto scan KK tidak terbaca..."
              rows={3}
              className="w-full text-xs font-semibold p-3.5 rounded-2xl border border-slate-200 bg-white placeholder-slate-400 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-all leading-relaxed"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setShowRejectForm(false)}
              disabled={loading}
              className="py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-500 hover:bg-slate-100 text-xs font-bold transition-all"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="py-3 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center justify-center space-x-2 shadow-sm transition-all"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
              <span>Tolak Surat</span>
            </button>
          </div>
        </form>
      ) : (
        // Action Selection Layout
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-3xs font-bold text-slate-400 uppercase tracking-wider block">
              Catatan Persetujuan (Opsional)
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Masukkan pesan atau arahan pendukung..."
              className="w-full text-xs font-semibold p-3 rounded-2xl border border-slate-200 bg-white placeholder-slate-400 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
            />
          </div>

          <div className="grid grid-cols-1 gap-3">
            {isRT && (
              <button
                type="button"
                onClick={handleRTApprove}
                disabled={loading}
                className="w-full py-3.5 rounded-2xl bg-primary hover:bg-primary/95 text-white text-xs font-black flex items-center justify-center space-x-2 shadow-sm transition-all hover:translate-y-[-1px] active:translate-y-[0px]"
              >
                {loading ? <Loader2 className="w-4.5 h-4.5 animate-spin" /> : <CheckCircle2 className="w-4.5 h-4.5" />}
                <span>Setujui & Teruskan ke RW</span>
              </button>
            )}

            {isRW && (
              <button
                type="button"
                onClick={handleRWApprove}
                disabled={loading}
                className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black flex items-center justify-center space-x-2 shadow-sm transition-all hover:translate-y-[-1px] active:translate-y-[0px]"
              >
                {loading ? <Loader2 className="w-4.5 h-4.5 animate-spin" /> : <CheckCircle2 className="w-4.5 h-4.5" />}
                <span>Sahkan & Terbitkan Nomor Surat</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setShowRejectForm(true)}
              disabled={loading}
              className="w-full py-3 rounded-2xl bg-white border border-rose-100 hover:bg-rose-50/30 text-rose-600 text-xs font-bold flex items-center justify-center space-x-2 transition-colors"
            >
              <XCircle className="w-4 h-4" />
              <span>Tolak Pengajuan</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
