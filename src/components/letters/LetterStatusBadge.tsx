import { LetterStatus } from '@/types/letters'
import { Clock, CheckCircle2, AlertTriangle, UserCheck } from 'lucide-react'

interface LetterStatusBadgeProps {
  status: LetterStatus
}

export default function LetterStatusBadge({ status }: LetterStatusBadgeProps) {
  const statusConfig = {
    pending_rt: {
      color: 'text-amber-700 bg-amber-50 border-amber-100',
      icon: Clock,
      label: 'Menunggu RT'
    },
    approved_rt: {
      color: 'text-indigo-700 bg-indigo-50 border-indigo-100',
      icon: UserCheck,
      label: 'Disetujui RT / Menunggu RW'
    },
    approved_rw: {
      color: 'text-blue-700 bg-blue-50 border-blue-100',
      icon: UserCheck,
      label: 'Disetujui RW / Finalisasi'
    },
    finished: {
      color: 'text-emerald-700 bg-emerald-50 border-emerald-100',
      icon: CheckCircle2,
      label: 'Surat Selesai & Sah'
    },
    rejected: {
      color: 'text-rose-700 bg-rose-50 border-rose-100',
      icon: AlertTriangle,
      label: 'Ditolak'
    }
  }

  const active = statusConfig[status] || {
    color: 'text-slate-700 bg-slate-50 border-slate-100',
    icon: Clock,
    label: status
  }

  const Icon = active.icon

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-2xl border text-[9px] font-bold uppercase tracking-wider ${active.color}`}>
      <Icon className="w-3.5 h-3.5 mr-1 flex-shrink-0" />
      {active.label}
    </span>
  )
}
