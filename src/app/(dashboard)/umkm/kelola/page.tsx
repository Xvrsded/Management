'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/services/supabase/client'
import { Upload, X, Save, Store, Loader2, Link as LinkIcon, Image as ImageIcon } from 'lucide-react'

// types
interface UMKMProduct {
  id: string
  name: string
  description: string
  price: number
  foto_urls: string[]
  link_url: string | null
}

export default function KelolaLapakPage() {
  const [products, setProducts] = useState<UMKMProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [currentUser, setCurrentUser] = useState<{ id: string } | null>(null)
  
  // Form state
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [linkUrl, setLinkUrl] = useState('')
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  useEffect(() => {
    fetchInitialData()
  }, [])

  const fetchInitialData = async () => {
    try {
      setLoading(true)
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) return
      
      setCurrentUser({ id: session.user.id })
      
      const { data: umkmData } = await supabase
        .from('umkm_products')
        .select('id, name, description, price, foto_urls, link_url')
        .eq('profile_id', session.user.id)
        .order('created_at', { ascending: false })
        
      if (umkmData) {
        setProducts(umkmData as any)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return
    const files = Array.from(e.target.files)
    
    // Validasi maksimal 10 gambar (termasuk yang sudah dipilih sebelumnya)
    if (selectedFiles.length + files.length > 10) {
      alert('Maksimal 10 gambar yang diperbolehkan.')
      // Reset input jika batal
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }
    
    setSelectedFiles(prev => [...prev, ...files])
    
    // Reset input agar bisa memilih file yang sama lagi jika dihapus
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const removeFile = (indexToRemove: number) => {
    setSelectedFiles(prev => prev.filter((_, idx) => idx !== indexToRemove))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentUser) return
    if (selectedFiles.length > 10) {
      alert('Maksimal 10 gambar yang diperbolehkan.')
      return
    }

    try {
      setSubmitting(true)
      
      // Upload Images array
      const uploadedUrls: string[] = []
      
      for (const file of selectedFiles) {
        const fileExt = file.name.split('.').pop()
        const fileName = `${currentUser.id}-${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
        const filePath = `${currentUser.id}/${fileName}`
        
        const { error: uploadError } = await supabase.storage
          .from('umkm-products')
          .upload(filePath, file)
          
        if (uploadError) throw uploadError
        
        const { data: { publicUrl } } = supabase.storage
          .from('umkm-products')
          .getPublicUrl(filePath)
          
        uploadedUrls.push(publicUrl)
      }

      // Insert ke database dengan kolom foto_urls dan link_url
      const { data, error } = await supabase
        .from('umkm_products')
        .insert({
          profile_id: currentUser.id,
          name,
          description,
          price: parseFloat(price),
          foto_urls: uploadedUrls,
          link_url: linkUrl || null
        })
        .select()
        
      if (error) throw error
      
      // Reset form
      setName('')
      setDescription('')
      setPrice('')
      setLinkUrl('')
      setSelectedFiles([])
      
      // Update UI dengan produk baru
      if (data) {
        setProducts(prev => [data[0] as any, ...prev])
      }
      
      alert('Produk berhasil ditambahkan!')
    } catch (err) {
      console.error(err)
      alert('Terjadi kesalahan saat menyimpan produk.')
    } finally {
      setSubmitting(false)
    }
  }

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num)
  }

  if (loading) {
    return (
      <div className="bg-slate-50 min-h-screen p-6 -m-6 rounded-none sm:rounded-tl-3xl flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
      </div>
    )
  }

  return (
    <div className="bg-slate-50 min-h-screen p-4 sm:p-6 lg:p-8 -m-4 sm:-m-6 lg:-m-8 rounded-none sm:rounded-tl-3xl transition-all">
      <div className="max-w-6xl mx-auto pb-20">
        
        <div className="mb-8">
          <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <Store className="w-7 h-7 text-purple-600" />
            Kelola Lapak Saya
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-1">
            Tambahkan dan kelola produk UMKM Anda untuk ditawarkan kepada tetangga.
          </p>
        </div>

        {/* Layout 2 Kolom di Desktop, 1 Kolom Bertumpuk di Mobile */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* KIRI: Form Input */}
          <div className="bg-white rounded-xl shadow-sm border border-purple-50 p-6 flex flex-col h-fit">
            <h2 className="text-lg font-bold text-slate-800 mb-5 border-b border-slate-100 pb-3">Tambah Produk Baru</h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Nama Produk</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Misal: Kue Bolu Kukus Merek X"
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Deskripsi Produk</label>
                <textarea 
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Jelaskan detail, komposisi, atau ukuran produk Anda..."
                  required
                  rows={3}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Harga (Rp)</label>
                <input 
                  type="number" 
                  value={price}
                  onChange={e => setPrice(e.target.value)}
                  placeholder="Contoh: 25000"
                  required
                  min="0"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              
              {/* Fitur Tautan Eksternal */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <LinkIcon className="w-3.5 h-3.5 text-purple-600" /> Tautan Toko Online / Media Sosial (Opsional)
                </label>
                <input 
                  type="url" 
                  value={linkUrl}
                  onChange={e => setLinkUrl(e.target.value)}
                  placeholder="Contoh: https://shopee.co.id/nama-toko atau link Instagram"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              {/* Fitur Multi-Upload Gambar (Maks 10) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                  <span>Foto Produk (Maks 10 Gambar)</span>
                  <span className="text-[10px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">{selectedFiles.length} / 10</span>
                </label>
                
                <div className="mt-2 border-2 border-dashed border-slate-200 rounded-xl p-4 text-center bg-slate-50 hover:bg-slate-100 transition-colors relative cursor-pointer">
                  <input 
                    type="file" 
                    multiple 
                    accept="image/*" 
                    onChange={handleFileSelect}
                    ref={fileInputRef}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="flex flex-col items-center justify-center space-y-2 pointer-events-none">
                    <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center">
                      <Upload className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-700">Pilih atau Tarik Foto</p>
                      <p className="text-xs font-medium text-slate-400">Mendukung format JPG, PNG</p>
                    </div>
                  </div>
                </div>

                {/* Preview Selected Images */}
                {selectedFiles.length > 0 && (
                  <div className="mt-4 grid grid-cols-4 sm:grid-cols-5 gap-2">
                    {selectedFiles.map((file, index) => (
                      <div key={index} className="relative aspect-square rounded-lg border border-slate-200 bg-white overflow-hidden group">
                        <img 
                          src={URL.createObjectURL(file)} 
                          alt={`preview ${index}`} 
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-slate-100">
                <button
                  type="submit"
                  disabled={submitting || selectedFiles.length === 0}
                  className="w-full py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-sm font-bold rounded-xl shadow-sm shadow-purple-200 transition-all flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Menyimpan...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" /> Simpan Produk
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* KANAN: Daftar Produk Saya */}
          <div className="bg-white rounded-xl shadow-sm border border-purple-50 p-6 flex flex-col h-fit">
            <h2 className="text-lg font-bold text-slate-800 mb-5 border-b border-slate-100 pb-3 flex items-center justify-between">
              Produk Terdaftar
              <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">{products.length}</span>
            </h2>

            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
              {products.length > 0 ? (
                products.map(product => (
                  <div key={product.id} className="flex gap-4 p-3 rounded-xl border border-slate-100 bg-slate-50 hover:bg-white hover:border-purple-100 hover:shadow-sm transition-all group">
                    {/* Thumbnail Image */}
                    <div className="w-20 h-20 rounded-lg bg-slate-200 shrink-0 overflow-hidden border border-slate-200 relative">
                      {product.foto_urls && product.foto_urls.length > 0 ? (
                        <img src={product.foto_urls[0]} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400">
                          <ImageIcon className="w-6 h-6" />
                        </div>
                      )}
                      {product.foto_urls && product.foto_urls.length > 1 && (
                        <div className="absolute bottom-1 right-1 bg-black/60 text-white text-[9px] font-bold px-1.5 py-0.5 rounded backdrop-blur-sm">
                          +{product.foto_urls.length - 1}
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0 py-0.5">
                      <h3 className="text-sm font-bold text-slate-800 truncate">{product.name}</h3>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-1">{product.description}</p>
                      
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-sm font-black text-purple-600">{formatRupiah(product.price)}</span>
                        
                        {product.link_url && (
                          <a 
                            href={product.link_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-500 hover:text-purple-600 transition-colors"
                          >
                            <LinkIcon className="w-3 h-3" /> Link Eksternal
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-12 flex flex-col items-center justify-center text-center border-2 border-dashed border-slate-100 rounded-xl">
                  <Store className="w-10 h-10 text-slate-300 mb-3" />
                  <p className="text-sm font-bold text-slate-700">Belum Ada Produk</p>
                  <p className="text-xs text-slate-400 mt-1">Produk yang Anda tambahkan akan muncul di sini.</p>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
