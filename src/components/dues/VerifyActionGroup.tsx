'use client'

import { useState } from 'react'
import { Check, X, AlertCircle, RefreshCw } from 'lucide-react'
import { duesService } from '@/services/duesService'

interface VerifyActionGroupProps {
  dueId: string
  verifierId: string
  onVerificationResult: (status: 'verified' | 'rejected', rejectionReason?: string) => void
}

export default function VerifyActionGroup({ dueId, verifierId, onVerificationResult }: VerifyActionGroupProps) {
  const [loading, setLoading] = useState(false)
  const [showRejectForm, setShowRejectForm] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const handleApprove = async () => {
    setLoading(true)
    setErrorMsg(null)
    const result = await duesService.verifyPayment(dueId, 'verified', verifierId)
    setLoading(false)

    if (result.success) {
      onVerificationResult('verified')
    } else {
      setErrorMsg(result.error || 'Gagal menyetujui iuran. Silakan coba kembali.')
    }
  }

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!rejectionReason.trim()) {
      setErrorMsg('Harap masukkan alasan penolakan bukti transfer.')
      return
    }

    setLoading(true)
    setErrorMsg(null)
    const result = await duesService.verifyPayment(dueId, 'rejected', verifierId, rejectionReason.trim())
    setLoading(false)

    if (result.success) {
      onVerificationResult('rejected', rejectionReason.trim())
    } else {
      setErrorMsg(result.error || 'Gagal menolak iuran. Silakan coba kembali.')
    }
  }

  const handleCancelReject = () => {
    setShowRejectForm(false)
    setRejectionReason('')
    setErrorMsg(null)
  }

  return (
    <div className="space-y-4">
      {errorMsg && (
        <div className="bg-rose-50 text-rose-700 text-xs rounded-xl p-3 border border-rose-100 flex items-start space-x-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span className="font-semibold">{errorMsg}</span>
        </div>
      )}

      {!showRejectForm ? (
        <div className="grid grid-cols-2 gap-3.5">
          <button
            onClick={() => setShowRejectForm(true)}
            disabled={loading}
            className="flex items-center justify-center space-x-2 py-3.5 px-4 rounded-2xl text-sm font-bold text-rose-600 bg-rose-50 hover:bg-rose-100/80 border border-rose-100 transition-all touch-target-large disabled:opacity-50"
          >
            <X className="w-4.5 h-4.5" />
            <span>Tolak Bukti</span>
          </button>
          
          <button
            onClick={handleApprove}
            disabled={loading}
            className="flex items-center justify-center space-x-2 py-3.5 px-4 rounded-2xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-all shadow-sm shadow-emerald-600/10 touch-target-large disabled:opacity-50"
          >
            {loading ? (
              <RefreshCw className="w-4.5 h-4.5 animate-spin" />
            ) : (
              <Check className="w-4.5 h-4.5" />
            )}
            <span>Setujui Iuran</span>
          </button>
        </div>
      ) : (
        /* Reject Form expand card */
        <form onSubmit={handleRejectSubmit} className="bg-rose-50/50 rounded-2xl p-4.5 border border-rose-100 space-y-3">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">Alasan Penolakan Bukti Transfer</label>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Contoh: Bukti transfer terpotong atau nominal tidak sesuai."
              className="w-full text-xs bg-white rounded-xl border border-slate-200 p-3 h-20 focus:outline-none focus:ring-2 focus:ring-rose-500/20 text-slate-800 font-medium placeholder-slate-400"
              disabled={loading}
            />
          </div>
          <div className="flex justify-end space-x-2.5">
            <button
              type="button"
              onClick={handleCancelReject}
              disabled={loading}
              className="text-xs font-bold text-slate-500 hover:bg-slate-100 py-2 px-4 rounded-xl transition-all touch-target-large"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center space-x-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 py-2 px-4 rounded-xl transition-all shadow-sm shadow-rose-600/10 touch-target-large disabled:opacity-50"
            >
              {loading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
              <span>Kirim Penolakan</span>
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
