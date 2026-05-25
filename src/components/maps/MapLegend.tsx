import { MARKER_COLORS, STATUS_LABELS } from './map-utils'
import type { MapMarkerStatus } from '@/types/maps'

const LEGEND_ORDER: MapMarkerStatus[] = ['active', 'temporary', 'attention', 'inactive']

export default function MapLegend() {
  return (
    <div className="rounded-xl border border-slate-200/80 bg-white/95 px-3 py-2.5 shadow-sm">
      <p className="mb-2 text-2xs font-semibold uppercase tracking-wide text-slate-500">
        Legenda
      </p>
      <ul className="space-y-1.5">
        {LEGEND_ORDER.map((status) => (
          <li key={status} className="flex items-center gap-2 text-xs text-slate-700">
            <span
              className="h-3 w-3 shrink-0 rounded-full border border-white shadow-sm"
              style={{ backgroundColor: MARKER_COLORS[status] }}
              aria-hidden
            />
            {STATUS_LABELS[status]}
          </li>
        ))}
      </ul>
    </div>
  )
}
