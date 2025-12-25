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

        // NEW APPROACH: Direct JOIN query to get affiliate profiles with names
        console.log('🔄 Using direct JOIN approach...')
        
        const { data: leaderboardData, error: leaderboardError } = await supabase
          .from('affiliate_profiles')
          .select(`
            id,
            total_earnings,
            profiles!inner (
              full_name,
              email
            )
          `)
          .order('total_earnings', { ascending: false })
          .limit(50)

        if (leaderboardError) {
          console.error('❌ Failed to fetch leaderboard with JOIN:', leaderboardError.message)
          // Fallback to separate queries
          console.log('🔄 Falling back to separate queries...')
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

          console.log('✅ Affiliate profiles fetched:', affiliateProfiles?.length || 0)

          // Simple approach: Get names individually
          const leaderboardWithNames = []
          for (const affiliate of (affiliateProfiles || []).slice(0, 10)) {
            console.log(`🔍 Getting profile for affiliate ID: ${(affiliate as any).id}`)
            
            const { data: profile, error: profileError } = await supabase
              .from('profiles')
              .select('full_name, email')
              .eq('id', (affiliate as any).id)
              .maybeSingle() // Use maybeSingle instead of single
            
            if (profileError) {
              console.error(`❌ Failed to get profile for ${(affiliate as any).id}:`, profileError.message)
            } else if (!profile) {
              console.warn(`⚠️ No profile found for ${(affiliate as any).id}`)
            } else {
              console.log(`✅ Profile found for ${(affiliate as any).id}:`, { full_name: (profile as any).full_name, email: (profile as any).email })
            }
            
            const name = (profile as any)?.full_name || (profile as any)?.email?.split('@')[0] || 'Anonymous Affiliate'
            
            console.log(`📝 Name resolved for ${(affiliate as any).id}:`, name)
            
            leaderboardWithNames.push({
              rank: leaderboardWithNames.length + 1,
              user_id: (affiliate as any).id,
              name,
              level: getAffiliateLevel(leaderboardWithNames.length + 1),
              total_earnings: (affiliate as any).total_earnings || 0,
              total_referrals: 0,
              award: getAwardEmoji(leaderboardWithNames.length + 1),
              isCurrentUser: user ? (affiliate as any).id === user.id : false
            })
          }

          console.log('✅ Final leaderboard with names:', leaderboardWithNames.length)
          setLeaderboard(leaderboardWithNames)
          return
        }

        // Transform JOIN data
        const transformedData: LeaderboardEntry[] = (leaderboardData || []).map((item: any, index: number) => {
          const rank = index + 1
          const profileData = item.profiles
          
          console.log(`🔍 Processing rank ${rank}:`, {
            affiliateId: item.id,
            profileData,
            fullName: profileData?.full_name,
            email: profileData?.email
          })
          
          return {
            rank,
            user_id: item.id,
            name: profileData?.full_name || profileData?.email?.split('@')[0] || 'Anonymous Affiliate',
            level: getAffiliateLevel(rank),
            total_earnings: item.total_earnings || 0,
            total_referrals: 0,
            award: getAwardEmoji(rank),
            isCurrentUser: user ? item.id === user.id : false
          }
        })

        setLeaderboard(transformedData)

        // Find current user's rank
        if (user) {
          const userEntry = transformedData.find(entry => entry.user_id === user.id)
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
