'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/supabase/auth'
import { Loader2 } from 'lucide-react'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const { user, loading } = useAuth()

  useEffect(() => {
    // Redirect to login if no user and auth is done loading
    if (!loading && !user) {
      console.log('[DashboardLayout] No user found, redirecting to /login')
      router.push('/login')
    }
  }, [user, loading, router])

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#ed874a]/5 via-white to-[#d76f32]/5">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#ed874a] mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // If user exists, render children
  if (user) {
    return <>{children}</>
  }

  // Fallback (should not reach here due to redirect above)
  return null
}
