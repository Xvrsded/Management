import { FileText, UserCheck, Shield, CheckCircle2 } from 'lucide-react'
import { LETTER_STEPS } from './landing-data'

const STEP_ICONS = [FileText, UserCheck, Shield, CheckCircle2]

export default function LetterFlow() {
  return (
    <section className="px-4 py-16 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-6xl rounded-2xl border border-slate-200/60 bg-white/60 p-6 shadow-sm backdrop-blur-sm sm:p-10">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-violet-700">
            Alur Surat
          </p>
          <h2 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">
            Proses Surat Digital yang Jelas
          </h2>
          <p className="mt-3 text-slate-600">
            Dari pengajuan hingga selesai — transparan dan bisa dipantau kapan saja.
          </p>
          <p className="mt-2 inline-flex items-center gap-2 rounded-full bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700">
            Estimasi proses real-time
          </p>
        </div>

        <ol className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {LETTER_STEPS.map((item, index) => {
            const Icon = STEP_ICONS[index]
            const isLast = index === LETTER_STEPS.length - 1
            return (
              <li key={item.step} className="relative">
                {!isLast && (
                  <span
                    className="absolute left-1/2 top-8 hidden h-px w-full bg-gradient-to-r from-blue-300 to-emerald-300 lg:block"
                    aria-hidden
                  />
                )}
                <div className="relative flex flex-col items-center text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-emerald-500 text-white shadow-md shadow-blue-900/15">
                    <Icon className="h-6 w-6" aria-hidden />
                  </div>
                  <span className="mt-3 text-xs font-bold text-blue-700">
                    Langkah {item.step}
                  </span>
                  <h3 className="mt-1 text-sm font-semibold text-slate-900">
                    {item.title}
                  </h3>
                  <p className="mt-1 text-xs text-slate-500">{item.desc}</p>
                </div>
              </li>
            )
          })}
        </ol>
      </div>
    </section>
  )
}
