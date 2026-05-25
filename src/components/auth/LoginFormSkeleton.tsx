export default function LoginFormSkeleton() {
  return (
    <div
      className="animate-pulse rounded-xl border border-slate-100 bg-white p-6 shadow-sm"
      aria-hidden
    >
      <div className="mx-auto h-4 w-32 rounded bg-slate-100" />
      <div className="mt-6 space-y-4">
        <div className="h-12 rounded-xl bg-slate-100" />
        <div className="h-12 rounded-xl bg-slate-100" />
        <div className="h-12 rounded-xl bg-slate-200" />
      </div>
    </div>
  )
}
