export default function LandingStatsSkeleton() {
  return (
    <section className="px-4 py-12 sm:px-6 sm:py-16" aria-hidden>
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex justify-center">
          <div className="h-6 w-40 animate-pulse rounded bg-slate-200" />
        </div>
        <ul className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <li
              key={i}
              className="h-32 animate-pulse rounded-2xl border border-white/60 bg-white/80"
            />
          ))}
        </ul>
      </div>
    </section>
  )
}
