'use client'

import { useAuthStore } from '@/store/useAuthStore'
import { signOut } from '@/app/auth/actions'
import { useRouter } from 'next/navigation'

export function useAuth() {
  const router = useRouter()
  const user = useAuthStore((state) => state.user)
  const loading = useAuthStore((state) => state.loading)
  const signOutStore = useAuthStore((state) => state.signOut)

  const role = user?.role ?? null

  const logout = async () => {
    await signOut()
    signOutStore()
    router.replace('/login')
  }

  return {
    user,
    loading,
    role,
    isAuthenticated: !!user,
    isCitizen: role === 'warga',
    isRT: role === 'rt',
    isRW: role === 'rw',
    isAdmin: role === 'admin',
    isSuperAdmin: role === 'superadmin',
    logout,
  }
}
