export default function DashboardLoading() {
  return (
    <div className="max-w-md mx-auto space-y-6 pb-20 animate-pulse">
      
      {/* 1. Greeting Section Skeleton */}
      <div className="bg-white rounded-3xl border border-slate-100 p-5 flex items-center justify-between">
        <div className="flex items-center space-x-3.5 w-3/4">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 flex-shrink-0" />
          <div className="space-y-2 w-full">
            <div className="h-3 bg-slate-100 rounded w-1/3" />
            <div className="h-4.5 bg-slate-100 rounded w-3/4" />
            <div className="h-3.5 bg-slate-100 rounded w-1/4" />
          </div>
        </div>
        <div className="w-10 h-10 rounded-2xl bg-slate-100" />
      </div>

      {/* 2. Unpaid Dues Summary Skeleton */}
      <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden">
        <div className="p-5 space-y-3">
          <div className="flex justify-between items-center">
            <div className="h-3 bg-slate-100 rounded w-1/4" />
            <div className="h-4 bg-slate-100 rounded w-12" />
          </div>
          <div className="flex justify-between items-baseline pt-2">
            <div className="h-7 bg-slate-100 rounded w-1/2" />
            <div className="h-3.5 bg-slate-100 rounded w-1/4" />
          </div>
        </div>
        <div className="px-5 pb-5 pt-3 border-t border-slate-50 space-y-3">
          <div className="space-y-2">
            <div className="flex justify-between">
              <div className="h-3.5 bg-slate-100 rounded w-1/3" />
              <div className="h-3.5 bg-slate-100 rounded w-1/5" />
            </div>
            <div className="flex justify-between">
              <div className="h-3.5 bg-slate-100 rounded w-1/4" />
              <div className="h-3.5 bg-slate-100 rounded w-1/6" />
            </div>
          </div>
          <div className="h-11 bg-slate-100 rounded-2xl w-full mt-2" />
        </div>
      </div>

      {/* 3. Shortcut Menu Cards Skeleton */}
      <div>
        <div className="h-3.5 bg-slate-100 rounded w-1/4 mb-3 px-1" />
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white border border-slate-100 p-4.5 rounded-3xl h-28 flex flex-col justify-between">
              <div className="w-10 h-10 rounded-2xl bg-slate-100" />
              <div className="space-y-1.5">
                <div className="h-3.5 bg-slate-100 rounded w-2/3" />
                <div className="h-2.5 bg-slate-100 rounded w-5/6" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Latest Announcements Skeleton */}
      <div className="bg-white rounded-3xl border border-slate-100 p-5 space-y-4">
        <div className="flex justify-between items-center">
          <div className="h-4 bg-slate-100 rounded w-1/3" />
          <div className="h-3.5 bg-slate-100 rounded w-1/6" />
        </div>
        <div className="space-y-4 pt-1">
          {[1, 2].map((i) => (
            <div key={i} className="space-y-2 pb-2">
              <div className="h-2.5 bg-slate-100 rounded w-1/5" />
              <div className="h-3.5 bg-slate-100 rounded w-1/2" />
              <div className="h-3 bg-slate-100 rounded w-full" />
              <div className="h-3 bg-slate-100 rounded w-5/6" />
            </div>
          ))}
        </div>
      </div>

      {/* 5. Recent Notifications Skeleton */}
      <div className="bg-white rounded-3xl border border-slate-100 p-5 space-y-4">
        <div className="h-4 bg-slate-100 rounded w-1/3" />
        <div className="space-y-3.5 pt-1">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex space-x-3">
              <div className="w-2.5 h-2.5 rounded-full bg-slate-100 mt-1.5 flex-shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="flex justify-between">
                  <div className="h-3.5 bg-slate-100 rounded w-1/3" />
                  <div className="h-2.5 bg-slate-100 rounded w-1/12" />
                </div>
                <div className="h-3 bg-slate-100 rounded w-full" />
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}
