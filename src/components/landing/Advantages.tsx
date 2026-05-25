import { ADVANTAGES } from './landing-data'

export default function Advantages() {
  return (
    <section className="px-4 py-16 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-6xl">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div className="order-2 lg:order-1">
            <div className="rounded-2xl border border-slate-200/80 bg-gradient-to-br from-slate-900 to-blue-900 p-6 text-white shadow-xl sm:p-8">
              <p className="text-sm font-medium text-blue-200">Kenapa Memilih Kami?</p>
              <h2 className="mt-2 text-2xl font-bold sm:text-3xl">
                Dibangun untuk Indonesia Digital
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-slate-300">
                Fokus pada kecepatan, keamanan, dan kemudahan — terutama untuk warga
                yang baru pertama kali pakai aplikasi digital.
              </p>
              <div className="mt-6 grid grid-cols-2 gap-3">
                {['< 2 detik', 'Aman', 'Mobile', 'Gratis'].map((tag) => (
                  <div
                    key={tag}
                    className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-center text-xs font-semibold"
                  >
                    {tag}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="order-1 lg:order-2">
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
              Keunggulan
            </p>
            <h2 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">
              Ringan, Aman, dan Mudah Dipahami
            </h2>
            <ul className="mt-6 space-y-3">
              {ADVANTAGES.map((item) => {
                const Icon = item.icon
                return (
                  <li
                    key={item.text}
                    className="flex items-center gap-3 rounded-xl border border-slate-200/60 bg-white/80 px-4 py-3 shadow-sm"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100">
                      <Icon className="h-5 w-5 text-emerald-700" aria-hidden />
                    </span>
                    <span className="text-sm font-medium text-slate-700">{item.text}</span>
                  </li>
                )
              })}
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}
