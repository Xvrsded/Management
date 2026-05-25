'use client'

import Link from 'next/link'
import { AlertTriangle, Clock, CheckCircle2, XCircle, ChevronRight } from 'lucide-react'
import { DuePayment } from '@/types/dues'

interface DuesCardProps {
  due: DuePayment
}

export default function DuesCard({ due }: DuesCardProps) {
  // Formatter for Indonesian currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(value)
  }

  // Format date nicely
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  // Style configurations based on status
  const statusStyles = {
    unpaid: {
      bg: 'bg-rose-50 border-rose-100',
      text: 'text-rose-700',
      badgeBg: 'bg-rose-100/70',
      icon: AlertTriangle,
      label: 'Belum Bayar'
    },
    pending_verification: {
      bg: 'bg-amber-50 border-amber-100',
      text: 'text-amber-700',
      badgeBg: 'bg-amber-100/70',
      icon: Clock,
      label: 'Menunggu Verifikasi'
    },
    verified: {
      bg: 'bg-emerald-50 border-emerald-100',
      text: 'text-emerald-700',
      badgeBg: 'bg-emerald-100/70',
      icon: CheckCircle2,
      label: 'Lunas'
    },
    rejected: {
      bg: 'bg-slate-50 border-slate-200',
      text: 'text-slate-700',
      badgeBg: 'bg-slate-200/70',
      icon: XCircle,
      label: 'Ditolak'
    }
  }

  const style = statusStyles[due.status] || statusStyles.unpaid
  const StatusIcon = style.icon

  return (
    <Link
      href={`/iuran/${due.id}`}
      className="block bg-white rounded-2xl border border-slate-100 p-5 hover:bg-slate-50 transition-all hover:shadow-xs focus:outline-none focus:ring-2 focus:ring-primary/20 touch-target-large active:scale-[0.99] duration-150"
    >
      <div className="flex justify-between items-start">
        <div className="space-y-1.5 flex-1 min-w-0">
          <div className="flex items-center space-x-2">
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${style.badgeBg} ${style.text}`}>
              <StatusIcon className="w-3 h-3 mr-1 flex-shrink-0" />
              {style.label}
            </span>
            {due.profiles && (
              <span className="text-[9px] font-semibold text-slate-400 truncate">
                • {due.profiles.full_name}
              </span>
            )}
          </div>
          <h4 className="text-sm font-bold text-slate-800 leading-snug truncate">
            {due.title}
          </h4>
          <div className="flex items-baseline space-x-2">
            <span className="text-base font-black text-slate-800 tracking-tight">
              {formatCurrency(due.amount)}
            </span>
          </div>
          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">
            Jatuh tempo: {formatDate(due.due_date)}
          </p>
        </div>
        <div className="flex items-center self-center h-full ml-4">
          <div className="w-8 h-8 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600">
            <ChevronRight className="w-4 h-4" />
          </div>
        </div>
      </div>
    </Link>
  )
}
