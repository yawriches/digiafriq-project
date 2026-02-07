"use client"
import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/supabase/auth'
import { supabase } from '@/lib/supabase/client'

interface LeaderboardEntry {
  rank: number
  user_id: string
  name: string
  level: string
  total_earnings: number
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

        // Fetch affiliate profiles ordered by earnings
        const { data: affiliateProfiles, error: profilesError } = await supabase
          .from('affiliate_profiles')
          .select('id, total_earnings')
          .order('total_earnings', { ascending: false })
          .limit(50)

        if (profilesError) {
          console.error('Failed to fetch affiliate profiles:', profilesError.message)
          setLeaderboard([])
          return
        }

        if (!affiliateProfiles || affiliateProfiles.length === 0) {
          setLeaderboard([])
          return
        }

        // Get all profile IDs
        const profileIds = affiliateProfiles.map((ap: any) => ap.id)

        // Fetch all profiles in one query
        const { data: profiles, error: profilesFetchError } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .in('id', profileIds)

        if (profilesFetchError) {
          console.error('Failed to fetch profiles:', profilesFetchError.message)
        }

        // Create a map of profile data for quick lookup
        const profileMap = new Map<string, { full_name: string | null; email: string | null }>()
        if (profiles) {
          profiles.forEach((p: any) => {
            profileMap.set(p.id, { full_name: p.full_name, email: p.email })
          })
        }

        // Build leaderboard with names, filtering out entries without valid profiles
        const leaderboardWithNames: LeaderboardEntry[] = []
        let rank = 0
        
        for (const affiliate of affiliateProfiles) {
          const profileData = profileMap.get((affiliate as any).id)
          
          // Skip affiliates without a matching profile (test/sample data)
          if (!profileData || (!profileData.full_name && !profileData.email)) {
            continue
          }
          
          rank++
          const name = profileData.full_name || profileData.email?.split('@')[0] || 'Affiliate'
          
          leaderboardWithNames.push({
            rank,
            user_id: (affiliate as any).id,
            name,
            level: getAffiliateLevel(rank),
            total_earnings: (affiliate as any).total_earnings || 0,
            total_referrals: 0,
            award: getAwardEmoji(rank),
            isCurrentUser: user ? (affiliate as any).id === user.id : false
          })
        }

        setLeaderboard(leaderboardWithNames)

        // Find current user's rank
        if (user) {
          const userEntry = leaderboardWithNames.find(entry => entry.user_id === user.id)
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
