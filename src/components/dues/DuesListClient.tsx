'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search, CreditCard, Inbox, AlertTriangle, FileText, CheckCircle2, RefreshCw, ChevronRight, Printer } from 'lucide-react'
import { duesService } from '@/services/duesService'
import DuesCard from './DuesCard'
import PrintableInvoice from './PrintableInvoice'
import AdminFinanceDashboard from './AdminFinanceDashboard'
import { DuePayment } from '@/types/dues'

interface DuesListClientProps {
  userId: string
  role: string
}

export default function DuesListClient({ userId, role }: DuesListClientProps) {
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [activeInvoiceDue, setActiveInvoiceDue] = useState<any | null>(null)

  const isCitizen = role === 'warga'

  // Fetch dues using TanStack Query for high performance and smart caching
  const {
    data: dues = [],
    isLoading,
    isFetching,
    refetch
  } = useQuery({
    queryKey: ['dues', role, userId, statusFilter, searchQuery],
    queryFn: () => duesService.getDues(role, userId, { status: statusFilter, search: searchQuery }),
    keepPreviousData: true,
    staleTime: 5000 // 5 seconds stale validation
  })

  // 1. RT/RW/Admin View Redirection
  if (!isCitizen) {
    return <AdminFinanceDashboard userId={userId} role={role} />
  }

  // Format currency into IDR
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(value)
  }

  // Calculate unpaid totals from unpaid and rejected dues
  const unpaidDues = dues.filter(item => item.status === 'unpaid' || item.status === 'rejected')
  const totalUnpaidAmount = unpaidDues.reduce((sum, item) => sum + Number(item.amount), 0)
  const hasPending = dues.some(d => d.status === 'pending_verification')

  const nearestDate = unpaidDues.length > 0 
    ? new Date(unpaidDues[0].due_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
    : null

  const handleHeroAction = () => {
    setStatusFilter('unpaid')
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 select-none">
      {/* Header section */}
      <div className="flex justify-between items-center px-1">
        <div>
          <h1 className="text-xl font-black text-slate-800 tracking-tight leading-none">
            Tagihan & Iuran Warga
          </h1>
          <p className="text-xs font-semibold text-slate-450 mt-1">
            Pantau & bayar iuran bulanan Anda secara mandiri
          </p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="w-8 h-8 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center border border-slate-100 transition-colors"
          title="Perbarui Data"
        >
          <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* 2. Premium Fintech Hero Status Tagihan Card */}
      {totalUnpaidAmount > 0 ? (
        /* Arrears/Unpaid State Banner */
        <div className="bg-gradient-to-r from-rose-500 via-orange-500 to-rose-600 text-white rounded-3xl p-5 sm:p-6 shadow-md shadow-rose-500/10 relative overflow-hidden group">
          <div className="absolute right-24 -bottom-4 text-white/5 pointer-events-none transform group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500 hidden sm:block">
            <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
              <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1-2-1Z" />
              <path d="M9 7h6" />
              <path d="M9 11h6" />
            </svg>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
            <div className="space-y-1.5 flex-1 min-w-0">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-white/25 border border-white/20 leading-none">
                <AlertTriangle className="w-3 h-3 mr-1" />
                Belum Lunas
              </span>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight mt-1 leading-none">
                {formatCurrency(totalUnpaidAmount)}
              </h2>
              <p className="text-[10px] sm:text-xs text-rose-100 font-semibold leading-none truncate mt-1">
                Jatuh tempo terdekat: {nearestDate} • Segera lunasi iuran Anda.
              </p>
            </div>

            <button 
              onClick={handleHeroAction}
              className="bg-white hover:bg-slate-50 text-rose-600 rounded-xl py-3 px-5 font-black text-xs uppercase tracking-widest transition-all hover:scale-105 active:scale-95 shadow-md shrink-0 flex items-center"
            >
              Bayar Sekarang <ChevronRight className="w-4 h-4 ml-1 shrink-0" />
            </button>
          </div>
        </div>
      ) : (
        /* Fully Paid/Lunas State Banner */
        <div className="bg-gradient-to-r from-emerald-500 via-teal-600 to-emerald-600 text-white rounded-3xl p-5 sm:p-6 shadow-md shadow-emerald-500/10 relative overflow-hidden group">
          <div className="absolute right-24 -bottom-4 text-white/5 pointer-events-none transform group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500 hidden sm:block">
            <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <path d="m22 4-10 10.01-3-3" />
            </svg>
          </div>

          <div className="flex items-center space-x-4 relative z-10">
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center shrink-0 border border-white/10 shadow-inner animate-pulse">
              <CheckCircle2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-white/20 border border-white/10 leading-none">
                Bebas Tagihan
              </span>
              <h2 className="text-base sm:text-lg font-black tracking-tight mt-1.5 leading-none">
                Luar Biasa! Semua Tagihan Lunas
              </h2>
              <p className="text-[10px] sm:text-xs text-emerald-100 font-semibold leading-none mt-1">
                Terima kasih telah berpartisipasi menjaga ketertiban keuangan lingkungan RT 03.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 3. Toggles/Tabs Gating */}
      <div className="flex bg-slate-100/80 p-1.5 rounded-2xl space-x-1 border border-slate-200/40">
        {[
          { key: 'all', label: 'Semua' },
          { key: 'unpaid', label: 'Belum Bayar' },
          { key: 'pending_verification', label: 'Menunggu' },
          { key: 'verified', label: 'Lunas' }
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setStatusFilter(tab.key)}
            className={`flex-1 text-center py-2.5 rounded-xl text-xs font-bold transition-all active:scale-[0.98] ${
              statusFilter === tab.key
                ? 'bg-white text-blue-600 shadow-xs border border-slate-100/20'
                : 'text-slate-400 hover:text-slate-600 font-semibold'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 4. Grid List view */}
      {isLoading ? (
        /* Skeletons */
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-100 p-5 space-y-3.5 animate-pulse">
              <div className="flex justify-between items-center">
                <div className="h-4 w-28 bg-slate-200 rounded-md" />
                <div className="h-4 w-20 bg-slate-100 rounded-md" />
              </div>
              <div className="h-5 w-44 bg-slate-200 rounded-md" />
              <div className="flex justify-between items-center pt-1.5">
                <div className="h-3.5 w-32 bg-slate-100 rounded-md" />
                <div className="h-6 w-6 bg-slate-100 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      ) : dues.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {dues.map((due) => {
            const isVerified = due.status === 'verified'
            return (
              <div key={due.id} className="relative group">
                <DuesCard due={due} />
                
                {/* Printable Invoice clicker on Verified cards */}
                {isVerified && (
                  <button
                    onClick={() => setActiveInvoiceDue(due)}
                    className="absolute right-12 top-4.5 z-10 w-8 h-8 rounded-full bg-white hover:bg-slate-50 border border-slate-150 flex items-center justify-center text-slate-400 hover:text-blue-600 transition-colors shadow-2xs group-hover:scale-105"
                    title="Cetak Kuitansi"
                  >
                    <Printer className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )
          })}
        </div>
      ) : (
        /* Empty states */
        <div className="bg-white rounded-3xl border border-slate-100 shadow-xs p-10 text-center flex flex-col items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center mb-3">
            <Inbox className="w-6 h-6" />
          </div>
          <h5 className="text-sm font-bold text-slate-700">Tidak Ada Tagihan</h5>
          <p className="text-xs text-slate-400 mt-1.5 max-w-[240px] leading-relaxed">
            {statusFilter === 'all'
              ? 'Saat ini tidak ada tagihan iuran yang terdaftar di sistem.'
              : 'Tidak ada tagihan yang sesuai dengan filter yang Anda pilih.'}
          </p>
        </div>
      )}

      {/* 5. Printable Invoice Modal trigger */}
      {activeInvoiceDue && (
        <PrintableInvoice 
          due={activeInvoiceDue} 
          onClose={() => setActiveInvoiceDue(null)} 
        />
      )}
    </div>
  )
}
