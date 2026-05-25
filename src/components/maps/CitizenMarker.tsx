'use client'

import { Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import type { MapCitizenMarker } from '@/types/maps'
import { MARKER_COLORS } from './map-utils'
import MapPopupCard from './MapPopupCard'

function createStatusIcon(status: MapCitizenMarker['status']) {
  const color = MARKER_COLORS[status]
  return L.divIcon({
    className: 'citizen-map-marker',
    html: `<div style="width:16px;height:16px;border-radius:50%;background:${color};border:2px solid #fff;box-shadow:0 1px 4px rgba(15,23,42,.25)"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
    popupAnchor: [0, -10],
  })
}

type Props = {
  marker: MapCitizenMarker
}

export default function CitizenMarker({ marker }: Props) {
  const icon = createStatusIcon(marker.status)

  return (
    <Marker position={[marker.latitude, marker.longitude]} icon={icon}>
      <Popup closeButton minWidth={200} maxWidth={240}>
        <MapPopupCard marker={marker} />
      </Popup>
    </Marker>
  )
}
