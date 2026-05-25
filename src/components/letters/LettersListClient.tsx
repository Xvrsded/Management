'use client'

import { useState, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { lettersService } from '@/services/lettersService'
import { LetterRequest } from '@/types/letters'
import LetterCard from './LetterCard'
import LetterEmptyState from './LetterEmptyState'
import LetterSkeleton from './LetterSkeleton'
import RealtimeCivicClock from './RealtimeCivicClock'
import NewRequestForm from './NewRequestForm'
import AdminLettersDashboard from './AdminLettersDashboard'
import { Search, Plus, RefreshCw, Star, Bookmark, Info, ChevronRight, Inbox, HelpCircle, FileText } from 'lucide-react'
import { toast } from 'sonner'

interface LettersListClientProps {
  initialLetters: LetterRequest[]
  userId: string
  role: string
}

export default function LettersListClient({ initialLetters, userId, role }: LettersListClientProps) {
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false)
  const [bookmarks, setBookmarks] = useState<string[]>([])
  const [categories, setCategories] = useState<any[]>([])

  const isCitizen = role === 'warga'

  // 1. RT/RW/Admin View Redirection
  if (!isCitizen) {
    return <AdminLettersDashboard userId={userId} role={role} />
  }

  // Stream live updates with TanStack Query
  const { data: letters = initialLetters, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['letters', role, userId, statusFilter, searchTerm],
    queryFn: () => lettersService.getMyLetters(role, userId, { status: statusFilter, search: searchTerm }),
    initialData: initialLetters,
    staleTime: 5000
  })

  // Load Categories & Bookmarks
  useEffect(() => {
    async function loadMetadata() {
      try {
        const [cats, bmarks] = await Promise.all([
          lettersService.getLetterCategories(),
          lettersService.getBookmarks(userId)
        ])
        setCategories(cats)
        setBookmarks(bmarks)
      } catch (err) {
        console.warn('Failed to load letter metadata')
      }
    }
    if (isCitizen) {
      loadMetadata()
    }
  }, [userId, isCitizen])

  // Listen to search params dynamically without deoptimizing static pages
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      if (params.get('action') === 'new') {
        setIsFormOpen(true)
        // Clean the URL without reload
        const newUrl = window.location.pathname
        window.history.replaceState({ path: newUrl }, '', newUrl)
      }
    }
  }, [])

  // Filter bookmarks categories
  const bookmarkedCategories = categories.filter(c => bookmarks.includes(c.id))

  const handleToggleBookmark = async (categoryId: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const isCurrentlyBookmarked = bookmarks.includes(categoryId)
    const nextBookmarks = isCurrentlyBookmarked
      ? bookmarks.filter(id => id !== categoryId)
      : [...bookmarks, categoryId]
    
    setBookmarks(nextBookmarks)
    
    const success = await lettersService.toggleBookmark(userId, categoryId, !isCurrentlyBookmarked)
    if (success) {
      toast.success(isCurrentlyBookmarked ? 'Dihapus dari favorit' : 'Disimpan ke favorit')
    } else {
      setBookmarks(bookmarks) // Fallback on fail
      toast.error('Gagal memperbarui favorit')
    }
  }

  const handleFormSuccess = () => {
    setIsFormOpen(false)
    refetch()
    queryClient.invalidateQueries(['letters'])
  }

  // Calculate quick metrics
  const activeRequests = letters.filter(l => l.status === 'pending_rt' || l.status === 'approved_rt')
  const completedRequests = letters.filter(l => l.status === 'finished')
  
  const latestRequest = letters.length > 0 ? letters[0] : null
  const latestStatusLabel = latestRequest
    ? latestRequest.status === 'pending_rt'
      ? 'Proses RT'
      : latestRequest.status === 'approved_rt'
      ? 'Proses RW'
      : latestRequest.status === 'finished'
      ? 'Selesai & Sah'
      : 'Ditolak'
    : 'Tidak ada pengajuan aktif'

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-24 select-none relative">
      
      {/* 2. Top Greeting Header Bar */}
      <div className="flex justify-between items-start md:items-center px-1 gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-black text-slate-800 tracking-tight leading-none">
            Halo Warga! 👋
          </h1>
          <p className="text-xs font-semibold text-slate-450 mt-1">
            Ajukan permohonan surat administrasi secara instan & mandiri
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="w-8.5 h-8.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center border border-slate-100 transition-colors"
            title="Perbarui Antrean"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* 3. Premium Fintech Hero Status Card */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white rounded-3xl p-5 sm:p-6 shadow-md shadow-blue-600/10 relative overflow-hidden group">
        <div className="absolute right-24 -bottom-6 text-white/5 pointer-events-none transform group-hover:scale-110 group-hover:rotate-2 transition-transform duration-500 hidden sm:block">
          <svg width="130" height="130" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
            <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1-2-1Z" />
            <path d="M9 7h6" />
            <path d="M9 11h6" />
          </svg>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 relative z-10">
          <div className="space-y-2 flex-1">
            <div className="flex items-center space-x-2.5">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase bg-white/20 border border-white/10 leading-none">
                Administrasi Mandiri
              </span>
              <RealtimeCivicClock />
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-1">
              <div>
                <p className="text-[10px] text-blue-100 font-semibold uppercase tracking-wider">Pengajuan Aktif</p>
                <h2 className="text-xl sm:text-2xl font-black tracking-tight leading-none mt-1">
                  {activeRequests.length} <span className="text-xs text-blue-200 font-medium">berkas</span>
                </h2>
              </div>
              <div>
                <p className="text-[10px] text-blue-100 font-semibold uppercase tracking-wider">Status Terkini</p>
                <h2 className="text-sm font-black tracking-tight mt-2 flex items-center leading-none truncate">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5 animate-pulse" />
                  {latestStatusLabel}
                </h2>
              </div>
              <div className="hidden sm:block">
                <p className="text-[10px] text-blue-100 font-semibold uppercase tracking-wider">Selesai Bulan Ini</p>
                <h2 className="text-xl sm:text-2xl font-black tracking-tight leading-none mt-1">
                  {completedRequests.length} <span className="text-xs text-blue-200 font-medium">surat</span>
                </h2>
              </div>
            </div>
          </div>

          <button 
            onClick={() => setIsFormOpen(true)}
            className="bg-white hover:bg-slate-50 text-blue-600 rounded-xl py-3 px-5 font-black text-xs uppercase tracking-widest transition-all hover:scale-105 active:scale-95 shadow-sm shrink-0 flex items-center justify-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Ajukan Surat Baru
          </button>
        </div>
      </div>

      {/* 4. Quick Action Shortcuts Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button 
          onClick={() => setIsFormOpen(true)}
          className="p-3.5 rounded-2xl bg-white border border-slate-100 flex flex-col items-center justify-center text-center hover:bg-slate-50 transition-colors shadow-3xs"
        >
          <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 mb-2">
            <Plus className="w-4.5 h-4.5" />
          </div>
          <span className="text-2xs font-extrabold text-slate-700">Ajukan Surat</span>
        </button>

        <button 
          onClick={() => setStatusFilter('finished')}
          className="p-3.5 rounded-2xl bg-white border border-slate-100 flex flex-col items-center justify-center text-center hover:bg-slate-50 transition-colors shadow-3xs"
        >
          <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 mb-2">
            <Bookmark className="w-4.5 h-4.5" />
          </div>
          <span className="text-2xs font-extrabold text-slate-700">Riwayat Surat</span>
        </button>

        <button 
          onClick={() => {
            if (bookmarkedCategories.length > 0) {
              setIsFormOpen(true)
            } else {
              toast.info('Bintang (favoritkan) kategori surat di bawah untuk akses cepat.')
            }
          }}
          className="p-3.5 rounded-2xl bg-white border border-slate-100 flex flex-col items-center justify-center text-center hover:bg-slate-50 transition-colors shadow-3xs"
        >
          <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-500 mb-2">
            <Star className="w-4.5 h-4.5" />
          </div>
          <span className="text-2xs font-extrabold text-slate-700">Surat Favorit</span>
        </button>

        <a 
          href="https://wa.me/6281234567890" 
          target="_blank" 
          rel="noopener noreferrer"
          className="p-3.5 rounded-2xl bg-white border border-slate-100 flex flex-col items-center justify-center text-center hover:bg-slate-50 transition-colors shadow-3xs"
        >
          <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-500 mb-2">
            <HelpCircle className="w-4.5 h-4.5" />
          </div>
          <span className="text-2xs font-extrabold text-slate-700">Bantuan RT</span>
        </a>
      </div>

      {/* 5. Bookmarked / Favorited templates section */}
      {bookmarkedCategories.length > 0 && (
        <div className="space-y-2 pl-0.5">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Layanan Favorit Anda</span>
          <div className="flex space-x-2 overflow-x-auto pb-1.5 scrollbar-none">
            {bookmarkedCategories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  setIsFormOpen(true)
                }}
                className="px-4 py-2 rounded-2xl bg-amber-50/50 hover:bg-amber-50 border border-amber-100 text-xs font-bold text-amber-800 flex items-center space-x-1.5 shrink-0 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 shrink-0" />
                <span>{cat.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 6. Main Dynamic Category Grid for citizens to favorite / select */}
      <div className="bg-slate-50/50 border border-slate-100/50 rounded-3xl p-4.5 space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block leading-none">Daftar Jenis Layanan</span>
          <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider block leading-none">Klik Bintang Untuk Memfavoritkan</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
          {categories.map((cat) => {
            const isFav = bookmarks.includes(cat.id)
            return (
              <div 
                key={cat.id}
                onClick={() => {
                  setIsFormOpen(true)
                }}
                className="bg-white border border-slate-100 rounded-2xl p-3 flex justify-between items-center hover:border-blue-200 cursor-pointer shadow-3xs transition-all hover:scale-[1.01]"
              >
                <div className="min-w-0 pr-2">
                  <p className="text-2xs font-extrabold text-slate-700 leading-tight truncate">{cat.name}</p>
                  <p className="text-[8px] font-semibold text-slate-400 mt-1 uppercase leading-none">{cat.code.replace(/_/g, ' ')}</p>
                </div>
                <button
                  type="button"
                  onClick={(e) => handleToggleBookmark(cat.id, e)}
                  className="w-7 h-7 rounded-xl hover:bg-slate-100 flex items-center justify-center shrink-0 transition-colors"
                >
                  <Star className={`w-4 h-4 ${isFav ? 'fill-amber-400 text-amber-400' : 'text-slate-300 hover:text-slate-400'}`} />
                </button>
              </div>
            )
          })}
        </div>
      </div>

      {/* 7. Filter Tabs for existing requests */}
      <div className="space-y-4 pt-2">
        <div className="flex bg-slate-100/80 p-1.5 rounded-2xl space-x-1 border border-slate-200/40">
          {[
            { id: 'all', label: 'Semua berkas' },
            { id: 'pending_rt', label: 'Menunggu RT' },
            { id: 'approved_rt', label: 'Proses RW' },
            { id: 'finished', label: 'Surat Selesai' },
            { id: 'rejected', label: 'Ditolak' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`flex-1 text-center py-2.5 rounded-xl text-xs font-bold transition-all active:scale-[0.98] ${
                statusFilter === tab.id
                  ? 'bg-white text-blue-600 shadow-xs border border-slate-100/20'
                  : 'text-slate-400 hover:text-slate-600 font-semibold'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* 8. Letter Cards Grid */}
        {isLoading ? (
          <LetterSkeleton />
        ) : letters.length === 0 ? (
          <LetterEmptyState isWarga={true} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {letters.map((letter) => (
              <div key={letter.id} className="relative group">
                <LetterCard letter={letter} currentRole={role} />
                <span className="absolute right-4.5 bottom-3.5 text-[9px] font-extrabold text-blue-500/80 bg-blue-50/50 px-2 py-0.5 rounded-lg border border-blue-100/20">
                  Estimasi: 1-2 hari
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 9. Dynamic Float Modal Overlay Card (BOTTOM-SHEET style for mobile, MODAL style for desktop) */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200 select-none">
          <div 
            className="absolute inset-0 cursor-zoom-out" 
            onClick={() => setIsFormOpen(false)} 
          />
          <div className="relative w-full sm:max-w-lg mt-auto sm:mt-0 animate-in slide-in-from-bottom-6 sm:slide-in-from-bottom-2 duration-300">
            <NewRequestForm 
              userId={userId} 
              onSuccess={handleFormSuccess} 
              onCancel={() => setIsFormOpen(false)} 
            />
          </div>
        </div>
      )}

    </div>
  )
}
