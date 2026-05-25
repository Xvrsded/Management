import type { MapMarkerStatus } from '@/types/maps'

export const MARKER_COLORS: Record<MapMarkerStatus, string> = {
  active: '#10b981',
  temporary: '#eab308',
  attention: '#ef4444',
  inactive: '#94a3b8',
}

export const STATUS_LABELS: Record<MapMarkerStatus, string> = {
  active: 'Warga Aktif',
  temporary: 'Sementara',
  attention: 'Perlu Perhatian',
  inactive: 'Tidak Aktif',
}

export function getGoogleMapsUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps?q=${lat},${lng}`
}

export function formatCoordinates(lat: number, lng: number): string {
  return `${lat.toFixed(6)}, ${lng.toFixed(6)}`
}

export async function copyCoordinates(lat: number, lng: number): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(formatCoordinates(lat, lng))
    return true
  } catch {
    return false
  }
}
