"use client"
import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/lib/supabase/auth'
import { supabase } from '@/lib/supabase/client'
import { usePathname } from 'next/navigation'

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
  const pathname = usePathname()
  const [stats, setStats] = useState<AffiliateStats>({
    totalEarnings: 0,
    currentBalance: 0,
    totalSales: 0,
    totalDcsSales: 0,
    commissionRate: 100,
    pendingCommissions: 0
  })
  const [recentCommissions, setRecentCommissions] = useState<Commission[]>([])
  const [recentPayouts, setRecentPayouts] = useState<Payout[]>([])
  const [affiliateProfile, setAffiliateProfile] = useState<AffiliateProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Memoized fetch function that can be called manually
  const fetchAffiliateData = useCallback(async () => {
    if (!user || !profile) {
      setLoading(false)
      return
    }

    // Always try to fetch real data - user might be admin with affiliate capabilities
    // or have an affiliate profile regardless of their primary role
    try {
      setLoading(true)
      setError(null)

      // Use Promise.allSettled to fetch all data in parallel and handle failures gracefully
      const [profileResult, commissionsResult, payoutsResult] = await Promise.allSettled([
        // Fetch affiliate profile
        (supabase as any)
          .from('affiliate_profiles')
          .select('*')
          .eq('id', user.id)
          .single(),
        
        // Fetch commissions with more details (fetch all for accurate counts)
        (supabase as any)
          .from('commissions')
          .select('*')
          .eq('affiliate_id', user.id)
          .order('created_at', { ascending: false }),
        
        // Fetch payouts
        (supabase as any)
          .from('payouts')
          .select('*')
          .eq('affiliate_id', user.id)
          .order('created_at', { ascending: false })
          .limit(10)
      ])

      // Handle affiliate profile
      let affiliateProfileData = null
      if (profileResult.status === 'fulfilled' && !profileResult.value.error) {
        affiliateProfileData = profileResult.value.data
        setAffiliateProfile(affiliateProfileData)
      } else {
        console.warn('Failed to fetch affiliate profile, using defaults')
        affiliateProfileData = { 
          total_earnings: 0, 
          available_balance: 0,
          lifetime_referrals: 0,
          active_referrals: 0,
          total_referrals: 0,
          commission_rate: 80 
        } as AffiliateProfile
        setAffiliateProfile(affiliateProfileData)
      }

      // Handle commissions
      let commissions: any[] = []
      if (commissionsResult.status === 'fulfilled' && !commissionsResult.value.error) {
        const rawCommissions = commissionsResult.value.data || []

        // Normalize field names so UI can rely on `amount`
        commissions = rawCommissions.map((c: any) => ({
          ...c,
          amount: c.amount ?? c.commission_amount ?? 0
        }))

        console.log('📊 Fetched commissions:', commissions.length, 'records')
        console.log('📊 Commission types:', commissions.map((c: any) => c.commission_type))

        setRecentCommissions(commissions as Commission[])
      } else {
        console.warn(
          'Failed to fetch commissions:',
          commissionsResult.status === 'rejected' ? commissionsResult.reason : commissionsResult.value?.error
        )
        setRecentCommissions([])
      }

      // Handle payouts
      let payouts = []
      if (payoutsResult.status === 'fulfilled' && !payoutsResult.value.error) {
        payouts = payoutsResult.value.data || []
        setRecentPayouts(payouts)
      } else {
        console.warn('Failed to fetch payouts, using empty array')
        setRecentPayouts([])
      }

      // Calculate stats with fallback values
      const totalEarnings = affiliateProfileData?.total_earnings || 0
      const currentBalance = affiliateProfileData?.available_balance || 0
      const commissionRate = affiliateProfileData?.commission_rate || 80

      // Calculate real-time sales counts from commissions
      // Membership sales: learner_referral, affiliate_referral, learner_initial, or no type specified
      const membershipCommissions = commissions.filter((c: any) => 
        c.commission_type === 'learner_referral' || 
        c.commission_type === 'affiliate_referral' || 
        c.commission_type === 'learner_initial' ||
        c.commission_type === 'learner' ||
        !c.commission_type
      )
      const totalSales = membershipCommissions.length || 0
      
      // DCS sales: dcs_addon type
      const dcsCommissions = commissions.filter((c: any) => 
        c.commission_type === 'dcs_addon' || 
        c.commission_type === 'dcs'
      )
      const totalDcsSales = dcsCommissions.length || 0
      
      console.log('📊 Sales calculation:', {
        totalCommissions: commissions.length,
        membershipSales: totalSales,
        dcsSales: totalDcsSales,
        commissionTypes: commissions.map((c: any) => c.commission_type)
      })
      const pendingCommissions = commissions.filter((c: any) => c.status === 'pending').length || 0

      setStats({
        totalEarnings,
        currentBalance,
        totalSales,
        totalDcsSales,
        commissionRate,
        pendingCommissions
      })

    } catch (err: any) {
      console.error('Error fetching affiliate data:', err)
      
      // Set fallback data on error to prevent blank dashboard
      setStats({
        totalEarnings: 0,
        currentBalance: 0,
        totalSales: 0,
        totalDcsSales: 0,
        commissionRate: 100,
        pendingCommissions: 0
      })
      setRecentCommissions([])
      setRecentPayouts([])
      setAffiliateProfile({ commission_rate: 100, total_earnings: 0, total_referrals: 0 } as AffiliateProfile)
      
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [user, profile])

  // Initial fetch on mount or when user/profile changes
  useEffect(() => {
    fetchAffiliateData()
  }, [fetchAffiliateData])

  // Refetch when route changes
  useEffect(() => {
    fetchAffiliateData()
  }, [pathname, fetchAffiliateData])

  // Refetch when tab becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('📱 Tab became visible, refreshing affiliate data...')
        fetchAffiliateData()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [fetchAffiliateData])

  // Refetch when page is restored from bfcache (browser back/forward)
  useEffect(() => {
    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        console.log('🔄 Page restored from bfcache, refreshing affiliate data...')
        fetchAffiliateData()
      }
    }

    window.addEventListener('pageshow', handlePageShow)
    return () => window.removeEventListener('pageshow', handlePageShow)
  }, [fetchAffiliateData])

  return {
    stats,
    recentCommissions,
    recentPayouts,
    affiliateProfile,
    loading,
    error,
    refresh: fetchAffiliateData
  }
}
