import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const path = req.nextUrl.pathname

  // Public paths that don't require authentication
  const PUBLIC_PATHS = [
    '/',
    '/login',
    '/signup',
    '/choose-role',
    '/legal-policies',
    '/blog',
    '/auth/callback',
    '/api',
    '/_next',
    '/favicon.ico',
    '/checkout/guest',
  ]

  // Check if path is public
  const isPublicPath = PUBLIC_PATHS.some((p) => path === p || path.startsWith(p))

  // Create Supabase client with cookie handling
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          res.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          res.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  // Refresh session and get user
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Protected routes require authentication
  if (!isPublicPath && !session) {
    const redirectUrl = new URL('/login', req.url)
    // Only add redirectTo if the user wasn't already trying to access /login
    // This prevents redirect loops after logout
    if (path !== '/login') {
      redirectUrl.searchParams.set('redirectTo', path)
    }
    return NextResponse.redirect(redirectUrl)
  }

  // Redirect authenticated users away from auth pages
  if (session && (path === '/login' || path === '/signup')) {
    return NextResponse.redirect(new URL('/dashboard/learner', req.url))
  }

  // Admin role-based access control
  if (session && path.startsWith('/dashboard/admin')) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single()

    // Admin access control
    if (profile?.role !== 'admin') {
      return NextResponse.redirect(new URL('/dashboard/learner', req.url))
    }
  }

  // Learner dashboard membership check — block expired/unpaid users
  if (session && path.startsWith('/dashboard/learner')) {
    const isMembershipPage = path === '/dashboard/learner/membership'
    const isCheckoutPage = path.startsWith('/dashboard/learner/membership/checkout')
    const isPaymentRelatedPage = isMembershipPage || isCheckoutPage

    if (!isPaymentRelatedPage) {
      // Check if user is admin (admins bypass membership check)
      const { data: profileData } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single()

      if (profileData?.role !== 'admin') {
        // Check for active, non-expired membership
        const { count } = await supabase
          .from('user_memberships')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', session.user.id)
          .eq('is_active', true)
          .gt('expires_at', new Date().toISOString())

        if ((count ?? 0) === 0) {
          return NextResponse.redirect(new URL('/dashboard/learner/membership', req.url))
        }
      }
    }
  }

  return res
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
