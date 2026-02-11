"use client"
import React, { useState, useEffect, useCallback } from 'react'
import { 
  Award, 
  Search, 
  Download,
  Loader2,
  DollarSign,
  CheckCircle,
  Clock,
  XCircle,
  Ban,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  RefreshCw
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import AdminDashboardLayout from '@/components/dashboard/AdminDashboardLayout'
import { supabase } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface Commission {
  id: string
  affiliate_id: string
  affiliate_name: string
  affiliate_email: string
  referral_id: string | null
  payment_id: string | null
  commission_type: string
  commission_amount: number
  commission_amount_usd: number
  commission_currency: string
  commission_rate: number
  base_amount: number
  base_amount_usd: number
  base_currency: string
  status: string
  created_at: string
  paid_at: string | null
  notes: string | null
}

interface Stats {
  totalAmount: number
  approvedAmount: number
  pendingAmount: number
  paidAmount: number
  totalCount: number
  approvedCount: number
  pendingCount: number
  paidCount: number
}

const CommissionsManagement = () => {
  const [commissions, setCommissions] = useState<Commission[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)

  const initialLoadDone = React.useRef(false)

  const fetchCommissions = useCallback(async () => {
    try {
      if (!initialLoadDone.current) setLoading(true)
      const { data: sessionData } = await supabase.auth.getSession()
      if (!sessionData.session) return

      const params = new URLSearchParams({
        page: String(page),
        limit: '25',
      })
      if (statusFilter !== 'all') params.set('status', statusFilter)
      if (searchTerm) params.set('search', searchTerm)

      const response = await fetch(`/api/admin/commissions?${params.toString()}`, {
        headers: { 'Authorization': `Bearer ${sessionData.session.access_token}` }
      })

      if (!response.ok) throw new Error('Failed to fetch commissions')

      const data = await response.json()
      setCommissions(data.commissions || [])
      setStats(data.stats || null)
      setTotalPages(data.totalPages || 1)
      setTotalCount(data.count || 0)
    } catch (error: any) {
      console.error('Error fetching commissions:', error)
      toast.error('Failed to load commissions')
    } finally {
      setLoading(false)
      initialLoadDone.current = true
    }
  }, [page, statusFilter, searchTerm])

  useEffect(() => {
    fetchCommissions()
  }, [fetchCommissions])

  // Auto-refresh stats every 15 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchCommissions()
    }, 15000)
    return () => clearInterval(interval)
  }, [fetchCommissions])

  const handleAction = async (commissionId: string, action: string) => {
    if (action === 'reject' && !confirm('Are you sure you want to reject this commission?')) return

    try {
      const { data: sessionData } = await supabase.auth.getSession()
      if (!sessionData.session) return

      const response = await fetch('/api/admin/commissions', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionData.session.access_token}`
        },
        body: JSON.stringify({ commission_id: commissionId, action })
      })

      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        throw new Error(err.error || 'Failed to update commission')
      }

      toast.success(`Commission ${action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'marked as paid'} successfully`)
      fetchCommissions()
    } catch (error: any) {
      console.error('Error updating commission:', error)
      toast.error(error.message || 'Failed to update commission')
    }
  }

  const handleExport = () => {
    const csv = [
      ['Affiliate', 'Email', 'Type', 'Commission (USD)', 'Sale Amount (USD)', 'Rate', 'Status', 'Date'].join(','),
      ...commissions.map(c => [
        `"${c.affiliate_name}"`,
        c.affiliate_email,
        c.commission_type,
        c.commission_amount_usd.toFixed(2),
        c.base_amount_usd.toFixed(2),
        `${((c.commission_rate || 0) * 100).toFixed(0)}%`,
        c.status,
        new Date(c.created_at).toLocaleDateString()
      ].join(','))
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `commissions-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'available': case 'approved': return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'pending': return <Clock className="w-4 h-4 text-yellow-600" />
      case 'paid': return <CreditCard className="w-4 h-4 text-blue-600" />
      case 'cancelled': case 'rejected': return <XCircle className="w-4 h-4 text-red-600" />
      default: return <Clock className="w-4 h-4 text-gray-600" />
    }
  }

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      available: 'bg-green-100 text-green-700 border-green-200',
      approved: 'bg-green-100 text-green-700 border-green-200',
      pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      paid: 'bg-blue-100 text-blue-700 border-blue-200',
      cancelled: 'bg-red-100 text-red-700 border-red-200',
      rejected: 'bg-red-100 text-red-700 border-red-200',
    }
    return colors[status] || 'bg-gray-100 text-gray-700 border-gray-200'
  }

  const formatType = (type: string) => {
    return type?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'N/A'
  }

  return (
    <AdminDashboardLayout title="Commissions Management">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-50 to-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Commissions</p>
                <p className="text-2xl font-bold text-gray-900">${(stats?.totalAmount || 0).toFixed(2)}</p>
                <p className="text-xs text-gray-400 mt-1">{stats?.totalCount || 0} commissions</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-gradient-to-br from-green-50 to-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Approved / Available</p>
                <p className="text-2xl font-bold text-green-600">${(stats?.approvedAmount || 0).toFixed(2)}</p>
                <p className="text-xs text-gray-400 mt-1">{stats?.approvedCount || 0} commissions</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-gradient-to-br from-yellow-50 to-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">${(stats?.pendingAmount || 0).toFixed(2)}</p>
                <p className="text-xs text-gray-400 mt-1">{stats?.pendingCount || 0} commissions</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-gradient-to-br from-purple-50 to-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Paid Out</p>
                <p className="text-2xl font-bold text-purple-600">${(stats?.paidAmount || 0).toFixed(2)}</p>
                <p className="text-xs text-gray-400 mt-1">{stats?.paidCount || 0} commissions</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-purple-600" />
              </div>
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
                placeholder="Search by affiliate name or email..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setPage(1) }}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1) }}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => fetchCommissions()}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button variant="outline" onClick={handleExport}>
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Commissions Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">
            All Commissions ({totalCount})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-[#ed874a]" />
              <span className="ml-3 text-gray-600">Loading commissions...</span>
            </div>
          ) : commissions.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Award className="w-16 h-16 mx-auto mb-4 opacity-30" />
              <p className="text-lg font-medium mb-2">No commissions found</p>
              <p className="text-sm">Try adjusting your search or filters</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">Affiliate</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">Type</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-600 text-sm">Sale Amount</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-600 text-sm">Commission</th>
                      <th className="text-center py-3 px-4 font-medium text-gray-600 text-sm">Rate</th>
                      <th className="text-center py-3 px-4 font-medium text-gray-600 text-sm">Status</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">Date</th>
                      <th className="text-center py-3 px-4 font-medium text-gray-600 text-sm">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {commissions.map((c) => (
                      <tr key={c.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-medium text-gray-900 text-sm">{c.affiliate_name}</p>
                            <p className="text-xs text-gray-500">{c.affiliate_email}</p>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant="secondary" className="text-xs">{formatType(c.commission_type)}</Badge>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className="text-sm text-gray-700">${c.base_amount_usd.toFixed(2)}</span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className="font-semibold text-gray-900">${c.commission_amount_usd.toFixed(2)}</span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="text-sm text-gray-600">{((c.commission_rate || 0) * 100).toFixed(0)}%</span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {getStatusIcon(c.status)}
                            <Badge className={`text-xs ${getStatusBadge(c.status)}`}>
                              {c.status}
                            </Badge>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">
                          {new Date(c.created_at).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-center gap-1">
                            {c.status === 'pending' && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleAction(c.id, 'approve')}
                                  title="Approve"
                                  className="h-8 w-8 p-0"
                                >
                                  <CheckCircle className="w-4 h-4 text-green-600" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleAction(c.id, 'reject')}
                                  title="Reject"
                                  className="h-8 w-8 p-0"
                                >
                                  <Ban className="w-4 h-4 text-red-600" />
                                </Button>
                              </>
                            )}
                            {(c.status === 'available' || c.status === 'approved') && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleAction(c.id, 'mark_paid')}
                                title="Mark as Paid"
                                className="h-8 w-8 p-0"
                              >
                                <CreditCard className="w-4 h-4 text-blue-600" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <p className="text-sm text-gray-500">
                    Page {page} of {totalPages} ({totalCount} total)
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page <= 1}
                      onClick={() => setPage(p => p - 1)}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= totalPages}
                      onClick={() => setPage(p => p + 1)}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </AdminDashboardLayout>
  )
}

export default CommissionsManagement
