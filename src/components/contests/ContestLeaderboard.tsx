"use client"

import React, { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Trophy, Medal, Award, User, TrendingUp, Loader2, DollarSign } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/lib/supabase/auth'

interface LeaderboardEntry {
  id: string
  user_id: string
  user_name: string
  user_avatar_url: string | null
  total_earnings: number
  total_referrals: number
  affiliate_level: string
  rank: number
}

interface AffiliateProfile {
  id: string
  total_earnings: number
}

interface Profile {
  id: string
  full_name: string
  avatar_url: string | null
}

interface ContestLeaderboardProps {
  contestId?: string
  contestStatus?: 'running' | 'ended' | 'upcoming'
}

export default function ContestLeaderboard({ contestId, contestStatus }: ContestLeaderboardProps) {
  const { user } = useAuth()
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [userEntry, setUserEntry] = useState<LeaderboardEntry | null>(null)

  useEffect(() => {
    fetchLeaderboard()

    // Poll for updates every 30 seconds (works without Pro subscription)
    const pollInterval = setInterval(() => {
      fetchLeaderboard()
    }, 30000) // 30 seconds

    return () => {
      clearInterval(pollInterval)
    }
  }, [])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const getLevelFromRank = (rank: number): string => {
    if (rank >= 1 && rank <= 3) return 'Legends'
    if (rank >= 4 && rank <= 6) return 'Champions'
    if (rank >= 7 && rank <= 10) return 'Elites'
    if (rank >= 11 && rank <= 15) return 'Rising Stars'
    if (rank >= 16 && rank <= 20) return 'Dream Chasers'
    return 'Starter'
  }

  const fetchLeaderboard = async () => {
    try {
      // Fetch affiliate profiles with user details from profiles table
      const { data: affiliates, error: affiliatesError } = await supabase
        .from('affiliate_profiles')
        .select(`
          id,
          total_earnings
        `)
        .order('total_earnings', { ascending: false })
        .limit(50)

      if (affiliatesError) {
        console.error('Error fetching affiliates:', affiliatesError)
        return
      }

      // Fetch profile names for these affiliates
      const affiliateIds = (affiliates as AffiliateProfile[] || []).map((a: AffiliateProfile) => a.id)
      
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .in('id', affiliateIds)

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError)
      }

      // Create a map of profiles for quick lookup
      const profileMap = new Map((profiles as Profile[] || []).map((p: Profile) => [p.id, p]))

      // Combine data and assign ranks
      const rankedData: LeaderboardEntry[] = (affiliates as AffiliateProfile[] || []).map((affiliate: AffiliateProfile, index: number) => {
        const profile = profileMap.get(affiliate.id)
        return {
          id: affiliate.id,
          user_id: affiliate.id,
          user_name: profile?.full_name || 'Anonymous Affiliate',
          user_avatar_url: profile?.avatar_url || null,
          total_earnings: affiliate.total_earnings || 0,
          total_referrals: 0, // Column doesn't exist in DB yet
          affiliate_level: getLevelFromRank(index + 1),
          rank: index + 1
        }
      })

      setLeaderboard(rankedData)

      // Find current user's entry
      if (user) {
        const currentUserEntry = rankedData.find(entry => entry.user_id === user.id)
        setUserEntry(currentUserEntry || null)
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-5 h-5 text-yellow-500" />
      case 2:
        return <Medal className="w-5 h-5 text-gray-400" />
      case 3:
        return <Award className="w-5 h-5 text-amber-600" />
      default:
        return <span className="w-5 h-5 flex items-center justify-center text-sm font-bold text-gray-500">{rank}</span>
    }
  }

  const getRankBgColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-200'
      case 2:
        return 'bg-gradient-to-r from-gray-50 to-slate-50 border-gray-200'
      case 3:
        return 'bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200'
      default:
        return 'bg-white border-gray-100'
    }
  }

  const getLevelBadgeColor = (level: string) => {
    switch (level) {
      case 'Legends':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      case 'Champions':
        return 'bg-purple-100 text-purple-800 border-purple-300'
      case 'Elites':
        return 'bg-blue-100 text-blue-800 border-blue-300'
      case 'Rising Stars':
        return 'bg-green-100 text-green-800 border-green-300'
      case 'Dream Chasers':
        return 'bg-orange-100 text-orange-800 border-orange-300'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <Loader2 className="w-6 h-6 animate-spin text-[#ed874a]" />
            <span className="ml-2 text-gray-500">Loading leaderboard...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center text-lg">
          <TrendingUp className="w-5 h-5 mr-2 text-[#ed874a]" />
          Affiliate Leaderboard
          <span className="ml-2 flex items-center">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-1"></span>
            <span className="text-xs text-green-600 font-normal">Live</span>
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {leaderboard.length === 0 ? (
          <div className="p-6 text-center">
            <User className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No affiliates yet</p>
            <p className="text-sm text-gray-400 mt-1">Be the first to earn commissions!</p>
          </div>
        ) : (
          <>
            {/* Current User Position Banner */}
            {userEntry && (
              <div className="bg-[#ed874a]/10 border-b border-[#ed874a]/20 px-4 py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-[#ed874a] rounded-full flex items-center justify-center text-white font-bold text-sm">
                      #{userEntry.rank}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Your Position</p>
                      <p className="text-sm text-gray-500">{formatCurrency(userEntry.total_earnings)} earned • {userEntry.total_referrals} referrals</p>
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full border ${getLevelBadgeColor(userEntry.affiliate_level)}`}>
                    {userEntry.affiliate_level}
                  </span>
                </div>
              </div>
            )}

            {/* Leaderboard List */}
            <div className="divide-y divide-gray-100">
              {leaderboard.map((entry) => (
                <div
                  key={entry.id}
                  className={`flex items-center justify-between px-4 py-3 transition-colors hover:bg-gray-50 ${
                    entry.user_id === user?.id ? 'bg-[#ed874a]/5' : ''
                  } ${getRankBgColor(entry.rank)} border-l-4`}
                >
                  <div className="flex items-center gap-3">
                    {/* Rank */}
                    <div className="w-8 flex justify-center">
                      {getRankIcon(entry.rank)}
                    </div>

                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                      {entry.user_avatar_url ? (
                        <img 
                          src={entry.user_avatar_url} 
                          alt={entry.user_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="w-5 h-5 text-gray-400" />
                      )}
                    </div>

                    {/* Name & Level */}
                    <div>
                      <p className={`font-medium ${entry.user_id === user?.id ? 'text-[#ed874a]' : 'text-gray-900'}`}>
                        {entry.user_name}
                        {entry.user_id === user?.id && (
                          <span className="ml-2 text-xs bg-[#ed874a] text-white px-2 py-0.5 rounded-full">You</span>
                        )}
                      </p>
                      <p className="text-xs text-gray-500">
                        <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] border ${getLevelBadgeColor(entry.affiliate_level)}`}>
                          {entry.affiliate_level}
                        </span>
                        <span className="ml-2">{entry.total_referrals} referrals</span>
                      </p>
                    </div>
                  </div>

                  {/* Earnings */}
                  <div className="text-right">
                    <p className="font-bold text-green-600 flex items-center justify-end">
                      <DollarSign className="w-4 h-4" />
                      {entry.total_earnings.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500">earned</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            {leaderboard.length >= 50 && (
              <div className="p-3 text-center border-t border-gray-100">
                <p className="text-sm text-gray-500">Showing top 50 affiliates</p>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
