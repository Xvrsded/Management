'use client'

import { useEffect, useState } from 'react'
import { reportsService, Report, ReportStatus } from '@/services/reportsService'
import { useAuthStore } from '@/store/useAuthStore'
import { AlertTriangle, MapPin, Search, Loader2, CheckCircle2, XCircle } from 'lucide-react'
import LocationMapLink from '@/components/location/LocationMapLink'
import { toast } from 'sonner'

export default function AdminLaporan() {
  const { user } = useAuthStore()
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)
  
  // Filters
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  const fetchReports = async () => {
    setLoading(true)
    try {
      const data = await reportsService.getAllReports()
      setReports(data)
    } catch (err) {
      toast.error('Gagal mengambil data aduan warga')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReports()
  }, [])

  const handleUpdateStatus = async (reportId: string, newStatus: ReportStatus) => {
    if (!user) return
    setUpdating(reportId)
    const { success, error } = await reportsService.updateStatus(reportId, user.id, newStatus)
    
    if (success) {
      toast.success('Status aduan berhasil diperbarui')
      setReports(reports.map(r => r.id === reportId ? { ...r, status: newStatus } : r))
    } else {
      toast.error(error || 'Gagal memperbarui status')
    }
    setUpdating(null)
  }

  const filteredReports = reports.filter(r => {
    const matchesStatus = filterStatus === 'all' || r.status === filterStatus
    const matchesSearch = r.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          r.profiles?.full_name.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesStatus && matchesSearch
  })

  return (
    <div className="space-y-6 pb-20 select-none">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight flex items-center">
            <AlertTriangle className="w-6 h-6 mr-2 text-rose-600 shrink-0" />
            Manajemen Laporan Warga
          </h1>
          <p className="text-xs font-semibold text-slate-450 mt-1.5">
            Tinjau, proses, dan selesaikan keluhan warga secara terpusat
          </p>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-xs p-4 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-400" />
          </div>
          <input
            type="text"
            placeholder="Cari nama pelapor atau judul aduan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 w-full bg-slate-50 border border-slate-100 text-slate-800 text-xs font-semibold rounded-xl focus:ring-rose-500 focus:border-rose-500 block p-2.5 transition-colors"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="bg-slate-50 border border-slate-100 text-slate-800 text-xs font-bold rounded-xl focus:ring-rose-500 focus:border-rose-500 block p-2.5 outline-none min-w-[160px]"
        >
          <option value="all">Semua Status</option>
          <option value="submitted">Terkirim (Menunggu)</option>
          <option value="reviewing">Sedang Ditinjau</option>
          <option value="in_progress">Sedang Diproses</option>
          <option value="resolved">Selesai</option>
          <option value="rejected">Ditolak</option>
        </select>
      </div>

      {/* Report Canvas */}
      {loading ? (
        <div className="text-center py-20 flex flex-col items-center justify-center space-y-2">
          <Loader2 className="w-8 h-8 animate-spin text-rose-600" />
          <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Memuat Data Laporan...</p>
        </div>
      ) : filteredReports.length === 0 ? (
        <div className="text-center bg-white rounded-3xl border border-slate-100 shadow-xs p-12">
          <div className="w-16 h-16 rounded-full bg-slate-50 text-slate-300 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <p className="text-sm text-slate-700 font-bold">Tidak ada laporan warga</p>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto leading-relaxed font-semibold">
            Belum ada aduan yang sesuai dengan kriteria filter saat ini.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredReports.map((report) => (
            <div key={report.id} className="bg-white rounded-3xl border border-slate-100 shadow-xs overflow-hidden flex flex-col relative group transition-all hover:shadow-md hover:border-slate-200">
              {/* Top Banner Status */}
              <div className={`px-5 py-2.5 flex items-center justify-between border-b ${
                report.status === 'submitted' ? 'bg-slate-50 border-slate-100 text-slate-600' :
                report.status === 'reviewing' ? 'bg-amber-50 border-amber-100 text-amber-700' :
                report.status === 'in_progress' ? 'bg-blue-50 border-blue-100 text-blue-700' :
                report.status === 'resolved' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' :
                'bg-rose-50 border-rose-100 text-rose-700'
              }`}>
                <span className="text-[10px] font-black uppercase tracking-widest">
                  {report.status === 'submitted' && 'Menunggu Tinjauan'}
                  {report.status === 'reviewing' && 'Sedang Ditinjau'}
                  {report.status === 'in_progress' && 'Sedang Diproses'}
                  {report.status === 'resolved' && 'Selesai'}
                  {report.status === 'rejected' && 'Ditolak'}
                </span>
                <span className="text-[9px] font-bold opacity-70">
                  {new Date(report.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

              <div className="p-5 flex-1 flex flex-col">
                <div className="flex justify-between items-start gap-4 mb-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 leading-tight">{report.title}</h3>
                    <p className="text-[10px] font-bold text-rose-600 uppercase tracking-widest mt-1">
                      Kategori: {report.category}
                    </p>
                  </div>
                  {report.latitude && report.longitude && (
                    <LocationMapLink latitude={report.latitude} longitude={report.longitude} />
                  )}
                </div>

                <div className="bg-slate-50/50 rounded-xl p-3 border border-slate-100 mb-4 flex-1">
                  <p className="text-xs text-slate-600 font-semibold leading-relaxed line-clamp-4">
                    {report.description}
                  </p>
                  {report.photo_url && (
                    <div className="mt-3 w-32 h-20 rounded-lg overflow-hidden border border-slate-200">
                      <img src={report.photo_url} alt="Lampiran" loading="lazy" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between mt-auto">
                  <div className="flex items-center space-x-2">
                    <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-[10px]">
                      {report.profiles?.full_name?.charAt(0) || 'W'}
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-700">Pelapor</p>
                      <p className="text-[11px] font-bold text-slate-900 leading-none">{report.profiles?.full_name || 'Warga'}</p>
                    </div>
                  </div>
                  
                  {/* Admin Actions */}
                  <div className="flex items-center space-x-1">
                    {updating === report.id ? (
                      <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
                    ) : (
                      <>
                        {report.status === 'submitted' && (
                          <button onClick={() => handleUpdateStatus(report.id, 'reviewing')} className="px-3 py-1.5 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors border border-amber-200/50">
                            Tinjau
                          </button>
                        )}
                        {report.status === 'reviewing' && (
                          <button onClick={() => handleUpdateStatus(report.id, 'in_progress')} className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors border border-blue-200/50">
                            Proses
                          </button>
                        )}
                        {report.status === 'in_progress' && (
                          <button onClick={() => handleUpdateStatus(report.id, 'resolved')} className="px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors border border-emerald-200/50 flex items-center">
                            <CheckCircle2 className="w-3 h-3 mr-1" /> Selesai
                          </button>
                        )}
                        {['submitted', 'reviewing'].includes(report.status) && (
                          <button onClick={() => handleUpdateStatus(report.id, 'rejected')} className="w-7 h-7 flex items-center justify-center bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg transition-colors border border-rose-200/50">
                            <XCircle className="w-4 h-4" />
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
