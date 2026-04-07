import { NextResponse } from 'next/server'
import { getSessionCookieName, verifyAdminSession } from '@/lib/auth-session'

const publicPaths = ['/login', '/api/auth/login']

function isPublicPath(pathname) {
  return publicPaths.some((path) => pathname === path || pathname.startsWith(`${path}/`))
}

export async function middleware(request) {
  const { pathname } = request.nextUrl

  if (pathname.startsWith('/_next') || pathname.startsWith('/favicon.ico') || pathname.startsWith('/api/auth/logout')) {
    return NextResponse.next()
  }

  const token = request.cookies.get(getSessionCookieName())?.value
  let isAuthenticated = false

  if (token) {
    try {
      await verifyAdminSession(token)
      isAuthenticated = true
    } catch {
      isAuthenticated = false
    }
  }

  if (!isAuthenticated && !isPublicPath(pathname)) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (isAuthenticated && pathname === '/login') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}