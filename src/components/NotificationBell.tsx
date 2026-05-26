'use client'

import { useState, useEffect, useRef } from 'react'
import { Bell, Check, X } from 'lucide-react'
import { notificationService, Notification } from '@/services/notificationService'
import { useAuthStore } from '@/store/useAuthStore'
import Link from 'next/link'

export default function NotificationBell() {
  const { user } = useAuthStore()
  const [unreadCount, setUnreadCount] = useState(0)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Fetch only unread count for background polling
  const fetchUnreadCount = async () => {
    if (!user?.id) return
    try {
      const count = await notificationService.getUnreadCount(user.id)
      setUnreadCount(count)
    } catch (e) {
      console.error('Failed to fetch unread count', e)
    }
  }

  // Setup lightweight polling interval with visibility state check
  useEffect(() => {
    if (!user?.id) return

    fetchUnreadCount() // initial fetch

    const intervalId = setInterval(() => {
      // Only fetch if tab is active/visible
      if (document.visibilityState === 'visible') {
        fetchUnreadCount()
      }
    }, 60000) // 60 seconds

    return () => clearInterval(intervalId)
  }, [user?.id])

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  const toggleDropdown = async () => {
    const nextIsOpen = !isOpen
    setIsOpen(nextIsOpen)
    
    if (nextIsOpen && user?.id) {
      try {
        const notifs = await notificationService.getMyNotifications(user.id)
        setNotifications(notifs)
      } catch (e) {
        console.error('Failed to fetch notifications list', e)
      }
    }
  }

  const handleMarkAsRead = async (id?: string) => {
    if (!user?.id) return
    const ok = await notificationService.markAsRead(user.id, id)
    if (ok) {
      if (id) {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
        setUnreadCount(prev => Math.max(0, prev - 1))
      } else {
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
        setUnreadCount(0)
      }
    }
  }

  if (!user) return null

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={toggleDropdown}
        className="relative w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-100 transition-colors"
      >
        <Bell className="w-4 h-4 text-slate-600" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white"></span>
        )}
      </button>

      {isOpen && (
        <div className="absolute top-10 right-0 md:-right-2 w-72 md:w-80 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-50 bg-slate-50/50">
            <h3 className="text-xs font-bold text-slate-800">Notifikasi</h3>
            {unreadCount > 0 && (
              <button 
                onClick={() => handleMarkAsRead()}
                className="text-[10px] font-semibold text-blue-600 hover:text-blue-800 flex items-center"
              >
                <Check className="w-3 h-3 mr-1" /> Tandai terbaca
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto scrollbar-thin">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-slate-400">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-20" />
                <p className="text-[10px] font-semibold">Belum ada notifikasi</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {notifications.map((notif) => (
                  <div 
                    key={notif.id} 
                    className={`p-3 transition-colors ${notif.is_read ? 'bg-white' : 'bg-blue-50/30'}`}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <p className={`text-[11px] font-bold truncate ${
                          notif.type === 'success' ? 'text-emerald-700' :
                          notif.type === 'warning' ? 'text-amber-700' :
                          notif.type === 'error' ? 'text-rose-700' : 'text-blue-700'
                        }`}>
                          {notif.title}
                        </p>
                        <p className="text-[10px] text-slate-600 mt-0.5 leading-snug line-clamp-2">
                          {notif.message}
                        </p>
                        <p className="text-[8px] text-slate-400 font-semibold mt-1">
                          {new Date(notif.created_at).toLocaleString('id-ID', {
                            day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                          })}
                        </p>
                      </div>
                      {!notif.is_read && (
                        <button 
                          onClick={() => handleMarkAsRead(notif.id)}
                          className="w-5 h-5 flex items-center justify-center rounded hover:bg-blue-100 text-blue-600 shrink-0"
                        >
                          <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
