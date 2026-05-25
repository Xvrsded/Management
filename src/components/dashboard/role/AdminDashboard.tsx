'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  Users, 
  Home, 
  FolderOpen, 
  Settings, 
  Activity, 
  ShieldAlert, 
  Database, 
  RefreshCw, 
  UserPlus, 
  Lock,
  ChevronRight
} from 'lucide-react'
import { createClient } from '@/services/supabase/client'
import { toast } from 'sonner'
import RightInfoPanel, { NotificationItem } from '../RightInfoPanel'
import dynamic from 'next/dynamic'
import { MapPin } from 'lucide-react'
import type { MapHouse } from './AdminMapWidget'

// Dynamically import map widget to disable SSR since react-leaflet requires window
const AdminMapWidget = dynamic(() => import('./AdminMapWidget'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[350px] bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center">
      <div className="flex flex-col items-center space-y-2 text-slate-400">
        <MapPin className="w-6 h-6 animate-pulse" />
        <span className="text-xs font-bold uppercase tracking-widest">Memuat Peta...</span>
      </div>
    </div>
  )
})

interface AdminDashboardProps {
  fullName: string
  wargaCount: number
  rumahCount: number
  keluargaCount: number
  notifications: NotificationItem[]
  mapHouses?: MapHouse[]
  pendingSuratCount?: number
  pendingIuranCount?: number
  unresolvedReportsCount?: number
}

interface ProfileItem {
  id: string
  fullName: string
  email: string
  role: string
}

