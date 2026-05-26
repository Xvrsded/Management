'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/services/supabase/client'
import { 
  MapPin, 
  Phone, 
  Briefcase, 
  User, 
  Store, 
  MessageSquare,
  MessageCircle,
  Loader2,
  AlertOctagon,
  Image as ImageIcon,
  Link as LinkIcon
} from 'lucide-react'

// types
interface CitizenProfile {
  id: string
  full_name: string
  avatar_url: string | null
  role: string
  citizen_data: {
    address: string
    phone: string | null
    occupation: string | null
    rt: string
    rw: string
  } | null
}

interface UMKMProduct {
  id: string
  name: string
  description: string
  price: number
  foto_urls: string[]
  link_url: string | null
}

interface ForumPost {
  id: string
  content: string
  created_at: string
}

export default function WargaProfilePage() {
  const params = useParams()
  const profileId = params.id as string

  const [profile, setProfile] = useState<CitizenProfile | null>(null)
  const [products, setProducts] = useState<UMKMProduct[]>([])
  const [posts, setPosts] = useState<ForumPost[]>([])
  
  const [loading, setLoading] = useState(true)
  const [errorNotFound, setErrorNotFound] = useState(false)
  
  const [activeTab, setActiveTab] = useState<'umkm' | 'forum'>('umkm')
  
  const supabase = createClient()

  useEffect(() => {
    if (!profileId) return
    fetchData()
  }, [profileId])

  const fetchData = async () => {
    try {
      setLoading(true)
      
      // CRITICAL PRIVACY RULE: Fetch safe columns only!
      const { data: profData, error: profError } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, role')
        .eq('id', profileId)
        .single()
        
      if (profError || !profData) {
        setErrorNotFound(true)
        return
      }

      // Safe columns from citizen_profiles (no NIK, no KK, no sensitive identifiers)
      const { data: citData } = await supabase
        .from('citizen_profiles')
        .select('address, phone, occupation, rt, rw')
        .eq('id', profileId)
        .single()
        
      setProfile({
        ...profData,
        citizen_data: citData || null
      })

      // Fetch UMKM
      const { data: umkmData } = await supabase
        .from('umkm_products')
        .select('id, name, description, price, foto_urls, link_url')
        .eq('profile_id', profileId)
        .order('created_at', { ascending: false })
        
      if (umkmData) setProducts(umkmData)

      // Fetch Forum Posts
      const { data: postsData } = await supabase
        .from('forum_posts')
        .select('id, content, created_at')
        .eq('profile_id', profileId)
        .order('created_at', { ascending: false })
        
      if (postsData) setPosts(postsData)

    } catch (err) {
      console.error(err)
      setErrorNotFound(true)
    } finally {
      setLoading(false)
    }
  }

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num)
  }

  const formatRoleBadge = () => {
    if (!profile) return 'Warga'
    if (profile.role === 'rt') return `Ketua RT ${profile.citizen_data?.rt || ''}`
    if (profile.role === 'rw') return `Ketua RW ${profile.citizen_data?.rw || ''}`
    if (profile.role === 'admin') return 'Admin Sistem'
    return `Warga RT ${profile.citizen_data?.rt || '??'}`
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
    
    if (diffInSeconds < 60) return 'Baru saja'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} menit yang lalu`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} jam yang lalu`
    return `${Math.floor(diffInSeconds / 86400)} hari yang lalu`
  }

  if (loading) {
    return (
      <div className="bg-slate-50 min-h-screen p-6 -m-6 rounded-none sm:rounded-tl-3xl flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
      </div>
    )
  }

  if (errorNotFound || !profile) {
    return (
      <div className="bg-slate-50 min-h-screen p-6 sm:p-8 -m-6 sm:-m-8 rounded-none sm:rounded-tl-3xl flex flex-col items-center justify-center pb-32">
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center max-w-sm text-center">
          <AlertOctagon className="w-16 h-16 text-slate-300 mb-4" />
          <h2 className="text-xl font-black text-slate-800">Profil Tidak Ditemukan</h2>
          <p className="text-sm text-slate-500 mt-2">Warga yang Anda cari tidak ada atau akses dibatasi.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-slate-50 min-h-screen p-4 sm:p-6 lg:p-8 -m-4 sm:-m-6 lg:-m-8 rounded-none sm:rounded-tl-3xl transition-all">
      <div className="max-w-4xl mx-auto pb-20">
        
        {/* Header Profil */}
        <div className="bg-white rounded-2xl shadow-sm border border-purple-50 p-6 sm:p-8 mb-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-purple-50 rounded-full blur-3xl -z-10 -translate-y-1/2 translate-x-1/2 opacity-50" />
          
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 relative z-10">
            {/* Avatar */}
            <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-slate-100 flex items-center justify-center shrink-0 border-4 border-white shadow-md overflow-hidden text-purple-600">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt={profile.full_name} className="w-full h-full object-cover" />
              ) : (
                <User className="w-10 h-10 sm:w-12 sm:h-12 opacity-50" />
              )}
            </div>

            {/* Info Warga */}
            <div className="flex-1 text-center sm:text-left space-y-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight">{profile.full_name}</h1>
                <div className="mt-2 inline-flex">
                  <span className="px-3 py-1 bg-purple-100 text-purple-700 text-xs font-bold uppercase tracking-wider rounded-full border border-purple-200 shadow-sm">
                    {formatRoleBadge()}
                  </span>
                </div>
              </div>

              {/* Data Publik yang Aman (Menghilangkan row jika bernilai falsy) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                {profile.citizen_data?.address && (
                  <div className="flex items-start justify-center sm:justify-start gap-2 text-slate-600">
                    <MapPin className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                    <span className="text-sm font-medium text-left">{profile.citizen_data.address}</span>
                  </div>
                )}
                {profile.citizen_data?.occupation && (
                  <div className="flex items-center justify-center sm:justify-start gap-2 text-slate-600">
                    <Briefcase className="w-4 h-4 text-purple-400 shrink-0" />
                    <span className="text-sm font-medium capitalize">{profile.citizen_data.occupation}</span>
                  </div>
                )}
                {profile.citizen_data?.phone && (
                  <div className="flex items-center justify-center sm:justify-start gap-2 text-slate-600">
                    <Phone className="w-4 h-4 text-purple-400 shrink-0" />
                    <span className="text-sm font-medium">{profile.citizen_data.phone}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 mb-6 border-b border-slate-200">
          <button 
            onClick={() => setActiveTab('umkm')}
            className={`flex items-center gap-2 px-5 py-3 border-b-2 text-sm font-bold transition-all ${activeTab === 'umkm' ? 'border-purple-600 text-purple-700' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}
          >
            <Store className="w-4 h-4" /> Lapak Jualan
          </button>
          <button 
            onClick={() => setActiveTab('forum')}
            className={`flex items-center gap-2 px-5 py-3 border-b-2 text-sm font-bold transition-all ${activeTab === 'forum' ? 'border-purple-600 text-purple-700' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}
          >
            <MessageSquare className="w-4 h-4" /> Aktivitas Forum
          </button>
        </div>

        {/* Tab Content: UMKM */}
        {activeTab === 'umkm' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {products.length > 0 ? (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5">
                {products.map(product => (
                  <div key={product.id} className="bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm flex flex-col group hover:shadow-md hover:border-purple-200 transition-all">
                    {/* Image Placeholder */}
                    <div className="w-full h-32 sm:h-40 bg-slate-100 flex items-center justify-center border-b border-slate-100 relative overflow-hidden">
                      {product.foto_urls && product.foto_urls.length > 0 ? (
                        <>
                          <img src={product.foto_urls[0]} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          {product.foto_urls.length > 1 && (
                            <div className="absolute top-2 right-2 bg-black/60 text-white text-[10px] font-bold px-2 py-0.5 rounded-full backdrop-blur-sm shadow-sm flex items-center gap-1">
                              <ImageIcon className="w-3 h-3" /> {product.foto_urls.length}
                            </div>
                          )}
                        </>
                      ) : (
                        <ImageIcon className="w-8 h-8 text-slate-300 group-hover:scale-110 transition-transform" />
                      )}
                    </div>
                    
                    <div className="p-4 flex-1 flex flex-col">
                      <h3 className="text-sm font-bold text-slate-800 line-clamp-1">{product.name}</h3>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2 flex-1">{product.description}</p>
                      
                      <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <span className="text-base font-black text-purple-600">{formatRupiah(product.price)}</span>
                        
                        <div className="flex items-center gap-2">
                          {/* Eksternal Link Button */}
                          {product.link_url && (
                            <a 
                              href={product.link_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-50 text-purple-600 hover:bg-purple-600 hover:text-white transition-colors shrink-0"
                              title="Lihat Toko"
                            >
                              <LinkIcon className="w-3.5 h-3.5" />
                            </a>
                          )}

                          {/* Action Button: WhatsApp or Disabled */}
                          {profile.citizen_data?.phone ? (
                            <a 
                              href={`https://wa.me/${profile.citizen_data.phone.replace(/^0/, '62')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white transition-colors text-xs font-bold shrink-0"
                            >
                              <MessageCircle className="w-3.5 h-3.5" /> <span className="hidden sm:inline">WA</span>
                            </a>
                          ) : (
                            <button 
                              disabled
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-400 cursor-not-allowed text-xs font-bold shrink-0"
                              title="Kontak Belum Diatur"
                            >
                              <MessageCircle className="w-3.5 h-3.5" /> <span className="hidden sm:inline">-</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-3xl p-10 border border-slate-100 text-center flex flex-col items-center">
                <Store className="w-12 h-12 text-slate-300 mb-3" />
                <h3 className="text-sm font-bold text-slate-800">Belum Ada Lapak</h3>
                <p className="text-xs text-slate-500 mt-1">Warga ini belum memajang produk UMKM apapun.</p>
              </div>
            )}
          </div>
        )}

        {/* Tab Content: Forum */}
        {activeTab === 'forum' && (
          <div className="space-y-4 max-w-3xl animate-in fade-in slide-in-from-bottom-2 duration-300">
            {posts.length > 0 ? (
              posts.map(post => (
                <div key={post.id} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 transition-all hover:border-purple-200 hover:shadow-md">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0 overflow-hidden border border-slate-200">
                      {profile.avatar_url ? (
                        <img src={profile.avatar_url} alt={profile.full_name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-sm font-bold text-slate-500">{profile.full_name.charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <h3 className="text-sm font-bold text-slate-800 truncate">{profile.full_name}</h3>
                          <p className="text-[11px] font-medium text-slate-500">{formatRoleBadge()}</p>
                        </div>
                        <span className="text-[10px] font-bold text-slate-400 shrink-0">
                          {formatTimeAgo(post.created_at)}
                        </span>
                      </div>
                      <div className="mt-2 text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                        {post.content}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white rounded-3xl p-10 border border-slate-100 text-center flex flex-col items-center">
                <MessageSquare className="w-12 h-12 text-slate-300 mb-3" />
                <h3 className="text-sm font-bold text-slate-800">Belum Ada Postingan</h3>
                <p className="text-xs text-slate-500 mt-1">Warga ini belum berpartisipasi di forum.</p>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  )
}
