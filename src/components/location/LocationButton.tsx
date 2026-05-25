'use client'

import { MapPin, Loader2 } from 'lucide-react'

interface LocationButtonProps {
  onClick: () => void
  loading: boolean
  disabled?: boolean
  label?: string
}

export default function LocationButton({ onClick, loading, disabled = false, label = 'Gunakan Lokasi Saya' }: LocationButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading || disabled}
      className="flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-3 px-4 font-semibold text-xs transition-all shadow-xs shadow-blue-600/10 focus:outline-none focus:ring-4 focus:ring-blue-100 disabled:opacity-50 disabled:cursor-not-allowed touch-target-large shrink-0"
    >
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin text-white shrink-0" />
          <span>Mengambil Lokasi...</span>
        </>
      ) : (
        <>
          <MapPin className="w-4 h-4 text-white shrink-0" />
          <span>{label}</span>
        </>
      )}
    </button>
  )
}
