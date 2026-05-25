export default function MapSkeleton() {
  return (
    <div
      className="flex h-[min(420px,55vh)] w-full animate-pulse flex-col items-center justify-center rounded-xl border border-slate-200 bg-slate-100/80 sm:h-[min(520px,60vh)]"
      aria-hidden
    >
      <div className="h-8 w-8 rounded-full border-2 border-slate-300 border-t-blue-500" />
      <p className="mt-3 text-sm font-medium text-slate-500">Memuat peta...</p>
    </div>
  )
}
