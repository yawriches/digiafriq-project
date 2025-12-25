"use client"
import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/supabase/auth'
import { supabase } from '@/lib/supabase/client'

interface Contest {
  id: string
  name: string
  description: string
  campaign: string
  start_date: string
  end_date: string
  status: 'running' | 'ended' | 'upcoming'
  prize_amount: number
  prize_description: string
  target_referrals: number
  winner_criteria: string
  max_participants?: number
  rules: string[]
  created_at: string
  updated_at: string
}

interface ContestParticipation {
  id: string
  contest_id: string
  user_id: string
  referrals_count: number
  rank: number
  prize_won?: string
  joined_at: string
}

interface ContestsData {
  runningContests: Contest[]
  endedContests: Contest[]
  userParticipations: ContestParticipation[]
  loading: boolean
  error: string | null
}

export const useContests = (): ContestsData => {
  const { user } = useAuth()
  const [runningContests, setRunningContests] = useState<Contest[]>([])
  const [endedContests, setEndedContests] = useState<Contest[]>([])
  const [userParticipations, setUserParticipations] = useState<ContestParticipation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchContests = async () => {
      try {
        setLoading(true)
        setError(null)

        // Try to fetch contests from Supabase, fallback to mock data if table doesn't exist
        try {
          const { data: contests, error: contestsError } = await (supabase as any)
            .from('contests')
            .select('*')
            .order('created_at', { ascending: false })

          if (contestsError) {
            // If table doesn't exist, use mock data
            if (contestsError.message.includes('relation "contests" does not exist') || 
                contestsError.message.includes('table "contests" does not exist')) {
              console.warn('Contests table not found, using mock data. Please apply the migration.')
              throw new Error('MOCK_DATA_FALLBACK')
            }
            throw new Error(`Failed to fetch contests: ${contestsError.message}`)
          }

          // Separate running and ended contests
          const running = contests?.filter((c: any) => c.status === 'running') || []
          const ended = contests?.filter((c: any) => c.status === 'ended') || []

          setRunningContests(running)
          setEndedContests(ended)

          // Fetch user participations if user is logged in
          if (user) {
            const { data: participations, error: participationsError } = await (supabase as any)
              .from('contest_participations')
              .select('*')
              .eq('user_id', user.id)

            if (participationsError) {
              console.warn('Failed to fetch user participations:', participationsError.message)
              // Don't throw error for participations, just log warning
            } else {
              setUserParticipations(participations || [])
            }
          }
        } catch (dbError: any) {
          // If database error or table doesn't exist, use mock data
          if (dbError.message === 'MOCK_DATA_FALLBACK' || 
              dbError.message.includes('Failed to fetch') ||
              dbError.message.includes('relation') ||
              dbError.message.includes('table')) {
            
            console.log('Using mock contest data as fallback')
            
            // Mock running contests
            const mockRunningContests: Contest[] = [
              {
                id: '1',
                name: 'The UMM Boss Sales Challenge',
                description: 'Refer 25 new affiliates to earn cash reward',
                campaign: 'The Ultimate Money Machine (U.M.M)',
                start_date: '2024-10-01',
                end_date: '2024-12-31',
                status: 'running',
                prize_amount: 700,
                prize_description: '700 Cedis',
                target_referrals: 25,
                winner_criteria: 'All target satisfied',
                max_participants: 100,
                rules: [
                  'Sales must be verified and legitimate to count toward the contest',
                  'Only new affiliate sign-ups during the contest period are eligible'
                ],
                created_at: '2024-10-01T00:00:00Z',
                updated_at: '2024-10-01T00:00:00Z'
              },
              {
                id: '2',
                name: '50 Affiliate Sales Challenge',
                description: 'Refer 50 new affiliates to unlock bigger rewards',
                campaign: 'DigiAfriq Campaign',
                start_date: '2024-10-01',
                end_date: '2024-12-31',
                status: 'running',
                prize_amount: 2000,
                prize_description: '2,000 Cedis',
                target_referrals: 50,
                winner_criteria: 'All target satisfied',
                max_participants: 50,
                rules: [
                  'Sales must be verified and legitimate to count toward the contest'
                ],
                created_at: '2024-10-01T00:00:00Z',
                updated_at: '2024-10-01T00:00:00Z'
              }
            ]

            // Mock ended contests
            const mockEndedContests: Contest[] = [
              {
                id: '4',
                name: 'MINI IMPORTATION GOLDMINE',
                description: 'Import products from China and sell locally for profit',
                campaign: 'DigiAfriq Campaign',
                start_date: '2024-07-01',
                end_date: '2024-09-30',
                status: 'ended',
                prize_amount: 700,
                prize_description: '700 Cedis',
                target_referrals: 25,
                winner_criteria: 'All target satisfied',
                max_participants: 50,
                rules: [
                  'Contest focused on importation business model'
                ],
                created_at: '2024-07-01T00:00:00Z',
                updated_at: '2024-09-30T00:00:00Z'
              }
            ]

            // Mock user participations
            const mockParticipations: ContestParticipation[] = user ? [
              {
                id: '1',
                contest_id: '1',
                user_id: user.id,
                referrals_count: 12,
                rank: 8,
                joined_at: '2024-10-05T00:00:00Z'
              },
              {
                id: '3',
                contest_id: '4',
                user_id: user.id,
                referrals_count: 25,
                rank: 8,
                prize_won: '700 Cedis',
                joined_at: '2024-07-05T00:00:00Z'
              }
            ] : []

            setRunningContests(mockRunningContests)
            setEndedContests(mockEndedContests)
            setUserParticipations(mockParticipations)
          } else {
            throw dbError
          }
        }

      } catch (err: any) {
        console.error('Error fetching contests:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchContests()
  }, [user])

  return {
    runningContests,
    endedContests,
    userParticipations,
    loading,
    error
  }
}
