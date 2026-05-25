import { Users, FileText, Wallet, Calendar } from 'lucide-react'
import { getLandingStats, formatRupiah } from '@/services/landingService.server'
import LiveDataBadge from './LiveDataBadge'

export default async function LandingStatsAsync() {
  const stats = await getLandingStats()

  const items = [
    {
      icon: Users,
      value: `${stats.activeCitizens}+`,
      label: 'Warga Terdaftar',
      gradient: 'from-blue-500 to-cyan-500',
    },
    {
      icon: FileText,
      value: `${stats.letterStatus.finished}+`,
      label: 'Surat Selesai',
      gradient: 'from-violet-500 to-purple-500',
    },
    {
      icon: Wallet,
      value: formatRupiah(stats.duesThisMonth),
      label: 'Iuran Terkumpul',
      gradient: 'from-emerald-500 to-teal-500',
    },
    {
      icon: Calendar,
      value: String(stats.activitiesCount),
      label: 'Kegiatan Mendatang',
      gradient: 'from-orange-500 to-amber-500',
    },
  ]

  return (
    <section className="px-4 py-12 sm:px-6 sm:py-16" aria-label="Statistik">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-col items-center gap-2 sm:flex-row sm:justify-center">
          <h2 className="text-lg font-bold text-slate-900">Statistik Lingkungan</h2>
          <LiveDataBadge />
        </div>
        <ul className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {items.map((item) => {
            const Icon = item.icon
            return (
              <li
                key={item.label}
                className="rounded-2xl border border-white/60 bg-white/80 px-4 py-5 text-center shadow-sm"
              >
                <span
                  className={`mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br ${item.gradient} text-white shadow-md`}
                >
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <p className="mt-3 text-xl font-bold text-slate-900 sm:text-2xl">
                  {item.value}
                </p>
                <p className="mt-1 text-xs font-medium text-slate-500 sm:text-sm">
                  {item.label}
                </p>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
