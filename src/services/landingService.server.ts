import { unstable_cache } from 'next/cache'
import { createClient as createSupabaseClient, type SupabaseClient } from '@supabase/supabase-js'
import { createAdminClient } from '@/services/supabase/admin'

export const LANDING_REVALIDATE = 60

export type LandingLetterStatus = {
  pendingRt: number
  pendingRw: number
  finished: number
  inProcess: number
}

export type LandingDuesSummary = {
  totalMonth: number
  pending: number
  success: number
}

export type LandingStats = {
  activeCitizens: number
  lettersInProcess: number
  duesThisMonth: number
  activeAnnouncements: number
  letterStatus: LandingLetterStatus
  dues: LandingDuesSummary
  activitiesCount: number
}

export type LandingAnnouncement = {
  id: string
  title: string
  content: string
  created_at: string
  category: string
}

export type LandingActivity = {
  id: string
  title: string
  description: string | null
  activity_date: string
  location: string
  participant_count: number
  status: 'upcoming' | 'ongoing' | 'finished'
}

export type LandingLetterPreview = {
  id: string
  label: string
  status: string
  statusTone: string
}

export type LandingRealtimeMetrics = {
  lettersInProcess: number
  notificationsRecent: number
  updatedAt: string | null
}

export type LandingDashboardData = {
  stats: LandingStats
  announcements: LandingAnnouncement[]
  activities: LandingActivity[]
  letterPreviews: LandingLetterPreview[]
  realtime: LandingRealtimeMetrics
}

const EMPTY_STATS: LandingStats = {
  activeCitizens: 0,
  lettersInProcess: 0,
  duesThisMonth: 0,
  activeAnnouncements: 0,
  letterStatus: { pendingRt: 0, pendingRw: 0, finished: 0, inProcess: 0 },
  dues: { totalMonth: 0, pending: 0, success: 0 },
  activitiesCount: 0,
}

function parseStatsPayload(raw: unknown): LandingStats {
  if (!raw || typeof raw !== 'object') return EMPTY_STATS
  const d = raw as Record<string, unknown>
  const letterStatus = (d.letterStatus as Record<string, number>) || {}
  const dues = (d.dues as Record<string, number>) || {}

  return {
    activeCitizens: Number(d.activeCitizens) || 0,
    lettersInProcess: Number(d.lettersInProcess) || 0,
    duesThisMonth: Number(d.duesThisMonth) || 0,
    activeAnnouncements: Number(d.activeAnnouncements) || 0,
    letterStatus: {
      pendingRt: Number(letterStatus.pendingRt) || 0,
      pendingRw: Number(letterStatus.pendingRw) || 0,
      finished: Number(letterStatus.finished) || 0,
      inProcess: Number(letterStatus.inProcess) || 0,
    },
    dues: {
      totalMonth: Number(dues.totalMonth) || 0,
      pending: Number(dues.pending) || 0,
      success: Number(dues.success) || 0,
    },
    activitiesCount: Number(d.activitiesCount) || 0,
  }
}

function formatRupiah(value: number): string {
  if (value >= 1_000_000) {
    return `Rp ${(value / 1_000_000).toFixed(1)}jt`
  }
  if (value >= 1_000) {
    return `Rp ${Math.round(value / 1_000)}rb`
  }
  return `Rp ${Math.round(value)}`
}

export { formatRupiah }

function letterTypeLabel(type: string): string {
  const map: Record<string, string> = {
    surat_pengantar: 'Surat Pengantar',
    surat_keterangan_domisili: 'SK Domisili',
    surat_keterangan_tidak_mampu: 'SKTM',
    surat_keterangan_usaha: 'SK Usaha',
  }
  return map[type] || 'Pengajuan Surat'
}

function letterStatusLabel(status: string): { label: string; tone: string } {
  switch (status) {
    case 'pending_rt':
      return { label: 'Menunggu RT', tone: 'bg-amber-100 text-amber-800' }
    case 'approved_rt':
      return { label: 'Menunggu RW', tone: 'bg-blue-100 text-blue-800' }
    case 'approved_rw':
      return { label: 'Validasi RW', tone: 'bg-violet-100 text-violet-800' }
    case 'finished':
      return { label: 'Selesai', tone: 'bg-emerald-100 text-emerald-800' }
    case 'rejected':
      return { label: 'Ditolak', tone: 'bg-rose-100 text-rose-800' }
    default:
      return { label: 'Diproses', tone: 'bg-slate-100 text-slate-700' }
  }
}

