import type { SupabaseClient } from '@supabase/supabase-js'

export type AnnouncementRow = {
  id: string
  title: string
  content: string
  created_at: string
  created_by: string | null
}

export type AnnouncementWithAuthor = AnnouncementRow & {
  profiles: {
    full_name: string
    role: string
  } | null
}

const ANNOUNCEMENT_COLUMNS =
  'id, title, content, created_at, created_by' as const

const PAGE_LIMIT = 50

export async function fetchAnnouncements(
  supabase: SupabaseClient
): Promise<AnnouncementWithAuthor[]> {
  const { data, error } = await supabase
    .from('announcements')
    .select(ANNOUNCEMENT_COLUMNS)
    .order('created_at', { ascending: false })
    .limit(PAGE_LIMIT)

  if (error) throw error

  const rows: AnnouncementRow[] = data ?? []
  if (rows.length === 0) return []

  const authorIds = [
    ...new Set(rows.map((r) => r.created_by).filter((id): id is string => !!id)),
  ]

  if (authorIds.length === 0) {
    return rows.map((row) => ({ ...row, profiles: null }))
  }

  const { data: authors, error: authorError } = await supabase
    .from('profiles')
    .select('id, full_name, role')
    .in('id', authorIds)

  if (authorError) {
    return rows.map((row) => ({ ...row, profiles: null }))
  }

  const authorMap = new Map(
    (authors ?? []).map((a) => [
      a.id,
      { full_name: a.full_name, role: a.role },
    ])
  )

  return rows.map((row) => ({
    ...row,
    profiles: row.created_by ? authorMap.get(row.created_by) ?? null : null,
  }))
}

export async function createAnnouncement(
  supabase: SupabaseClient,
  payload: { title: string; content: string; createdBy: string }
): Promise<void> {
  const { error } = await supabase.from('announcements').insert({
    title: payload.title,
    content: payload.content,
    created_by: payload.createdBy,
  })

  if (error) throw error
}
