import type { User } from '@supabase/supabase-js'
import type { UserProfile } from '@/store/useAuthStore'

export const VALID_ROLES = ['warga', 'rt', 'rw', 'admin', 'superadmin'] as const
export type UserRole = (typeof VALID_ROLES)[number]

export function parseUserRole(metadata: Record<string, unknown> | undefined): UserRole {
  const role = metadata?.role
  if (typeof role === 'string' && VALID_ROLES.includes(role as UserRole)) {
    return role as UserRole
  }
  return 'warga'
}

export function userFromSupabaseUser(user: User): UserProfile {
  return {
    id: user.id,
    email: user.email || '',
    fullName: (user.user_metadata?.full_name as string) || '',
    role: parseUserRole(user.user_metadata),
  }
}
