'use client'

import { useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import { Map, Maximize2, Minimize2, Users } from 'lucide-react'
import type { MapCitizenMarker, MapMarkerStatus, MapStats } from '@/types/maps'
import MapFilters from './MapFilters'
import MapSkeleton from './MapSkeleton'
import { STATUS_LABELS } from './map-utils'

const AdminCitizenMap = dynamic(() => import('./AdminCitizenMap'), {
  ssr: false,
  loading: () => <MapSkeleton />,
})

type Props = {
  markers: MapCitizenMarker[]
  stats: MapStats
}

function uniqueSorted(values: string[]): string[] {
  return [...new Set(values.filter((v) => v && v !== '-'))].sort()
}

export default function MapsPageClient({ markers, stats }: Props) {
  const [rtFilter, setRtFilter] = useState('all')
  const [rwFilter, setRwFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState<MapMarkerStatus | 'all'>('all')
  const [fullscreen, setFullscreen] = useState(false)

  const rtOptions = useMemo(() => uniqueSorted(markers.map((m) => m.rt)), [markers])
  const rwOptions = useMemo(() => uniqueSorted(markers.map((m) => m.rw)), [markers])

  const filteredMarkers = useMemo(() => {
    return markers.filter((m) => {
      if (rtFilter !== 'all' && m.rt !== rtFilter) return false
      if (rwFilter !== 'all' && m.rw !== rwFilter) return false
      if (statusFilter !== 'all' && m.status !== statusFilter) return false
      return true
    })
  }, [markers, rtFilter, rwFilter, statusFilter])

  const filteredStats = useMemo(() => {
    const counts = { active: 0, temporary: 0, attention: 0, inactive: 0 }
    for (const m of filteredMarkers) counts[m.status] += 1
    return { total: filteredMarkers.length, ...counts }
  }, [filteredMarkers])

  return (
    <div className="mx-auto max-w-6xl space-y-4 pb-24 md:pb-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold text-slate-900 sm:text-2xl">
            <Map className="h-6 w-6 text-blue-600" aria-hidden />
            Peta Warga
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Monitoring lokasi rumah warga — ringan & responsif
          </p>
        </div>
        <button
          type="button"
          onClick={() => setFullscreen((v) => !v)}
          className="inline-flex min-h-[44px] items-center justify-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition-colors duration-150 hover:bg-slate-50 md:hidden"
        >
          {fullscreen ? (
            <>
              <Minimize2 className="h-4 w-4" aria-hidden />
              Tutup Layar Penuh
            </>
          ) : (
            <>
              <Maximize2 className="h-4 w-4" aria-hidden />
              Layar Penuh
            </>
          )}
        </button>
      </div>

      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-5">
        <li className="rounded-xl border border-slate-200/80 bg-white px-3 py-2.5 shadow-sm">
          <p className="text-2xs text-slate-500">Total Marker</p>
          <p className="text-lg font-bold text-slate-900">{filteredStats.total}</p>
        </li>
        <li className="rounded-xl border border-emerald-100 bg-emerald-50/80 px-3 py-2.5">
          <p className="text-2xs text-emerald-700">{STATUS_LABELS.active}</p>
          <p className="text-lg font-bold text-emerald-800">{filteredStats.active}</p>
        </li>
        <li className="rounded-xl border border-amber-100 bg-amber-50/80 px-3 py-2.5">
          <p className="text-2xs text-amber-700">{STATUS_LABELS.temporary}</p>
          <p className="text-lg font-bold text-amber-800">{filteredStats.temporary}</p>
        </li>
        <li className="rounded-xl border border-rose-100 bg-rose-50/80 px-3 py-2.5">
          <p className="text-2xs text-rose-700">{STATUS_LABELS.attention}</p>
          <p className="text-lg font-bold text-rose-800">{filteredStats.attention}</p>
        </li>
        <li className="col-span-2 rounded-xl border border-slate-200/80 bg-slate-50 px-3 py-2.5 sm:col-span-1">
          <p className="flex items-center gap-1 text-2xs text-slate-500">
            <Users className="h-3 w-3" aria-hidden />
            Wilayah
          </p>
          <p className="text-xs font-semibold text-slate-700">
            {Object.keys(stats.rtBreakdown).length} RT ·{' '}
            {Object.keys(stats.rwBreakdown).length} RW
          </p>
        </li>
      </ul>

      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
        <MapFilters
          rtOptions={rtOptions}
          rwOptions={rwOptions}
          rtFilter={rtFilter}
          rwFilter={rwFilter}
          statusFilter={statusFilter}
          onRtChange={setRtFilter}
          onRwChange={setRwFilter}
          onStatusChange={setStatusFilter}
        />
      </div>

      {filteredMarkers.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-12 text-center">
          <p className="text-sm font-medium text-slate-700">Tidak ada marker pada filter ini</p>
          <p className="mt-1 text-xs text-slate-500">
            Pastikan data rumah memiliki koordinat di menu Data Rumah.
          </p>
        </div>
      ) : (
        <AdminCitizenMap markers={filteredMarkers} fullscreen={fullscreen} />
      )}

      {markers.length >= 500 && (
        <p className="text-center text-2xs text-amber-700">
          Menampilkan maks. 500 lokasi. Gunakan filter RT/RW untuk mempersempit tampilan.
        </p>
      )}
    </div>
  )
}
