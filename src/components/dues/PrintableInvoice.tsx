'use client'

import { X, Printer, ShieldCheck, Download, Award } from 'lucide-react'

interface PrintableInvoiceProps {
  due: {
    id: string
    title: string
    amount: number
    due_date: string
    status: string
    verified_at?: string
    proof_url?: string
    profiles?: {
      full_name: string
      email: string
    }
  }
  transactionCode?: string
  paymentMethod?: string
  onClose: () => void
}

export default function PrintableInvoice({ 
  due, 
  transactionCode = `TRX-${due.id.slice(0,4).toUpperCase()}-MANUAL`, 
  paymentMethod = 'Manual Transfer Bank', 
  onClose 
}: PrintableInvoiceProps) {

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(value)
  }

  const formatDateTime = (dateStr?: string) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in print:p-0 print:bg-white print:relative print:z-0">
      
      {/* Invoice Container Card */}
      <div className="bg-white rounded-3xl border border-slate-150 max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-xl relative animate-scale-up print:border-none print:shadow-none print:p-0 print:max-w-full">
        
        {/* Top Control Header - Hidden during print */}
        <div className="flex justify-between items-center border-b border-slate-100 pb-4 print:hidden">
          <div className="flex items-center space-x-2">
            <Award className="w-5 h-5 text-emerald-600" />
            <h3 className="text-sm font-black text-slate-800 tracking-tight uppercase leading-none">
              Kuitansi Iuran Digital
            </h3>
          </div>
          
          <div className="flex items-center space-x-2">
            <button 
              onClick={handlePrint}
              className="flex items-center space-x-1 px-3 py-1.5 bg-slate-50 border border-slate-150 hover:bg-slate-100 rounded-lg text-slate-700 text-2xs font-extrabold transition-all"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>CETAK</span>
            </button>
            
            <button 
              onClick={onClose}
              className="w-7 h-7 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-150 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Invoice Header Content */}
        <div className="space-y-4">
          
          {/* Brand & Receipt Identifier */}
          <div className="flex justify-between items-start border-b border-slate-100 pb-4.5">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-2xs">
                  RT
                </div>
                <h4 className="text-xs font-black text-slate-800 leading-none">RT 03 / RW 05 Digital</h4>
              </div>
              <p className="text-[9px] font-semibold text-slate-400 leading-none uppercase tracking-wider">
                Kelurahan Kebagusan, Jakarta Selatan
              </p>
            </div>
            
            <div className="text-right space-y-1">
              <h2 className="text-sm font-black text-slate-900 leading-none tracking-tight">KUITANSI RESMI</h2>
              <p className="text-[9px] font-mono font-bold text-slate-400 leading-none mt-1">
                CODE: {transactionCode}
              </p>
            </div>
          </div>

          {/* Citizen demographics */}
          <div className="grid grid-cols-2 gap-4 text-[10px] bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
            <div className="space-y-1.5">
              <span className="text-[8px] font-extrabold text-slate-450 uppercase tracking-widest leading-none block">
                Pembayar (Warga):
              </span>
              <p className="font-extrabold text-slate-800 leading-tight">
                {due.profiles?.full_name || 'Warga RT 03'}
              </p>
              <p className="font-semibold text-slate-450 leading-none font-mono">
                {due.profiles?.email || '-'}
              </p>
            </div>
            
            <div className="space-y-1.5 text-right">
              <span className="text-[8px] font-extrabold text-slate-450 uppercase tracking-widest leading-none block">
                Detail Transaksi:
              </span>
              <p className="font-bold text-slate-700 leading-tight">
                Metode: {paymentMethod}
              </p>
              <p className="font-semibold text-slate-450 leading-none">
                Tanggal: {formatDateTime(due.verified_at || new Date().toISOString())}
              </p>
            </div>
          </div>

          {/* Core breakdown table */}
          <div className="border border-slate-150 rounded-2xl overflow-hidden mt-6 text-2xs">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 text-slate-450 border-b border-slate-150">
                  <th className="p-3 font-extrabold uppercase tracking-wider text-[8px]">Deskripsi Iuran</th>
                  <th className="p-3 text-right font-extrabold uppercase tracking-wider text-[8px]">Total Tagihan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="p-3.5">
                    <p className="font-bold text-slate-800">{due.title}</p>
                    <span className="text-[9px] text-slate-450 block mt-1">Jatuh Tempo: {new Date(due.due_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                  </td>
                  <td className="p-3.5 text-right font-black text-slate-800 text-xs">
                    {formatCurrency(due.amount)}
                  </td>
                </tr>
                {/* Total row */}
                <tr className="bg-slate-50/50 font-black text-xs text-slate-900 border-t border-slate-150">
                  <td className="p-4 text-right">Jumlah Dibayar:</td>
                  <td className="p-4 text-right text-sm text-emerald-600 font-extrabold">
                    {formatCurrency(due.amount)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Stamp & Seal section */}
          <div className="flex justify-between items-center pt-8 border-t border-slate-50">
            <div className="flex items-center space-x-1.5 text-emerald-600 leading-none select-none">
              <ShieldCheck className="w-5 h-5 shrink-0" />
              <span className="text-[10px] font-black uppercase tracking-widest">
                LUNAS & VERIFIKASI DIGITAL
              </span>
            </div>

            <div className="text-center w-36 space-y-1">
              <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest block leading-none">
                Ketua RT 03 Guntur
              </span>
              {/* Seal block */}
              <div className="h-10 w-full flex items-center justify-center text-slate-300 italic text-[10px] relative">
                {/* Simulated signature stamp circle */}
                <div className="absolute w-12 h-12 rounded-full border-2 border-dashed border-emerald-500/20 flex items-center justify-center text-[8px] text-emerald-500/40 uppercase tracking-widest font-bold rotate-12 leading-none">
                  RT 03 SEAl
                </div>
              </div>
              <p className="text-[9px] font-bold text-slate-700 leading-none border-t border-slate-100 pt-1.5">
                Guntur Ramadhan
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
