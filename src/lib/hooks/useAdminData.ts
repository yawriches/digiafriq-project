"use client"
import { useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import { CURRENCY_RATES } from '@/contexts/CurrencyContext'
import { useSWR, supabaseFetcher, swrDefaults } from '@/lib/hooks/swr'

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
    return supabaseFetcher(key, async () => {
      const { data: revenueData, error: revenueError } = await supabase
        .from('payments')
        .select('amount, currency, payment_type, metadata')
        .eq('status', 'completed')

      if (revenueError) {
        throw revenueError
      }

      const totalRevenue = revenueData?.reduce((sum: number, p: any) => {
        const currency = p.currency?.toUpperCase() || 'USD'
        let usdAmount = p.amount
        if (currency !== 'USD' && currency in CURRENCY_RATES) {
          usdAmount = p.amount / CURRENCY_RATES[currency as keyof typeof CURRENCY_RATES].rate
        }
        return sum + usdAmount
      }, 0) || 0

      const [usersResult, coursesResult, commissionsResult, affiliateProfilesResult] = await Promise.all([
        (supabase as any).from('profiles').select('*'),
        (supabase as any).from('courses').select('*'),
        (supabase as any).from('commissions').select('*'),
        (supabase as any).from('affiliate_profiles').select('id, has_paid').eq('has_paid', true)
      ])

      const users = usersResult.data || []
      const affiliates = users.filter((u: User) => u.role === 'affiliate')

      const activeUsers = users.filter((u: any) => u.status === 'active').length
      const suspendedUsers = users.filter((u: any) => u.status === 'suspended').length
      const pendingUsers = users.filter((u: any) => u.status === 'pending').length

      const courses = coursesResult.data || []

      const commissions = commissionsResult.data || []
      const totalCommissions = commissions.reduce((sum: number, c: any) => {
        const currency = c.commission_currency?.toUpperCase() || 'USD'
        let usdAmount = c.commission_amount || c.amount || 0
        if (currency !== 'USD' && currency in CURRENCY_RATES) {
          usdAmount = usdAmount / CURRENCY_RATES[currency as keyof typeof CURRENCY_RATES].rate
        }
        return sum + usdAmount
      }, 0)

      // Affiliates who completed onboarding (has_paid = true)
      const affiliatesOnboarded = affiliateProfilesResult.data?.length || 0

      // Split completed payments into affiliate sales vs direct website sales
      const completedPayments = revenueData || []
      const affiliateSales = completedPayments.filter((p: any) => 
        p.payment_type === 'referral_membership' || p.metadata?.is_referral_signup === true || p.metadata?.referral_code
      ).length
      const directSales = completedPayments.length - affiliateSales

      return {
        stats: {
          totalUsers: users.length,
          activeUsers,
          suspendedUsers,
          pendingUsers,
          totalRevenue,
          activeCourses: courses.length,
          activeAffiliates: affiliates.length,
          totalPayments: revenueData?.length || 0,
          totalCommissions,
          affiliatesOnboarded,
          affiliateSales,
          directSales,
        } as AdminStats,
        recentUsers: users.slice(0, 5) as User[],
        recentPayments: [] as Payment[],
      }
    })
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
