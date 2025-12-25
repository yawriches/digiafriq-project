"use client"
import React, { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import AdminDashboardLayout from '@/components/dashboard/AdminDashboardLayout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  ArrowLeft, 
  Edit, 
  Trophy, 
  Calendar, 
  Target,
  Users,
  Loader2,
  Gift,
  CheckCircle
} from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { toast } from 'sonner'

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
      
      const { data, error } = await (supabase as any)
        .from('contests')
        .select('*')
        .eq('id', contestId)
        .single()

      if (error) throw error

      setContest(data)
    } catch (error: any) {
      console.error('Error fetching contest:', error)
      toast.error('Failed to load contest')
      router.push('/dashboard/admin/contests')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'ended':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      case 'upcoming':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <AdminDashboardLayout title="Contest Details">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-[#3eb489]" />
          <span className="ml-2 text-gray-600">Loading contest...</span>
        </div>
      </AdminDashboardLayout>
    )
  }

  if (!contest) {
    return (
      <AdminDashboardLayout title="Contest Details">
        <div className="text-center py-12">
          <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Contest not found</h3>
          <Button onClick={() => router.push('/dashboard/admin/contests')}>
            Back to Contests
          </Button>
        </div>
      </AdminDashboardLayout>
    )
  }

  return (
    <AdminDashboardLayout title="Contest Details">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => router.back()}
              className="text-gray-600"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{contest.name}</h1>
              <p className="text-gray-600">{contest.campaign || 'DigiAfriq Campaign'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={`${getStatusColor(contest.status)} capitalize px-3 py-1`}>
              {contest.status}
            </Badge>
            <Button 
              onClick={() => router.push(`/dashboard/admin/contests/${contest.id}/edit`)}
              className="bg-[#3eb489] hover:bg-[#35a07a] text-white"
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit Contest
            </Button>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Trophy className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Prize</p>
                  <p className="text-lg font-bold text-gray-900">{contest.prize_description || 'N/A'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Target className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Target Referrals</p>
                  <p className="text-lg font-bold text-gray-900">{contest.target_referrals}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Users className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Max Participants</p>
                  <p className="text-lg font-bold text-gray-900">{contest.max_participants || 'Unlimited'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Calendar className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Duration</p>
                  <p className="text-sm font-medium text-gray-900">
                    {formatDate(contest.start_date)} - {formatDate(contest.end_date)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Contest Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Description & Winner Criteria */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Trophy className="w-5 h-5 mr-2 text-[#3eb489]" />
                Contest Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-1">Description</h4>
                <p className="text-gray-600">{contest.description || 'No description provided.'}</p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-1">Winner Criteria</h4>
                <p className="text-gray-600">{contest.winner_criteria || 'All target satisfied'}</p>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-1">Prize Amount</h4>
                <p className="text-gray-600">
                  {contest.prize_amount > 0 ? `$${contest.prize_amount.toFixed(2)}` : 'Not specified'}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Contest Rules */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Gift className="w-5 h-5 mr-2 text-[#3eb489]" />
                Contest Rules
              </CardTitle>
            </CardHeader>
            <CardContent>
              {contest.rules && contest.rules.length > 0 ? (
                <ul className="space-y-2">
                  {contest.rules.map((rule, index) => (
                    <li key={index} className="flex items-start">
                      <CheckCircle className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-600 text-sm">{rule}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500 text-sm">No rules specified for this contest.</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Contest Period Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="w-5 h-5 mr-2 text-[#3eb489]" />
              Contest Period
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500 mb-1">Start Date</p>
                <p className="font-medium text-gray-900">{formatDate(contest.start_date)}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500 mb-1">End Date</p>
                <p className="font-medium text-gray-900">{formatDate(contest.end_date)}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500 mb-1">Created</p>
                <p className="font-medium text-gray-900">{formatDate(contest.created_at)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminDashboardLayout>
  )
}
