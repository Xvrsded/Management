'use client'

import Link from 'next/link'
import { ExternalLink, Copy, MapPin } from 'lucide-react'
import { toast } from 'sonner'
import type { MapCitizenMarker } from '@/types/maps'
import { STATUS_LABELS, copyCoordinates, getGoogleMapsUrl } from './map-utils'
import { displayRT, displayRW } from '@/lib/region-format'

type Props = {
  marker: MapCitizenMarker
}

export default function MapPopupCard({ marker }: Props) {
  const handleCopy = async () => {
    const ok = await copyCoordinates(marker.latitude, marker.longitude)
    if (ok) toast.success('Koordinat disalin')
    else toast.error('Gagal menyalin koordinat')
  }

  return (
    <div className="min-w-[180px] max-w-[220px] p-0.5">
      <p className="text-sm font-semibold text-slate-900">{marker.fullName}</p>
      <p className="mt-0.5 text-xs text-slate-500">
        {displayRT(marker.rt)} / {displayRW(marker.rw)}
      </p>
      <p className="mt-1 flex items-center gap-1 text-xs text-slate-600">
        <MapPin className="h-3 w-3 shrink-0" aria-hidden />
        No. {marker.houseNumber}
      </p>
      <p className="mt-1 text-2xs text-slate-400 line-clamp-2">{marker.address}</p>
      <span className="mt-2 inline-block rounded-md bg-slate-100 px-2 py-0.5 text-2xs font-medium text-slate-700">
        {STATUS_LABELS[marker.status]}
      </span>
      <div className="mt-3 flex flex-wrap gap-2">
        <a
          href={getGoogleMapsUrl(marker.latitude, marker.longitude)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-2 py-1 text-2xs font-semibold text-blue-700 hover:bg-blue-100"
        >
          <ExternalLink className="h-3 w-3" aria-hidden />
          Google Maps
        </a>
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2 py-1 text-2xs font-semibold text-slate-700 hover:bg-slate-200"
        >
          <Copy className="h-3 w-3" aria-hidden />
          Salin
        </button>
        <Link
          href="/rumah"
          className="inline-flex items-center rounded-lg border border-slate-200 px-2 py-1 text-2xs font-semibold text-slate-600 hover:bg-slate-50"
        >
          Detail
        </Link>
      </div>
    </div>
  )
}
