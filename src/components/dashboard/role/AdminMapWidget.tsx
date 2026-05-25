'use client'

import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

// Fix for default Leaflet marker icons in Next.js
const customMarkerIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
})

export interface MapHouse {
  id: string
  latitude: number
  longitude: number
  house_number: string
  address: string
  fullName: string
  phone: string
}

interface AdminMapWidgetProps {
  houses: MapHouse[]
}

export default function AdminMapWidget({ houses }: AdminMapWidgetProps) {
  const validHouses = houses.filter(h => h.latitude && h.longitude)

  // Center map on the first valid house, or fallback to a default location (Jakarta)
  const defaultCenter: [number, number] = validHouses.length > 0
    ? [Number(validHouses[0].latitude), Number(validHouses[0].longitude)]
    : [-6.200000, 106.816666]

  return (
    <div className="w-full h-full rounded-2xl overflow-hidden relative z-0 border border-slate-100 shadow-inner">
      <MapContainer 
        center={defaultCenter} 
        zoom={16} 
        scrollWheelZoom={false} 
        className="w-full h-full"
        style={{ minHeight: '350px' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />
        {validHouses.map((house) => (
          <Marker 
            key={house.id} 
            position={[Number(house.latitude), Number(house.longitude)]} 
            icon={customMarkerIcon}
          >
            <Popup className="rounded-xl font-sans">
              <div className="space-y-2 p-1 min-w-[150px]">
                <div className="border-b border-slate-100 pb-2 mb-2">
                  <p className="text-[10px] font-extrabold text-blue-600 uppercase tracking-widest leading-none">
                    Rumah Warga
                  </p>
                  <p className="text-xs font-bold text-slate-800 mt-1 leading-tight">
                    {house.house_number ? `Blok ${house.house_number}` : 'Tanpa Blok'}
                  </p>
                </div>
                <div>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">
                    Nama Pemilik
                  </p>
                  <p className="text-sm font-black text-slate-700 leading-tight mt-0.5">
                    {house.fullName || 'Tidak Terdaftar'}
                  </p>
                </div>
                <div>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mt-1">
                    Nomor Telepon
                  </p>
                  <p className="text-xs font-semibold text-slate-600 leading-tight mt-0.5 font-mono">
                    {house.phone || 'Tidak Ada Data'}
                  </p>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}
