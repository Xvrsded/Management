'use client'

import { useEffect, useMemo } from 'react'
import { MapContainer, TileLayer, useMap } from 'react-leaflet'
import type { LatLngBoundsExpression } from 'leaflet'
import type { MapCitizenMarker } from '@/types/maps'
import CitizenMarker from './CitizenMarker'
import MapLegend from './MapLegend'

const DEFAULT_CENTER: [number, number] = [-6.2088, 106.8456]
const DEFAULT_ZOOM = 15

function FitBounds({ markers }: { markers: MapCitizenMarker[] }) {
  const map = useMap()

  useEffect(() => {
    if (markers.length === 0) return
    if (markers.length === 1) {
      map.setView([markers[0].latitude, markers[0].longitude], 17)
      return
    }
    const bounds: LatLngBoundsExpression = markers.map((m) => [m.latitude, m.longitude])
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 17 })
  }, [map, markers])

  return null
}

type Props = {
  markers: MapCitizenMarker[]
  fullscreen?: boolean
}

export default function AdminCitizenMap({ markers, fullscreen = false }: Props) {
  const center = useMemo((): [number, number] => {
    if (markers.length === 0) return DEFAULT_CENTER
    const sum = markers.reduce(
      (acc, m) => ({ lat: acc.lat + m.latitude, lng: acc.lng + m.longitude }),
      { lat: 0, lng: 0 }
    )
    return [sum.lat / markers.length, sum.lng / markers.length]
  }, [markers])

  const heightClass = fullscreen
    ? 'h-[calc(100dvh-8rem)]'
    : 'h-[min(420px,55vh)] sm:h-[min(520px,60vh)]'

  return (
    <div className={`relative w-full overflow-hidden rounded-xl border border-slate-200 ${heightClass}`}>
      <MapContainer
        center={center}
        zoom={DEFAULT_ZOOM}
        className="h-full w-full z-0"
        scrollWheelZoom
        zoomControl
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds markers={markers} />
        {markers.map((marker) => (
          <CitizenMarker key={marker.id} marker={marker} />
        ))}
      </MapContainer>

      <div className="pointer-events-none absolute bottom-3 left-3 z-[1000]">
        <div className="pointer-events-auto">
          <MapLegend />
        </div>
      </div>
    </div>
  )
}
