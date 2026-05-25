import { createClient } from '@/services/supabase/server'
import type { MapCitizenMarker, MapMarkerStatus, MapMarkersPayload, MapStats } from '@/types/maps'

const MARKER_LIMIT = 500

function toNumber(value: unknown): number | null {
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

function normalizeName(name: string): string {
  return name.trim().toLowerCase()
}

function buildStats(markers: MapCitizenMarker[]): MapStats {
  const stats: MapStats = {
    total: markers.length,
    active: 0,
    temporary: 0,
    attention: 0,
    inactive: 0,
    rtBreakdown: {},
    rwBreakdown: {},
  }

  for (const m of markers) {
    stats[m.status] += 1
    stats.rtBreakdown[m.rt] = (stats.rtBreakdown[m.rt] || 0) + 1
    stats.rwBreakdown[m.rw] = (stats.rwBreakdown[m.rw] || 0) + 1
  }

  return stats
}

function resolveStatus(
  hasCitizenMatch: boolean,
  hasActiveReport: boolean
): MapMarkerStatus {
  if (hasActiveReport) return 'attention'
  if (!hasCitizenMatch) return 'temporary'
  return 'active'
}

export async function getMapMarkers(): Promise<MapMarkersPayload> {
  const supabase = await createClient()

  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const [housesRes, citizensRes, reportsRes] = await Promise.all([
    supabase
      .from('houses')
      .select('id, owner_name, house_number, address, latitude, longitude')
      .not('latitude', 'is', null)
      .not('longitude', 'is', null)
      .limit(MARKER_LIMIT),
    supabase
      .from('citizen_profiles')
      .select('id, rt, rw, address, profiles(full_name)'),
    supabase
      .from('reports')
      .select('profile_id, created_at')
      .gte('created_at', thirtyDaysAgo.toISOString())
      .limit(200),
  ])

  const houses = housesRes.data || []
  const citizens = citizensRes.data || []
  const reports = reportsRes.data || []

  const citizenByName = new Map<string, { rt: string; rw: string; id: string }>()
  for (const c of citizens) {
    const profile = c.profiles as { full_name?: string } | null
    const name = profile?.full_name
    if (!name) continue
    citizenByName.set(normalizeName(name), {
      rt: c.rt || '-',
      rw: c.rw || '-',
      id: c.id,
    })
  }

  const reportProfileIds = new Set(
    reports.map((r) => r.profile_id).filter(Boolean) as string[]
  )

  const markers: MapCitizenMarker[] = []

  for (const house of houses) {
    const lat = toNumber(house.latitude)
    const lng = toNumber(house.longitude)
    if (lat == null || lng == null) continue

    const citizen = citizenByName.get(normalizeName(house.owner_name))
    const hasCitizenMatch = !!citizen
    const hasActiveReport = citizen ? reportProfileIds.has(citizen.id) : false

    markers.push({
      id: house.id,
      fullName: house.owner_name,
      houseNumber: house.house_number,
      rt: citizen?.rt || '-',
      rw: citizen?.rw || '-',
      latitude: lat,
      longitude: lng,
      status: resolveStatus(hasCitizenMatch, hasActiveReport),
      address: house.address,
    })
  }

  return {
    markers,
    stats: buildStats(markers),
  }
}
