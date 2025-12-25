'use client'

import { useAuth } from '@/lib/supabase/auth'
import LearnerDashboardLayout from '@/components/dashboard/LearnerDashboardLayout'
import AffiliateDashboardLayout from '@/components/dashboard/AffiliateDashboardLayout'
import { Loader2 } from 'lucide-react'

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { profile, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#ed874a]" />
      </div>
    )
  }

  // Determine which layout to use based on active role
  const activeRole = profile?.active_role || 'learner'

  if (activeRole === 'affiliate') {
    return (
      <AffiliateDashboardLayout title="Profile Settings">
        {children}
      </AffiliateDashboardLayout>
    )
  }

  // Default to learner layout
  return (
    <LearnerDashboardLayout title="Profile Settings">
      {children}
    </LearnerDashboardLayout>
  )
}
