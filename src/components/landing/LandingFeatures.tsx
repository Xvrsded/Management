import { FEATURES } from './landing-data'

export default function LandingFeatures() {
  return (
    <section id="fitur" className="px-4 py-16 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
            Fitur Unggulan
          </p>
          <h2 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">
            Semua Layanan RT/RW dalam Satu Tempat
          </h2>
          <p className="mt-3 text-slate-600">
            Dirancang sederhana agar warga dan pengurus bisa langsung pakai tanpa
            pelatihan rumit.
          </p>
        </div>

        <ul className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((feature) => {
            const Icon = feature.icon
            return (
              <li key={feature.title}>
                <article
                  className={`group h-full rounded-2xl border border-white/60 p-5 shadow-sm transition-[transform,box-shadow] duration-150 hover:-translate-y-0.5 hover:shadow-md ${feature.cardBg}`}
                >
                  <div
                    className={`inline-flex h-11 w-11 items-center justify-center rounded-full ${feature.iconBg}`}
                  >
                    <Icon className={`h-5 w-5 ${feature.iconColor}`} aria-hidden />
                  </div>
                  <h3 className="mt-4 text-sm font-semibold text-slate-900">
                    {feature.title}
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
                    {feature.description}
                  </p>
                </article>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
