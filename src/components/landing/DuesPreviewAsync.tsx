import { QrCode, Building, Smartphone, CheckCircle2, Clock, Upload } from 'lucide-react'
import { getLandingStats, formatRupiah } from '@/services/landingService.server'
import { PAYMENT_METHODS } from './landing-data'
import LiveDataBadge from './LiveDataBadge'

const METHOD_ICONS = {
  QRIS: QrCode,
  'Transfer Bank': Building,
  'E-wallet': Smartphone,
} as const

export default async function DuesPreviewAsync() {
  const stats = await getLandingStats()
  const monthLabel = new Date().toLocaleDateString('id-ID', {
    month: 'long',
    year: 'numeric',
  })

  return (
    <section className="px-4 py-16 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-6xl">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-orange-600">
              Iuran Digital
            </p>
            <h2 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">
              Pembayaran Iuran Lebih Mudah
            </h2>
            <p className="mt-3 text-slate-600">
              Pantau status lunas, pending, upload bukti transfer, dan riwayat
              pembayaran — data diperbarui dari database setiap menit.
            </p>
            <LiveDataBadge className="mt-3" />

            <ul className="mt-6 flex flex-wrap gap-2">
              {PAYMENT_METHODS.map((method) => {
                const Icon = METHOD_ICONS[method]
                return (
                  <li
                    key={method}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200/80 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm"
                  >
                    <Icon className="h-4 w-4 text-blue-600" aria-hidden />
                    {method}
                  </li>
                )
              })}
            </ul>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-lg shadow-slate-900/5 sm:p-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <p className="text-xs text-slate-500">Total Iuran — {monthLabel}</p>
                <p className="text-lg font-bold text-slate-900">
                  {formatRupiah(stats.dues.totalMonth)}
                </p>
              </div>
              <span className="rounded-lg bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                {stats.dues.success} lunas
              </span>
            </div>

            <ul className="mt-4 grid grid-cols-3 gap-2 text-center">
              <li className="rounded-xl bg-emerald-50 px-2 py-3">
                <p className="text-lg font-bold text-emerald-700">{stats.dues.success}</p>
                <p className="text-2xs text-slate-500">Sukses</p>
              </li>
              <li className="rounded-xl bg-amber-50 px-2 py-3">
                <p className="text-lg font-bold text-amber-700">{stats.dues.pending}</p>
                <p className="text-2xs text-slate-500">Pending</p>
              </li>
              <li className="rounded-xl bg-blue-50 px-2 py-3">
                <p className="text-lg font-bold text-blue-700">
                  {formatRupiah(stats.duesThisMonth)}
                </p>
                <p className="text-2xs text-slate-500">Terkumpul</p>
              </li>
            </ul>

            <div className="mt-4 flex items-center gap-3 rounded-xl border border-dashed border-blue-200 bg-blue-50/50 px-4 py-3">
              <Upload className="h-5 w-5 shrink-0 text-blue-600" aria-hidden />
              <div>
                <p className="text-sm font-semibold text-slate-800">Upload Bukti Transfer</p>
                <p className="text-xs text-slate-500">
                  {stats.dues.pending > 0
                    ? `${stats.dues.pending} pembayaran menunggu verifikasi`
                    : 'Semua pembayaran terverifikasi'}
                </p>
              </div>
            </div>

            <div className="mt-3 flex items-center gap-4 text-xs text-slate-500">
              <span className="inline-flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                Lunas: {stats.dues.success}
              </span>
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-amber-600" />
                Pending: {stats.dues.pending}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
