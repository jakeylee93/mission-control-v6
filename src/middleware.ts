import { NextRequest, NextResponse } from 'next/server'

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Allow the auth API, static files, and Next internals
  if (
    pathname === '/' ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/images') ||
    pathname === '/login'
  ) {
    return NextResponse.next()
  }

  // Allow API routes (they use service keys, not browser auth)
  // But protect the main pages
  if (pathname.startsWith('/api/')) {
    return NextResponse.next()
  }

  // Check auth cookie
  const authCookie = req.cookies.get('mc_auth')
  if (authCookie?.value === 'authenticated') {
    return NextResponse.next()
  }

  // Redirect to login
  const loginUrl = new URL('/login', req.url)
  return NextResponse.redirect(loginUrl)
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
