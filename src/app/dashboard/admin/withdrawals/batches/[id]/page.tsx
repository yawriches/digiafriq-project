'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { 
  ArrowLeft,
  Plus,
  Download,
  Eye,
  Package,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Loader2,
  RefreshCw,
  FileText,
  DollarSign,
  Trash2,
  Play,
  Check,
  Filter,
  Calendar,
  Globe
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import Link from 'next/link'
import AdminDashboardLayout from '@/components/dashboard/AdminDashboardLayout'
import {
  getBatchWithWithdrawals,
  getApprovedWithdrawals,
  addWithdrawalsToBatch,
  finalizeBatch,
  markWithdrawalPaid,
  markWithdrawalFailed,
  WithdrawalBatch,
  WithdrawalWithUser,
  BatchStatus,
  WithdrawalStatus,
  formatWithdrawalAmount,
  generateProviderCSV,
  downloadCSV,
  validateWithdrawalsForExport,
  checkDuplicatePayouts
} from '@/lib/withdrawals'

export default function BatchDetailPage() {
  const params = useParams()
  const router = useRouter()
  const batchId = params.id as string

  const [batch, setBatch] = useState<WithdrawalBatch | null>(null)
  const [withdrawals, setWithdrawals] = useState<WithdrawalWithUser[]>([])
  const [availableWithdrawals, setAvailableWithdrawals] = useState<WithdrawalWithUser[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)

  // Selection state
  const [selectedWithdrawals, setSelectedWithdrawals] = useState<Set<string>>(new Set())
  const [showAddModal, setShowAddModal] = useState(false)

  // Filter state for Add Withdrawals modal
  const [dateFilter, setDateFilter] = useState<string>('')
  const [countryFilter, setCountryFilter] = useState<string>('')

  // Get unique countries from available withdrawals
  const availableCountries = useMemo(() => {
    const countries = new Set(availableWithdrawals.map(w => w.user_country || 'Unknown'))
    return Array.from(countries).sort()
  }, [availableWithdrawals])

  // Filter available withdrawals based on filters
  const filteredWithdrawals = useMemo(() => {
    return availableWithdrawals.filter(w => {
      // Date filter
      if (dateFilter) {
        const withdrawalDate = new Date(w.created_at).toISOString().split('T')[0]
        if (withdrawalDate !== dateFilter) return false
      }
      // Country filter
      if (countryFilter && (w.user_country || 'Unknown') !== countryFilter) {
        return false
      }
      return true
    })
  }, [availableWithdrawals, dateFilter, countryFilter])

  const loadData = async () => {
    setLoading(true)
    try {
      const [batchResult, availableResult] = await Promise.all([
        getBatchWithWithdrawals(batchId),
        getApprovedWithdrawals()
      ])

      if (batchResult.error) {
        toast.error(batchResult.error)
        router.push('/dashboard/admin/withdrawals/batches')
        return
      }

      setBatch(batchResult.batch)
      setWithdrawals(batchResult.withdrawals)
      setAvailableWithdrawals(availableResult.data)
    } catch (err) {
      toast.error('Failed to load batch details')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (batchId) {
      loadData()
    }
  }, [batchId])

  const handleAddWithdrawals = async () => {
    if (selectedWithdrawals.size === 0) {
      toast.error('Please select withdrawals to add')
      return
    }

    setProcessing(true)
    try {
      const { success, errors } = await addWithdrawalsToBatch(
        Array.from(selectedWithdrawals),
        batchId
      )

      if (errors.length > 0) {
        errors.forEach(err => toast.error(err))
      }

      if (success || errors.length < selectedWithdrawals.size) {
        toast.success('Withdrawals added to batch')
        setShowAddModal(false)
        setSelectedWithdrawals(new Set())
        loadData()
      }
    } finally {
      setProcessing(false)
    }
  }

  const handleFinalizeBatch = async () => {
    if (!batch) return
    
    if (withdrawals.length === 0) {
      toast.error('Cannot finalize empty batch')
      return
    }

    setProcessing(true)
    try {
      const { success, error } = await finalizeBatch(batchId)
      if (error) {
        toast.error(error)
      } else {
        toast.success('Batch finalized and ready for processing')
        loadData()
      }
    } finally {
      setProcessing(false)
    }
  }

  const handleExportCSV = () => {
    if (!batch || withdrawals.length === 0) {
      toast.error('No withdrawals to export')
      return
    }

    // Validate withdrawals
    const { valid, invalid } = validateWithdrawalsForExport(withdrawals)
    
    if (invalid.length > 0) {
      invalid.forEach(({ withdrawal, reason }) => {
        toast.error(`${withdrawal.reference}: ${reason}`)
      })
    }

    if (valid.length === 0) {
      toast.error('No valid withdrawals to export')
      return
    }

    // Check for duplicates
    const { duplicates, unique } = checkDuplicatePayouts(valid)
    
    if (duplicates.length > 0) {
      toast.warning(`Found ${duplicates.length} duplicate account(s). Review before processing.`)
    }

    // Generate CSV (Paystack uses bank code slugs directly, no recipient codes needed)
    const { csv, errors, filename } = generateProviderCSV(
      batch.provider,
      valid
    )

    if (errors.length > 0) {
      errors.forEach(err => toast.error(err))
    }

    if (csv) {
      downloadCSV(csv, filename)
      toast.success(`CSV exported: ${filename}`)
    }
  }

  const handleMarkAllPaid = async () => {
    if (!batch) return
    
    setProcessing(true)
    const failed: string[] = []
    
    for (const withdrawal of withdrawals) {
      if (withdrawal.status === 'APPROVED' || withdrawal.status === 'PROCESSING') {
        const { error } = await markWithdrawalPaid(withdrawal.id)
        if (error) {
          failed.push(withdrawal.reference)
        }
      }
    }

    if (failed.length > 0) {
      toast.error(`Failed to mark ${failed.length} withdrawals as paid`)
    } else {
      toast.success('All withdrawals marked as paid')
    }
    
    loadData()
    setProcessing(false)
  }

  const toggleWithdrawalSelection = (id: string) => {
    const newSelection = new Set(selectedWithdrawals)
    if (newSelection.has(id)) {
      newSelection.delete(id)
    } else {
      newSelection.add(id)
    }
    setSelectedWithdrawals(newSelection)
  }

  const selectAllAvailable = () => {
    // Select all filtered withdrawals
    setSelectedWithdrawals(new Set(filteredWithdrawals.map(w => w.id)))
  }

  const clearFilters = () => {
    setDateFilter('')
    setCountryFilter('')
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

  const getBatchStatusBadge = (status: BatchStatus) => {
    const colors: Record<BatchStatus, string> = {
      DRAFT: 'bg-gray-100 text-gray-800 border-gray-200',
      READY: 'bg-blue-100 text-blue-800 border-blue-200',
      PROCESSING: 'bg-purple-100 text-purple-800 border-purple-200',
      COMPLETED: 'bg-green-100 text-green-800 border-green-200',
      PARTIALLY_COMPLETED: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      FAILED: 'bg-red-100 text-red-800 border-red-200'
    }
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium border ${colors[status]}`}>
        {status.replace('_', ' ')}
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
      <AdminDashboardLayout title="Batch Details">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-[#ed874a]" />
        </div>
      </AdminDashboardLayout>
    )
  }

  if (!batch) {
    return (
      <AdminDashboardLayout title="Batch Details">
        <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600">Batch not found</p>
          <Link href="/dashboard/admin/withdrawals/batches">
            <Button variant="outline" className="mt-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Batches
            </Button>
          </Link>
        </div>
      </AdminDashboardLayout>
    )
  }

  return (
    <AdminDashboardLayout title="Batch Details">
      <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/dashboard/admin/withdrawals/batches">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{batch.batch_reference}</h1>
            <p className="text-gray-600">Batch Details</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          {getBatchStatusBadge(batch.status)}
        </div>
      </div>

      {/* Batch Info */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-600">Provider</p>
            <p className={`text-xl font-bold ${
              batch.provider === 'PAYSTACK' ? 'text-green-600' : 'text-blue-600'
            }`}>
              {batch.provider}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-600">Total Withdrawals</p>
            <p className="text-xl font-bold text-gray-900">{batch.total_withdrawals}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-600">Total Amount</p>
            <p className="text-xl font-bold text-gray-900">${batch.total_amount_usd.toFixed(2)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-600">Currency</p>
            <p className="text-xl font-bold text-gray-900">{batch.currency}</p>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {batch.status === 'DRAFT' && (
              <>
                <Button
                  variant="outline"
                  onClick={() => setShowAddModal(true)}
                  disabled={availableWithdrawals.length === 0}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Withdrawals ({availableWithdrawals.length} available)
                </Button>
                <Button
                  className="bg-blue-600 hover:bg-blue-700"
                  onClick={handleFinalizeBatch}
                  disabled={processing || withdrawals.length === 0}
                >
                  {processing ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4 mr-2" />
                  )}
                  Finalize Batch
                </Button>
              </>
            )}

            {(batch.status === 'READY' || batch.status === 'PROCESSING') && (
              <>
                <Button
                  variant="outline"
                  onClick={handleExportCSV}
                  disabled={withdrawals.length === 0}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export CSV
                </Button>
                <Button
                  className="bg-green-600 hover:bg-green-700"
                  onClick={handleMarkAllPaid}
                  disabled={processing}
                >
                  {processing ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle className="w-4 h-4 mr-2" />
                  )}
                  Mark All as Paid
                </Button>
              </>
            )}

            {batch.status === 'COMPLETED' && (
              <p className="text-green-600 flex items-center">
                <CheckCircle className="w-5 h-5 mr-2" />
                Batch completed successfully
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Withdrawals in Batch */}
      <Card>
        <CardHeader>
          <CardTitle>Withdrawals in Batch ({withdrawals.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {withdrawals.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No withdrawals in this batch yet</p>
              {batch.status === 'DRAFT' && availableWithdrawals.length > 0 && (
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => setShowAddModal(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Withdrawals
                </Button>
              )}
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
                    <th className="pb-3 font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {withdrawals.map((withdrawal) => (
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
                      <td className="py-4">
                        <Link href={`/dashboard/admin/withdrawals/${withdrawal.id}`}>
                          <Button variant="ghost" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Batch Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Clock className="w-5 h-5 mr-2 text-[#ed874a]" />
            Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 mt-2 rounded-full bg-gray-400" />
              <div>
                <p className="font-medium">Created</p>
                <p className="text-sm text-gray-600">{formatDate(batch.created_at)}</p>
              </div>
            </div>
            
            {batch.finalized_at && (
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 mt-2 rounded-full bg-blue-500" />
                <div>
                  <p className="font-medium">Finalized</p>
                  <p className="text-sm text-gray-600">{formatDate(batch.finalized_at)}</p>
                </div>
              </div>
            )}
            
            {batch.processed_at && (
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 mt-2 rounded-full bg-purple-500" />
                <div>
                  <p className="font-medium">Processed</p>
                  <p className="text-sm text-gray-600">{formatDate(batch.processed_at)}</p>
                </div>
              </div>
            )}
            
            {batch.completed_at && (
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 mt-2 rounded-full bg-green-500" />
                <div>
                  <p className="font-medium">Completed</p>
                  <p className="text-sm text-gray-600">{formatDate(batch.completed_at)}</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Add Withdrawals Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-3xl mx-4 max-h-[85vh] overflow-hidden flex flex-col">
            <h3 className="text-lg font-semibold mb-4">Add Withdrawals to Batch</h3>
            
            {/* Filters */}
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-2 mb-3">
                <Filter className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Filters</span>
                {(dateFilter || countryFilter) && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={clearFilters}
                    className="ml-auto text-xs text-gray-500 hover:text-gray-700"
                  >
                    Clear all
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Date Filter */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    <Calendar className="w-3 h-3 inline mr-1" />
                    Created Date
                  </label>
                  <input
                    type="date"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-[#ed874a] focus:border-transparent"
                  />
                </div>
                {/* Country Filter */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    <Globe className="w-3 h-3 inline mr-1" />
                    Country
                  </label>
                  <select
                    value={countryFilter}
                    onChange={(e) => setCountryFilter(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-[#ed874a] focus:border-transparent"
                  >
                    <option value="">All Countries</option>
                    {availableCountries.map(country => (
                      <option key={country} value={country}>{country}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Selection info */}
            <div className="flex justify-between items-center mb-4">
              <p className="text-sm text-gray-600">
                {selectedWithdrawals.size} selected
                {(dateFilter || countryFilter) && (
                  <span className="text-gray-400"> • Showing {filteredWithdrawals.length} of {availableWithdrawals.length}</span>
                )}
              </p>
              <Button variant="outline" size="sm" onClick={selectAllAvailable}>
                Select All {filteredWithdrawals.length > 0 && `(${filteredWithdrawals.length})`}
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto border rounded-lg">
              {filteredWithdrawals.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  {availableWithdrawals.length === 0 ? (
                    <p>No approved withdrawals available</p>
                  ) : (
                    <>
                      <p>No withdrawals match your filters</p>
                      <Button variant="link" size="sm" onClick={clearFilters} className="mt-2">
                        Clear filters
                      </Button>
                    </>
                  )}
                </div>
              ) : (
                <table className="w-full">
                  <thead className="sticky top-0 bg-gray-50">
                    <tr className="border-b text-left">
                      <th className="p-3 font-medium text-gray-600 w-10"></th>
                      <th className="p-3 font-medium text-gray-600">Reference</th>
                      <th className="p-3 font-medium text-gray-600">User</th>
                      <th className="p-3 font-medium text-gray-600">Country</th>
                      <th className="p-3 font-medium text-gray-600">Date</th>
                      <th className="p-3 font-medium text-gray-600">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredWithdrawals.map((withdrawal) => (
                      <tr 
                        key={withdrawal.id} 
                        className={`border-b hover:bg-gray-50 cursor-pointer ${
                          selectedWithdrawals.has(withdrawal.id) ? 'bg-blue-50' : ''
                        }`}
                        onClick={() => toggleWithdrawalSelection(withdrawal.id)}
                      >
                        <td className="p-3">
                          <input
                            type="checkbox"
                            checked={selectedWithdrawals.has(withdrawal.id)}
                            onChange={() => toggleWithdrawalSelection(withdrawal.id)}
                            className="rounded"
                          />
                        </td>
                        <td className="p-3 font-mono text-sm">{withdrawal.reference}</td>
                        <td className="p-3">
                          <p className="font-medium">{withdrawal.user_name}</p>
                        </td>
                        <td className="p-3 text-sm text-gray-600">{withdrawal.user_country || 'Unknown'}</td>
                        <td className="p-3 text-sm text-gray-600">
                          {new Date(withdrawal.created_at).toLocaleDateString()}
                        </td>
                        <td className="p-3 font-medium">${withdrawal.amount_usd.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="flex space-x-3 mt-4 pt-4 border-t">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setShowAddModal(false)
                  setSelectedWithdrawals(new Set())
                  clearFilters()
                }}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-[#ed874a] hover:bg-[#d76f32]"
                onClick={handleAddWithdrawals}
                disabled={selectedWithdrawals.size === 0 || processing}
              >
                {processing ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Plus className="w-4 h-4 mr-2" />
                )}
                Add {selectedWithdrawals.size} Withdrawal{selectedWithdrawals.size !== 1 ? 's' : ''}
              </Button>
            </div>
          </div>
        </div>
      )}
      </div>
    </AdminDashboardLayout>
  )
}
