import { create } from 'zustand'
import type { UserRole } from '@/lib/auth/session'

export interface UserProfile {
  id: string
  email: string
  fullName: string
  role: UserRole
}

type AuthState = {
  user: UserProfile | null
  loading: boolean
  setUser: (u: UserProfile | null) => void
  setLoading: (l: boolean) => void
  signOut: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: false,
  setUser: (user) => set({ user, loading: false }),
  setLoading: (loading) => set({ loading }),
  signOut: () => set({ user: null, loading: false }),
}))
