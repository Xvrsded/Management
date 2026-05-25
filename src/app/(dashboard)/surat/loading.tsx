import LetterSkeleton from '@/components/letters/LetterSkeleton'
import { FileText } from 'lucide-react'

export default function SuratLoading() {
  return (
    <section className="px-4 py-6 md:py-8 max-w-4xl mx-auto space-y-6">
      {/* Header Skeleton */}
      <div className="space-y-2.5">
        <div className="flex items-center">
          <FileText className="w-6 h-6 mr-2 text-slate-300 animate-pulse" />
          <div className="h-6 w-44 bg-slate-100 rounded-lg animate-pulse" />
        </div>
        <div className="h-3 w-80 bg-slate-100 rounded-md animate-pulse" />
      </div>

      {/* Main Skeletons */}
      <LetterSkeleton />
    </section>
  )
}
