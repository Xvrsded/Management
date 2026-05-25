export default function LetterSkeleton() {
  return (
    <div className="space-y-4">
      {/* Search/Filter Skeletons */}
      <div className="flex gap-3 flex-wrap">
        <div className="h-11 bg-slate-100 rounded-2xl animate-pulse flex-1 min-w-[200px]" />
        <div className="h-11 w-32 bg-slate-100 rounded-2xl animate-pulse" />
      </div>

      {/* Grid Cards List Skeletons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((id) => (
          <div key={id} className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm space-y-4">
            <div className="flex justify-between items-start">
              <div className="h-6 w-24 bg-slate-100 rounded-xl animate-pulse" />
              <div className="h-4 w-20 bg-slate-100 rounded-lg animate-pulse" />
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 rounded-xl bg-slate-100 animate-pulse" />
                <div className="h-5 w-44 bg-slate-100 rounded-lg animate-pulse" />
              </div>
              <div className="h-4 w-full bg-slate-100 rounded-lg animate-pulse pl-9" />
            </div>

            <div className="pt-3 border-t border-slate-50 flex items-center justify-between">
              <div className="h-4 w-32 bg-slate-100 rounded-lg animate-pulse" />
              <div className="h-4 w-12 bg-slate-100 rounded-lg animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function LetterDetailSkeleton() {
  return (
    <div className="max-w-md mx-auto space-y-6">
      <div className="flex items-center space-x-3">
        <div className="w-9 h-9 rounded-2xl bg-slate-100 animate-pulse" />
        <div className="space-y-1.5">
          <div className="h-5 w-32 bg-slate-100 rounded-lg animate-pulse" />
          <div className="h-3 w-40 bg-slate-100 rounded-md animate-pulse" />
        </div>
      </div>

      <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm space-y-5">
        <div className="h-6 w-24 bg-slate-100 rounded-xl animate-pulse" />
        <div className="space-y-2">
          <div className="h-5 w-48 bg-slate-100 rounded-lg animate-pulse" />
          <div className="h-4 w-28 bg-slate-100 rounded-md animate-pulse" />
        </div>
        <div className="grid grid-cols-2 gap-4 pt-2">
          <div className="space-y-1.5">
            <div className="h-3 w-16 bg-slate-100 rounded-md animate-pulse" />
            <div className="h-5 w-24 bg-slate-100 rounded-lg animate-pulse" />
          </div>
          <div className="space-y-1.5">
            <div className="h-3 w-16 bg-slate-100 rounded-md animate-pulse" />
            <div className="h-5 w-24 bg-slate-100 rounded-lg animate-pulse" />
          </div>
        </div>
      </div>
      
      <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm h-36 animate-pulse" />
      <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm h-48 animate-pulse" />
    </div>
  )
}
