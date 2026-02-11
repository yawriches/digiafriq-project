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
    const { data: sessionData } = await supabase.auth.getSession()
    if (!sessionData.session) {
      throw new Error('No session')
    }

    // Fetch dashboard stats from API
    const response = await fetch('/api/admin/dashboard-stats', {
      headers: {
        'Authorization': `Bearer ${sessionData.session.access_token}`
      }
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || `Failed to fetch dashboard stats (${response.status})`)
    }

    const apiData = await response.json()

    // Fetch recent payments directly via Supabase client
    // (same approach as the working payments page)
    const { data: recentPaymentsRaw } = await supabase
      .from('payments')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10)

    const RATES: Record<string, number> = { GHS: 14, NGN: 1600 }

    // For each payment, fetch user info (same as payments page)
    const recentPayments: Payment[] = await Promise.all(
      (recentPaymentsRaw || []).map(async (p: any) => {
        let user = undefined
        if (p.user_id) {
          const { data: userData } = await supabase
            .from('profiles')
            .select('id, full_name, email')
            .eq('id', p.user_id)
            .single()
          if (userData) {
            user = { email: userData.email, full_name: userData.full_name }
          }
        }

        const currency = p.currency?.toUpperCase() || 'USD'
        let usdAmount = p.amount
        if (p.base_amount && p.base_currency?.toUpperCase() === 'USD') {
          usdAmount = p.base_amount
        } else if (currency !== 'USD' && currency in RATES) {
          usdAmount = p.amount / RATES[currency]
        }

        return {
          id: p.id,
          amount: p.amount,
          currency: p.currency,
          base_currency_amount: usdAmount,
          status: p.status,
          reference: p.paystack_reference || p.provider_reference || null,
          created_at: p.created_at,
          user,
        }
      })
    )

    return {
      ...apiData,
      recentPayments,
    }
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
