'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { 
  DollarSign, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Download,
  Plus,
  Eye,
  Filter,
  Search,
  RefreshCw,
  Loader2,
  ArrowUpRight,
  ArrowDownRight,
  Users,
  Calendar,
  Mail,
  CheckCheck
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import Link from 'next/link'
import AdminDashboardLayout from '@/components/dashboard/AdminDashboardLayout'
import {
  getAllWithdrawals,
  getWithdrawalStats,
  approveWithdrawal,
  rejectWithdrawal,
  WithdrawalWithUser,
  WithdrawalStatus,
  WITHDRAWAL_STATUS,
  getStatusColor,
  formatWithdrawalAmount
} from '@/lib/withdrawals'

export default function AdminWithdrawalsPage() {
  const [withdrawals, setWithdrawals] = useState<WithdrawalWithUser[]>([])
  const [filteredWithdrawals, setFilteredWithdrawals] = useState<WithdrawalWithUser[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<WithdrawalStatus | 'ALL'>('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [dateFilter, setDateFilter] = useState('')
  const [emailFilter, setEmailFilter] = useState('')
  const [bulkProcessing, setBulkProcessing] = useState(false)
  const [stats, setStats] = useState({
    pending_count: 0,
    pending_amount: 0,
    approved_count: 0,
    approved_amount: 0,
    paid_this_week: 0,
    paid_amount_this_week: 0
  })

  // Action states
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [rejectingWithdrawal, setRejectingWithdrawal] = useState<WithdrawalWithUser | null>(null)
  const [rejectReason, setRejectReason] = useState('')

  const loadData = async () => {
    setLoading(true)
    try {
      const [withdrawalsResult, statsResult] = await Promise.all([
        getAllWithdrawals(),
        getWithdrawalStats()
      ])

      if (withdrawalsResult.error) {
        toast.error(withdrawalsResult.error)
      } else {
        setWithdrawals(withdrawalsResult.data)
        setFilteredWithdrawals(withdrawalsResult.data)
      }

      if (statsResult.data) {
        setStats(statsResult.data)
      }
    } catch (err) {
      toast.error('Failed to load withdrawals')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Filter withdrawals
  useEffect(() => {
    let filtered = withdrawals

    // Status filter
    if (statusFilter !== 'ALL') {
      filtered = filtered.filter(w => w.status === statusFilter)
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(w => 
        w.reference.toLowerCase().includes(query) ||
        w.user_name.toLowerCase().includes(query) ||
        w.user_email.toLowerCase().includes(query)
      )
    }

    // Date filter
    if (dateFilter) {
      filtered = filtered.filter(w => {
        const withdrawalDate = new Date(w.created_at).toISOString().split('T')[0]
        return withdrawalDate === dateFilter
      })
    }

    // Email filter
    if (emailFilter) {
      const email = emailFilter.toLowerCase()
      filtered = filtered.filter(w => w.user_email.toLowerCase().includes(email))
    }

    setFilteredWithdrawals(filtered)
  }, [statusFilter, searchQuery, dateFilter, emailFilter, withdrawals])

  // Bulk action handlers
  const handleBulkApprove = async () => {
    const pendingWithdrawals = filteredWithdrawals.filter(w => w.status === 'PENDING')
    if (pendingWithdrawals.length === 0) {
      toast.error('No pending withdrawals to approve')
      return
    }

    if (!confirm(`Are you sure you want to approve ${pendingWithdrawals.length} pending withdrawal(s)?`)) {
      return
    }

    setBulkProcessing(true)
    let successCount = 0
    let errorCount = 0

    for (const withdrawal of pendingWithdrawals) {
      const { success, error } = await approveWithdrawal(withdrawal.id)
      if (success) successCount++
      else errorCount++
    }

    setBulkProcessing(false)
    toast.success(`Approved ${successCount} withdrawal(s)${errorCount > 0 ? `, ${errorCount} failed` : ''}`)
    loadData()
  }

  const handleBulkReject = async () => {
    const pendingWithdrawals = filteredWithdrawals.filter(w => w.status === 'PENDING')
    if (pendingWithdrawals.length === 0) {
      toast.error('No pending withdrawals to reject')
      return
    }

    const reason = prompt(`Enter rejection reason for ${pendingWithdrawals.length} withdrawal(s):`)
    if (!reason) return

    setBulkProcessing(true)
    let successCount = 0
    let errorCount = 0

    for (const withdrawal of pendingWithdrawals) {
      const { success, error } = await rejectWithdrawal(withdrawal.id, reason)
      if (success) successCount++
      else errorCount++
    }

    setBulkProcessing(false)
    toast.success(`Rejected ${successCount} withdrawal(s)${errorCount > 0 ? `, ${errorCount} failed` : ''}`)
    loadData()
  }

  // Count helpers for bulk actions
  const pendingCount = useMemo(() => filteredWithdrawals.filter(w => w.status === 'PENDING').length, [filteredWithdrawals])
  const approvedCount = useMemo(() => filteredWithdrawals.filter(w => w.status === 'APPROVED').length, [filteredWithdrawals])

  const handleApprove = async (withdrawal: WithdrawalWithUser) => {
    setProcessingId(withdrawal.id)
    try {
      const { success, error } = await approveWithdrawal(withdrawal.id)
      if (error) {
        toast.error(error)
      } else {
        toast.success(`Withdrawal ${withdrawal.reference} approved`)
        loadData()
      }
    } finally {
      setProcessingId(null)
    }
  }

  const handleRejectClick = (withdrawal: WithdrawalWithUser) => {
    setRejectingWithdrawal(withdrawal)
    setRejectReason('')
    setShowRejectModal(true)
  }

  const handleRejectConfirm = async () => {
    if (!rejectingWithdrawal || !rejectReason.trim()) {
      toast.error('Please provide a rejection reason')
      return
    }

    setProcessingId(rejectingWithdrawal.id)
    try {
      const { success, error } = await rejectWithdrawal(rejectingWithdrawal.id, rejectReason)
      if (error) {
        toast.error(error)
      } else {
        toast.success(`Withdrawal ${rejectingWithdrawal.reference} rejected`)
        setShowRejectModal(false)
        setRejectingWithdrawal(null)
        loadData()
      }
    } finally {
      setProcessingId(null)
    }
  }

  const getStatusBadge = (status: WithdrawalStatus) => {
    const colors: Record<WithdrawalStatus, string> = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      APPROVED: 'bg-blue-100 text-blue-800',
      REJECTED: 'bg-red-100 text-red-800',
      PROCESSING: 'bg-purple-100 text-purple-800',
      PAID: 'bg-green-100 text-green-800',
      FAILED: 'bg-red-100 text-red-800'
    }
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status]}`}>
        {status}
      </span>
    )
  }

  const formatDate = (date: string | null) => {
    if (!date) return '-'
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <AdminDashboardLayout title="Withdrawal Management">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-[#ed874a]" />
        </div>
      </AdminDashboardLayout>
    )
  }

  return (
    <AdminDashboardLayout title="Withdrawal Management">
      <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600">Review and process affiliate withdrawal requests</p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" onClick={loadData}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Link href="/dashboard/admin/withdrawals/batches">
            <Button className="bg-[#ed874a] hover:bg-[#d76f32]">
              <Plus className="w-4 h-4 mr-2" />
              Manage Batches
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending Review</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending_count}</p>
                <p className="text-sm text-gray-500">${stats.pending_amount.toFixed(2)}</p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-full">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Approved (Unbatched)</p>
                <p className="text-2xl font-bold text-blue-600">{stats.approved_count}</p>
                <p className="text-sm text-gray-500">${stats.approved_amount.toFixed(2)}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <CheckCircle className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Paid This Week</p>
                <p className="text-2xl font-bold text-green-600">{stats.paid_this_week}</p>
                <p className="text-sm text-gray-500">${stats.paid_amount_this_week.toFixed(2)}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <ArrowUpRight className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Withdrawals</p>
                <p className="text-2xl font-bold text-gray-900">{withdrawals.length}</p>
                <p className="text-sm text-gray-500">All time</p>
              </div>
              <div className="p-3 bg-gray-100 rounded-full">
                <Users className="w-6 h-6 text-gray-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="space-y-4">
            {/* Search and Filter Row */}
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search by reference or name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Filter by email..."
                    value={emailFilter}
                    onChange={(e) => setEmailFilter(e.target.value)}
                    className="pl-10 w-48"
                  />
                </div>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="date"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="pl-10 pr-3 py-2 border rounded-md text-sm h-10"
                  />
                </div>
                {(dateFilter || emailFilter) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => { setDateFilter(''); setEmailFilter('') }}
                    className="text-gray-500"
                  >
                    Clear
                  </Button>
                )}
              </div>
            </div>

            {/* Status Filter Row */}
            <div className="flex flex-wrap gap-2">
              <Button
                variant={statusFilter === 'ALL' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('ALL')}
              >
                All
              </Button>
              <Button
                variant={statusFilter === 'PENDING' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('PENDING')}
                className={statusFilter === 'PENDING' ? 'bg-yellow-500 hover:bg-yellow-600' : ''}
              >
                Pending
              </Button>
              <Button
                variant={statusFilter === 'APPROVED' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('APPROVED')}
                className={statusFilter === 'APPROVED' ? 'bg-blue-500 hover:bg-blue-600' : ''}
              >
                Approved
              </Button>
              <Button
                variant={statusFilter === 'PAID' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('PAID')}
                className={statusFilter === 'PAID' ? 'bg-green-500 hover:bg-green-600' : ''}
              >
                Paid
              </Button>
              <Button
                variant={statusFilter === 'REJECTED' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('REJECTED')}
                className={statusFilter === 'REJECTED' ? 'bg-red-500 hover:bg-red-600' : ''}
              >
                Rejected
              </Button>

              {/* Bulk Actions */}
              <div className="ml-auto flex gap-2">
                {pendingCount > 0 && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleBulkApprove}
                      disabled={bulkProcessing}
                      className="text-green-600 border-green-300 hover:bg-green-50"
                    >
                      {bulkProcessing ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <CheckCheck className="w-4 h-4 mr-1" />}
                      Approve All ({pendingCount})
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleBulkReject}
                      disabled={bulkProcessing}
                      className="text-red-600 border-red-300 hover:bg-red-50"
                    >
                      {bulkProcessing ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <XCircle className="w-4 h-4 mr-1" />}
                      Reject All ({pendingCount})
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Withdrawals Table */}
      <Card>
        <CardHeader>
          <CardTitle>Withdrawal Requests ({filteredWithdrawals.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredWithdrawals.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <DollarSign className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No withdrawals found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-3 font-medium text-gray-600">Reference</th>
                    <th className="pb-3 font-medium text-gray-600">User</th>
                    <th className="pb-3 font-medium text-gray-600">Amount</th>
                    <th className="pb-3 font-medium text-gray-600">Channel</th>
                    <th className="pb-3 font-medium text-gray-600">Status</th>
                    <th className="pb-3 font-medium text-gray-600">Date</th>
                    <th className="pb-3 font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredWithdrawals.map((withdrawal) => (
                    <tr key={withdrawal.id} className="border-b hover:bg-gray-50">
                      <td className="py-4">
                        <span className="font-mono text-sm">{withdrawal.reference}</span>
                      </td>
                      <td className="py-4">
                        <div>
                          <p className="font-medium text-gray-900">{withdrawal.user_name}</p>
                          <p className="text-sm text-gray-500">{withdrawal.user_email}</p>
                        </div>
                      </td>
                      <td className="py-4">
                        <div>
                          <p className="font-medium">${withdrawal.amount_usd.toFixed(2)}</p>
                          {withdrawal.amount_local && (
                            <p className="text-sm text-gray-500">
                              {formatWithdrawalAmount(withdrawal.amount_local, withdrawal.currency)}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="py-4">
                        <span className="capitalize">{withdrawal.payout_channel.replace('_', ' ')}</span>
                      </td>
                      <td className="py-4">
                        {getStatusBadge(withdrawal.status)}
                      </td>
                      <td className="py-4 text-sm text-gray-600">
                        {formatDate(withdrawal.created_at)}
                      </td>
                      <td className="py-4">
                        <div className="flex items-center space-x-2">
                          <Link href={`/dashboard/admin/withdrawals/${withdrawal.id}`}>
                            <Button variant="ghost" size="sm">
                              <Eye className="w-4 h-4" />
                            </Button>
                          </Link>
                          
                          {withdrawal.status === 'PENDING' && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                onClick={() => handleApprove(withdrawal)}
                                disabled={processingId === withdrawal.id}
                              >
                                {processingId === withdrawal.id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <CheckCircle className="w-4 h-4" />
                                )}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={() => handleRejectClick(withdrawal)}
                                disabled={processingId === withdrawal.id}
                              >
                                <XCircle className="w-4 h-4" />
                              </Button>
                            </>
                          )}
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

      {/* Reject Modal */}
      {showRejectModal && rejectingWithdrawal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">Reject Withdrawal</h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to reject withdrawal <strong>{rejectingWithdrawal.reference}</strong>?
            </p>
            <p className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg mb-4">
              <AlertCircle className="w-4 h-4 inline mr-2" />
              Funds will remain frozen. Manual refund may be required.
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rejection Reason *
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full border rounded-lg p-3 h-24 resize-none"
                placeholder="Enter reason for rejection..."
              />
            </div>
            <div className="flex space-x-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setShowRejectModal(false)
                  setRejectingWithdrawal(null)
                }}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-red-600 hover:bg-red-700"
                onClick={handleRejectConfirm}
                disabled={!rejectReason.trim() || processingId === rejectingWithdrawal.id}
              >
                {processingId === rejectingWithdrawal.id ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : null}
                Reject Withdrawal
              </Button>
            </div>
          </div>
        </div>
      )}
      </div>
    </AdminDashboardLayout>
  )
}
