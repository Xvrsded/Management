import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { updateSession } from '@/services/supabase/middleware'
import { ROUTE_PERMISSIONS } from '@/utils/navigationData'
import { parseUserRole } from '@/lib/auth/session'

const AUTH_ROUTES = new Set(['/login', '/register'])

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const isAuthRoute = AUTH_ROUTES.has(pathname)

  const { user, response } = await updateSession(req)

  if (isAuthRoute) {
    if (user) {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
    return response
  }

  const matchedPath = Object.keys(ROUTE_PERMISSIONS).find(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  )

  if (!matchedPath) {
    return response
  }

  if (!user) {
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  const userRole = parseUserRole(user.user_metadata)
  const allowedRoles = ROUTE_PERMISSIONS[matchedPath]

  if (!allowedRoles.includes(userRole)) {
    return NextResponse.redirect(new URL('/dashboard?unauthorized=true', req.url))
  }

  return response
}

export const config = {
  matcher: [
    '/login',
    '/register',
    '/dashboard/:path*',
    '/iuran/:path*',
    '/surat/:path*',
    '/pengumuman/:path*',
    '/warga/:path*',
    '/keluarga/:path*',
    '/rumah/:path*',
    '/maps/:path*',
    '/laporan/:path*',
    '/kegiatan/:path*',
    '/absensi/:path*',
    '/profile/:path*',
    '/settings/:path*',
  ],
}
