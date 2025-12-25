"use client"
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/supabase/auth'
import { Loader2 } from 'lucide-react'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, profile, loading } = useAuth()
  const router = useRouter()
  const [isAuthorized, setIsAuthorized] = useState(false)

  useEffect(() => {
    const checkAdminAccess = async () => {
      if (loading) return

      if (!user) {
        // Not logged in, redirect to login
        console.log('❌ No user found, redirecting to login')
        router.push('/login')
        return
      }

      if (!profile) {
        // Profile not loaded yet, wait
        console.log('⏳ Waiting for profile to load...')
        return
      }

      console.log('🔐 Checking admin access for user:', {
        email: user.email,
        role: profile.role
      })

      // Check if user has admin role from profile
      if (profile.role !== 'admin') {
        // Not an admin, redirect to appropriate dashboard
        console.log('❌ User is not admin, redirecting to', profile.role, 'dashboard')
        if (profile.role === 'affiliate') {
          router.push('/dashboard/affiliate')
        } else {
          router.push('/dashboard/learner')
        }
        return
      }

      // User is admin, allow access
      console.log('✅ Admin access granted')
      setIsAuthorized(true)
    }

    checkAdminAccess()
  }, [user, profile, loading, router])

  // Show loading state while checking authorization
  if (loading || !isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-[#ed874a] mx-auto mb-4" />
          <p className="text-gray-600">Verifying admin access...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
