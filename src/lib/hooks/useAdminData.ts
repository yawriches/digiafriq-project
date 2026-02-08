"use client"
import { useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useSWR, swrDefaults } from '@/lib/hooks/swr'

interface AdminStats {
  totalUsers: number
  activeUsers: number
  suspendedUsers: number
  pendingUsers: number
  totalRevenue: number
  activeCourses: number
  activeAffiliates: number
  totalPayments: number
  totalCommissions: number
  affiliatesOnboarded: number
  affiliateSales: number
  directSales: number
}

interface User {
  id: string
  email: string
  full_name: string | null
  role: string
  created_at: string
}

interface Payment {
  id: string
  amount: number
  currency: string
  base_currency_amount?: number
  status: string
  reference: string | null
  created_at: string
  user?: {
    email: string
    full_name: string | null
  }
}

interface AdminData {
  stats: AdminStats
  recentUsers: User[]
  recentPayments: Payment[]
  loading: boolean
  error: string | null
}

export const useAdminData = (): AdminData => {
  const key = 'admin-dashboard'

  const fetcher = useCallback(async () => {
    // Get current session token for auth
    const { data: sessionData } = await supabase.auth.getSession()
    if (!sessionData.session) {
      throw new Error('No session')
    }

    const response = await fetch('/api/admin/dashboard-stats', {
      headers: {
        'Authorization': `Bearer ${sessionData.session.access_token}`
      }
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || `Failed to fetch dashboard stats (${response.status})`)
    }

    return response.json()
  }, [])

  const { data, error, isLoading } = useSWR(key, fetcher, {
    ...swrDefaults,
    revalidateOnFocus: true,
  })

  return {
    stats: data?.stats ?? {
      totalUsers: 0,
      activeUsers: 0,
      suspendedUsers: 0,
      pendingUsers: 0,
      totalRevenue: 0,
      activeCourses: 0,
      activeAffiliates: 0,
      totalPayments: 0,
      totalCommissions: 0,
      affiliatesOnboarded: 0,
      affiliateSales: 0,
      directSales: 0,
    },
    recentUsers: data?.recentUsers ?? [],
    recentPayments: data?.recentPayments ?? [],
    loading: !data && isLoading,
    error: error ? (error as any).message ?? String(error) : null,
  }
}
