'use client'

import Link from 'next/link'
import { Megaphone, ChevronRight, Info } from 'lucide-react'

export interface Announcement {
  id: string
  title: string
  content: string
  created_at: string
}

interface AnnouncementsWidgetProps {
  announcements: Announcement[]
}

export default function AnnouncementsWidget({ announcements }: AnnouncementsWidgetProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100/80 shadow-xs p-5 select-none">
      <div className="flex items-center justify-between mb-4 sm:mb-5">
        <div className="flex items-center space-x-2">
          <Megaphone className="w-4 h-4 text-blue-600 shrink-0" />
          <h4 className="text-[10px] font-extrabold text-slate-800 uppercase tracking-widest leading-none">
            Pengumuman Warga
          </h4>
        </div>
        <Link 
          href="/pengumuman" 
          className="text-[9px] font-extrabold text-blue-600 hover:text-blue-700 uppercase tracking-wider flex items-center hover:underline transition-colors shrink-0"
        >
          Lihat Semua <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
        </Link>
      </div>

      {announcements.length > 0 ? (
        <div className="space-y-4">
          {announcements.map((item, idx) => (
            <div
              key={item.id}
              className={`pb-4 group ${idx < announcements.length - 1 ? 'border-b border-slate-100/50' : ''}`}
            >
              <div className="flex justify-between items-start gap-2">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                  {new Date(item.created_at).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  })}
                </span>
              </div>
              <p className="text-xs font-bold text-slate-800 mt-1 leading-tight group-hover:text-blue-600 transition-colors">
                {item.title}
              </p>
              <p className="text-[10px] text-slate-500 mt-1.5 line-clamp-2 leading-relaxed font-medium">
                {item.content}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-6">
          <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-slate-50 text-slate-400 mb-2">
            <Info className="w-4 h-4" />
          </div>
          <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest">
            Belum ada pengumuman
          </p>
        </div>
      )}
    </div>
  )
}
