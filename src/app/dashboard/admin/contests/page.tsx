"use client"
import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AdminDashboardLayout from '@/components/dashboard/AdminDashboardLayout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Plus, 
  Edit, 
  Trash2, 
  Trophy, 
  Calendar, 
  Target,
  Users,
  Search,
  Loader2,
  Eye
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

export default function ContestsPage() {
  const router = useRouter()
  const [contests, setContests] = useState<Contest[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchContests()
  }, [])

  const fetchContests = async () => {
    try {
      setLoading(true)
      
      const response = await fetch('/api/admin/contests')
      const result = await response.json()

      if (result.error) {
        // If table doesn't exist, show empty state
        if (result.error.includes('relation "contests" does not exist')) {
          console.warn('Contests table not found. Please run the migration.')
          setContests([])
          return
        }
        throw new Error(result.error)
      }

      setContests(result.data || [])
    } catch (error: any) {
      console.error('Error fetching contests:', error)
      toast.error('Failed to load contests')
      setContests([])
    } finally {
      setLoading(false)
    }
  }

  const handleCreateContest = () => {
    router.push('/dashboard/admin/contests/create')
  }

  const handleEditContest = (contest: Contest) => {
    router.push(`/dashboard/admin/contests/${contest.id}/edit`)
  }

  const handleViewContest = (contest: Contest) => {
    router.push(`/dashboard/admin/contests/${contest.id}`)
  }

  const handleDeleteContest = async (contestId: string) => {
    if (!confirm('Are you sure you want to delete this contest? This action cannot be undone.')) {
      return
    }

    try {
      setLoading(true)
      
      const response = await fetch(`/api/admin/contests?id=${contestId}`, {
        method: 'DELETE'
      })
      const result = await response.json()

      if (result.error) throw new Error(result.error)

      toast.success('Contest deleted successfully')
      fetchContests()
    } catch (error: any) {
      console.error('Error deleting contest:', error)
      toast.error('Failed to delete contest')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleStatus = async (contest: Contest) => {
    const newStatus = contest.status === 'running' ? 'ended' : 'running'
    
    try {
      const response = await fetch('/api/admin/contests', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: contest.id, status: newStatus })
      })
      const result = await response.json()

      if (result.error) throw new Error(result.error)

      toast.success(`Contest ${newStatus === 'running' ? 'activated' : 'ended'} successfully`)
      fetchContests()
    } catch (error: any) {
      console.error('Error updating contest status:', error)
      toast.error('Failed to update contest status')
    }
  }

  const filteredContests = contests.filter(contest =>
    contest.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contest.campaign?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contest.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

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
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <AdminDashboardLayout title="Contests Management">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Contests</h1>
            <p className="text-gray-600 mt-1">Manage affiliate contests and challenges</p>
          </div>
          <Button 
            onClick={handleCreateContest}
            className="bg-[#3eb489] hover:bg-[#35a07a] text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Contest
          </Button>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            placeholder="Search contests..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-4 pr-12 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3eb489] focus:border-transparent"
          />
          <div className="absolute right-0 top-0 h-full px-4 flex items-center text-gray-400">
            <Search className="w-5 h-5" />
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Trophy className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Active Contests</p>
                  <p className="text-xl font-bold text-gray-900">
                    {contests.filter(c => c.status === 'running').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <Calendar className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Ended Contests</p>
                  <p className="text-xl font-bold text-gray-900">
                    {contests.filter(c => c.status === 'ended').length}
                  </p>
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
                  <p className="text-sm text-gray-600">Total Contests</p>
                  <p className="text-xl font-bold text-gray-900">{contests.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Contests List */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-[#3eb489]" />
            <span className="ml-2 text-gray-600">Loading contests...</span>
          </div>
        ) : filteredContests.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No contests found</h3>
              <p className="text-gray-500 mb-4">
                {searchQuery ? 'No contests match your search.' : 'Get started by creating your first contest.'}
              </p>
              {!searchQuery && (
                <Button 
                  onClick={handleCreateContest}
                  className="bg-[#3eb489] hover:bg-[#35a07a] text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Contest
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredContests.map((contest) => (
              <Card key={contest.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    {/* Contest Info */}
                    <div className="flex-1 space-y-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{contest.name}</h3>
                          <p className="text-sm text-gray-500">{contest.campaign || 'DigiAfriq Campaign'}</p>
                        </div>
                        <Badge className={`${getStatusColor(contest.status)} capitalize`}>
                          {contest.status}
                        </Badge>
                      </div>
                      
                      <p className="text-sm text-gray-600 line-clamp-2">{contest.description}</p>
                      
                      <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          {formatDate(contest.start_date)} - {formatDate(contest.end_date)}
                        </div>
                        <div className="flex items-center">
                          <Trophy className="w-4 h-4 mr-1" />
                          {contest.prize_description}
                        </div>
                        <div className="flex items-center">
                          <Target className="w-4 h-4 mr-1" />
                          Target: {contest.target_referrals} referrals
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewContest(contest)}
                        className="text-gray-600"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditContest(contest)}
                        className="text-blue-600"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleStatus(contest)}
                        className={contest.status === 'running' ? 'text-orange-600' : 'text-green-600'}
                      >
                        {contest.status === 'running' ? 'End' : 'Activate'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteContest(contest.id)}
                        className="text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AdminDashboardLayout>
  )
}
