'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { createClient } from '@/services/supabase/client'
import { MessageSquare, Send, Loader2, User, Image as ImageIcon, Smile, X, Heart, MessageCircle, RefreshCw } from 'lucide-react'
import EmojiPicker from 'emoji-picker-react'

interface Profile {
  full_name: string
  avatar_url: string | null
  role: string
}

interface ForumLike {
  profile_id: string
}

interface ForumComment {
  id: string
  profile_id: string
  content: string
  created_at: string
  profiles: Profile
}

interface ForumPost {
  id: string
  profile_id: string
  content: string
  image_urls: string[] | null
  created_at: string
  profiles: Profile
  forum_likes: ForumLike[]
  forum_comments: ForumComment[]
}

export default function ForumPage() {
  const [posts, setPosts] = useState<ForumPost[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [newPostContent, setNewPostContent] = useState('')
  const [currentUser, setCurrentUser] = useState<{ id: string, full_name: string, avatar_url: string | null } | null>(null)
  
  // States for interactive features
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({})
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({})
  const [submittingComment, setSubmittingComment] = useState<Record<string, boolean>>({})
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const emojiPickerRef = useRef<HTMLDivElement>(null)

  const supabase = createClient()

  useEffect(() => {
    fetchPosts()
    fetchCurrentUser()

    // Realtime subscription setup
    const channel = supabase.channel('public:forum_updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'forum_posts' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          fetchSinglePost(payload.new.id)
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'forum_likes' }, () => {
        // Simple approach: re-fetch all posts or just let optimistic updates handle it mostly.
        // For production, you'd target the specific post to re-fetch its likes.
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'forum_comments' }, () => {
         // Same for comments
      })
      .subscribe()

    const handleClickOutside = (e: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target as Node)) {
        setShowEmojiPicker(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)

    return () => {
      supabase.removeChannel(channel)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const fetchCurrentUser = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user) {
      const { data } = await supabase.from('profiles').select('id, full_name, avatar_url').eq('id', session.user.id).single()
      if (data) setCurrentUser(data)
    }
  }

  const fetchPosts = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('forum_posts')
        .select(`
          *,
          profiles:profile_id (full_name, avatar_url, role),
          forum_likes(profile_id),
          forum_comments(*, profiles:profile_id(full_name, avatar_url, role))
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      
      // Sort comments within posts
      const sortedPosts = (data as unknown as ForumPost[]).map(post => ({
        ...post,
        forum_comments: post.forum_comments?.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()) || []
      }))
      
      setPosts(sortedPosts)
    } catch (error) {
      console.error('Error fetching posts:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchSinglePost = async (id: string) => {
    const { data, error } = await supabase
      .from('forum_posts')
      .select(`
        *,
        profiles:profile_id (full_name, avatar_url, role),
        forum_likes(profile_id),
        forum_comments(*, profiles:profile_id(full_name, avatar_url, role))
      `)
      .eq('id', id)
      .single()

    if (data && !error) {
      const newPost = data as unknown as ForumPost
      setPosts((prev) => [newPost, ...prev.filter(p => p.id !== id)])
    }
  }

  // --- Like Toggle (Optimistic) ---
  const handleLikeToggle = async (postId: string, isLiked: boolean) => {
    if (!currentUser) return
    
    // 1. Optimistic Update UI
    setPosts(prev => prev.map(post => {
      if (post.id === postId) {
        const newLikes = isLiked 
          ? post.forum_likes.filter(l => l.profile_id !== currentUser.id)
          : [...(post.forum_likes || []), { profile_id: currentUser.id }]
        return { ...post, forum_likes: newLikes }
      }
      return post
    }))

    // 2. Perform DB action
    try {
      if (isLiked) {
        await supabase.from('forum_likes').delete().match({ post_id: postId, profile_id: currentUser.id })
      } else {
        await supabase.from('forum_likes').insert({ post_id: postId, profile_id: currentUser.id })
      }
    } catch (error) {
      console.error('Error toggling like:', error)
      // Revert optimistic update on failure (fetch real data)
      fetchSinglePost(postId)
    }
  }

  // --- Comment Submit ---
  const handleCommentSubmit = async (e: React.FormEvent, postId: string) => {
    e.preventDefault()
    if (!currentUser || !commentInputs[postId]?.trim()) return
    
    const content = commentInputs[postId].trim()
    
    try {
      setSubmittingComment(prev => ({ ...prev, [postId]: true }))
      
      const { error } = await supabase.from('forum_comments').insert({
        post_id: postId,
        profile_id: currentUser.id,
        content
      })
      
      if (error) throw error
      
      // Clear input and fetch real data to show the new comment
      setCommentInputs(prev => ({ ...prev, [postId]: '' }))
      await fetchSinglePost(postId)
      
    } catch (error) {
      console.error('Error adding comment:', error)
      alert('Gagal mengirim komentar.')
    } finally {
      setSubmittingComment(prev => ({ ...prev, [postId]: false }))
    }
  }

  // --- Image Upload Logic ---
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return
    const files = Array.from(e.target.files)
    
    if (selectedFiles.length + files.length > 4) {
      alert('Maksimal 4 gambar yang diperbolehkan untuk satu postingan.')
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }
    
    setSelectedFiles(prev => [...prev, ...files])
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const removeFile = (indexToRemove: number) => {
    setSelectedFiles(prev => prev.filter((_, idx) => idx !== indexToRemove))
  }

  // --- Emoji Picker Logic ---
  const handleEmojiClick = (emojiData: any) => {
    const emoji = emojiData.emoji
    if (textareaRef.current) {
      const start = textareaRef.current.selectionStart
      const end = textareaRef.current.selectionEnd
      const newText = newPostContent.substring(0, start) + emoji + newPostContent.substring(end)
      setNewPostContent(newText)
      
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + emoji.length
          textareaRef.current.focus()
        }
      }, 0)
    } else {
      setNewPostContent(prev => prev + emoji)
    }
  }

  // --- Submit Logic ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newPostContent.trim() && selectedFiles.length === 0) return
    if (!currentUser) return
    
    if (selectedFiles.length > 4) {
      alert('Maksimal 4 gambar yang diperbolehkan.')
      return
    }

    try {
      setSubmitting(true)
      
      const uploadedUrls: string[] = []
      for (const file of selectedFiles) {
        const fileExt = file.name.split('.').pop()
        const fileName = `${currentUser.id}-${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
        const filePath = `${currentUser.id}/${fileName}`
        
        const { error: uploadError } = await supabase.storage
          .from('forum-images')
          .upload(filePath, file)
          
        if (uploadError) throw uploadError
        
        const { data: { publicUrl } } = supabase.storage
          .from('forum-images')
          .getPublicUrl(filePath)
          
        uploadedUrls.push(publicUrl)
      }

      const { error } = await supabase.from('forum_posts').insert({
        profile_id: currentUser.id,
        content: newPostContent.trim(),
        image_urls: uploadedUrls.length > 0 ? uploadedUrls : null
      })

      if (error) throw error
      
      setNewPostContent('')
      setSelectedFiles([])
      setShowEmojiPicker(false)
      
    } catch (error) {
      console.error('Error creating post:', error)
      alert('Gagal mengirim postingan. Silakan coba lagi.')
    } finally {
      setSubmitting(false)
    }
  }

  // --- Formatting Helpers ---
  const formatRole = (role: string) => {
    const roleMap: Record<string, string> = {
      'warga': 'Warga',
      'rt': 'Pengurus RT',
      'rw': 'Pengurus RW',
      'admin': 'Administrator',
      'superadmin': 'Superadmin'
    }
    return roleMap[role] || role
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

  const getGridClass = (count: number) => {
    if (count === 1) return "grid-cols-1"
    if (count === 2) return "grid-cols-2"
    if (count === 3) return "grid-cols-2"
    return "grid-cols-2"
  }

  return (
    <div className="bg-slate-50 min-h-screen p-4 sm:p-6 lg:p-8 -m-4 sm:-m-6 lg:-m-8 rounded-none sm:rounded-tl-3xl transition-all">
      <div className="max-w-3xl mx-auto space-y-6 pb-20">
        
        {/* Header Section */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
              <MessageSquare className="w-7 h-7 text-purple-600" />
              Forum Warga
            </h1>
            <p className="text-sm font-medium text-slate-500 mt-1">
              Media interaktif untuk berbagi informasi, berdiskusi, dan bersosialisasi dengan tetangga sekitar.
            </p>
          </div>
          <button 
            onClick={fetchPosts}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:text-purple-600 hover:border-purple-200 rounded-xl shadow-sm transition-all disabled:opacity-50"
            title="Muat ulang konten"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-purple-600' : ''}`} />
            <span className="text-sm font-bold hidden sm:inline">Refresh</span>
          </button>
        </div>

        {/* Create Post Form */}
        <div className="bg-white rounded-2xl p-5 shadow-sm shadow-purple-100/40 border border-purple-50">
          <form onSubmit={handleSubmit} className="flex gap-4">
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0 overflow-hidden border border-slate-200">
              {currentUser?.avatar_url ? (
                <img src={currentUser.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <User className="w-5 h-5 text-slate-400" />
              )}
            </div>
            <div className="flex-1 space-y-3 relative">
              <textarea
                ref={textareaRef}
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
                placeholder="Apa yang ingin Anda bagikan ke tetangga?"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none min-h-[80px]"
                disabled={submitting || !currentUser}
              />
              
              {selectedFiles.length > 0 && (
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {selectedFiles.map((file, index) => (
                    <div key={index} className="relative aspect-video sm:aspect-[4/3] rounded-xl border border-slate-200 bg-white overflow-hidden group">
                      <img 
                        src={URL.createObjectURL(file)} 
                        alt={`preview ${index}`} 
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="absolute top-2 right-2 w-7 h-7 bg-black/50 hover:bg-red-500 text-white rounded-full flex items-center justify-center backdrop-blur-sm transition-colors shadow-sm"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-1 relative">
                  <input 
                    type="file" 
                    multiple 
                    accept="image/*" 
                    onChange={handleFileSelect}
                    ref={fileInputRef}
                    className="hidden"
                  />
                  <button 
                    type="button" 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={selectedFiles.length >= 4 || submitting}
                    className="p-2 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed" 
                    title="Unggah Gambar"
                  >
                    <ImageIcon className="w-5 h-5" />
                  </button>
                  
                  <div ref={emojiPickerRef}>
                    <button 
                      type="button" 
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      className={`p-2 rounded-full transition-colors ${showEmojiPicker ? 'text-purple-600 bg-purple-50' : 'text-slate-400 hover:text-purple-600 hover:bg-purple-50'}`} 
                      title="Tambahkan Emoji"
                    >
                      <Smile className="w-5 h-5" />
                    </button>
                    
                    {showEmojiPicker && (
                      <div className="absolute top-12 left-0 z-50 shadow-xl rounded-xl overflow-hidden border border-slate-100 animate-in fade-in slide-in-from-top-2">
                        <EmojiPicker 
                          onEmojiClick={handleEmojiClick}
                          width={320}
                          height={400}
                        />
                      </div>
                    )}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={(!newPostContent.trim() && selectedFiles.length === 0) || submitting || !currentUser}
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-sm font-bold rounded-lg shadow-sm shadow-purple-200 transition-colors flex items-center gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Mengunggah...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" /> Kirim
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Timeline Feed */}
        <div className="space-y-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin mb-4 text-purple-600" />
              <p className="text-sm font-medium">Memuat linimasa...</p>
            </div>
          ) : posts.length > 0 ? (
            posts.map((post) => {
              const isLiked = post.forum_likes?.some(like => like.profile_id === currentUser?.id)
              const likeCount = post.forum_likes?.length || 0
              const commentCount = post.forum_comments?.length || 0
              const isCommentsOpen = expandedComments[post.id] || false

              return (
                <div key={post.id} className="bg-white rounded-2xl p-5 shadow-sm shadow-purple-100/40 border border-purple-50 transition-all hover:shadow-md">
                  <div className="flex items-start gap-4">
                    <Link href={`/warga/${post.profile_id}`} className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0 overflow-hidden border border-slate-200 hover:ring-2 hover:ring-purple-500 transition-all">
                      {post.profiles?.avatar_url ? (
                        <img src={post.profiles.avatar_url} alt={post.profiles.full_name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-sm font-bold text-slate-500">{post.profiles?.full_name?.charAt(0).toUpperCase()}</span>
                      )}
                    </Link>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <Link href={`/warga/${post.profile_id}`} className="block truncate">
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-bold text-slate-800 hover:text-purple-600 hover:underline truncate">
                              {post.profiles?.full_name}
                            </h3>
                            {post.profiles?.role === 'superadmin' || post.profiles?.role === 'admin' ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-rose-50 text-rose-600 border border-rose-100 shrink-0">Admin Sistem</span>
                            ) : post.profiles?.role === 'rw' ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-purple-50 text-purple-600 border border-purple-100 shrink-0">Ketua RW</span>
                            ) : post.profiles?.role === 'rt' ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-50 text-blue-600 border border-blue-100 shrink-0">Ketua RT</span>
                            ) : null}
                          </div>
                          <p className="text-[11px] font-medium text-slate-500 truncate">
                            {formatRole(post.profiles?.role || 'warga')}
                          </p>
                        </Link>
                        <span className="text-[10px] font-bold text-slate-400 shrink-0">
                          {formatTimeAgo(post.created_at)}
                        </span>
                      </div>
                      
                      {/* Teks Postingan */}
                      {post.content && (
                        <div className="mt-2 text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                          {post.content}
                        </div>
                      )}

                      {/* Grid Gambar */}
                      {post.image_urls && post.image_urls.length > 0 && (
                        <div className={`mt-3 grid gap-1.5 rounded-xl overflow-hidden ${getGridClass(post.image_urls.length)}`}>
                          {post.image_urls.map((url, idx) => (
                            <div 
                              key={idx} 
                              className={`relative aspect-video sm:aspect-[4/3] bg-slate-100 ${post.image_urls!.length === 3 && idx === 0 ? 'col-span-2' : ''}`}
                            >
                              <img src={url} alt={`post img ${idx}`} className="absolute inset-0 w-full h-full object-cover border border-slate-100/50" />
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Action Bar (Like & Comment) */}
                      <div className="mt-4 flex items-center gap-6 border-t border-slate-50 pt-3">
                        <button 
                          onClick={() => handleLikeToggle(post.id, !!isLiked)}
                          className={`flex items-center gap-1.5 group text-sm font-medium transition-colors ${isLiked ? 'text-rose-500' : 'text-slate-500 hover:text-rose-500'}`}
                        >
                          <div className={`p-1.5 rounded-full transition-colors ${isLiked ? 'bg-rose-50' : 'group-hover:bg-rose-50'}`}>
                            <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
                          </div>
                          <span>{likeCount > 0 ? likeCount : ''}</span>
                        </button>
                        
                        <button 
                          onClick={() => setExpandedComments(prev => ({ ...prev, [post.id]: !isCommentsOpen }))}
                          className={`flex items-center gap-1.5 group text-sm font-medium transition-colors ${isCommentsOpen ? 'text-purple-600' : 'text-slate-500 hover:text-purple-600'}`}
                        >
                          <div className={`p-1.5 rounded-full transition-colors ${isCommentsOpen ? 'bg-purple-50' : 'group-hover:bg-purple-50'}`}>
                            <MessageCircle className={`w-4 h-4 ${isCommentsOpen ? 'fill-purple-100' : ''}`} />
                          </div>
                          <span>{commentCount > 0 ? commentCount : ''}</span>
                        </button>
                      </div>

                      {/* Comments Panel */}
                      {isCommentsOpen && (
                        <div className="mt-4 pt-4 border-t border-slate-100 space-y-4 animate-in fade-in slide-in-from-top-2">
                          
                          {/* List Komentar */}
                          {post.forum_comments?.length > 0 && (
                            <div className="space-y-4">
                              {post.forum_comments.map(comment => (
                                <div key={comment.id} className="flex gap-3">
                                  <Link href={`/warga/${comment.profile_id}`} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0 overflow-hidden border border-slate-200">
                                    {comment.profiles?.avatar_url ? (
                                      <img src={comment.profiles.avatar_url} alt={comment.profiles.full_name} className="w-full h-full object-cover" />
                                    ) : (
                                      <span className="text-xs font-bold text-slate-500">{comment.profiles?.full_name?.charAt(0).toUpperCase()}</span>
                                    )}
                                  </Link>
                                  <div className="flex-1 bg-slate-50 rounded-2xl rounded-tl-none p-3 border border-slate-100">
                                    <div className="flex items-center gap-2 mb-1">
                                      <div className="flex items-center gap-2">
                                        <Link href={`/warga/${comment.profile_id}`} className="text-xs font-bold text-slate-800 hover:text-purple-600 hover:underline">
                                          {comment.profiles?.full_name}
                                        </Link>
                                        {comment.profiles?.role === 'superadmin' || comment.profiles?.role === 'admin' ? (
                                          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-rose-50 text-rose-600 border border-rose-100 shrink-0">Admin Sistem</span>
                                        ) : comment.profiles?.role === 'rw' ? (
                                          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-purple-50 text-purple-600 border border-purple-100 shrink-0">Ketua RW</span>
                                        ) : comment.profiles?.role === 'rt' ? (
                                          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-50 text-blue-600 border border-blue-100 shrink-0">Ketua RT</span>
                                        ) : null}
                                      </div>
                                      <span className="text-[9px] text-slate-400 font-medium">
                                        {formatTimeAgo(comment.created_at)}
                                      </span>
                                    </div>
                                    <p className="text-xs text-slate-700 leading-relaxed">{comment.content}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Form Tambah Komentar */}
                          <form onSubmit={(e) => handleCommentSubmit(e, post.id)} className="flex gap-3 mt-4">
                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0 overflow-hidden border border-slate-200">
                              {currentUser?.avatar_url ? (
                                <img src={currentUser.avatar_url} alt="You" className="w-full h-full object-cover" />
                              ) : (
                                <User className="w-4 h-4 text-slate-400" />
                              )}
                            </div>
                            <div className="flex-1 relative flex items-center">
                              <input
                                type="text"
                                value={commentInputs[post.id] || ''}
                                onChange={(e) => setCommentInputs(prev => ({ ...prev, [post.id]: e.target.value }))}
                                placeholder="Tulis komentar..."
                                className="w-full bg-slate-50 border border-slate-200 rounded-full py-2 pl-4 pr-12 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                disabled={submittingComment[post.id] || !currentUser}
                              />
                              <button
                                type="submit"
                                disabled={!commentInputs[post.id]?.trim() || submittingComment[post.id] || !currentUser}
                                className="absolute right-1 w-8 h-8 flex items-center justify-center bg-purple-600 hover:bg-purple-700 disabled:bg-slate-300 text-white rounded-full transition-colors"
                              >
                                {submittingComment[post.id] ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <Send className="w-3.5 h-3.5 ml-0.5" />
                                )}
                              </button>
                            </div>
                          </form>

                        </div>
                      )}

                    </div>
                  </div>
                </div>
              )
            })
          ) : (
            <div className="bg-white rounded-2xl p-10 shadow-sm border border-slate-100 text-center flex flex-col items-center justify-center">
              <MessageSquare className="w-12 h-12 text-slate-300 mb-3" />
              <h3 className="text-sm font-bold text-slate-800">Belum Ada Postingan</h3>
              <p className="text-xs text-slate-500 mt-1">Jadilah yang pertama untuk menyapa tetangga Anda!</p>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
