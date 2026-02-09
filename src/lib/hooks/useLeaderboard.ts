"use client"
import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/supabase/auth'
import { supabase } from '@/lib/supabase/client'

interface LeaderboardEntry {
  rank: number
  user_id: string
  name: string
  level: string
  total_revenue: number
  total_referrals: number
  award: string
  isCurrentUser?: boolean
}

interface LeaderboardData {
  leaderboard: LeaderboardEntry[]
  currentUserRank: number | null
  loading: boolean
  error: string | null
}

export const useLeaderboard = (): LeaderboardData => {
  const { user, profile } = useAuth()
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [currentUserRank, setCurrentUserRank] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Function to determine affiliate level based on rank
  const getAffiliateLevel = (rank: number): string => {
    if (rank >= 1 && rank <= 3) return 'Legends'
    if (rank >= 4 && rank <= 6) return 'Champions'
    if (rank >= 7 && rank <= 10) return 'Elites'
    if (rank >= 11 && rank <= 15) return 'Rising Stars'
    if (rank >= 16 && rank <= 20) return 'Dream Chasers'
    return 'Starter'
  }

  // Function to get award emoji based on rank
  const getAwardEmoji = (rank: number): string => {
    if (rank === 1) return '🏆'
    if (rank === 2) return '🥈'
    if (rank === 3) return '🥉'
    return '🏆'
  }

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setLoading(true)
        setError(null)

        // Fetch affiliate profiles with referral codes
        const { data: affiliateProfiles, error: profilesError } = await supabase
          .from('affiliate_profiles')
          .select('id, referral_code')

        if (profilesError) {
          console.error('Failed to fetch affiliate profiles:', profilesError.message)
          setLeaderboard([])
          return
        }

        if (!affiliateProfiles || affiliateProfiles.length === 0) {
          setLeaderboard([])
          return
        }

        // Build referral_code -> user_id map
        const codeToUserMap = new Map<string, string>()
        affiliateProfiles.forEach((ap: any) => {
          if (ap.referral_code) codeToUserMap.set(ap.referral_code, ap.id)
        })

        // Fetch completed payments and profiles in parallel
        const profileIds = affiliateProfiles.map((ap: any) => ap.id)
        const [paymentsResult, profilesResult] = await Promise.all([
          supabase
            .from('payments')
            .select('amount, metadata')
            .eq('status', 'completed'),
          supabase
            .from('profiles')
            .select('id, full_name, email, affiliate_onboarding_completed, available_roles, active_role, role')
            .in('id', profileIds)
        ])

        if (paymentsResult.error) {
          console.error('Failed to fetch payments:', paymentsResult.error.message)
        }
        if (profilesResult.error) {
          console.error('Failed to fetch profiles:', profilesResult.error.message)
        }

        const payments = paymentsResult.data || []
        const profiles = profilesResult.data || []

        // Create profile lookup map
        const profileMap = new Map<string, any>()
        profiles.forEach((p: any) => profileMap.set(p.id, p))

        // Calculate total revenue per affiliate from payments
        const revenueMap = new Map<string, number>()
        const salesCountMap = new Map<string, number>()
        payments.forEach((p: any) => {
          const refCode = p.metadata?.referral_code
          if (refCode && codeToUserMap.has(refCode)) {
            const affiliateId = codeToUserMap.get(refCode)!
            revenueMap.set(affiliateId, (revenueMap.get(affiliateId) || 0) + (parseFloat(p.amount) || 0))
            salesCountMap.set(affiliateId, (salesCountMap.get(affiliateId) || 0) + 1)
          }
        })

        // Build leaderboard entries — only onboarded affiliates with valid profiles
        const entries: LeaderboardEntry[] = []
        for (const ap of affiliateProfiles) {
          const profileData = profileMap.get((ap as any).id)
          if (!profileData) continue
          if (!profileData.affiliate_onboarding_completed) continue
          if (!profileData.full_name && !profileData.email) continue

          const isAffiliate =
            profileData.role === 'affiliate' ||
            profileData.active_role === 'affiliate' ||
            profileData.available_roles?.includes('affiliate')
          if (!isAffiliate) continue

          entries.push({
            rank: 0,
            user_id: (ap as any).id,
            name: profileData.full_name || profileData.email?.split('@')[0] || 'Affiliate',
            level: '',
            total_revenue: revenueMap.get((ap as any).id) || 0,
            total_referrals: salesCountMap.get((ap as any).id) || 0,
            award: '',
            isCurrentUser: user ? (ap as any).id === user.id : false
          })
        }

        // Sort by total revenue descending and assign ranks
        entries.sort((a, b) => b.total_revenue - a.total_revenue)
        entries.forEach((entry, i) => {
          entry.rank = i + 1
          entry.level = getAffiliateLevel(entry.rank)
          entry.award = getAwardEmoji(entry.rank)
        })

        setLeaderboard(entries)

        // Find current user's rank
        if (user) {
          const userEntry = entries.find(entry => entry.user_id === user.id)
          setCurrentUserRank(userEntry?.rank || null)
        }

      } catch (err: any) {
        console.error('Error fetching leaderboard:', err)
        setError(err.message)
        
        // Set empty leaderboard on error
        setLeaderboard([])
        setCurrentUserRank(null)
      } finally {
        setLoading(false)
      }
    }

    fetchLeaderboard()
  }, [user, profile])

  return {
    leaderboard,
    currentUserRank,
    loading,
    error
  }
}
