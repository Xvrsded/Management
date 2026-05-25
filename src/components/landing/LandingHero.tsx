import Link from 'next/link'
import { Suspense } from 'react'
import { ArrowRight, Check } from 'lucide-react'
import { HERO_BADGES } from './landing-data'
import LandingDashboardAsync from './LandingDashboardAsync'
import LandingDashboardSkeleton from './LandingDashboardSkeleton'

export default function LandingHero() {
  return (
    <section
      id="beranda"
      className="relative overflow-hidden px-4 pb-16 pt-8 sm:px-6 sm:pb-20 sm:pt-12 lg:pt-16"
    >
      <div
        className="pointer-events-none absolute -right-24 top-0 h-72 w-72 rounded-full bg-blue-200/40 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -left-16 bottom-0 h-64 w-64 rounded-full bg-emerald-200/40 blur-3xl"
        aria-hidden
      />

      <div className="relative mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-2 lg:gap-14">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full border border-blue-200/80 bg-blue-50/90 px-3 py-1 text-xs font-medium text-blue-800">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden />
            Platform Digital RT/RW Indonesia
          </p>

          <h1 className="mt-5 text-3xl font-bold leading-tight tracking-tight text-slate-900 sm:text-4xl lg:text-[2.65rem] lg:leading-[1.15]">
            Platform Digital RT/RW Modern untuk{' '}
            <span className="bg-gradient-to-r from-blue-700 to-emerald-600 bg-clip-text text-transparent">
              Warga & Pengurus
            </span>
          </h1>

          <p className="mt-4 max-w-xl text-base leading-relaxed text-slate-600 sm:text-lg">
            Satu aplikasi ringan untuk pengelolaan iuran, surat, laporan warga,
            kegiatan, dan administrasi lingkungan — dengan data langsung dari database.
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href="/login"
              className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-700 to-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-900/20 transition-opacity duration-150 hover:opacity-95"
            >
              Masuk Sekarang
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
            <a
              href="#fitur"
              className="inline-flex min-h-[48px] items-center justify-center rounded-2xl border border-slate-200 bg-white/90 px-6 py-3 text-sm font-semibold text-slate-700 shadow-sm transition-colors duration-150 hover:bg-white"
            >
              Lihat Fitur
            </a>
          </div>

          <ul className="mt-6 flex flex-wrap gap-2">
            {HERO_BADGES.map((badge) => (
              <li
                key={badge}
                className="inline-flex items-center gap-1.5 rounded-full border border-slate-200/80 bg-white/80 px-3 py-1.5 text-xs font-medium text-slate-600"
              >
                <Check className="h-3.5 w-3.5 text-emerald-600" aria-hidden />
                {badge}
              </li>
            ))}
          </ul>
        </div>

        <Suspense fallback={<LandingDashboardSkeleton />}>
          <LandingDashboardAsync />
        </Suspense>
      </div>
    </section>
  )
}
