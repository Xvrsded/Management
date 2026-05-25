import { useState } from 'react'

export interface GeolocationState {
  latitude: number | null
  longitude: number | null
  loading: boolean
  error: string | null
}

export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>({
    latitude: null,
    longitude: null,
    loading: false,
    error: null,
  })

  const getPosition = (): Promise<{ latitude: number; longitude: number }> => {
    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !navigator.geolocation) {
        const errorMsg = 'Browser Anda tidak mendukung geolocation'
        setState((s) => ({ ...s, error: errorMsg, loading: false }))
        reject(new Error(errorMsg))
        return
      }

      setState((s) => ({ ...s, loading: true, error: null }))

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords
          setState({
            latitude,
            longitude,
            loading: false,
            error: null,
          })
          resolve({ latitude, longitude })
        },
        (error) => {
          let errorMsg = 'Gagal mengambil lokasi. Coba lagi.'
          if (error.code === error.PERMISSION_DENIED) {
            errorMsg = 'Silakan izinkan akses lokasi untuk melanjutkan'
          } else if (error.code === error.TIMEOUT) {
            errorMsg = 'Waktu pengambilan lokasi habis. Coba lagi.'
          }
          setState((s) => ({ ...s, error: errorMsg, loading: false }))
          reject(new Error(errorMsg))
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      )
    })
  }

  const clearLocation = () => {
    setState({
      latitude: null,
      longitude: null,
      loading: false,
      error: null,
    })
  }

  return { ...state, getPosition, clearLocation }
}
