'use client'

import type { MapMarkerStatus } from '@/types/maps'
import { STATUS_LABELS } from './map-utils'
import { displayRT, displayRW } from '@/lib/region-format'

type Props = {
  rtOptions: string[]
  rwOptions: string[]
  rtFilter: string
  rwFilter: string
  statusFilter: MapMarkerStatus | 'all'
  onRtChange: (value: string) => void
  onRwChange: (value: string) => void
  onStatusChange: (value: MapMarkerStatus | 'all') => void
}

const STATUS_OPTIONS: { value: MapMarkerStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'Semua Status' },
  { value: 'active', label: STATUS_LABELS.active },
  { value: 'temporary', label: STATUS_LABELS.temporary },
  { value: 'attention', label: STATUS_LABELS.attention },
  { value: 'inactive', label: STATUS_LABELS.inactive },
]

export default function MapFilters({
  rtOptions,
  rwOptions,
  rtFilter,
  rwFilter,
  statusFilter,
  onRtChange,
  onRwChange,
  onStatusChange,
}: Props) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
      <div className="min-w-[120px] flex-1">
        <label htmlFor="map-filter-rt" className="mb-1 block text-2xs font-semibold text-slate-500">
          Filter RT
        </label>
        <select
          id="map-filter-rt"
          value={rtFilter}
          onChange={(e) => onRtChange(e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/15"
        >
          <option value="all">Semua RT</option>
          {rtOptions.map((rt) => (
            <option key={rt} value={rt}>
              {displayRT(rt)}
            </option>
          ))}
        </select>
      </div>
      <div className="min-w-[120px] flex-1">
        <label htmlFor="map-filter-rw" className="mb-1 block text-2xs font-semibold text-slate-500">
          Filter RW
        </label>
        <select
          id="map-filter-rw"
          value={rwFilter}
          onChange={(e) => onRwChange(e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/15"
        >
          <option value="all">Semua RW</option>
          {rwOptions.map((rw) => (
            <option key={rw} value={rw}>
              {displayRW(rw)}
            </option>
          ))}
        </select>
      </div>
      <div className="min-w-[140px] flex-1">
        <label
          htmlFor="map-filter-status"
          className="mb-1 block text-2xs font-semibold text-slate-500"
        >
          Status Warga
        </label>
        <select
          id="map-filter-status"
          value={statusFilter}
          onChange={(e) => onStatusChange(e.target.value as MapMarkerStatus | 'all')}
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/15"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}
