"use client"
import React, { useState, useEffect } from 'react'
import { 
  Award, 
  Search, 
  Filter,
  Download,
  Eye,
  Loader2,
  DollarSign,
  CheckCircle,
  Clock,
  XCircle,
  TrendingUp
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import AdminDashboardLayout from '@/components/dashboard/AdminDashboardLayout'
import { supabase } from '@/lib/supabase/client'

interface Commission {
  id: string
  affiliate_id: string
  amount: number
  commission_rate: number
  status: string
  payment_id: string | null
  created_at: string
}

const CommissionsManagement = () => {
  const [commissions, setCommissions] = useState<Commission[]>([])
  const [filteredCommissions, setFilteredCommissions] = useState<Commission[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    fetchCommissions()
  }, [])

  useEffect(() => {
    filterCommissions()
  }, [searchTerm, statusFilter, commissions])

  const fetchCommissions = async () => {
    try {
      setLoading(true)
      const { data, error } = await (supabase as any)
        .from('commissions')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setCommissions(data || [])
    } catch (error: any) {
      console.error('Error fetching commissions:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterCommissions = () => {
    let filtered = commissions

    if (searchTerm) {
      filtered = filtered.filter(commission => 
        commission.affiliate_id?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(commission => commission.status === statusFilter)
    }

    setFilteredCommissions(filtered)
  }

  const handleApproveCommission = async (commissionId: string) => {
    try {
      const { error } = await (supabase as any)
        .from('commissions')
        .update({ status: 'approved' })
        .eq('id', commissionId)

      if (error) throw error
      
      setCommissions(commissions.map(c => c.id === commissionId ? { ...c, status: 'approved' } : c))
      alert('Commission approved successfully')
    } catch (error: any) {
      console.error('Error approving commission:', error)
      alert('Failed to approve commission')
    }
  }

  const handleRejectCommission = async (commissionId: string) => {
    if (!confirm('Are you sure you want to reject this commission?')) return

    try {
      const { error } = await (supabase as any)
        .from('commissions')
        .update({ status: 'rejected' })
        .eq('id', commissionId)

      if (error) throw error
      
      setCommissions(commissions.map(c => c.id === commissionId ? { ...c, status: 'rejected' } : c))
      alert('Commission rejected')
    } catch (error: any) {
      console.error('Error rejecting commission:', error)
      alert('Failed to reject commission')
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'pending': return <Clock className="w-4 h-4 text-yellow-600" />
      case 'rejected': return <XCircle className="w-4 h-4 text-red-600" />
      default: return <Clock className="w-4 h-4 text-gray-600" />
    }
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-700'
      case 'pending': return 'bg-yellow-100 text-yellow-700'
      case 'rejected': return 'bg-red-100 text-red-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const totalCommissions = commissions.reduce((sum, c) => sum + (c.amount || 0), 0)
  const approvedCommissions = commissions
    .filter(c => c.status === 'approved')
    .reduce((sum, c) => sum + (c.amount || 0), 0)
  const pendingCommissions = commissions
    .filter(c => c.status === 'pending')
    .reduce((sum, c) => sum + (c.amount || 0), 0)

  return (
    <AdminDashboardLayout title="Commissions Management">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Commissions</p>
                <p className="text-2xl font-bold text-gray-900">${totalCommissions.toLocaleString()}</p>
              </div>
              <DollarSign className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Approved</p>
                <p className="text-2xl font-bold text-gray-900">${approvedCommissions.toLocaleString()}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-gray-900">${pendingCommissions.toLocaleString()}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Count</p>
                <p className="text-2xl font-bold text-gray-900">{commissions.length}</p>
              </div>
              <Award className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search by affiliate ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-gray-200 rounded-md px-3 py-2 text-sm"
            >
              <option value="all">All Status</option>
              <option value="approved">Approved</option>
              <option value="pending">Pending</option>
              <option value="rejected">Rejected</option>
            </select>
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Commissions Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">All Commissions ({filteredCommissions.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-[#ed874a]" />
              <span className="ml-3 text-gray-600">Loading commissions...</span>
            </div>
          ) : filteredCommissions.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Award className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg mb-2">No commissions found</p>
              <p className="text-sm">Try adjusting your search or filters</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Affiliate ID</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Amount</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Rate</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Date</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCommissions.map((commission) => (
                    <tr key={commission.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <span className="font-mono text-sm text-gray-900">{commission.affiliate_id?.slice(0, 8) || 'N/A'}...</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-gray-900">${(commission.amount || 0).toFixed(2)}</span>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">{commission.commission_rate || 0}%</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(commission.status)}
                          <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadgeColor(commission.status)}`}>
                            {commission.status}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {new Date(commission.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          {commission.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleApproveCommission(commission.id)}
                                className="p-1 hover:bg-gray-100 rounded"
                                title="Approve"
                              >
                                <CheckCircle className="w-4 h-4 text-green-600" />
                              </button>
                              <button
                                onClick={() => handleRejectCommission(commission.id)}
                                className="p-1 hover:bg-gray-100 rounded"
                                title="Reject"
                              >
                                <XCircle className="w-4 h-4 text-red-600" />
                              </button>
                            </>
                          )}
                          <button className="p-1 hover:bg-gray-100 rounded" title="View Details">
                            <Eye className="w-4 h-4 text-blue-600" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </AdminDashboardLayout>
  )
}

export default CommissionsManagement
