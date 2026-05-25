export type PaymentStatus = 'unpaid' | 'pending_verification' | 'verified' | 'rejected'

export interface UserProfile {
  id: string
  email: string
  fullName: string
  role: 'warga' | 'rt' | 'rw' | 'admin' | 'superadmin'
}

export interface DuePayment {
  id: string
  profile_id: string
  title: string
  amount: number
  due_date: string
  status: PaymentStatus
  proof_url?: string
  verified_by?: string
  verified_at?: string
  rejection_reason?: string
  created_at: string
  updated_at?: string
  profiles?: {
    full_name: string
    email: string
    role: string
  }
}

export interface NotificationItem {
  id: string
  profile_id: string
  title: string
  message: string
  is_read: boolean
  created_at: string
}
