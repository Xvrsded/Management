export default function DuesLoading() {
  return (
    <div className="max-w-md mx-auto space-y-6 pb-20 animate-pulse">
      {/* Header section skeleton */}
      <div className="space-y-2 px-1">
        <div className="h-6 w-48 bg-slate-200 rounded-xl" />
        <div className="h-4 w-64 bg-slate-100 rounded-lg" />
      </div>

      {/* Metrics Section */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5 flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-3.5 w-24 bg-slate-200 rounded-md" />
          <div className="h-8 w-36 bg-slate-200 rounded-lg" />
        </div>
        <div className="h-6 w-16 bg-slate-100 rounded-md" />
      </div>

      {/* Toggles/Tabs skeleton */}
      <div className="flex bg-slate-100 p-1 rounded-2xl space-x-1">
        <div className="h-10 flex-1 bg-white rounded-xl" />
        <div className="h-10 flex-1 bg-slate-100 rounded-xl" />
      </div>

      {/* List skeleton */}
      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-2xl border border-slate-100 p-4.5 space-y-3">
            <div className="flex justify-between items-center">
              <div className="h-4 w-28 bg-slate-200 rounded-md" />
              <div className="h-4 w-20 bg-slate-100 rounded-md" />
            </div>
            <div className="h-5 w-44 bg-slate-200 rounded-md" />
            <div className="flex justify-between items-center pt-1.5">
              <div className="h-3.5 w-32 bg-slate-100 rounded-md" />
              <div className="h-6 w-6 bg-slate-100 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
