import { cn } from '@/lib/utils'

type Props = {
  className?: string
}

export default function LiveDataBadge({ className }: Props) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border border-emerald-200/80 bg-emerald-50/90 px-2 py-0.5 text-2xs font-semibold text-emerald-800',
        className
      )}
    >
      <span className="relative flex h-1.5 w-1.5" aria-hidden>
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
      </span>
      Live Data
    </span>
  )
}
