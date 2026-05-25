'use client'

interface LocationPreviewProps {
  latitude: number | null
  longitude: number | null
}

export default function LocationPreview({ latitude, longitude }: LocationPreviewProps) {
  if (latitude === null || longitude === null) return null

  return (
    <div className="bg-[#f5f7fb]/80 border border-slate-100 rounded-xl px-4 py-3 text-4xs font-bold text-slate-500 flex items-center justify-between uppercase tracking-wider">
      <div>
        <span className="text-slate-400 mr-1.5">Lat:</span>
        <span className="text-slate-700 mr-4 font-mono">{latitude.toFixed(7)}</span>
        <span className="text-slate-400 mr-1.5">Lng:</span>
        <span className="text-slate-700 font-mono">{longitude.toFixed(7)}</span>
      </div>
    </div>
  )
}
