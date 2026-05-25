import { createClient } from './supabase/client'

export type NotificationType = 'success' | 'info' | 'warning' | 'error'

export interface Notification {
  id: string
  profile_id: string
  title: string
  message: string
  type: NotificationType
  is_read: boolean
  link_url?: string
  created_at: string
}

export const notificationService = {
  // Fetch latest notifications for a user
  async getMyNotifications(profileId: string, limit = 15): Promise<Notification[]> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('profile_id', profileId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching notifications:', error)
      return []
    }
    return data as Notification[]
  },

  // Get unread count specifically
  async getUnreadCount(profileId: string): Promise<number> {
    const supabase = createClient()
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('profile_id', profileId)
      .eq('is_read', false)

    if (error) return 0
    return count || 0
  },

  // Mark specific or all as read
  async markAsRead(profileId: string, notificationId?: string): Promise<boolean> {
    const supabase = createClient()
    let query = supabase.from('notifications').update({ is_read: true }).eq('profile_id', profileId)
    
    if (notificationId) {
      query = query.eq('id', notificationId)
    } else {
      query = query.eq('is_read', false)
    }

    const { error } = await query
    return !error
  },

  // System hook to send notification
  async sendNotification(payload: {
    profile_id: string
    title: string
    message: string
    type?: NotificationType
    link_url?: string
  }): Promise<boolean> {
    const supabase = createClient()
    const { error } = await supabase.from('notifications').insert({
      profile_id: payload.profile_id,
      title: payload.title,
      message: payload.message,
      type: payload.type || 'info',
      link_url: payload.link_url
    })
    return !error
  }
}
