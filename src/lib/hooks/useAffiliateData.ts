"use client"
import { useCallback } from 'react'
import { useAuth } from '@/lib/supabase/auth'
import { supabase } from '@/lib/supabase/client'
import { useSWR, supabaseFetcher, swrDefaults } from '@/lib/hooks/swr'

interface AffiliateStats {
  totalEarnings: number
  currentBalance: number
  totalSales: number
  totalDcsSales: number
  commissionRate: number
  pendingCommissions: number
}

interface Commission {
  id: string
  affiliate_id?: string
  amount?: number
  commission_amount?: number
  commission_rate?: number
  status: string
  created_at: string
  commission_type?: string
  [key: string]: any
}

interface Payout {
  id: string
  amount: number
  status: string
  created_at: string
  processed_at?: string
  reference?: string
}

interface AffiliateProfile {
  commission_rate: number
  total_earnings: number
  total_referrals: number
  [key: string]: any
}

interface AffiliateDashboardData {
  stats: AffiliateStats
  recentCommissions: Commission[]
  recentPayouts: Payout[]
  affiliateProfile: AffiliateProfile | null
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
}

export const useAffiliateData = (): AffiliateDashboardData => {
  const { user, profile } = useAuth()
  const key = user?.id ? ['affiliate-dashboard', user.id] : null

  const fetcher = useCallback(async () => {
    if (!user || !profile) {
      return {
        stats: {
          totalEarnings: 0,
          currentBalance: 0,
          totalSales: 0,
          totalDcsSales: 0,
          commissionRate: 100,
          pendingCommissions: 0,
        } as AffiliateStats,
        recentCommissions: [] as Commission[],
        recentPayouts: [] as Payout[],
        affiliateProfile: null as AffiliateProfile | null,
      }
    }

    return supabaseFetcher(String(key), async () => {
      const [profileResult, commissionsResult, payoutsResult] = await Promise.allSettled([
        (supabase as any)
          .from('affiliate_profiles')
          .select('*')
          .eq('id', user.id)
          .single(),
        (supabase as any)
          .from('commissions')
          .select('*')
          .eq('affiliate_id', user.id)
          .order('created_at', { ascending: false }),
        (supabase as any)
          .from('payouts')
          .select('*')
          .eq('affiliate_id', user.id)
          .order('created_at', { ascending: false })
          .limit(10),
      ])

      let affiliateProfileData: any = null
      if (profileResult.status === 'fulfilled' && !profileResult.value.error) {
        affiliateProfileData = profileResult.value.data
      } else {
        affiliateProfileData = {
          total_earnings: 0,
          available_balance: 0,
          lifetime_referrals: 0,
          active_referrals: 0,
          total_referrals: 0,
          commission_rate: 80,
        } as AffiliateProfile
      }

      let commissions: any[] = []
      if (commissionsResult.status === 'fulfilled' && !commissionsResult.value.error) {
        const rawCommissions = commissionsResult.value.data || []
        commissions = rawCommissions.map((c: any) => ({
          ...c,
          amount: c.amount ?? c.commission_amount ?? 0,
        }))
      }

      let payouts: any[] = []
      if (payoutsResult.status === 'fulfilled' && !payoutsResult.value.error) {
        payouts = payoutsResult.value.data || []
      }

      const totalEarnings = affiliateProfileData?.total_earnings || 0
      const currentBalance = affiliateProfileData?.available_balance || 0
      const commissionRate = affiliateProfileData?.commission_rate || 80

      const membershipCommissions = commissions.filter((c: any) =>
        c.commission_type === 'learner_referral' ||
        c.commission_type === 'affiliate_referral' ||
        c.commission_type === 'learner_initial' ||
        c.commission_type === 'learner' ||
        !c.commission_type
      )
      const totalSales = membershipCommissions.length || 0

      const dcsCommissions = commissions.filter((c: any) =>
        c.commission_type === 'dcs_addon' ||
        c.commission_type === 'dcs'
      )
      const totalDcsSales = dcsCommissions.length || 0

      const pendingCommissions = commissions.filter((c: any) => c.status === 'pending').length || 0

      return {
        stats: {
          totalEarnings,
          currentBalance,
          totalSales,
          totalDcsSales,
          commissionRate,
          pendingCommissions,
        } as AffiliateStats,
        recentCommissions: commissions as Commission[],
        recentPayouts: payouts as Payout[],
        affiliateProfile: affiliateProfileData as AffiliateProfile,
      }
    })
  }, [key, user, profile])

  const { data, error, isLoading, mutate } = useSWR(key, fetcher, {
    ...swrDefaults,
    revalidateOnFocus: true,
  })

  return {
    stats: data?.stats ?? {
      totalEarnings: 0,
      currentBalance: 0,
      totalSales: 0,
      totalDcsSales: 0,
      commissionRate: 100,
      pendingCommissions: 0,
    },
    recentCommissions: data?.recentCommissions ?? [],
    recentPayouts: data?.recentPayouts ?? [],
    affiliateProfile: data?.affiliateProfile ?? null,
    loading: !data && isLoading,
    error: error ? (error as any).message ?? String(error) : null,
    refresh: async () => {
      await mutate()
    }
  }
}
