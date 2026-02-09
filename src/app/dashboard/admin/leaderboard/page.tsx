"use client"
import React, { useState, useEffect } from 'react'
import AdminDashboardLayout from '@/components/dashboard/AdminDashboardLayout'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Trophy,
  Users,
  DollarSign,
  TrendingUp,
  Search,
  Loader2,
  Edit,
  Save,
  X,
  ChevronUp,
  ChevronDown,
  Award,
  Star,
  UserCheck,
  RefreshCw
} from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface LeaderboardEntry {
  rank: number
  user_id: string
  name: string
  email: string
  level: string
  total_revenue: number
  total_referrals: number
  active_referrals: number
  total_commissions: number
  referral_code: string
  status: string
  onboarding_completed: boolean
  created_at: string
}

interface LeaderboardStats {
  totalAffiliates: number
  totalRevenue: number
  totalReferrals: number
  activeAffiliates: number
}

export default function LeaderboardManagementPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [stats, setStats] = useState<LeaderboardStats>({ totalAffiliates: 0, totalRevenue: 0, totalReferrals: 0, activeAffiliates: 0 })
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<{ total_revenue?: number; status?: string }>({})
  const [saving, setSaving] = useState(false)
  const [sortField, setSortField] = useState<'total_revenue' | 'total_referrals' | 'rank'>('rank')
  const [sortAsc, setSortAsc] = useState(true)

  useEffect(() => {
    fetchLeaderboard()
  }, [])

  const fetchLeaderboard = async () => {
    try {
      setLoading(true)
      const { data: sessionData } = await supabase.auth.getSession()
      if (!sessionData.session) {
        toast.error('Session expired')
        return
      }

      const response = await fetch('/api/admin/leaderboard', {
        headers: {
          'Authorization': `Bearer ${sessionData.session.access_token}`
        }
      })

      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        throw new Error(err.error || 'Failed to fetch leaderboard')
      }

      const result = await response.json()
      setLeaderboard(result.data || [])
      setStats(result.stats || { totalAffiliates: 0, totalEarnings: 0, totalReferrals: 0, activeAffiliates: 0 })
    } catch (error: any) {
      console.error('Error fetching leaderboard:', error)
      toast.error(error.message || 'Failed to load leaderboard')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (entry: LeaderboardEntry) => {
    setEditingId(entry.user_id)
    setEditForm({
      total_revenue: entry.total_revenue,
      status: entry.status
    })
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditForm({})
  }

  const handleSave = async (userId: string) => {
    try {
      setSaving(true)
      const { data: sessionData } = await supabase.auth.getSession()
      if (!sessionData.session) return

      const response = await fetch('/api/admin/leaderboard', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionData.session.access_token}`
        },
        body: JSON.stringify({ user_id: userId, ...editForm })
      })

      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        throw new Error(err.error || 'Failed to update')
      }

      toast.success('Affiliate updated successfully')
      setEditingId(null)
      setEditForm({})
      fetchLeaderboard()
    } catch (error: any) {
      toast.error(error.message || 'Failed to update affiliate')
    } finally {
      setSaving(false)
    }
  }

  const handleSort = (field: 'total_revenue' | 'total_referrals' | 'rank') => {
    if (sortField === field) {
      setSortAsc(!sortAsc)
    } else {
      setSortField(field)
      setSortAsc(field === 'rank')
    }
  }

  const filteredLeaderboard = leaderboard
    .filter(entry =>
      entry.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.referral_code.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      const multiplier = sortAsc ? 1 : -1
      if (sortField === 'rank') return (a.rank - b.rank) * multiplier
      if (sortField === 'total_revenue') return (a.total_revenue - b.total_revenue) * multiplier
      if (sortField === 'total_referrals') return (a.total_referrals - b.total_referrals) * multiplier
      return 0
    })

  const getLevelBadgeColor = (level: string) => {
    switch (level) {
      case 'Legends': return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      case 'Champions': return 'bg-purple-100 text-purple-800 border-purple-300'
      case 'Elites': return 'bg-blue-100 text-blue-800 border-blue-300'
      case 'Rising Stars': return 'bg-green-100 text-green-800 border-green-300'
      case 'Dream Chasers': return 'bg-orange-100 text-orange-800 border-orange-300'
      default: return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-700 border-green-200'
      case 'suspended': return 'bg-red-100 text-red-700 border-red-200'
      case 'inactive': return 'bg-gray-100 text-gray-700 border-gray-200'
      default: return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  const getRankDisplay = (rank: number) => {
    if (rank === 1) return { icon: '🏆', bg: 'bg-yellow-50 border-yellow-300' }
    if (rank === 2) return { icon: '🥈', bg: 'bg-gray-50 border-gray-300' }
    if (rank === 3) return { icon: '🥉', bg: 'bg-orange-50 border-orange-300' }
    return { icon: `#${rank}`, bg: 'bg-white border-gray-200' }
  }

  const SortIcon = ({ field }: { field: string }) => {
    if (sortField !== field) return <ChevronUp className="w-3 h-3 text-gray-300" />
    return sortAsc ? <ChevronUp className="w-3 h-3 text-emerald-600" /> : <ChevronDown className="w-3 h-3 text-emerald-600" />
  }

  return (
    <AdminDashboardLayout title="Leaderboard Management">
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-emerald-100 rounded-xl">
                  <Users className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Affiliates</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalAffiliates}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-blue-100 rounded-xl">
                  <UserCheck className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Active Affiliates</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.activeAffiliates}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-orange-100 rounded-xl">
                  <DollarSign className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">${stats.totalRevenue.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-purple-100 rounded-xl">
                  <TrendingUp className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Referrals</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalReferrals}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <input
              type="text"
              placeholder="Search affiliates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-4 pr-12 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
            <div className="absolute right-0 top-0 h-full px-4 flex items-center text-gray-400">
              <Search className="w-5 h-5" />
            </div>
          </div>
          <Button
            onClick={fetchLeaderboard}
            variant="outline"
            className="flex items-center gap-2"
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Leaderboard Table */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
            <span className="ml-2 text-gray-600">Loading leaderboard...</span>
          </div>
        ) : filteredLeaderboard.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No affiliates found</h3>
              <p className="text-gray-500">
                {searchQuery ? 'No affiliates match your search.' : 'No affiliate data available yet.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      <button onClick={() => handleSort('rank')} className="flex items-center gap-1 hover:text-gray-700">
                        Rank <SortIcon field="rank" />
                      </button>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Affiliate</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Level</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      <button onClick={() => handleSort('total_revenue')} className="flex items-center gap-1 hover:text-gray-700">
                        Total Revenue <SortIcon field="total_revenue" />
                      </button>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      <button onClick={() => handleSort('total_referrals')} className="flex items-center gap-1 hover:text-gray-700">
                        Referrals <SortIcon field="total_referrals" />
                      </button>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Commissions</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Onboarded</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredLeaderboard.map((entry) => {
                    const rankDisplay = getRankDisplay(entry.rank)
                    const isEditing = editingId === entry.user_id

                    return (
                      <tr key={entry.user_id} className={`hover:bg-gray-50 transition-colors ${entry.rank <= 3 ? 'bg-gradient-to-r from-yellow-50/30 to-transparent' : ''}`}>
                        {/* Rank */}
                        <td className="px-4 py-3">
                          <div className={`inline-flex items-center justify-center w-10 h-10 rounded-full border ${rankDisplay.bg}`}>
                            <span className={`text-sm font-bold ${entry.rank <= 3 ? '' : 'text-gray-600'}`}>
                              {rankDisplay.icon}
                            </span>
                          </div>
                        </td>

                        {/* Affiliate Info */}
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-semibold text-gray-900">{entry.name}</p>
                            <p className="text-sm text-gray-500">{entry.email}</p>
                            {entry.referral_code && (
                              <p className="text-xs text-gray-400 font-mono mt-0.5">{entry.referral_code}</p>
                            )}
                          </div>
                        </td>

                        {/* Level */}
                        <td className="px-4 py-3">
                          <Badge className={`${getLevelBadgeColor(entry.level)} text-xs`}>
                            {entry.level}
                          </Badge>
                        </td>

                        {/* Total Revenue */}
                        <td className="px-4 py-3">
                          {isEditing ? (
                            <Input
                              type="number"
                              value={editForm.total_revenue ?? ''}
                              onChange={(e) => setEditForm({ ...editForm, total_revenue: parseFloat(e.target.value) || 0 })}
                              className="w-28 h-8 text-sm"
                            />
                          ) : (
                            <span className="font-semibold text-gray-900">${entry.total_revenue.toLocaleString()}</span>
                          )}
                        </td>

                        {/* Referrals */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <span className="font-medium text-gray-900">{entry.total_referrals}</span>
                            {entry.active_referrals > 0 && (
                              <span className="text-xs text-green-600">({entry.active_referrals} active)</span>
                            )}
                          </div>
                        </td>

                        {/* Total Commissions */}
                        <td className="px-4 py-3">
                          <span className="font-semibold text-gray-900">${entry.total_commissions.toLocaleString()}</span>
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3">
                          {isEditing ? (
                            <select
                              value={editForm.status || entry.status}
                              onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                              className="h-8 text-sm border border-gray-300 rounded-md px-2"
                            >
                              <option value="active">Active</option>
                              <option value="suspended">Suspended</option>
                              <option value="inactive">Inactive</option>
                            </select>
                          ) : (
                            <Badge className={`${getStatusBadgeColor(entry.status)} text-xs capitalize`}>
                              {entry.status}
                            </Badge>
                          )}
                        </td>

                        {/* Onboarded */}
                        <td className="px-4 py-3">
                          {entry.onboarding_completed ? (
                            <span className="inline-flex items-center gap-1 text-green-600 text-sm">
                              <UserCheck className="w-4 h-4" /> Yes
                            </span>
                          ) : (
                            <span className="text-gray-400 text-sm">No</span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3 text-right">
                          {isEditing ? (
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                size="sm"
                                onClick={() => handleSave(entry.user_id)}
                                disabled={saving}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white h-8 px-3"
                              >
                                {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={handleCancelEdit}
                                className="h-8 px-3"
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            </div>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEdit(entry)}
                              className="h-8 px-3 text-gray-600 hover:text-emerald-600"
                            >
                              <Edit className="w-3 h-3" />
                            </Button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </AdminDashboardLayout>
  )
}
