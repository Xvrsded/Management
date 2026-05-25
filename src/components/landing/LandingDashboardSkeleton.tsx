export default function LandingDashboardSkeleton() {
  return (
    <div
      className="animate-pulse rounded-2xl border border-white/60 bg-white/70 p-4 shadow-xl shadow-slate-900/5 sm:p-5"
      aria-hidden
    >
      <div className="mb-4 flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-3 w-24 rounded bg-slate-200" />
          <div className="h-4 w-36 rounded bg-slate-200" />
        </div>
        <div className="h-6 w-14 rounded-lg bg-slate-200" />
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-16 rounded-xl bg-slate-100" />
        ))}
      </div>
      <div className="mt-4 space-y-2">
        <div className="h-3 w-20 rounded bg-slate-200" />
        <div className="h-14 rounded-xl bg-slate-100" />
        <div className="h-14 rounded-xl bg-slate-100" />
      </div>
      <div className="mt-4 space-y-2">
        <div className="h-3 w-24 rounded bg-slate-200" />
        <div className="h-10 rounded-xl bg-slate-100" />
        <div className="h-10 rounded-xl bg-slate-100" />
      </div>
      <div className="mt-4 h-12 rounded-xl bg-slate-100" />
    </div>
  )
}