function activityStatus(eventDate: string): LandingActivity['status'] {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const event = new Date(eventDate)
  event.setHours(0, 0, 0, 0)
  if (event.getTime() > today.getTime()) return 'upcoming'
  if (event.getTime() === today.getTime()) return 'ongoing'
  return 'finished'
}

function activityBadge(status: LandingActivity['status']): string {
  switch (status) {
    case 'upcoming':
      return 'Akan Datang'
    case 'ongoing':
      return 'Berlangsung'
    default:
      return 'Selesai'
  }
}

function announcementCategory(title: string): string {
  const lower = title.toLowerCase()
  if (lower.includes('iuran') || lower.includes('pembayaran')) return 'Keuangan'
  if (lower.includes('kerja bakti') || lower.includes('kegiatan')) return 'Kegiatan'
  if (lower.includes('surat')) return 'Administrasi'
  return 'Umum'
}

/** Stateless anon client — no cookies(), safe inside unstable_cache(). */
function createLandingSupabase(): SupabaseClient {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-project.supabase.co'
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummy-anon-key'

  return createSupabaseClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

function getSupabaseForLanding(): SupabaseClient {
  return createAdminClient() ?? createLandingSupabase()
}

async function fetchLandingStatsRaw(): Promise<LandingStats> {
  const supabase = getSupabaseForLanding()

  const { data, error } = await supabase.rpc('get_landing_stats')
  if (!error && data) {
    return parseStatsPayload(data)
  }

  return fetchLandingStatsFallback(supabase)
}

async function fetchLandingStatsFallback(
  supabase: SupabaseClient
): Promise<LandingStats> {
  const monthStart = new Date()
  monthStart.setDate(1)
  monthStart.setHours(0, 0, 0, 0)
  const monthEnd = new Date(monthStart)
  monthEnd.setMonth(monthEnd.getMonth() + 1)

  const monthStartIso = monthStart.toISOString().slice(0, 10)
  const monthEndIso = monthEnd.toISOString().slice(0, 10)

  try {
    const [
      citizensRes,
      lettersRes,
      announcementsRes,
      duesRes,
      letterStatusRes,
    ] = await Promise.all([
      supabase
        .from('citizen_profiles')
        .select('*', { count: 'exact', head: true }),
      supabase
        .from('letter_requests')
        .select('*', { count: 'exact', head: true })
        .neq('status', 'finished')
        .neq('status', 'rejected'),
      supabase
        .from('announcements')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', new Date(Date.now() - 30 * 86400000).toISOString()),
      supabase
        .from('due_payments')
        .select('amount, status, due_date')
        .gte('due_date', monthStartIso)
        .lt('due_date', monthEndIso),
      supabase.from('letter_requests').select('status'),
    ])

    const duesRows = duesRes.data || []
    const paidStatuses = new Set(['verified', 'paid'])
    const pendingStatuses = new Set(['unpaid', 'pending', 'pending_verification'])

    const duesThisMonth = duesRows
      .filter((r) => paidStatuses.has(r.status))
      .reduce((sum, r) => sum + Number(r.amount), 0)

    const statusRows = letterStatusRes.data || []
    const letterStatus: LandingLetterStatus = {
      pendingRt: statusRows.filter((r) => r.status === 'pending_rt').length,
      pendingRw: statusRows.filter((r) =>
        ['approved_rt', 'approved_rw'].includes(r.status)
      ).length,
      finished: statusRows.filter((r) => r.status === 'finished').length,
      inProcess: statusRows.filter((r) =>
        !['finished', 'rejected'].includes(r.status)
      ).length,
    }

    return {
      activeCitizens: citizensRes.count ?? 0,
      lettersInProcess: lettersRes.count ?? 0,
      duesThisMonth,
      activeAnnouncements: announcementsRes.count ?? 0,
      letterStatus,
      dues: {
        totalMonth: duesRows.reduce((s, r) => s + Number(r.amount), 0),
        pending: duesRows.filter((r) => pendingStatuses.has(r.status)).length,
        success: duesRows.filter((r) => paidStatuses.has(r.status)).length,
      },
      activitiesCount: 0,
    }
  } catch {
    return EMPTY_STATS
  }
}

const getLandingStatsCached = unstable_cache(
  fetchLandingStatsRaw,
  ['landing-stats-v1'],
  { revalidate: LANDING_REVALIDATE }
)

export async function getLandingStats(): Promise<LandingStats> {
  return getLandingStatsCached()
}

async function fetchLatestAnnouncementsRaw(): Promise<LandingAnnouncement[]> {
  const supabase = getSupabaseForLanding()
  const { data, error } = await supabase
    .from('announcements')
    .select('id, title, content, created_at')
    .order('created_at', { ascending: false })
    .limit(3)

  if (error || !data) return []

  return data.map((row) => ({
    id: row.id,
    title: row.title,
    content: row.content,
    created_at: row.created_at,
    category: announcementCategory(row.title),
  }))
}

const getLatestAnnouncementsCached = unstable_cache(
  fetchLatestAnnouncementsRaw,
  ['landing-announcements-v1'],
  { revalidate: LANDING_REVALIDATE }
)

export async function getLatestAnnouncements(): Promise<LandingAnnouncement[]> {
  return getLatestAnnouncementsCached()
}

async function fetchUpcomingActivitiesRaw(): Promise<LandingActivity[]> {
  const supabase = getSupabaseForLanding()
  const today = new Date().toISOString().slice(0, 10)

  const { data, error } = await supabase
    .from('activities')
    .select('id, title, description, activity_date, latitude, longitude')
    .gte('activity_date', today)
    .order('activity_date', { ascending: true })
    .limit(3)

  if (error || !data?.length) return []

  const ids = data.map((a) => a.id)
  const { data: attendanceRows } = await supabase
    .from('attendance')
    .select('activity_id')
    .in('activity_id', ids)

  const countMap = new Map<string, number>()
  for (const row of attendanceRows || []) {
    countMap.set(row.activity_id, (countMap.get(row.activity_id) || 0) + 1)
  }

  return data.map((row) => {
    const status = activityStatus(row.activity_date)
    const hasCoords = row.latitude != null && row.longitude != null
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      activity_date: row.activity_date,
      location: hasCoords ? 'Lokasi GPS terdaftar' : 'Lokasi lingkungan RT/RW',
      participant_count: countMap.get(row.id) || 0,
      status,
    }
  })
}

