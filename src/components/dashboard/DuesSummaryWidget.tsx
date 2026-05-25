'use client'

import Link from 'next/link'
import { AlertTriangle, CheckCircle2, ChevronRight } from 'lucide-react'

export interface DuePayment {
  id: string
  title: string
  amount: number
  due_date: string
  status: 'unpaid' | 'pending' | 'paid' | 'pending_verification' | 'rejected'
}

interface DuesSummaryWidgetProps {
  role: string
  dues?: DuePayment[]
  totalRegionalDues?: number
  regionalCount?: number
}

export default function DuesSummaryWidget({ 
  role, 
  dues = [], 
  totalRegionalDues = 0, 
  regionalCount = 0 
}: DuesSummaryWidgetProps) {
  const isCitizen = role === 'warga'

  // Calculations for Citizen
  const personalUnpaid = dues.filter(d => d.status === 'unpaid' || d.status === 'rejected')
  const totalPersonalAmount = personalUnpaid.reduce((sum, item) => sum + Number(item.amount), 0)
  const personalHasPending = dues.some(d => d.status === 'pending' || d.status === 'pending_verification')

  // Unified status checks
  const totalAmount = isCitizen ? totalPersonalAmount : totalRegionalDues
  const hasDues = isCitizen ? personalUnpaid.length > 0 : totalRegionalDues > 0
  const hasPending = isCitizen ? personalHasPending : regionalCount > 0

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(value)
  }

  const nearestDate = isCitizen && personalUnpaid.length > 0 
    ? new Date(personalUnpaid[0].due_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
    : null

  // Styling maps
  const badgeColor = hasDues
    ? hasPending
      ? 'bg-amber-100 text-amber-700 border-amber-200'
      : 'bg-rose-100 text-rose-700 border-rose-200'
    : 'bg-emerald-100 text-emerald-700 border-emerald-200'

  const iconBgColor = hasDues
    ? hasPending
      ? 'bg-amber-500 text-white border-amber-400'
      : 'bg-rose-500 text-white border-rose-400'
    : 'bg-emerald-500 text-white border-emerald-400'

  return (
    <div className="bg-gradient-to-r from-emerald-50 via-emerald-50/70 to-green-100/50 rounded-2xl border border-emerald-100/80 shadow-xs p-4 sm:p-5 flex items-center justify-between overflow-hidden relative group select-none">
      {/* Decorative SVG Receipt Watermark background */}
      <div className="absolute right-24 -bottom-4 text-emerald-500/10 pointer-events-none transform group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500 hidden sm:block">
        <svg width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1-2-1Z" />
          <path d="M9 7h6" />
          <path d="M9 11h6" />
          <path d="M9 15h4" />
        </svg>
      </div>

      <div className="flex items-center space-x-4 min-w-0 flex-1 relative z-10">
        {/* Modern circular badge */}
        <div className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 shadow-2xs border ${iconBgColor}`}>
          {hasDues ? (
            <AlertTriangle className="w-5 h-5 shrink-0" />
          ) : (
            <CheckCircle2 className="w-5 h-5 shrink-0" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <span className="block text-[9px] sm:text-[10px] font-extrabold text-emerald-750/90 uppercase tracking-widest leading-none">
            {isCitizen ? 'Status Keuangan Iuran Anda' : 'Total Tunggakan Wilayah RT'}
          </span>
          <div className="mt-1.5 flex items-center space-x-2.5 flex-wrap gap-y-1">
            <h3 className="text-lg sm:text-xl font-extrabold text-emerald-950 tracking-tight leading-none">
              {formatCurrency(totalAmount)}
            </h3>
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-extrabold tracking-wide uppercase border leading-none shadow-3xs ${badgeColor}`}>
              {hasDues 
                ? isCitizen 
                  ? hasPending ? 'Pending' : 'Tunggakan'
                  : `${regionalCount} Belum Bayar`
                : 'Lunas'}
            </span>
          </div>
          <p className="text-[10px] sm:text-xs text-emerald-800/70 mt-1.5 font-semibold leading-none truncate max-w-xs sm:max-w-md">
            {isCitizen
              ? hasDues 
                ? `Jatuh tempo terdekat: ${nearestDate}` 
                : 'Bebas dari semua tagihan bulanan'
              : hasDues
                ? `Terdapat ${regionalCount} tagihan warga yang belum terverifikasi / dibayar.`
                : 'Luar biasa! Seluruh warga telah melunasi iuran bulan ini.'
            }
          </p>
        </div>
      </div>

      <div className="flex items-center space-x-2 shrink-0 relative z-10 ml-3">
        {isCitizen ? (
          hasDues ? (
            <Link
              href="/iuran"
              className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl py-2.5 px-4 sm:px-5 font-bold text-xs transition-all hover:scale-105 active:scale-95 shadow-md shadow-emerald-600/10 focus:outline-none focus:ring-4 focus:ring-emerald-100 flex items-center"
            >
              Bayar <ChevronRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          ) : (
            <Link
              href="/iuran"
              className="border border-emerald-250 hover:bg-emerald-500/10 text-emerald-750 rounded-xl py-2.5 px-4 font-bold text-xs transition-all focus:outline-none flex items-center"
            >
              Detail <ChevronRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          )
        ) : (
          <Link
            href="/iuran"
            className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl py-2.5 px-4 sm:px-5 font-bold text-xs transition-all hover:scale-105 active:scale-95 shadow-md shadow-emerald-600/10 focus:outline-none focus:ring-4 focus:ring-emerald-100 flex items-center"
          >
            Kelola <ChevronRight className="w-3.5 h-3.5 ml-1" />
          </Link>
        )}
      </div>
    </div>
  )
}
