'use client'

import { Map, ExternalLink } from 'lucide-react'

interface LocationMapLinkProps {
  latitude: number | null
  longitude: number | null
  label?: string
}

export default function LocationMapLink({ latitude, longitude, label = 'Buka di Google Maps' }: LocationMapLinkProps) {
  if (latitude === null || longitude === null) return null

  const mapsUrl = `https://maps.google.com/?q=${latitude},${longitude}`

  return (
    <a
      href={mapsUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center space-x-1.5 text-blue-600 hover:text-blue-700 hover:underline text-xs font-semibold"
    >
      <Map className="w-3.5 h-3.5 text-blue-600 shrink-0" />
      <span>{label}</span>
      <ExternalLink className="w-3 h-3 text-blue-400 shrink-0" />
    </a>
  )
}
