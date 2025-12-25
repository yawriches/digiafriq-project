"use client"
import React, { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  ArrowLeft, 
  Trophy, 
  Calendar, 
  Target,
  Users,
  Loader2,
  CheckCircle,
  Clock
} from 'lucide-react'
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

export default function ContestDetailsPage() {
  const router = useRouter()
  const params = useParams()
  const contestId = params.id as string
  
  const [contest, setContest] = useState<Contest | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchContest()
  }, [contestId])

  const fetchContest = async () => {
    try {
      setLoading(true)
      
      const { data, error } = await supabase
        .from('contests')
        .select('*')
        .eq('id', contestId)
        .single()

      if (error) throw error

      setContest(data)
    } catch (error: any) {
      console.error('Error fetching contest:', error)
      router.push('/dashboard/affiliate/contests/active')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
        return 'bg-green-100 text-green-800'
      case 'ended':
        return 'bg-gray-100 text-gray-800'
      case 'upcoming':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getDaysRemaining = (endDate: string) => {
    const end = new Date(endDate)
    const now = new Date()
    const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    return diff > 0 ? diff : 0
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[#ed874a]" />
        <span className="ml-2 text-gray-600">Loading contest details...</span>
      </div>
    )
  }

  if (!contest) {
    return (
      <div className="text-center py-12">
        <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Contest not found</h3>
        <Button 
          onClick={() => router.push('/dashboard/affiliate/contests/active')}
          className="bg-[#ed874a] hover:bg-[#d76f32] text-white"
        >
          Back to Contests
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
        {/* Back Button */}
        <Button
          variant="outline"
          onClick={() => router.back()}
          className="text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Contests
        </Button>

        {/* Contest Header */}
        <div className="bg-gradient-to-r from-[#ed874a] to-[#d76f32] rounded-xl p-6 text-white">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <Badge className={`${getStatusColor(contest.status)} capitalize mb-2`}>
                {contest.status}
              </Badge>
              <h1 className="text-2xl md:text-3xl font-bold">{contest.name}</h1>
              <p className="text-white/80 mt-1">{contest.campaign || 'DigiAfriq Campaign'}</p>
            </div>
            {contest.status === 'running' && (
              <div className="bg-white/20 rounded-lg px-4 py-3 text-center">
                <div className="flex items-center justify-center gap-2">
                  <Clock className="w-5 h-5" />
                  <span className="text-2xl font-bold">{getDaysRemaining(contest.end_date)}</span>
                </div>
                <p className="text-sm text-white/80">Days Remaining</p>
              </div>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <Target className="w-8 h-8 text-[#ed874a] mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">{contest.target_referrals}</p>
              <p className="text-sm text-gray-500">Target Referrals</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <Users className="w-8 h-8 text-[#ed874a] mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">{contest.max_participants || '∞'}</p>
              <p className="text-sm text-gray-500">Max Participants</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <Calendar className="w-8 h-8 text-blue-500 mx-auto mb-2" />
              <p className="text-sm font-bold text-gray-900">{formatDate(contest.start_date)}</p>
              <p className="text-sm text-gray-500">Start Date</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <Calendar className="w-8 h-8 text-red-500 mx-auto mb-2" />
              <p className="text-sm font-bold text-gray-900">{formatDate(contest.end_date)}</p>
              <p className="text-sm text-gray-500">End Date</p>
            </CardContent>
          </Card>
        </div>

        {/* Description */}
        <Card>
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Trophy className="w-5 h-5 mr-2 text-[#ed874a]" />
              Contest Details & Prizes
            </h2>
            <div className="prose prose-sm max-w-none">
              <p className="text-gray-700 whitespace-pre-wrap leading-relaxed text-base">
                {contest.description || 'No description provided for this contest.'}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Winner Criteria */}
        {contest.winner_criteria && (
          <Card>
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                <Trophy className="w-5 h-5 mr-2 text-[#ed874a]" />
                Winner Criteria
              </h2>
              <p className="text-gray-700">{contest.winner_criteria}</p>
            </CardContent>
          </Card>
        )}

        {/* Contest Rules */}
        {contest.rules && contest.rules.length > 0 && (
          <Card>
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <CheckCircle className="w-5 h-5 mr-2 text-[#ed874a]" />
                Contest Rules
              </h2>
              <ul className="space-y-3">
                {contest.rules.map((rule, index) => (
                  <li key={index} className="flex items-start">
                    <span className="flex-shrink-0 w-6 h-6 bg-[#ed874a]/10 text-[#ed874a] rounded-full flex items-center justify-center text-sm font-medium mr-3">
                      {index + 1}
                    </span>
                    <span className="text-gray-700">{rule}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

      </div>
  )
}
