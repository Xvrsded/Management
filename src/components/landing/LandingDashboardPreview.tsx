import {
  Users,
  FileText,
  Wallet,
  Megaphone,
  Calendar,
  MapPin,
} from 'lucide-react'
import type { LandingDashboardData } from '@/services/landingService.server'
import {
  formatRupiah,
  formatActivityDate,
  formatAnnouncementDate,
  truncateText,
  activityBadge,
} from '@/services/landingService.server'
import LandingCivicClock from './LandingCivicClock'
import LiveRealtimeCounters from './LiveRealtimeCounters'
import LiveDataBadge from './LiveDataBadge'

type Props = {
  data: LandingDashboardData
}

const STAT_CARDS = [
  {
    key: 'citizens',
    label: 'Warga Aktif',
    icon: Users,
    gradient: 'from-blue-500 to-blue-600',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
  },
  {
    key: 'letters',
    label: 'Surat Diproses',
    icon: FileText,
    gradient: 'from-violet-500 to-violet-600',
    bg: 'bg-violet-50',
    text: 'text-violet-700',
  },
  {
    key: 'dues',
    label: 'Iuran Bulan Ini',
    icon: Wallet,
    gradient: 'from-emerald-500 to-emerald-600',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
  },
  {
    key: 'announcements',
    label: 'Pengumuman Aktif',
    icon: Megaphone,
    gradient: 'from-orange-500 to-orange-600',
    bg: 'bg-orange-50',
    text: 'text-orange-700',
  },
] as const

export default function LandingDashboardPreview({ data }: Props) {
  const { stats, announcements, activities, letterPreviews, realtime } = data

  const statValues: Record<string, string> = {
    citizens: String(stats.activeCitizens),
    letters: String(stats.lettersInProcess),
    dues: formatRupiah(stats.duesThisMonth),
    announcements: String(stats.activeAnnouncements),
  }

  const duesPaidPercent =
    stats.dues.pending + stats.dues.success > 0
      ? Math.round(
          (stats.dues.success / (stats.dues.pending + stats.dues.success)) * 100
        )
      : 0

  return (
    <div className="relative mx-auto w-full max-w-md lg:max-w-none">
      <div className="rounded-2xl border border-white/60 bg-white/70 p-4 shadow-xl shadow-slate-900/5 backdrop-blur-sm sm:p-5">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium text-slate-500">Dashboard RT/RW</p>
            <p className="text-sm font-semibold text-slate-800">Data Lingkungan Live</p>
            <LiveDataBadge className="mt-1.5" />
          </div>
          <div className="shrink-0 text-right">
            <LandingCivicClock />
            <span className="mt-1 inline-block rounded-lg bg-emerald-100 px-2 py-0.5 text-2xs font-semibold text-emerald-700">
              Online
            </span>
          </div>
        </div>

        <ul className="grid grid-cols-2 gap-2 sm:gap-3">
          {STAT_CARDS.map((card) => {
            const Icon = card.icon
            return (
              <li
                key={card.key}
                className={`rounded-xl border border-white/80 p-2.5 ${card.bg} shadow-sm`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${card.gradient} text-white shadow-sm`}
                  >
                    <Icon className="h-4 w-4" aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <p className={`text-base font-bold leading-none ${card.text}`}>
                      {statValues[card.key]}
                    </p>
                    <p className="mt-0.5 truncate text-2xs font-medium text-slate-600">
                      {card.label}
                    </p>
                  </div>
                </div>
              </li>
            )
          })}
        </ul>

        <div className="mt-4 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Pengumuman Terbaru
          </p>
          {announcements.length === 0 ? (
            <p className="rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2.5 text-xs text-slate-500">
              Belum ada pengumuman aktif.
            </p>
          ) : (
            announcements.map((item) => (
              <article
                key={item.id}
                className="rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium text-slate-800">{item.title}</p>
                  <span className="shrink-0 rounded-md bg-blue-100 px-1.5 py-0.5 text-2xs font-semibold text-blue-700">
                    {item.category}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-slate-500">
                  {formatAnnouncementDate(item.created_at)}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-slate-600">
                  {truncateText(item.content, 64)}
                </p>
              </article>
            ))
          )}
        </div>

        <div className="mt-4 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Status Surat
          </p>
          {letterPreviews.length === 0 ? (
            <p className="rounded-xl border border-slate-100 bg-white px-3 py-2 text-xs text-slate-500">
              Belum ada pengajuan surat.
            </p>
          ) : (
            letterPreviews.map((row) => (
              <div
                key={row.id}
                className="flex items-center justify-between gap-2 rounded-xl border border-slate-100 bg-white px-3 py-2"
              >
                <div className="flex min-w-0 items-center gap-2">
                  <FileText className="h-4 w-4 shrink-0 text-blue-600" aria-hidden />
                  <span className="truncate text-sm text-slate-700">{row.label}</span>
                </div>
                <span
                  className={`shrink-0 rounded-md px-2 py-0.5 text-2xs font-semibold ${row.statusTone}`}
                >
                  {row.status}
                </span>
              </div>
            ))
          )}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {[
              { label: 'RT', count: stats.letterStatus.pendingRt },
              { label: 'RW', count: stats.letterStatus.pendingRw },
              { label: 'Selesai', count: stats.letterStatus.finished },
            ].map((chip) => (
              <span
                key={chip.label}
                className="rounded-md bg-slate-100 px-2 py-0.5 text-2xs font-medium text-slate-600"
              >
                {chip.label}: {chip.count}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between rounded-xl border border-emerald-100 bg-emerald-50/80 px-3 py-2.5">
          <div className="flex items-center gap-2">
            <Wallet className="h-4 w-4 text-emerald-700" aria-hidden />
            <div>
              <span className="text-sm font-medium text-slate-800">Iuran Bulan Ini</span>
              <p className="text-2xs text-slate-500">
                {stats.dues.pending} pending · {stats.dues.success} lunas
              </p>
            </div>
          </div>
          <span className="text-xs font-semibold text-emerald-700">
            {duesPaidPercent > 0 ? `${duesPaidPercent}%` : formatRupiah(stats.dues.totalMonth)}
          </span>
        </div>

        {activities.length > 0 && (
          <div className="mt-4 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Kegiatan Mendatang
            </p>
            {activities.map((act) => (
              <div
                key={act.id}
                className="rounded-xl border border-slate-100 bg-white px-3 py-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium text-slate-800">{act.title}</p>
                  <span className="shrink-0 rounded-md bg-violet-100 px-1.5 py-0.5 text-2xs font-semibold text-violet-700">
                    {activityBadge(act.status)}
                  </span>
                </div>
                <p className="mt-1 flex items-center gap-1 text-2xs text-slate-500">
                  <Calendar className="h-3 w-3" aria-hidden />
                  {formatActivityDate(act.activity_date)}
                </p>
                <p className="mt-0.5 flex items-center gap-1 text-2xs text-slate-500">
                  <MapPin className="h-3 w-3" aria-hidden />
                  {act.location} · {act.participant_count} peserta
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      <LiveRealtimeCounters initial={realtime} />
    </div>
  )
}
