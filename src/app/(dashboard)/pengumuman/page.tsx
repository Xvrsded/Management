'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { createClient } from '@/services/supabase/client'
import { useRequireSession } from '@/hooks/useRequireSession'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { toast } from 'sonner'
import { Loader2, Plus, Megaphone, Calendar, User } from 'lucide-react'
import {
  createAnnouncement,
  fetchAnnouncements,
  type AnnouncementWithAuthor,
} from '@/services/announcementsService'
import { handleSupabaseError, logSupabaseError } from '@/lib/supabase/errors'

const announcementSchema = z.object({
  title: z.string().min(1, 'Judul pengumuman wajib diisi'),
  content: z.string().min(5, 'Isi pengumuman minimal 5 karakter wajib diisi'),
})

type AnnouncementFormValues = z.infer<typeof announcementSchema>

const ROLE_LABELS: Record<string, string> = {
  warga: 'Warga',
  rt: 'Ketua RT',
  rw: 'Ketua RW',
  admin: 'Admin',
  superadmin: 'Super Admin',
}

export default function PengumumanPage() {
  const { user, ready } = useRequireSession()
  const isStaff = ['rt', 'rw', 'admin', 'superadmin'].includes(user?.role || '')

  const [announcements, setAnnouncements] = useState<AnnouncementWithAuthor[]>([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)

  const loadingRef = useRef(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AnnouncementFormValues>({
    resolver: zodResolver(announcementSchema),
    defaultValues: { title: '', content: '' },
  })

  const loadAnnouncements = useCallback(async () => {
    if (loadingRef.current) return
    loadingRef.current = true
    setLoading(true)
    setFetchError(null)

    try {
      const supabase = createClient()
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        setFetchError('Session login berakhir')
        return
      }

      const data = await fetchAnnouncements(supabase)
      setAnnouncements(data)
    } catch (err: unknown) {
      logSupabaseError('fetchAnnouncements', err)
      const message = handleSupabaseError(err)
      setFetchError(message)
      toast.error(message)
    } finally {
      setLoading(false)
      loadingRef.current = false
    }
  }, [])

  useEffect(() => {
    if (!ready) return
    loadAnnouncements()
  }, [ready, loadAnnouncements])

  const onSubmit = async (values: AnnouncementFormValues) => {
    if (!user) return
    setSubmitting(true)
    try {
      const supabase = createClient()
      await createAnnouncement(supabase, {
        title: values.title.trim(),
        content: values.content.trim(),
        createdBy: user.id,
      })

      toast.success('Pengumuman baru berhasil dipublikasikan!')
      reset()
      setShowAddForm(false)
      await loadAnnouncements()
    } catch (err: unknown) {
      logSupabaseError('createAnnouncement', err)
      toast.error(handleSupabaseError(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-20 select-none">
      <div className="flex items-center justify-between px-1">
        <div>
          <h1 className="flex items-center text-xl font-bold tracking-tight text-slate-800">
            <Megaphone className="mr-2 h-6 w-6 shrink-0 text-blue-600" />
            Pengumuman Wilayah
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Daftar maklumat resmi dan kabar warga RT/RW
          </p>
        </div>
        {isStaff && (
          <button
            type="button"
            onClick={() => {
              setShowAddForm(!showAddForm)
              reset()
            }}
            className="flex shrink-0 items-center space-x-1.5 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition-colors hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 shrink-0" />
            <span>{showAddForm ? 'Batal' : 'Buat Pengumuman'}</span>
          </button>
        )}
      </div>

      {showAddForm && isStaff && (
        <div className="space-y-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800">Publikasikan Pengumuman Baru</h3>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-600">Judul</label>
              <input
                {...register('title')}
                placeholder="Judul pengumuman..."
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/10"
              />
              {errors.title && (
                <p className="text-xs text-rose-500">{errors.title.message}</p>
              )}
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-600">Isi</label>
              <textarea
                {...register('content')}
                rows={5}
                placeholder="Detail pengumuman..."
                className="w-full resize-none rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/10"
              />
              {errors.content && (
                <p className="text-xs text-rose-500">{errors.content.message}</p>
              )}
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-xs font-bold text-white disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Mempublikasikan...
                </>
              ) : (
                'Kirim Pengumuman'
              )}
            </button>
          </form>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
          <p className="mt-2 text-xs font-medium text-slate-400">Memuat pengumuman...</p>
        </div>
      ) : fetchError ? (
        <div className="rounded-2xl border border-rose-100 bg-rose-50 p-6 text-center">
          <p className="text-sm font-semibold text-rose-700">{fetchError}</p>
          <button
            type="button"
            onClick={loadAnnouncements}
            className="mt-3 rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white"
          >
            Coba Lagi
          </button>
        </div>
      ) : announcements.length > 0 ? (
        <div className="grid grid-cols-1 gap-4">
          {announcements.map((item) => (
            <article
              key={item.id}
              className="space-y-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6"
            >
              <div className="flex flex-wrap items-start justify-between gap-2 border-b border-slate-50 pb-3">
                <h3 className="text-base font-bold text-slate-800">{item.title}</h3>
                <span className="flex items-center text-[10px] font-bold uppercase tracking-wide text-slate-400">
                  <Calendar className="mr-1 h-3.5 w-3.5" />
                  {new Date(item.created_at).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
              </div>
              <p className="whitespace-pre-line text-sm leading-relaxed text-slate-600">
                {item.content}
              </p>
              <div className="flex items-center text-[10px] font-bold uppercase tracking-wider text-slate-400">
                <User className="mr-1 h-3.5 w-3.5" />
                Disiarkan:{' '}
                <span className="ml-1 text-blue-600">
                  {item.profiles?.full_name || 'Pengurus RT/RW'}
                </span>
                {item.profiles?.role && (
                  <span className="ml-1">
                    ({ROLE_LABELS[item.profiles.role] || 'Pengurus'})
                  </span>
                )}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-100 bg-white p-10 text-center shadow-sm">
          <Megaphone className="mx-auto h-8 w-8 text-slate-300" />
          <p className="mt-3 text-sm font-bold text-slate-600">Belum ada pengumuman</p>
          <p className="mx-auto mt-1 max-w-xs text-xs text-slate-400">
            Pengumuman resmi RT/RW akan muncul di sini.
          </p>
        </div>
      )}
    </div>
  )
}
