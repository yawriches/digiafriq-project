import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Public paths that don't require authentication
const PUBLIC_PATHS = [
  '/login',
  '/signup',
  '/choose-role',
  '/legal-policies',
  '/api/auth',
  '/_next',
  '/favicon.ico',
]

export function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname

  // Allow public paths
  if (PUBLIC_PATHS.some((p) => path === p || path.startsWith(p))) {
    return NextResponse.next()
  }

  // For all other paths, just pass through
  // Session protection is now handled in layouts
  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/payment/:path*'],
}
