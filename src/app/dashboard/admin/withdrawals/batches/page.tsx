'use client'

import React, { useState, useEffect } from 'react'
import { 
  ArrowLeft,
  Plus,
  Download,
  Eye,
  Package,
  CheckCircle,
  Clock,
  AlertCircle,
  Loader2,
  RefreshCw,
  FileText,
  DollarSign
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import Link from 'next/link'
import AdminDashboardLayout from '@/components/dashboard/AdminDashboardLayout'
import {
  getBatches,
  createBatch,
  getApprovedWithdrawals,
  WithdrawalBatch,
  WithdrawalWithUser,
  BatchStatus,
  PayoutProvider,
  PAYOUT_PROVIDER
} from '@/lib/withdrawals'

export default function BatchesPage() {
  const [batches, setBatches] = useState<WithdrawalBatch[]>([])
  const [approvedWithdrawals, setApprovedWithdrawals] = useState<WithdrawalWithUser[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)

  // Create batch modal
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newBatchProvider, setNewBatchProvider] = useState<PayoutProvider>('PAYSTACK')
  const [newBatchCurrency, setNewBatchCurrency] = useState('GHS')
  const [newBatchNotes, setNewBatchNotes] = useState('')

  const loadData = async () => {
    setLoading(true)
    try {
      const [batchesResult, withdrawalsResult] = await Promise.all([
        getBatches(),
        getApprovedWithdrawals()
      ])

      if (batchesResult.error) {
        toast.error(batchesResult.error)
      } else {
        setBatches(batchesResult.data)
      }

      if (!withdrawalsResult.error) {
        setApprovedWithdrawals(withdrawalsResult.data)
      }
    } catch (err) {
      toast.error('Failed to load batches')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleCreateBatch = async () => {
    setCreating(true)
    try {
      const { data, error } = await createBatch(
        newBatchProvider,
        newBatchCurrency,
        newBatchNotes || undefined
      )

      if (error) {
        toast.error(error)
      } else {
        toast.success(`Batch ${data?.batch_reference} created successfully`)
        setShowCreateModal(false)
        setNewBatchNotes('')
        loadData()
      }
    } finally {
      setCreating(false)
    }
  }

  const getStatusBadge = (status: BatchStatus) => {
    const colors: Record<BatchStatus, string> = {
      DRAFT: 'bg-gray-100 text-gray-800',
      READY: 'bg-blue-100 text-blue-800',
      PROCESSING: 'bg-purple-100 text-purple-800',
      COMPLETED: 'bg-green-100 text-green-800',
      PARTIALLY_COMPLETED: 'bg-yellow-100 text-yellow-800',
      FAILED: 'bg-red-100 text-red-800'
    }
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status]}`}>
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
      <AdminDashboardLayout title="Payout Batches">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-[#ed874a]" />
        </div>
      </AdminDashboardLayout>
    )
  }

  return (
    <AdminDashboardLayout title="Payout Batches">
      <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/dashboard/admin/withdrawals">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Payout Batches</h1>
            <p className="text-gray-600">Manage weekly batch processing for bulk payouts</p>
          </div>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" onClick={loadData}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button 
            className="bg-[#ed874a] hover:bg-[#d76f32]"
            onClick={() => setShowCreateModal(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Batch
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Approved (Unbatched)</p>
                <p className="text-2xl font-bold text-blue-600">{approvedWithdrawals.length}</p>
                <p className="text-sm text-gray-500">
                  ${approvedWithdrawals.reduce((sum, w) => sum + w.amount_usd, 0).toFixed(2)}
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Clock className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Batches</p>
                <p className="text-2xl font-bold text-purple-600">
                  {batches.filter(b => ['DRAFT', 'READY', 'PROCESSING'].includes(b.status)).length}
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <Package className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Completed Batches</p>
                <p className="text-2xl font-bold text-green-600">
                  {batches.filter(b => b.status === 'COMPLETED').length}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Approved Withdrawals Ready for Batching */}
      {approvedWithdrawals.length > 0 && (
        <Card className="border-blue-200 bg-blue-50/50">
          <CardHeader>
            <CardTitle className="flex items-center text-blue-800">
              <AlertCircle className="w-5 h-5 mr-2" />
              {approvedWithdrawals.length} Approved Withdrawals Ready for Batching
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-blue-700 mb-4">
              These withdrawals have been approved and are waiting to be added to a batch for processing.
            </p>
            <Button 
              variant="outline" 
              className="border-blue-300 text-blue-700 hover:bg-blue-100"
              onClick={() => setShowCreateModal(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Create New Batch
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Batches List */}
      <Card>
        <CardHeader>
          <CardTitle>All Batches ({batches.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {batches.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No batches created yet</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => setShowCreateModal(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Create First Batch
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-3 font-medium text-gray-600">Reference</th>
                    <th className="pb-3 font-medium text-gray-600">Provider</th>
                    <th className="pb-3 font-medium text-gray-600">Withdrawals</th>
                    <th className="pb-3 font-medium text-gray-600">Total Amount</th>
                    <th className="pb-3 font-medium text-gray-600">Status</th>
                    <th className="pb-3 font-medium text-gray-600">Created</th>
                    <th className="pb-3 font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {batches.map((batch) => (
                    <tr key={batch.id} className="border-b hover:bg-gray-50">
                      <td className="py-4">
                        <span className="font-mono text-sm">{batch.batch_reference}</span>
                      </td>
                      <td className="py-4">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          batch.provider === 'PAYSTACK' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {batch.provider}
                        </span>
                      </td>
                      <td className="py-4">
                        <div>
                          <p className="font-medium">{batch.total_withdrawals}</p>
                          {batch.status === 'COMPLETED' && (
                            <p className="text-xs text-gray-500">
                              {batch.successful_count} paid, {batch.failed_count} failed
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="py-4">
                        <p className="font-medium">${batch.total_amount_usd.toFixed(2)}</p>
                      </td>
                      <td className="py-4">
                        {getStatusBadge(batch.status)}
                      </td>
                      <td className="py-4 text-sm text-gray-600">
                        {formatDate(batch.created_at)}
                      </td>
                      <td className="py-4">
                        <div className="flex items-center space-x-2">
                          <Link href={`/dashboard/admin/withdrawals/batches/${batch.id}`}>
                            <Button variant="ghost" size="sm">
                              <Eye className="w-4 h-4" />
                            </Button>
                          </Link>
                          {batch.csv_file_url && (
                            <a href={batch.csv_file_url} download>
                              <Button variant="ghost" size="sm">
                                <Download className="w-4 h-4" />
                              </Button>
                            </a>
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

      {/* Create Batch Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">Create New Batch</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payout Provider *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    className={`p-3 border rounded-lg text-center transition-colors ${
                      newBatchProvider === 'PAYSTACK'
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setNewBatchProvider('PAYSTACK')}
                  >
                    <p className="font-medium">Paystack</p>
                    <p className="text-xs text-gray-500">Ghana, Nigeria</p>
                  </button>
                  <button
                    type="button"
                    className={`p-3 border rounded-lg text-center transition-colors ${
                      newBatchProvider === 'KORA'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setNewBatchProvider('KORA')}
                  >
                    <p className="font-medium">Kora</p>
                    <p className="text-xs text-gray-500">Nigeria, Kenya</p>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Currency *
                </label>
                <select
                  value={newBatchCurrency}
                  onChange={(e) => setNewBatchCurrency(e.target.value)}
                  className="w-full border rounded-lg p-3"
                >
                  <option value="GHS">GHS - Ghanaian Cedi</option>
                  <option value="NGN">NGN - Nigerian Naira</option>
                  <option value="USD">USD - US Dollar</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  value={newBatchNotes}
                  onChange={(e) => setNewBatchNotes(e.target.value)}
                  className="w-full border rounded-lg p-3 h-20 resize-none"
                  placeholder="Add any notes about this batch..."
                />
              </div>

              {approvedWithdrawals.length > 0 && (
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-700">
                    <AlertCircle className="w-4 h-4 inline mr-2" />
                    {approvedWithdrawals.length} approved withdrawals available to add
                  </p>
                </div>
              )}
            </div>

            <div className="flex space-x-3 mt-6">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowCreateModal(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-[#ed874a] hover:bg-[#d76f32]"
                onClick={handleCreateBatch}
                disabled={creating}
              >
                {creating ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Plus className="w-4 h-4 mr-2" />
                )}
                Create Batch
              </Button>
            </div>
          </div>
        </div>
      )}
      </div>
    </AdminDashboardLayout>
  )
}
