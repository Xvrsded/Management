export type MapMarkerStatus = 'active' | 'temporary' | 'inactive' | 'attention'

export type MapCitizenMarker = {
  id: string
  fullName: string
  houseNumber: string
  rt: string
  rw: string
  latitude: number
  longitude: number
  status: MapMarkerStatus
  address: string
}

export type MapStats = {
  total: number
  active: number
  temporary: number
  attention: number
  inactive: number
  rtBreakdown: Record<string, number>
  rwBreakdown: Record<string, number>
}

export type MapMarkersPayload = {
  markers: MapCitizenMarker[]
  stats: MapStats
}
