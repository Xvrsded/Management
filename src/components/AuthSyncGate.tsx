'use client'

import { usePathname } from 'next/navigation'
import AuthSync from './AuthSync'

function shouldSkipAuthSync(pathname: string): boolean {
  if (pathname === '/') return true
  if (pathname === '/login' || pathname.startsWith('/login/')) return true
  if (pathname === '/register' || pathname.startsWith('/register/')) return true
  return false
}

export default function AuthSyncGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  if (shouldSkipAuthSync(pathname)) {
    return <>{children}</>
  }

  return <AuthSync>{children}</AuthSync>
}
