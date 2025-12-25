'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { 
  ArrowLeft,
  DollarSign, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  User,
  CreditCard,
  Smartphone,
  Building,
  FileText,
  Loader2,
  History
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import Link from 'next/link'
import AdminDashboardLayout from '@/components/dashboard/AdminDashboardLayout'
import {
  getWithdrawal,
  getWithdrawalAuditLogs,
  approveWithdrawal,
  rejectWithdrawal,
  markWithdrawalPaid,
  markWithdrawalFailed,
  Withdrawal,
  WithdrawalAuditLog,
  WithdrawalStatus,
  BankAccountDetails,
  MobileMoneyDetails,
  formatWithdrawalAmount
} from '@/lib/withdrawals'

export default function WithdrawalDetailPage() {
  const params = useParams()
  const router = useRouter()
  const withdrawalId = params.id as string

  const [withdrawal, setWithdrawal] = useState<Withdrawal | null>(null)
  const [auditLogs, setAuditLogs] = useState<WithdrawalAuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)

  // Modal states
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [showFailedModal, setShowFailedModal] = useState(false)
  const [showPaidModal, setShowPaidModal] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [failureReason, setFailureReason] = useState('')
  const [providerReference, setProviderReference] = useState('')

  const loadData = async () => {
    setLoading(true)
    try {
      const [withdrawalResult, logsResult] = await Promise.all([
        getWithdrawal(withdrawalId),
        getWithdrawalAuditLogs(withdrawalId)
      ])

      if (withdrawalResult.error) {
        toast.error(withdrawalResult.error)
        router.push('/dashboard/admin/withdrawals')
        return
      }

      setWithdrawal(withdrawalResult.data)
      setAuditLogs(logsResult.data)
    } catch (err) {
      toast.error('Failed to load withdrawal details')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (withdrawalId) {
      loadData()
    }
  }, [withdrawalId])

  const handleApprove = async () => {
    if (!withdrawal) return
    setProcessing(true)
    try {
      const { success, error } = await approveWithdrawal(withdrawal.id)
      if (error) {
        toast.error(error)
      } else {
        toast.success('Withdrawal approved successfully')
        loadData()
      }
    } finally {
      setProcessing(false)
    }
  }

  const handleReject = async () => {
    if (!withdrawal || !rejectReason.trim()) {
      toast.error('Please provide a rejection reason')
      return
    }
    setProcessing(true)
    try {
      const { success, error } = await rejectWithdrawal(withdrawal.id, rejectReason)
      if (error) {
        toast.error(error)
      } else {
        toast.success('Withdrawal rejected')
        setShowRejectModal(false)
        loadData()
      }
    } finally {
      setProcessing(false)
    }
  }

  const handleMarkPaid = async () => {
    if (!withdrawal) return
    setProcessing(true)
    try {
      const { success, error } = await markWithdrawalPaid(
        withdrawal.id,
        providerReference || undefined
      )
      if (error) {
        toast.error(error)
      } else {
        toast.success('Withdrawal marked as paid')
        setShowPaidModal(false)
        loadData()
      }
    } finally {
      setProcessing(false)
    }
  }

  const handleMarkFailed = async () => {
    if (!withdrawal || !failureReason.trim()) {
      toast.error('Please provide a failure reason')
      return
    }
    setProcessing(true)
    try {
      const { success, error } = await markWithdrawalFailed(withdrawal.id, failureReason)
      if (error) {
        toast.error(error)
      } else {
        toast.success('Withdrawal marked as failed')
        setShowFailedModal(false)
        loadData()
      }
    } finally {
      setProcessing(false)
    }
  }

  const getStatusBadge = (status: WithdrawalStatus) => {
    const colors: Record<WithdrawalStatus, string> = {
      PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      APPROVED: 'bg-blue-100 text-blue-800 border-blue-200',
      REJECTED: 'bg-red-100 text-red-800 border-red-200',
      PROCESSING: 'bg-purple-100 text-purple-800 border-purple-200',
      PAID: 'bg-green-100 text-green-800 border-green-200',
      FAILED: 'bg-red-100 text-red-800 border-red-200'
    }
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium border ${colors[status]}`}>
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
      <AdminDashboardLayout title="Withdrawal Details">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-[#ed874a]" />
        </div>
      </AdminDashboardLayout>
    )
  }

  if (!withdrawal) {
    return (
      <AdminDashboardLayout title="Withdrawal Details">
        <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600">Withdrawal not found</p>
          <Link href="/dashboard/admin/withdrawals">
            <Button variant="outline" className="mt-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Withdrawals
            </Button>
          </Link>
        </div>
      </AdminDashboardLayout>
    )
  }

  const accountDetails = withdrawal.account_details
  const isBankTransfer = withdrawal.payout_channel === 'bank'

  return (
    <AdminDashboardLayout title="Withdrawal Details">
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
            <h1 className="text-2xl font-bold text-gray-900">{withdrawal.reference}</h1>
            <p className="text-gray-600">Withdrawal Details</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          {getStatusBadge(withdrawal.status)}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Amount Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <DollarSign className="w-5 h-5 mr-2 text-[#ed874a]" />
                Withdrawal Amount
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-600">Amount (USD)</p>
                  <p className="text-3xl font-bold text-gray-900">
                    ${withdrawal.amount_usd.toFixed(2)}
                  </p>
                </div>
                {withdrawal.amount_local && (
                  <div>
                    <p className="text-sm text-gray-600">Local Amount</p>
                    <p className="text-3xl font-bold text-gray-900">
                      {formatWithdrawalAmount(withdrawal.amount_local, withdrawal.currency)}
                    </p>
                    {withdrawal.exchange_rate && (
                      <p className="text-sm text-gray-500">
                        Rate: 1 USD = {withdrawal.exchange_rate} {withdrawal.currency}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Account Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                {isBankTransfer ? (
                  <Building className="w-5 h-5 mr-2 text-[#ed874a]" />
                ) : (
                  <Smartphone className="w-5 h-5 mr-2 text-[#ed874a]" />
                )}
                {isBankTransfer ? 'Bank Account Details' : 'Mobile Money Details'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isBankTransfer ? (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Bank Name</p>
                    <p className="font-medium">{(accountDetails as BankAccountDetails).bank_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Bank Code</p>
                    <p className="font-medium font-mono">{(accountDetails as BankAccountDetails).bank_code}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Account Number</p>
                    <p className="font-medium font-mono">{(accountDetails as BankAccountDetails).account_number}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Account Name</p>
                    <p className="font-medium">{(accountDetails as BankAccountDetails).account_name}</p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Network</p>
                    <p className="font-medium">{(accountDetails as MobileMoneyDetails).network}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Network Code</p>
                    <p className="font-medium font-mono">{(accountDetails as MobileMoneyDetails).network_code}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Mobile Number</p>
                    <p className="font-medium font-mono">{(accountDetails as MobileMoneyDetails).mobile_number}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Account Name</p>
                    <p className="font-medium">{(accountDetails as MobileMoneyDetails).account_name || '-'}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Timeline */}
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
                    <p className="text-sm text-gray-600">{formatDate(withdrawal.created_at)}</p>
                  </div>
                </div>
                
                {withdrawal.approved_at && (
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 mt-2 rounded-full bg-blue-500" />
                    <div>
                      <p className="font-medium">Approved</p>
                      <p className="text-sm text-gray-600">{formatDate(withdrawal.approved_at)}</p>
                    </div>
                  </div>
                )}
                
                {withdrawal.rejected_at && (
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 mt-2 rounded-full bg-red-500" />
                    <div>
                      <p className="font-medium">Rejected</p>
                      <p className="text-sm text-gray-600">{formatDate(withdrawal.rejected_at)}</p>
                      {withdrawal.rejection_reason && (
                        <p className="text-sm text-red-600 mt-1">
                          Reason: {withdrawal.rejection_reason}
                        </p>
                      )}
                    </div>
                  </div>
                )}
                
                {withdrawal.processed_at && (
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 mt-2 rounded-full bg-purple-500" />
                    <div>
                      <p className="font-medium">Processed</p>
                      <p className="text-sm text-gray-600">{formatDate(withdrawal.processed_at)}</p>
                    </div>
                  </div>
                )}
                
                {withdrawal.paid_at && (
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 mt-2 rounded-full bg-green-500" />
                    <div>
                      <p className="font-medium">Paid</p>
                      <p className="text-sm text-gray-600">{formatDate(withdrawal.paid_at)}</p>
                      {withdrawal.provider_reference && (
                        <p className="text-sm text-gray-500 mt-1">
                          Ref: {withdrawal.provider_reference}
                        </p>
                      )}
                    </div>
                  </div>
                )}
                
                {withdrawal.failed_at && (
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 mt-2 rounded-full bg-red-500" />
                    <div>
                      <p className="font-medium">Failed</p>
                      <p className="text-sm text-gray-600">{formatDate(withdrawal.failed_at)}</p>
                      {withdrawal.failure_reason && (
                        <p className="text-sm text-red-600 mt-1">
                          Reason: {withdrawal.failure_reason}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Audit Log */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <History className="w-5 h-5 mr-2 text-[#ed874a]" />
                Audit Log
              </CardTitle>
            </CardHeader>
            <CardContent>
              {auditLogs.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No audit logs yet</p>
              ) : (
                <div className="space-y-3">
                  {auditLogs.map((log) => (
                    <div key={log.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-sm">{log.action}</span>
                          {log.previous_status && log.new_status && (
                            <span className="text-xs text-gray-500">
                              {log.previous_status} → {log.new_status}
                            </span>
                          )}
                        </div>
                        {log.reason && (
                          <p className="text-sm text-gray-600 mt-1">{log.reason}</p>
                        )}
                        <p className="text-xs text-gray-400 mt-1">
                          {log.admin_email} • {formatDate(log.created_at)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Actions */}
        <div className="space-y-6">
          {/* Actions Card */}
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {withdrawal.status === 'PENDING' && (
                <>
                  <Button
                    className="w-full bg-green-600 hover:bg-green-700"
                    onClick={handleApprove}
                    disabled={processing}
                  >
                    {processing ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <CheckCircle className="w-4 h-4 mr-2" />
                    )}
                    Approve Withdrawal
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full border-red-200 text-red-600 hover:bg-red-50"
                    onClick={() => setShowRejectModal(true)}
                    disabled={processing}
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Reject Withdrawal
                  </Button>
                </>
              )}

              {(withdrawal.status === 'APPROVED' || withdrawal.status === 'PROCESSING') && (
                <>
                  <Button
                    className="w-full bg-green-600 hover:bg-green-700"
                    onClick={() => setShowPaidModal(true)}
                    disabled={processing}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Mark as Paid
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full border-red-200 text-red-600 hover:bg-red-50"
                    onClick={() => setShowFailedModal(true)}
                    disabled={processing}
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Mark as Failed
                  </Button>
                </>
              )}

              {(withdrawal.status === 'PAID' || withdrawal.status === 'REJECTED') && (
                <p className="text-center text-gray-500 py-4">
                  No actions available for {withdrawal.status.toLowerCase()} withdrawals
                </p>
              )}

              {withdrawal.status === 'FAILED' && (
                <div className="text-center">
                  <p className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg">
                    <AlertCircle className="w-4 h-4 inline mr-2" />
                    This withdrawal failed. Manual review required.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Provider Info */}
          {withdrawal.provider && (
            <Card>
              <CardHeader>
                <CardTitle>Provider Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <p className="text-sm text-gray-600">Provider</p>
                  <p className="font-medium">{withdrawal.provider}</p>
                </div>
                {withdrawal.provider_reference && (
                  <div>
                    <p className="text-sm text-gray-600">Reference</p>
                    <p className="font-mono text-sm">{withdrawal.provider_reference}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Batch Info */}
          {withdrawal.batch_id && (
            <Card>
              <CardHeader>
                <CardTitle>Batch Info</CardTitle>
              </CardHeader>
              <CardContent>
                <Link href={`/dashboard/admin/withdrawals/batches/${withdrawal.batch_id}`}>
                  <Button variant="outline" className="w-full">
                    <FileText className="w-4 h-4 mr-2" />
                    View Batch
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">Reject Withdrawal</h3>
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
                onClick={() => setShowRejectModal(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-red-600 hover:bg-red-700"
                onClick={handleReject}
                disabled={!rejectReason.trim() || processing}
              >
                {processing && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                Reject
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Mark Paid Modal */}
      {showPaidModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">Mark as Paid</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Provider Reference (Optional)
              </label>
              <input
                type="text"
                value={providerReference}
                onChange={(e) => setProviderReference(e.target.value)}
                className="w-full border rounded-lg p-3"
                placeholder="Enter provider transaction reference..."
              />
            </div>
            <div className="flex space-x-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowPaidModal(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-green-600 hover:bg-green-700"
                onClick={handleMarkPaid}
                disabled={processing}
              >
                {processing && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                Mark as Paid
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Mark Failed Modal */}
      {showFailedModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">Mark as Failed</h3>
            <p className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg mb-4">
              <AlertCircle className="w-4 h-4 inline mr-2" />
              Funds will remain frozen for manual review.
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Failure Reason *
              </label>
              <textarea
                value={failureReason}
                onChange={(e) => setFailureReason(e.target.value)}
                className="w-full border rounded-lg p-3 h-24 resize-none"
                placeholder="Enter reason for failure..."
              />
            </div>
            <div className="flex space-x-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowFailedModal(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-red-600 hover:bg-red-700"
                onClick={handleMarkFailed}
                disabled={!failureReason.trim() || processing}
              >
                {processing && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                Mark as Failed
              </Button>
            </div>
          </div>
        </div>
      )}
      </div>
    </AdminDashboardLayout>
  )
}
