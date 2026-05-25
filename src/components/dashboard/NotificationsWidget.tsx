'use client'

import { Bell } from 'lucide-react'

export interface NotificationItem {
  id: string
  title: string
  message: string
  created_at: string
  is_read: boolean
}

interface NotificationsWidgetProps {
  notifications: NotificationItem[]
}

export default function NotificationsWidget({ notifications }: NotificationsWidgetProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4.5">
      <div className="flex items-center space-x-2 mb-4">
        <Bell className="w-4 h-4 text-blue-600" />
        <h4 className="text-3xs font-extrabold text-slate-800 uppercase tracking-widest">Notifikasi Aktivitas</h4>
      </div>

      {notifications.length > 0 ? (
        <div className="relative pl-3.5 border-l border-slate-100 space-y-4">
          {notifications.map((item) => (
            <div key={item.id} className="relative text-xs">
              {/* Timeline Bullet */}
              <span className={`absolute -left-[18.5px] top-1 w-2 h-2 rounded-full ring-4 ring-white shrink-0 ${
                item.is_read ? 'bg-slate-300' : 'bg-blue-600 animate-pulse'
              }`} />
              
              <div className="flex-1">
                <div className="flex justify-between items-baseline gap-2">
                  <p className="font-bold text-slate-800 leading-tight">{item.title}</p>
                  <span className="text-4xs text-slate-400 font-semibold whitespace-nowrap uppercase tracking-wider">
                    {new Date(item.created_at).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short'
                    })}
                  </span>
                </div>
                <p className="text-4xs text-slate-500 mt-1 leading-relaxed font-medium">{item.message}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-5">
          <div className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-50 text-slate-400 mb-2">
            <Bell className="w-3.5 h-3.5" />
          </div>
          <p className="text-4xs text-slate-500 font-bold uppercase tracking-wider">Belum ada notifikasi baru.</p>
        </div>
      )}
    </div>
  )
}