const getUpcomingActivitiesCached = unstable_cache(
  fetchUpcomingActivitiesRaw,
  ['landing-activities-v1'],
  { revalidate: LANDING_REVALIDATE }
)

export async function getUpcomingActivities(): Promise<LandingActivity[]> {
  return getUpcomingActivitiesCached()
}

async function fetchRealtimeStatsRaw(): Promise<LandingRealtimeMetrics> {
  const supabase = getSupabaseForLanding()
  const { data, error } = await supabase
    .from('landing_public_metrics')
    .select('letters_in_process, notifications_recent, updated_at')
    .eq('id', 1)
    .maybeSingle()

  if (!error && data) {
    return {
      lettersInProcess: Number(data.letters_in_process) || 0,
      notificationsRecent: Number(data.notifications_recent) || 0,
      updatedAt: data.updated_at,
    }
  }

  const { count } = await supabase
    .from('letter_requests')
    .select('*', { count: 'exact', head: true })
    .neq('status', 'finished')
    .neq('status', 'rejected')

  return {
    lettersInProcess: count ?? 0,
    notificationsRecent: 0,
    updatedAt: null,
  }
}

const getRealtimeStatsCached = unstable_cache(
  fetchRealtimeStatsRaw,
  ['landing-realtime-v1'],
  { revalidate: LANDING_REVALIDATE }
)

export async function getRealtimeStats(): Promise<LandingRealtimeMetrics> {
  return getRealtimeStatsCached()
}

async function fetchLetterPreviewsRaw(): Promise<LandingLetterPreview[]> {
  const supabase = getSupabaseForLanding()
  const { data, error } = await supabase
    .from('letter_requests')
    .select('id, letter_type, status')
    .order('created_at', { ascending: false })
    .limit(2)

  if (error || !data) return []

  return data.map((row) => {
    const { label, tone } = letterStatusLabel(row.status)
    return {
      id: row.id,
      label: letterTypeLabel(row.letter_type),
      status: label,
      statusTone: tone,
    }
  })
}

const getLetterPreviewsCached = unstable_cache(
  fetchLetterPreviewsRaw,
  ['landing-letter-previews-v1'],
  { revalidate: LANDING_REVALIDATE }
)

async function getLetterPreviews(): Promise<LandingLetterPreview[]> {
  return getLetterPreviewsCached()
}

export async function getLandingDashboardData(): Promise<LandingDashboardData> {
  const [stats, announcements, activities, letterPreviews, realtime] =
    await Promise.all([
      getLandingStats(),
      getLatestAnnouncements(),
      getUpcomingActivities(),
      getLetterPreviews(),
      getRealtimeStats(),
    ])

  return { stats, announcements, activities, letterPreviews, realtime }
}

export function formatActivityDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('id-ID', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function formatAnnouncementDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function truncateText(text: string, max = 72): string {
  if (text.length <= max) return text
  return `${text.slice(0, max).trim()}…`
}

export { activityBadge, announcementCategory, letterStatusLabel }