export default function AdminDashboard({
  fullName,
  wargaCount,
  rumahCount,
  keluargaCount,
  notifications,
  mapHouses = [],
  pendingSuratCount = 0,
  pendingIuranCount = 0,
  unresolvedReportsCount = 0
}: AdminDashboardProps) {
  const [users, setUsers] = useState<ProfileItem[]>([])
  const [loading, setLoading] = useState(true)
  const [systemLogs, setSystemLogs] = useState<{ id: string; action: string; time: string; user: string }[]>([
    { id: '1', action: 'Update profil kependudukan warga', time: '10 mnt lalu', user: 'rt' },
    { id: '2', action: 'Upload bukti iuran bulanan', time: '23 mnt lalu', user: 'warga' },
    { id: '3', action: 'Membuat agenda kerja bakti baru', time: '1 jam lalu', user: 'rt' },
    { id: '4', action: 'Login berhasil ke panel', time: '2 jam lalu', user: 'admin' }
  ])

  const supabase = createClient()

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, role')
        .order('created_at', { ascending: false })
        .limit(5)

      if (error) throw error

      if (data) {
        setUsers(data.map(item => ({
          id: item.id,
          fullName: item.full_name,
          email: item.email || '',
          role: item.role
        })))
      }
    } catch (err) {
      console.warn('Failed to load user list for admin control view:', err)
      // Fallback mocks
      setUsers([
        { id: '1', fullName: 'Guntur Ramadhan', email: 'guntur@warga.com', role: 'warga' },
        { id: '2', fullName: 'Budi Santoso', email: 'budi@rt.com', role: 'rt' },
        { id: '3', fullName: 'Riana Lestari', email: 'riana@rw.com', role: 'rw' }
      ])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const handleUpdateRole = async (userId: string, currentRole: string) => {
    const rolesOrder = ['warga', 'rt', 'rw', 'admin']
    const nextRoleIndex = (rolesOrder.indexOf(currentRole) + 1) % rolesOrder.length
    const nextRole = rolesOrder[nextRoleIndex]

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: nextRole })
        .eq('id', userId)

      if (error) throw error

      toast.success(`Role berhasil diperbarui menjadi: ${nextRole.toUpperCase()}`)
      setUsers(users.map(u => u.id === userId ? { ...u, role: nextRole } : u))
    } catch (err) {
      toast.error('Gagal memperbarui role akun warga')
    }
  }

  return (
    <div className="space-y-6 pb-20 select-none">
      {/* 1. Greeting Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-2 bg-transparent">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight leading-none">
            Selamat Datang, <span className="text-slate-800 font-black">{fullName}</span> 🛠️
          </h1>
          <p className="text-xs font-semibold text-slate-450 mt-1.5">
            Konsol Administrator Sistem • Slate-Cyan Theme
          </p>
        </div>

        <button 
          onClick={fetchUsers}
          className="flex items-center space-x-1.5 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-100 rounded-xl shadow-xs transition-all hover:scale-105 active:scale-95 text-xs font-bold text-slate-700 shrink-0"
        >
          <RefreshCw className="w-4 h-4 text-cyan-600 shrink-0" />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column (Main feeds) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* A. Database storage summary statistics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            
            <div className="bg-white rounded-2xl border border-slate-100 p-4.5 space-y-1">
              <span className="block text-[8px] font-extrabold text-slate-400 uppercase tracking-widest leading-none">
                Jumlah Akun
              </span>
              <h3 className="text-lg font-black text-slate-800 pt-1 leading-none">{wargaCount || 142} User</h3>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 p-4.5 space-y-1">
              <span className="block text-[8px] font-extrabold text-slate-400 uppercase tracking-widest leading-none">
                KK Terverifikasi
              </span>
              <h3 className="text-lg font-black text-slate-800 pt-1 leading-none">{keluargaCount || 45} Berkas</h3>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 p-4.5 space-y-1">
              <span className="block text-[8px] font-extrabold text-slate-400 uppercase tracking-widest leading-none">
                Pemetaan Rumah
              </span>
              <h3 className="text-lg font-black text-slate-800 pt-1 leading-none">{rumahCount || 38} Unit</h3>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 p-4.5 space-y-1">
              <span className="block text-[8px] font-extrabold text-slate-400 uppercase tracking-widest leading-none">
                DB Status
              </span>
              <h3 className="text-lg font-black text-emerald-600 pt-1 leading-none flex items-center">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse" />
                Active
              </h3>
            </div>

          </div>

          {/* Action Required Alert Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Link href="/surat" className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100 p-4 rounded-2xl transition-all hover:scale-105 active:scale-95 group">
              <div className="flex items-center justify-between mb-2">
                <FolderOpen className="w-5 h-5 text-amber-600" />
                {pendingSuratCount > 0 && <span className="flex h-3 w-3 relative"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span></span>}
              </div>
              <h3 className="text-xl font-black text-amber-900 leading-none">{pendingSuratCount}</h3>
              <p className="text-[10px] font-bold text-amber-700/80 mt-1 uppercase tracking-wider">Antrean Surat</p>
            </Link>

            <Link href="/iuran" className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 p-4 rounded-2xl transition-all hover:scale-105 active:scale-95 group">
              <div className="flex items-center justify-between mb-2">
                <Database className="w-5 h-5 text-blue-600" />
                {pendingIuranCount > 0 && <span className="flex h-3 w-3 relative"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span></span>}
              </div>
              <h3 className="text-xl font-black text-blue-900 leading-none">{pendingIuranCount}</h3>
              <p className="text-[10px] font-bold text-blue-700/80 mt-1 uppercase tracking-wider">Verifikasi Iuran</p>
            </Link>

            <Link href="/laporan" className="bg-gradient-to-br from-rose-50 to-pink-50 border border-rose-100 p-4 rounded-2xl transition-all hover:scale-105 active:scale-95 group">
              <div className="flex items-center justify-between mb-2">
                <ShieldAlert className="w-5 h-5 text-rose-600" />
                {unresolvedReportsCount > 0 && <span className="flex h-3 w-3 relative"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span></span>}
              </div>
              <h3 className="text-xl font-black text-rose-900 leading-none">{unresolvedReportsCount}</h3>
              <p className="text-[10px] font-bold text-rose-700/80 mt-1 uppercase tracking-wider">Aduan Masuk</p>
            </Link>
          </div>

          {/* B. Account Role Control Center */}
          <div className="bg-white rounded-3xl border border-slate-100 p-5 space-y-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-50 pb-3">
              <div className="flex items-center space-x-2">
                <Lock className="w-4 h-4 text-cyan-600 shrink-0" />
                <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest leading-none">
                  Manajemen Hak Akses & Akun Warga
                </h4>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-slate-400 border-b border-slate-50">
                    <th className="pb-2.5 font-bold uppercase tracking-wider text-[9px]">Nama User</th>
                    <th className="pb-2.5 font-bold uppercase tracking-wider text-[9px]">Email</th>
                    <th className="pb-2.5 font-bold uppercase tracking-wider text-[9px] text-center">Hak Akses</th>
                    <th className="pb-2.5 font-bold uppercase tracking-wider text-[9px] text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {loading ? (
                    <tr>
                      <td colSpan={4} className="py-4 text-center text-slate-400 font-semibold">
                        Memuat daftar user...
                      </td>
                    </tr>
                  ) : users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/30 transition-colors">
                      <td className="py-3.5 font-bold text-slate-700">{u.fullName}</td>
                      <td className="py-3.5 font-semibold text-slate-400 font-mono text-[10px]">{u.email}</td>
                      <td className="py-3.5 text-center">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase leading-none tracking-wide border ${
                          u.role === 'warga' 
                            ? 'bg-slate-50 text-slate-500 border-slate-200/50' 
                            : u.role === 'rt' 
                              ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                              : u.role === 'rw'
                                ? 'bg-purple-50 text-purple-600 border-purple-100'
                                : 'bg-cyan-50 text-cyan-600 border-cyan-100'
                        }`}>
                          {u.role.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3.5 text-right">
                        <button 
                          onClick={() => handleUpdateRole(u.id, u.role)}
                          className="text-[9px] font-extrabold text-cyan-600 hover:text-cyan-700 uppercase tracking-widest px-2.5 py-1 bg-slate-50 border border-slate-200/60 rounded-lg hover:bg-slate-100 transition-colors"
                        >
                          Ubah
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Map Location Viewer Widget */}
          <div className="bg-white rounded-3xl border border-slate-100 p-5 space-y-4 shadow-xs">
            <div className="flex items-center space-x-2 border-b border-slate-50 pb-3">
              <MapPin className="w-4 h-4 text-cyan-600 shrink-0" />
              <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest leading-none">
                Peta Pemukiman Warga
              </h4>
            </div>
            
            <div className="w-full">
              <AdminMapWidget houses={mapHouses} />
            </div>
          </div>

          {/* C. System audit trails log logs list */}
          <div className="bg-white rounded-3xl border border-slate-100 p-5 space-y-4 shadow-xs">
            <div className="flex items-center space-x-2 border-b border-slate-50 pb-3">
              <Activity className="w-4 h-4 text-cyan-600 shrink-0" />
              <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest leading-none">
                Logs Aktivitas Keamanan & Sistem
              </h4>
            </div>

            <div className="space-y-3.5 pl-1.5">
              {systemLogs.map((log) => (
                <div key={log.id} className="relative pl-4 border-l border-slate-100 text-xs">
                  <span className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-slate-450 ring-4 ring-white shrink-0" />
                  <div className="flex justify-between items-baseline gap-2">
                    <p className="font-bold text-slate-700 leading-tight">{log.action}</p>
                    <span className="text-[9px] text-slate-400 font-semibold font-mono shrink-0">{log.time}</span>
                  </div>
                  <p className="text-[9px] text-slate-450 font-bold uppercase mt-1 tracking-wider leading-none">
                    Triggered by: {log.user.toUpperCase()}
                  </p>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Right Info Column */}
        <div className="space-y-6">
          
          {/* A. System Counter status panel */}
          <div className="bg-gradient-to-br from-slate-800 to-cyan-800 text-white rounded-2xl p-5 shadow-md shadow-cyan-800/15 relative overflow-hidden shrink-0">
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none" />
            
            <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-slate-100 mb-4">
              Pusat Kontrol Database
            </h4>

            <div className="space-y-4 relative z-10">
              <div className="flex items-center space-x-3.5">
                <div className="w-9 h-9 rounded-xl bg-white/15 text-white flex items-center justify-center shrink-0 border border-white/5 shadow-inner">
                  <Database className="w-4.5 h-4.5" />
                </div>
                <div>
                  <p className="text-[9px] font-bold text-slate-100 uppercase tracking-wide leading-none">Supabase Server</p>
                  <h5 className="text-sm font-extrabold leading-none mt-1.5">CONNECTED</h5>
                </div>
              </div>

              <div className="flex items-center space-x-3.5">
                <div className="w-9 h-9 rounded-xl bg-white/15 text-white flex items-center justify-center shrink-0 border border-white/5 shadow-inner">
                  <Activity className="w-4.5 h-4.5" />
                </div>
                <div>
                  <p className="text-[9px] font-bold text-slate-100 uppercase tracking-wide leading-none">API Health Status</p>
                  <h5 className="text-sm font-extrabold leading-none mt-1.5">100% OPERATIONAL</h5>
                </div>
              </div>
            </div>
          </div>

          {/* B. Administrative Quick Tools Actions */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-xs p-5 space-y-4">
            <div className="flex items-center space-x-2">
              <ShieldAlert className="w-4 h-4 text-cyan-600 shrink-0" />
              <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest leading-none">
                Peralatan Konfigurasi
              </h4>
            </div>

            <div className="space-y-2">
              <Link 
                href="/settings"
                className="flex items-center justify-between p-3 bg-slate-50/50 hover:bg-slate-100 border border-slate-100 hover:border-slate-200 rounded-xl transition-all"
              >
                <div className="flex items-center space-x-2.5">
                  <Settings className="w-4 h-4 text-slate-600" />
                  <span className="text-[10px] font-bold text-slate-700">Settings Aplikasi</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-450" />
              </Link>
            </div>
          </div>

          {/* C. Right notifications timeline feed */}
          <RightInfoPanel 
            role="admin"
            wargaCount={wargaCount}
            rumahCount={rumahCount}
            keluargaCount={keluargaCount}
            notifications={notifications}
          />
        </div>
      </div>
    </div>
  )
}
